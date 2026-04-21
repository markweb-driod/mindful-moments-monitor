import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Sparkles, Activity } from "lucide-react";

export type EmotionLabel =
  | "Joyful" | "Content" | "Neutral" | "Anxious" | "Sad" | "Stressed" | "Angry" | "Depressed";
export type RiskLevel = "low" | "moderate" | "elevated" | "high";

export interface DisplayResult {
  fused: { label: EmotionLabel | string; confidence: number; scores: Record<string, number> };
  risk: RiskLevel;
  wellbeingScore: number;
  highlights: string[];
  suggestions: string[];
}

export const EMOTION_COLORS: Record<string, string> = {
  Joyful: "oklch(80% 0.18 90)",
  Content: "oklch(78% 0.10 160)",
  Neutral: "oklch(75% 0.03 200)",
  Anxious: "oklch(70% 0.15 60)",
  Sad: "oklch(60% 0.12 250)",
  Stressed: "oklch(65% 0.18 30)",
  Angry: "oklch(60% 0.22 25)",
  Depressed: "oklch(45% 0.10 270)",
};

const RISK_BADGE: Record<RiskLevel, { label: string; cls: string }> = {
  low: { label: "Low risk", cls: "bg-emerald-100 text-emerald-800" },
  moderate: { label: "Moderate", cls: "bg-amber-100 text-amber-800" },
  elevated: { label: "Elevated", cls: "bg-orange-100 text-orange-900" },
  high: { label: "High — please seek support", cls: "bg-red-100 text-red-900" },
};

export function ResultDisplay({ result }: { result: DisplayResult }) {
  const risk = RISK_BADGE[result.risk];
  const sortedScores = Object.entries(result.fused.scores).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <Card className="p-8 border-border shadow-[var(--shadow-soft)] bg-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Predicted state</p>
            <h2 className="font-display text-5xl font-semibold tracking-tight">{result.fused.label}</h2>
            <p className="text-muted-foreground mt-2">
              Confidence {Math.round(result.fused.confidence * 100)}% · Wellbeing {result.wellbeingScore}/100
            </p>
          </div>
          <Badge className={`${risk.cls} text-sm px-3 py-1.5 rounded-full`}>
            {result.risk === "high" && <AlertTriangle className="size-3.5 mr-1.5 inline" />}
            {risk.label}
          </Badge>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2 text-sm font-medium mb-3 text-muted-foreground">
            <Activity className="size-4" /> Emotion distribution
          </div>
          <div className="space-y-2.5">
            {sortedScores.map(([label, val]) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground">{Math.round(val * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${val * 100}%`,
                      background: EMOTION_COLORS[label] ?? "oklch(70% 0.05 200)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {result.highlights.length > 0 && (
        <Card className="p-6 bg-card border-border">
          <h3 className="font-display text-xl font-semibold mb-3">Observations</h3>
          <ul className="space-y-2">
            {result.highlights.map((h, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-6 bg-card border-border">
        <h3 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="size-5 text-accent" /> Personalized suggestions
        </h3>
        <ul className="space-y-3">
          {result.suggestions.map((s, i) => (
            <li key={i} className="p-4 rounded-xl bg-surface-2 text-sm leading-relaxed">
              {s}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
