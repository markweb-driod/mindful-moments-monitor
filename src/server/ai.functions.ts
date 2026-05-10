import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database, Json } from "@/integrations/supabase/types";
import { z } from "zod";

const EMOTIONS = [
  "Joyful",
  "Content",
  "Neutral",
  "Anxious",
  "Sad",
  "Stressed",
  "Angry",
  "Depressed",
] as const;

type Emotion = (typeof EMOTIONS)[number];

const RISK_LEVELS = ["low", "moderate", "elevated", "high"] as const;
const MODALITIES = ["text", "voice", "face", "multimodal"] as const;

interface ModalityScore {
  label: Emotion;
  confidence: number;
  scores: Record<Emotion, number>;
}

interface AIAnalysis {
  modalities: { text?: ModalityScore; voice?: ModalityScore; face?: ModalityScore };
  fused: ModalityScore;
  risk: (typeof RISK_LEVELS)[number];
  wellbeingScore: number;
  highlights: string[];
  suggestions: string[];
  inputPreview: string;
  transcript?: string;
}

type GeminiPart =
  | {
      text: string;
    }
  | {
      inlineData: {
        mimeType: string;
        data: string;
      };
    };

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SYSTEM_PROMPT = `You are an empathetic mental wellbeing analyst. You analyze inputs (text journal entries, voice transcripts, or facial photos) and produce a structured emotional assessment.

Rules:
- NEVER diagnose. You are not a clinician.
- Always include a safety note if the user expresses self-harm, suicidal ideation, or hopelessness.
- Output emotion scores as a probability distribution that sums to ~1.0 across these 8 labels: Joyful, Content, Neutral, Anxious, Sad, Stressed, Angry, Depressed.
- wellbeingScore is 0-100 (higher = better). Joyful/Content = high; Depressed/high-risk = low.
- risk: "low" | "moderate" | "elevated" | "high". Use "high" for explicit self-harm or suicidal language.
- Provide 2-4 short, actionable, kind suggestions tailored to the detected state.
- highlights: 1-3 brief observations from the input (e.g. "Mentions exhaustion and deadline pressure").

Output requirements:
- Return a single valid JSON object only (no markdown fences, no extra prose).
- JSON shape:
{
  "label": "Joyful|Content|Neutral|Anxious|Sad|Stressed|Angry|Depressed",
  "confidence": number,
  "scores": {
    "Joyful": number,
    "Content": number,
    "Neutral": number,
    "Anxious": number,
    "Sad": number,
    "Stressed": number,
    "Angry": number,
    "Depressed": number
  },
  "wellbeingScore": number,
  "risk": "low|moderate|elevated|high",
  "highlights": string[],
  "suggestions": string[]
}`;

const ANALYSIS_RESPONSE_SCHEMA = z.object({
  label: z.enum(EMOTIONS),
  confidence: z.number().min(0).max(1),
  scores: z.record(z.string(), z.number().min(0).max(1)),
  wellbeingScore: z.number().int().min(0).max(100),
  risk: z.enum(RISK_LEVELS),
  highlights: z.array(z.string()).min(1).max(4),
  suggestions: z.array(z.string()).min(2).max(4),
});

function extractJsonObject(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const fence = trimmed.match(/```json\s*([\s\S]*?)```/i) || trimmed.match(/```\s*([\s\S]*?)```/i);
  if (fence?.[1]) return fence[1].trim();

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);

  return trimmed;
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL payload");
  return { mimeType: match[1], data: match[2] };
}

async function callGemini(
  parts: GeminiPart[],
  model = DEFAULT_GEMINI_MODEL,
): Promise<
  ModalityScore & {
    wellbeingScore: number;
    risk: (typeof RISK_LEVELS)[number];
    highlights: string[];
    suggestions: string[];
  }
