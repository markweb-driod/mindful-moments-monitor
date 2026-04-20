// Intelligent multi-modal mental health analyzer
// Uses lexicon-based sentiment + heuristic scoring across modalities.
// Deterministic, runs entirely client-side. No external services required.

export type EmotionLabel =
  | "Joyful"
  | "Content"
  | "Neutral"
  | "Anxious"
  | "Sad"
  | "Stressed"
  | "Angry"
  | "Depressed";

export type RiskLevel = "low" | "moderate" | "elevated" | "high";

export interface ModalityScore {
  label: EmotionLabel;
  confidence: number; // 0..1
  scores: Record<EmotionLabel, number>;
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  modalities: {
    text?: ModalityScore;
    voice?: ModalityScore;
    face?: ModalityScore;
  };
  fused: ModalityScore;
  risk: RiskLevel;
  wellbeingScore: number; // 0..100 (higher = better)
  highlights: string[];
  suggestions: string[];
  inputPreview: string;
}

const LEXICON: Record<EmotionLabel, string[]> = {
  Joyful: ["happy", "joy", "great", "amazing", "love", "excited", "grateful", "wonderful", "delighted", "smile", "fantastic", "blessed"],
  Content: ["calm", "peaceful", "fine", "okay", "good", "relaxed", "satisfied", "comfortable", "steady", "balanced"],
  Neutral: ["normal", "usual", "regular", "average", "meh", "alright"],
  Anxious: ["anxious", "worried", "nervous", "panic", "afraid", "fear", "scared", "uneasy", "restless", "overwhelmed", "tense"],
  Sad: ["sad", "down", "unhappy", "cry", "crying", "lonely", "alone", "miss", "hurt", "blue", "tearful"],
  Stressed: ["stressed", "stress", "pressure", "burned", "burnout", "exhausted", "tired", "deadline", "overworked", "swamped"],
  Angry: ["angry", "mad", "furious", "annoyed", "irritated", "rage", "hate", "frustrated", "resent"],
  Depressed: ["hopeless", "worthless", "empty", "numb", "depressed", "depression", "suicidal", "kill", "give up", "pointless", "dark"],
};

const ALL_EMOTIONS = Object.keys(LEXICON) as EmotionLabel[];

function emptyScores(): Record<EmotionLabel, number> {
  return ALL_EMOTIONS.reduce(
    (acc, e) => ({ ...acc, [e]: 0 }),
    {} as Record<EmotionLabel, number>
  );
}

function softmax(scores: Record<EmotionLabel, number>): Record<EmotionLabel, number> {
  const values = Object.values(scores);
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  const out = emptyScores();
  ALL_EMOTIONS.forEach((e, i) => {
    out[e] = exps[i] / sum;
  });
  return out;
}

function topLabel(scores: Record<EmotionLabel, number>): { label: EmotionLabel; confidence: number } {
  let best: EmotionLabel = "Neutral";
  let bestVal = -Infinity;
  for (const e of ALL_EMOTIONS) {
    if (scores[e] > bestVal) {
      bestVal = scores[e];
      best = e;
    }
  }
  return { label: best, confidence: bestVal };
}

export function analyzeText(text: string): ModalityScore {
  const scores = emptyScores();
  const lower = text.toLowerCase();
  const words = lower.split(/\W+/).filter(Boolean);

  for (const emotion of ALL_EMOTIONS) {
    for (const term of LEXICON[emotion]) {
      const matches = lower.split(term).length - 1;
      scores[emotion] += matches * 1.4;
    }
  }

  // Light bias toward Neutral when little signal
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  if (total === 0) scores.Neutral += 1;

  // Negation/intensifier hints
  if (/\b(very|really|so|extremely)\b/.test(lower)) {
    for (const e of ALL_EMOTIONS) scores[e] *= 1.15;
  }
  if (/\b(not|never|no)\b/.test(lower)) {
    scores.Joyful *= 0.6;
    scores.Content *= 0.7;
  }

  // Length normalization
  const norm = Math.max(1, Math.log2(words.length + 2));
  for (const e of ALL_EMOTIONS) scores[e] = scores[e] / norm;

  const probs = softmax(scores);
  const { label, confidence } = topLabel(probs);
  return { label, confidence, scores: probs };
}

