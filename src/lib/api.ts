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

export type ServerAnalysis = Awaited<ReturnType<typeof analyzeText>>["analysis"];

export async function runAnalyzeText(text: string) {
  return withAuth((headers) => analyzeText({ data: { text }, headers }));
}

export async function runAnalyzeFace(imageDataUrl: string) {
  return withAuth((headers) => analyzeFace({ data: { imageDataUrl }, headers }));
}

export async function runAnalyzeVoice(audioDataUrl: string, mimeType: string) {
  return withAuth((headers) => analyzeVoice({ data: { audioDataUrl, mimeType }, headers }));
}

export async function runAnalyzeMultimodal(input: {
  text?: string;
  imageDataUrl?: string;
  audioDataUrl?: string;
  audioMime?: string;
}) {
  return withAuth((headers) => analyzeMultimodal({ data: input, headers }));
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
  return withAuth(async (headers) => {
    const { items } = (await fetchAnalysisHistory({ headers })) as HistoryServerResponse;
    return items as unknown as HistoryRow[];
  });
}

export async function clearHistoryRemote() {
  await withAuth((headers) => clearAnalysisHistory({ headers }));
}