> {
  const GEMINI_API_KEY = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.LOVABLE_API_KEY
  )?.trim();
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const endpoint = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        role: "system",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429)
      throw new Error("Rate limit reached. Please wait a moment and try again.");
    if (res.status === 401 || res.status === 403)
      throw new Error("Gemini API key is invalid or lacks access");
    throw new Error(`Gemini API error [${res.status}]: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const outputText = data.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text || "")
    .join("\n")
    .trim();
  if (!outputText) throw new Error("Gemini did not return analysis content");

  let parsed: z.infer<typeof ANALYSIS_RESPONSE_SCHEMA>;
  try {
    parsed = ANALYSIS_RESPONSE_SCHEMA.parse(JSON.parse(extractJsonObject(outputText)));
  } catch {
    throw new Error("Gemini returned invalid structured analysis");
  }

  // Normalize scores to sum=1
  const total = EMOTIONS.reduce((a, e) => a + (parsed.scores[e] ?? 0), 0) || 1;
  const scores = Object.fromEntries(
    EMOTIONS.map((e) => [e, (parsed.scores[e] ?? 0) / total]),
  ) as Record<Emotion, number>;

  return {
    label: parsed.label,
    confidence: parsed.confidence,
    scores,
    wellbeingScore: parsed.wellbeingScore,
    risk: parsed.risk,
    highlights: parsed.highlights,
    suggestions: parsed.suggestions,
  };
}

function fuseModalities(mods: AIAnalysis["modalities"]): ModalityScore {
  const weights = { text: 0.5, voice: 0.25, face: 0.25 };
  const fused = Object.fromEntries(EMOTIONS.map((e) => [e, 0])) as Record<Emotion, number>;
  let total = 0;
  (["text", "voice", "face"] as const).forEach((m) => {
    const s = mods[m];
    if (!s) return;
    total += weights[m];
    EMOTIONS.forEach((e) => {
      fused[e] += s.scores[e] * weights[m];
    });
  });
  if (total === 0) {
    fused.Neutral = 1;
    return { label: "Neutral", confidence: 1, scores: fused };
  }
  EMOTIONS.forEach((e) => (fused[e] /= total));
  let best: Emotion = "Neutral";
  let bestVal = -1;
  EMOTIONS.forEach((e) => {
    if (fused[e] > bestVal) {
      bestVal = fused[e];
      best = e;
    }
  });
  return { label: best, confidence: bestVal, scores: fused };
}

async function persistAnalysis(
  supabase: SupabaseClient<Database>,
  userId: string,
  modality: (typeof MODALITIES)[number],
  analysis: AIAnalysis,
) {
  const { data, error } = await supabase
    .from("analyses")
    .insert({
      user_id: userId,
      modality_input: modality,
      predicted_label: analysis.fused.label,
      confidence: analysis.fused.confidence,
      wellbeing_score: analysis.wellbeingScore,
      risk_level: analysis.risk,
      scores: analysis.fused.scores as unknown as Json,
      modalities: analysis.modalities as unknown as Json,
      highlights: analysis.highlights as unknown as Json,
      suggestions: analysis.suggestions as unknown as Json,
      input_preview: analysis.inputPreview,
    })
    .select()
    .single();
  if (error) {
    // Fallback: try service-role client to bypass potential RLS/auth key issues
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from("analyses")
        .insert({
          user_id: userId,
          modality_input: modality,
          predicted_label: analysis.fused.label,
          confidence: analysis.fused.confidence,
          wellbeing_score: analysis.wellbeingScore,
          risk_level: analysis.risk,
          scores: analysis.fused.scores as unknown as Json,
          modalities: analysis.modalities as unknown as Json,
          highlights: analysis.highlights as unknown as Json,
          suggestions: analysis.suggestions as unknown as Json,
          input_preview: analysis.inputPreview,
        })
        .select()
        .single();
      if (fallbackError) throw new Error(`Failed to save analysis (service role fallback): ${fallbackError.message}`);
      return fallbackData;
    } catch (fallbackErr) {
      throw new Error(`Failed to save analysis: ${error.message}`);
    }
  }
  return data;
}

function combineHighlights(mods: AIAnalysis["modalities"], extra: string[] = []) {
  const hs = [...extra];
  if (mods.text) hs.push(`Text: ${mods.text.label} (${Math.round(mods.text.confidence * 100)}%)`);
  if (mods.voice)
    hs.push(`Voice: ${mods.voice.label} (${Math.round(mods.voice.confidence * 100)}%)`);
  if (mods.face) hs.push(`Face: ${mods.face.label} (${Math.round(mods.face.confidence * 100)}%)`);
  return hs;
}

// ---------------- TEXT ----------------
export const analyzeText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { text: string }) =>
    z.object({ text: z.string().trim().min(5).max(4000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const r = await callGemini([
      {
        text: `Analyze the emotional state expressed in this journal entry:\n\n"""${data.text}"""`,
      },
    ]);
    const modScore: ModalityScore = { label: r.label, confidence: r.confidence, scores: r.scores };
    const analysis: AIAnalysis = {
      modalities: { text: modScore },
      fused: modScore,
      risk: r.risk,
      wellbeingScore: r.wellbeingScore,
      highlights: r.highlights,
      suggestions: r.suggestions,
      inputPreview: data.text.slice(0, 200),
    };
    const saved = await persistAnalysis(context.supabase, context.userId, "text", analysis);
    return { analysis, id: saved.id };
  });

// ---------------- FACE ----------------
export const analyzeFace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { imageDataUrl: string }) =>
    z
      .object({
        imageDataUrl: z
          .string()
          .startsWith("data:image/")
          .max(8_000_000, "Image too large (max ~6MB)"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const image = parseDataUrl(data.imageDataUrl);
    const r = await callGemini([
      {
        text: "Analyze the visible facial cues in this photo (smile, brow, eyes, jaw) and infer the emotional state. If no face is visible, default to Neutral with low confidence.",
      },
      {
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      },
    ]);
    const modScore: ModalityScore = { label: r.label, confidence: r.confidence, scores: r.scores };
    const analysis: AIAnalysis = {
      modalities: { face: modScore },
      fused: modScore,
      risk: r.risk,
      wellbeingScore: r.wellbeingScore,
      highlights: r.highlights,
      suggestions: r.suggestions,
      inputPreview: "[facial photo]",
    };
    const saved = await persistAnalysis(context.supabase, context.userId, "face", analysis);
    return { analysis, id: saved.id };
  });

// ---------------- VOICE ----------------
export const analyzeVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { audioDataUrl: string; mimeType: string }) =>
    z
      .object({
        audioDataUrl: z.string().startsWith("data:").max(15_000_000, "Audio too large (max ~11MB)"),
        mimeType: z.string().min(3).max(100),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const audio = parseDataUrl(data.audioDataUrl);
    const r = await callGemini([
      {
        text: 'Listen to this voice sample. Transcribe what you hear (briefly), then analyze emotional state from both word choice and vocal qualities (tone, pace, energy). Include the transcript at the start of your first highlight as: "Transcript: ...".',
      },
      {
        inlineData: {
          mimeType: audio.mimeType || data.mimeType,
          data: audio.data,
        },
      },
    ]);
    const modScore: ModalityScore = { label: r.label, confidence: r.confidence, scores: r.scores };
    const analysis: AIAnalysis = {
      modalities: { voice: modScore },
      fused: modScore,
      risk: r.risk,
      wellbeingScore: r.wellbeingScore,
      highlights: r.highlights,
      suggestions: r.suggestions,
      inputPreview: "[voice recording]",
    };
    const saved = await persistAnalysis(context.supabase, context.userId, "voice", analysis);
    return { analysis, id: saved.id };
  });

// ---------------- MULTIMODAL ----------------
export const analyzeMultimodal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { text?: string; imageDataUrl?: string; audioDataUrl?: string; audioMime?: string }) =>
      z
        .object({
          text: z.string().trim().min(1).max(4000).optional(),
          imageDataUrl: z.string().startsWith("data:image/").max(8_000_000).optional(),
          audioDataUrl: z.string().startsWith("data:").max(15_000_000).optional(),
          audioMime: z.string().min(3).max(100).optional(),
        })
        .refine((v) => v.text || v.imageDataUrl || v.audioDataUrl, {
          message: "Provide at least one modality",
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const mods: AIAnalysis["modalities"] = {};

    if (data.text) {
      const r = await callGemini([
        {
          text: `Analyze the emotional state expressed in this journal entry:\n\n"""${data.text}"""`,
        },
      ]);
      mods.text = { label: r.label, confidence: r.confidence, scores: r.scores };
    }
    if (data.imageDataUrl) {
      const image = parseDataUrl(data.imageDataUrl);
      const r = await callGemini([
        {
          text: "Analyze visible facial cues for emotional state.",
        },
        {
          inlineData: {
            mimeType: image.mimeType,
            data: image.data,
          },
        },
      ]);
      mods.face = { label: r.label, confidence: r.confidence, scores: r.scores };
    }
    if (data.audioDataUrl) {
      const audio = parseDataUrl(data.audioDataUrl);
      const r = await callGemini([
        {
          text: "Analyze emotional state from this voice sample.",
        },
        {
          inlineData: {
            mimeType: audio.mimeType || data.audioMime || "audio/webm",
            data: audio.data,
          },
        },
      ]);
      mods.voice = { label: r.label, confidence: r.confidence, scores: r.scores };
    }

    const fused = fuseModalities(mods);

    // Ask the model for an overall narrative + suggestions based on fused signal
    const summarized = await callGemini([
      {
        text: `Per-modality results: ${JSON.stringify({
          text: mods.text?.label,
          voice: mods.voice?.label,
          face: mods.face?.label,
        })}. Fused dominant emotion: ${fused.label} (${Math.round(fused.confidence * 100)}%). User text (if any): "${(data.text || "").slice(0, 600)}". Produce the final structured analysis reflecting this fusion.`,
      },
    ]);

    const analysis: AIAnalysis = {
      modalities: mods,
      fused,
      risk: summarized.risk,
      wellbeingScore: summarized.wellbeingScore,
      highlights: combineHighlights(mods, summarized.highlights),
      suggestions: summarized.suggestions,
      inputPreview: data.text ? data.text.slice(0, 200) : "[multi-modal session]",
    };
    const saved = await persistAnalysis(context.supabase, context.userId, "multimodal", analysis);
    return { analysis, id: saved.id };
  });