// Voice features: pitch (Hz), energy (0..1), speakingRate (words/sec)
export interface VoiceFeatures {
  pitch: number;
  energy: number;
  speakingRate: number;
  jitter: number; // voice instability 0..1
}

export function analyzeVoice(f: VoiceFeatures): ModalityScore {
  const scores = emptyScores();
  // Heuristic mapping of acoustic features → emotions
  scores.Joyful = Math.max(0, (f.energy - 0.5) * 2 + (f.pitch - 180) / 200);
  scores.Content = Math.max(0, 1 - Math.abs(f.energy - 0.45) * 2);
  scores.Neutral = Math.max(0, 1 - Math.abs(f.energy - 0.4) - f.jitter);
  scores.Anxious = Math.max(0, f.jitter * 2 + Math.max(0, f.speakingRate - 3) * 0.4);
  scores.Sad = Math.max(0, (0.4 - f.energy) * 2 + (160 - f.pitch) / 150);
  scores.Stressed = Math.max(0, f.jitter + Math.max(0, f.speakingRate - 3.5) * 0.6);
  scores.Angry = Math.max(0, (f.energy - 0.7) * 2 + (f.pitch - 200) / 150);
  scores.Depressed = Math.max(0, (0.3 - f.energy) * 2.5 + (140 - f.pitch) / 200);

  const probs = softmax(scores);
  const { label, confidence } = topLabel(probs);
  return { label, confidence, scores: probs };
}

// Face features: simulated AU intensities 0..1
export interface FaceFeatures {
  smile: number;
  browFurrow: number;
  eyeOpenness: number;
  mouthFrown: number;
  jawTension: number;
}

export function analyzeFace(f: FaceFeatures): ModalityScore {
  const scores = emptyScores();
  scores.Joyful = f.smile * 2.2 - f.mouthFrown;
  scores.Content = Math.max(0, f.smile * 1.2 - f.browFurrow);
  scores.Neutral = 1 - Math.abs(f.smile - 0.3) - f.browFurrow;
  scores.Anxious = f.browFurrow * 1.6 + (1 - f.eyeOpenness) * 0.6;
  scores.Sad = f.mouthFrown * 1.8 + (0.4 - f.eyeOpenness);
  scores.Stressed = f.browFurrow + f.jawTension * 1.4;
  scores.Angry = f.browFurrow * 1.2 + f.jawTension * 1.6;
  scores.Depressed = f.mouthFrown * 1.4 + (1 - f.smile) * 0.8 + (0.3 - f.eyeOpenness);

  const probs = softmax(scores);
  const { label, confidence } = topLabel(probs);
  return { label, confidence, scores: probs };
}

// Late fusion (weighted average of modality probability distributions)
export function fuseModalities(modalities: AnalysisResult["modalities"]): ModalityScore {
  const weights = { text: 0.5, voice: 0.25, face: 0.25 };
  const fused = emptyScores();
  let totalWeight = 0;
  (["text", "voice", "face"] as const).forEach((m) => {
    const score = modalities[m];
    if (!score) return;
    totalWeight += weights[m];
    for (const e of ALL_EMOTIONS) fused[e] += score.scores[e] * weights[m];
  });
  if (totalWeight === 0) {
    fused.Neutral = 1;
    return { label: "Neutral", confidence: 1, scores: fused };
  }
  for (const e of ALL_EMOTIONS) fused[e] /= totalWeight;
  const { label, confidence } = topLabel(fused);
  return { label, confidence, scores: fused };
}

const RISK_WEIGHT: Record<EmotionLabel, number> = {
  Joyful: -2,
  Content: -1,
  Neutral: 0,
  Anxious: 2,
  Sad: 2,
  Stressed: 1.5,
  Angry: 1,
  Depressed: 4,
};

