import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ResultDisplay } from "@/components/ResultDisplay";
import { buildAnalysis, saveAnalysis, type AnalysisResult, type VoiceFeatures } from "@/lib/analyzer";
import { Mic, Square, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/voice")({
  head: () => ({
    meta: [
      { title: "Voice Analysis — Serenity" },
      { name: "description", content: "Analyze vocal tone, pitch, energy and jitter to detect emotional cues." },
      { property: "og:title", content: "Voice Analysis — Serenity" },
      { property: "og:description", content: "Acoustic mental wellbeing analysis." },
    ],
  }),
  component: VoicePage,
});

function VoicePage() {
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [features, setFeatures] = useState<VoiceFeatures>({
    pitch: 180,
    energy: 0.5,
    speakingRate: 2.5,
    jitter: 0.2,
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const timerRef = useRef<number | null>(null);

  const startRecording = () => {
    setRecording(true);
    setRecorded(false);
    toast.info("Recording... speak naturally for ~5 seconds");
    timerRef.current = window.setTimeout(() => {
      setRecording(false);
      setRecorded(true);
      // simulate extracted features with slight randomization
      setFeatures({
        pitch: 150 + Math.random() * 120,
        energy: 0.3 + Math.random() * 0.5,
        speakingRate: 2 + Math.random() * 2,
        jitter: Math.random() * 0.5,
      });
      toast.success("Recording captured. Adjust features if you like, then analyze.");
    }, 5000);
  };

  const stopRecording = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRecording(false);
    setRecorded(true);
  };

  const onAnalyze = async () => {
    if (!recorded) {
      toast.error("Please record a sample first");
      return;
    }
    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 600));
    const r = buildAnalysis({ voice: features });
    saveAnalysis(r);
    setResult(r);
    setAnalyzing(false);
  };

  return (
    <SiteLayout>
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="font-display text-5xl font-semibold tracking-tight">Voice Analysis</h1>
            <p className="text-muted-foreground mt-3 text-lg">
              Record a short voice sample. We extract acoustic features and infer emotional state.
            </p>
          </div>

          <Card className="p-8 bg-card border-border shadow-[var(--shadow-soft)]">
            <div className="flex flex-col items-center text-center py-6">
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`size-28 rounded-full grid place-items-center transition-all ${
                  recording
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "bg-accent text-accent-foreground hover:scale-105"
                }`}
              >
                {recording ? <Square className="size-10" /> : <Mic className="size-10" />}
              </button>
              <p className="mt-4 text-sm text-muted-foreground">
                {recording ? "Recording... tap to stop" : recorded ? "Sample captured" : "Tap to record"}
              </p>
            </div>

            {recorded && (
              <div className="mt-6 space-y-5 pt-6 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground">Extracted acoustic features</p>
                {([
                  { key: "pitch", label: "Pitch (Hz)", min: 80, max: 400, step: 1 },
                  { key: "energy", label: "Energy", min: 0, max: 1, step: 0.01 },
                  { key: "speakingRate", label: "Speaking rate (w/s)", min: 0.5, max: 5, step: 0.1 },
                  { key: "jitter", label: "Jitter (instability)", min: 0, max: 1, step: 0.01 },
                ] as const).map((f) => (
                  <div key={f.key}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{f.label}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {features[f.key].toFixed(f.step < 1 ? 2 : 0)}
                      </span>
                    </div>
                    <Slider
                      value={[features[f.key]]}
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      onValueChange={(v) => setFeatures((s) => ({ ...s, [f.key]: v[0] }))}
                    />
                  </div>
                ))}
                <Button
                  onClick={onAnalyze}
                  disabled={analyzing}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  size="lg"
                >
                  {analyzing ? <><Loader2 className="size-4 mr-2 animate-spin" /> Analyzing</> : <>Analyze voice <ArrowRight className="size-4 ml-1" /></>}
                </Button>
              </div>
            )}
          </Card>

          {result && (
            <div className="mt-10">
              <ResultDisplay result={result} />
              <div className="mt-6 text-center">
                <Link to="/multimodal">
                  <Button variant="outline">Combine with text & face →</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
