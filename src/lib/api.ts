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
import { getFirebaseClientAuth } from "@/integrations/firebase/client";

/** Try to get auth headers — silently skip if user isn't signed in yet. */
async function tryWithAuth<T>(fn: (headers: HeadersInit) => Promise<T>): Promise<T> {
  try {
    const token = await getAccessToken();
    return fn({ Authorization: `Bearer ${token}` });
  } catch (error: any) {
    if (error?.message && String(error.message).includes("Not signed in")) {
      return fn({});
    }
    throw error;
  }
}

async function withOptionalAuthForAnalysis<T>(fn: (headers: HeadersInit) => Promise<T>): Promise<T> {
  try {
    const token = await getAccessToken();
    return fn({ Authorization: `Bearer ${token}` });
  } catch (error: any) {
    if (error?.message && String(error.message).includes("Not signed in")) {
      return fn({});
    }
    throw error;
  }
}

export type ServerAnalysis = Awaited<ReturnType<typeof analyzeText>>["analysis"];

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

const LOCAL_HISTORY_KEY = "serenity-local-history-v1";

function getCurrentUserKey() {
  return getFirebaseClientAuth()?.currentUser?.uid ?? "anon-device";
}

function readLocalHistoryMap(): Record<string, HistoryRow[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, HistoryRow[]>;
  } catch {
    return {};
  }
}

function writeLocalHistoryMap(map: Record<string, HistoryRow[]>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(map));
}

function addLocalHistory(item: HistoryRow) {
  const key = getCurrentUserKey();
  const map = readLocalHistoryMap();
  const current = Array.isArray(map[key]) ? map[key] : [];
  map[key] = [item, ...current].slice(0, 200);
  writeLocalHistoryMap(map);
}

function getLocalHistory(): HistoryRow[] {
  const key = getCurrentUserKey();
  const map = readLocalHistoryMap();
  return Array.isArray(map[key]) ? map[key] : [];
}

function clearLocalHistory() {
  const key = getCurrentUserKey();
  const map = readLocalHistoryMap();
  map[key] = [];
  writeLocalHistoryMap(map);
}

function toLocalRow(
  modality: HistoryRow["modality_input"],
  analysis: ServerAnalysis,
  preview: string | null,
  id?: string,
): HistoryRow {
  return {
    id: id || `local-${Date.now()}`,
    created_at: new Date().toISOString(),
    modality_input: modality,
    predicted_label: analysis.fused.label,
    confidence: analysis.fused.confidence,
    wellbeing_score: analysis.wellbeingScore,
    risk_level: analysis.risk,
    scores: analysis.fused.scores as Record<string, number>,
    highlights: analysis.highlights,
    suggestions: analysis.suggestions,
    input_preview: preview,
  };
}

export async function runAnalyzeText(text: string) {
  const res = await withOptionalAuthForAnalysis((headers) => analyzeText({ data: { text }, headers }));
  if (res?.analysis) addLocalHistory(toLocalRow("text", res.analysis, text.slice(0, 200), res.id));
  return res;
}

export async function runAnalyzeFace(imageDataUrl: string) {
  const res = await withOptionalAuthForAnalysis((headers) => analyzeFace({ data: { imageDataUrl }, headers }));
  if (res?.analysis) addLocalHistory(toLocalRow("face", res.analysis, "[facial photo]", res.id));
  return res;
}

export async function runAnalyzeVoice(audioDataUrl: string, mimeType: string) {
  const res = await withOptionalAuthForAnalysis((headers) => analyzeVoice({ data: { audioDataUrl, mimeType }, headers }));
  if (res?.analysis) addLocalHistory(toLocalRow("voice", res.analysis, "[voice recording]", res.id));
  return res;
}

export async function runAnalyzeMultimodal(input: {
  text?: string;
  imageDataUrl?: string;
  audioDataUrl?: string;
  audioMime?: string;
}) {
  const res = await withOptionalAuthForAnalysis((headers) => analyzeMultimodal({ data: input, headers }));
  if (res?.analysis) {
    addLocalHistory(
      toLocalRow("multimodal", res.analysis, input.text?.slice(0, 200) ?? "[multi-modal session]", res.id),
    );
  }
  return res;
}

export async function fetchHistory(): Promise<HistoryRow[]> {
  return tryWithAuth(async (headers) => {
    const res = (await fetchAnalysisHistory({ headers })) as HistoryServerResponse | undefined;
    const items = (res as { items?: unknown } | undefined)?.items;
    const remote = Array.isArray(items) ? (items as HistoryRow[]) : [];
    if (remote.length > 0) return remote;
    return getLocalHistory();
  });
}

export async function clearHistoryRemote() {
  await tryWithAuth((headers) => clearAnalysisHistory({ headers }));
  clearLocalHistory();
}