export function computeRisk(fused: ModalityScore, text?: string): { risk: RiskLevel; score: number } {
  let score = 0;
  for (const e of ALL_EMOTIONS) score += fused.scores[e] * RISK_WEIGHT[e];
  if (text && /\b(suicid|kill myself|end it|give up|harm myself)\b/i.test(text)) {
    score += 4;
  }
  let risk: RiskLevel = "low";
  if (score > 2.5) risk = "high";
  else if (score > 1.2) risk = "elevated";
  else if (score > 0.3) risk = "moderate";
  return { risk, score };
}

const SUGGESTIONS: Record<EmotionLabel, string[]> = {
  Joyful: ["Savor the moment — note 3 things you're grateful for.", "Share your good mood with someone you care about."],
  Content: ["Maintain your routine — gentle walks support steady mood.", "Reflect briefly in a journal."],
  Neutral: ["Try a 4-7-8 breathing cycle for 2 minutes.", "Step outside for natural light."],
  Anxious: ["Try box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s.", "Ground yourself — name 5 things you can see right now."],
  Sad: ["Reach out to a friend or loved one.", "Engage in a small, kind activity for yourself."],
  Stressed: ["Take a 10-minute break away from screens.", "Write down what you can and cannot control right now."],
  Angry: ["Pause and take 6 slow breaths before responding.", "Move your body — a brisk 5-minute walk helps."],
  Depressed: ["Please consider speaking with a mental health professional.", "Call a trusted helpline if you feel unsafe — you are not alone."],
};

export function buildAnalysis(input: {
  text?: string;
  voice?: VoiceFeatures;
  face?: FaceFeatures;
}): AnalysisResult {
  const modalities: AnalysisResult["modalities"] = {};
  if (input.text && input.text.trim()) modalities.text = analyzeText(input.text);
  if (input.voice) modalities.voice = analyzeVoice(input.voice);
  if (input.face) modalities.face = analyzeFace(input.face);

  const fused = fuseModalities(modalities);
  const { risk, score } = computeRisk(fused, input.text);

  const wellbeingScore = Math.max(0, Math.min(100, Math.round(70 - score * 12)));

  const highlights: string[] = [];
  if (modalities.text) highlights.push(`Text signal: ${modalities.text.label} (${Math.round(modalities.text.confidence * 100)}%)`);
  if (modalities.voice) highlights.push(`Voice signal: ${modalities.voice.label} (${Math.round(modalities.voice.confidence * 100)}%)`);
  if (modalities.face) highlights.push(`Facial signal: ${modalities.face.label} (${Math.round(modalities.face.confidence * 100)}%)`);

  const suggestions = SUGGESTIONS[fused.label].slice();
  if (risk === "high") {
    suggestions.unshift("If you're in crisis, please contact emergency services or a crisis helpline immediately.");
  }

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    modalities,
    fused,
    risk,
    wellbeingScore,
    highlights,
    suggestions,
    inputPreview: (input.text || "").slice(0, 200),
  };
}

// History storage
const HISTORY_KEY = "mhm_history_v1";
const LATEST_KEY = "mhm_latest_v1";

export function saveAnalysis(a: AnalysisResult) {
  if (typeof window === "undefined") return;
  const list = loadHistory();
  list.unshift(a);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 100)));
  localStorage.setItem(LATEST_KEY, JSON.stringify(a));
}

export function loadHistory(): AnalysisResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as AnalysisResult[]) : [];
  } catch {
    return [];
  }
}

export function loadLatest(): AnalysisResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LATEST_KEY);
    return raw ? (JSON.parse(raw) as AnalysisResult) : null;
  } catch {
    return null;
  }
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(LATEST_KEY);
}

export const EMOTION_COLORS: Record<EmotionLabel, string> = {
  Joyful: "oklch(80% 0.18 90)",
  Content: "oklch(78% 0.10 160)",
  Neutral: "oklch(75% 0.03 200)",
  Anxious: "oklch(70% 0.15 60)",
  Sad: "oklch(60% 0.12 250)",
  Stressed: "oklch(65% 0.18 30)",
  Angry: "oklch(60% 0.22 25)",
  Depressed: "oklch(45% 0.10 270)",
};
