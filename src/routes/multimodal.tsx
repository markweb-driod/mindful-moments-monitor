import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ResultDisplay } from "@/components/ResultDisplay";
import { buildAnalysis, saveAnalysis, type AnalysisResult, type VoiceFeatures, type FaceFeatures } from "@/lib/analyzer";
import { Loader2, Layers, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/multimodal")({
  head: () => ({
    meta: [
      { title: "Multi-modal Analysis — Serenity" },
      { name: "description", content: "Combine text, voice, and facial signals for richer mental health insights." },
      { property: "og:title", content: "Multi-modal Analysis — Serenity" },
      { property: "og:description", content: "Late-fusion of text, voice, and face." },
    ],
  }),
  component: MultimodalPage,
});

function MultimodalPage() {
  const [text, setText] = useState("");
  const [useVoice, setUseVoice] = useState(true);
  const [useFace, setUseFace] = useState(true);
  const [voice, setVoice] = useState<VoiceFeatures>({ pitch: 200, energy: 0.5, speakingRate: 2.5, jitter: 0.25 });
  const [face, setFace] = useState<FaceFeatures>({ smile: 0.4, browFurrow: 0.3, eyeOpenness: 0.6, mouthFrown: 0.2, jawTension: 0.3 });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const onAnalyze = async () => {
    if (!text.trim() && !useVoice && !useFace) {
      toast.error("Please provide at least one modality");
      return;
    }
    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 700));
    const r = buildAnalysis({
      text: text.trim() || undefined,
      voice: useVoice ? voice : undefined,
      face: useFace ? face : undefined,
    });
    saveAnalysis(r);
    setResult(r);
    setAnalyzing(false);
  };

  return (
    <SiteLayout>
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground mb-4">
              <Layers className="size-3.5 text-accent" /> Late-fusion model
            </div>
            <h1 className="font-display text-5xl font-semibold tracking-tight">Multi-modal Analysis</h1>
            <p className="text-muted-foreground mt-3 text-lg">
              Combine all three signals. The system weighs each modality and fuses them into a single insight.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 bg-card border-border md:col-span-2">
              <Label className="text-sm font-semibold mb-3 block">Text input</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe how you're feeling..."
                className="min-h-[120px] resize-none"
                maxLength={2000}
              />
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-sm font-semibold">Voice features</Label>
                <Switch checked={useVoice} onCheckedChange={setUseVoice} />
              </div>
              <div className={`space-y-4 ${useVoice ? "" : "opacity-40 pointer-events-none"}`}>
                {([
                  { key: "pitch", label: "Pitch", min: 80, max: 400, step: 1 },
                  { key: "energy", label: "Energy", min: 0, max: 1, step: 0.01 },
                  { key: "speakingRate", label: "Rate", min: 0.5, max: 5, step: 0.1 },
                  { key: "jitter", label: "Jitter", min: 0, max: 1, step: 0.01 },
                ] as const).map((f) => (
                  <div key={f.key}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span>{f.label}</span>
                      <span className="text-muted-foreground tabular-nums">{voice[f.key].toFixed(f.step < 1 ? 2 : 0)}</span>
                    </div>
                    <Slider value={[voice[f.key]]} min={f.min} max={f.max} step={f.step} onValueChange={(v) => setVoice((s) => ({ ...s, [f.key]: v[0] }))} />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-sm font-semibold">Facial features</Label>
                <Switch checked={useFace} onCheckedChange={setUseFace} />
              </div>
              <div className={`space-y-4 ${useFace ? "" : "opacity-40 pointer-events-none"}`}>
                {([
                  { key: "smile", label: "Smile" },
                  { key: "browFurrow", label: "Brow furrow" },
                  { key: "eyeOpenness", label: "Eye openness" },
                  { key: "mouthFrown", label: "Mouth frown" },
                  { key: "jawTension", label: "Jaw tension" },
                ] as const).map((f) => (
                  <div key={f.key}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span>{f.label}</span>
                      <span className="text-muted-foreground tabular-nums">{face[f.key].toFixed(2)}</span>
                    </div>
                    <Slider value={[face[f.key]]} min={0} max={1} step={0.01} onValueChange={(v) => setFace((s) => ({ ...s, [f.key]: v[0] }))} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={onAnalyze} disabled={analyzing} className="bg-accent text-accent-foreground hover:bg-accent/90 px-8">
              {analyzing ? <><Loader2 className="size-4 mr-2 animate-spin" /> Fusing signals</> : <>Run multi-modal analysis <ArrowRight className="size-4 ml-1" /></>}
            </Button>
          </div>

          {result && (
            <div className="mt-12">
              <ResultDisplay result={result} />
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
