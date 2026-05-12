// Client helpers that call TanStack server functions with the user's auth token.
import {
  analyzeText,
  analyzeFace,
  analyzeVoice,
  analyzeMultimodal,
  fetchAnalysisHistory,
  clearAnalysisHistory,
} from "@/server/ai.functions";
import { getAccessToken } from "@/lib/auth-context";

async function withAuth<T>(fn: (headers: HeadersInit) => Promise<T>): Promise<T> {
  const token = await getAccessToken();
  return fn({ Authorization: `Bearer ${token}` });
}

/** Try to get auth headers — silently skip if user isn't signed in yet. */
async function tryWithAuth<T>(fn: (headers: HeadersInit) => Promise<T>): Promise<T> {
  try {
    const token = await getAccessToken();
    return fn({ Authorization: `Bearer ${token}` });
  } catch {
    return fn({});
  }
}

export type ServerAnalysis = Awaited<ReturnType<typeof analyzeText>>["analysis"];

export async function runAnalyzeText(text: string) {
  return tryWithAuth((headers) => analyzeText({ data: { text }, headers }));
}

export async function runAnalyzeFace(imageDataUrl: string) {
  return tryWithAuth((headers) => analyzeFace({ data: { imageDataUrl }, headers }));
}

export async function runAnalyzeVoice(audioDataUrl: string, mimeType: string) {
  return tryWithAuth((headers) => analyzeVoice({ data: { audioDataUrl, mimeType }, headers }));
}

export async function runAnalyzeMultimodal(input: {
  text?: string;
  imageDataUrl?: string;
  audioDataUrl?: string;
  audioMime?: string;
}) {
  return tryWithAuth((headers) => analyzeMultimodal({ data: input, headers }));
}

type HistoryServerResponse = Awaited<ReturnType<typeof fetchAnalysisHistory>>;

export interface HistoryRow {
  id: string;
  created_at: string;
  modality_input: "text" | "voice" | "face" | "multimodal";
  predicted_label: string;
  confidence: number;
  wellbeing_score: number;
  risk_level: "low" | "moderate" | "elevated" | "high";
  scores: Record<string, number>;
  highlights: string[];
  suggestions: string[];
  input_preview: string | null;
}

export async function fetchHistory(): Promise<HistoryRow[]> {
  return tryWithAuth(async (headers) => {
    const res = (await fetchAnalysisHistory({ headers })) as HistoryServerResponse | undefined;
    const items = (res as { items?: unknown } | undefined)?.items;
    if (!Array.isArray(items)) return [];
    return items as unknown as HistoryRow[];
  });
}

export async function clearHistoryRemote() {
  await tryWithAuth((headers) => clearAnalysisHistory({ headers }));
}
