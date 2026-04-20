import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ResultDisplay } from "@/components/ResultDisplay";
import { buildAnalysis, saveAnalysis, type AnalysisResult, type FaceFeatures } from "@/lib/analyzer";
import { Camera, Loader2, ArrowRight, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/face")({
  head: () => ({
    meta: [
      { title: "Facial Analysis — Serenity" },
      { name: "description", content: "Analyze facial action units to detect emotional states." },
      { property: "og:title", content: "Facial Analysis — Serenity" },
      { property: "og:description", content: "Vision-based emotion detection." },
    ],
  }),
  component: FacePage,
});

function FacePage() {
  const [captured, setCaptured] = useState<string | null>(null);
  const [features, setFeatures] = useState<FaceFeatures>({
    smile: 0.4,
    browFurrow: 0.3,
    eyeOpenness: 0.6,
    mouthFrown: 0.2,
    jawTension: 0.3,
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    const url = URL.createObjectURL(file);
    setCaptured(url);
    // simulate AU extraction
    setFeatures({
      smile: Math.random(),
      browFurrow: Math.random() * 0.7,
      eyeOpenness: 0.4 + Math.random() * 0.6,
      mouthFrown: Math.random() * 0.6,
      jawTension: Math.random() * 0.7,
    });
    toast.success("Face captured. Action units extracted.");
  };

  const onAnalyze = async () => {
    if (!captured) {
      toast.error("Please upload a facial image first");
      return;
    }
    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 600));
    const r = buildAnalysis({ face: features });
    saveAnalysis(r);
    setResult(r);
    setAnalyzing(false);
  };

  return (
    <SiteLayout>
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="font-display text-5xl font-semibold tracking-tight">Facial Analysis</h1>
            <p className="text-muted-foreground mt-3 text-lg">
              Upload a clear photo of your face. Action units are inferred and mapped to emotion.
            </p>
          </div>

          <Card className="p-8 bg-card border-border shadow-[var(--shadow-soft)]">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div>
                <label className="block">
                  <div className="aspect-square rounded-xl border-2 border-dashed border-border bg-surface-2 grid place-items-center cursor-pointer hover:bg-surface-1 transition overflow-hidden">
                    {captured ? (
                      <img src={captured} alt="Captured face" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-6">
                        <Upload className="size-10 mx-auto text-muted-foreground mb-3" />
                        <p className="font-medium">Upload a photo</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
                </label>
              </div>

              <div className="space-y-5">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Camera className="size-4" /> Facial action units
                </p>
                {([
                  { key: "smile", label: "Smile" },
                  { key: "browFurrow", label: "Brow furrow" },
                  { key: "eyeOpenness", label: "Eye openness" },
                  { key: "mouthFrown", label: "Mouth frown" },
                  { key: "jawTension", label: "Jaw tension" },
                ] as const).map((f) => (
                  <div key={f.key}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{f.label}</span>
                      <span className="text-muted-foreground tabular-nums">{features[f.key].toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[features[f.key]]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={(v) => setFeatures((s) => ({ ...s, [f.key]: v[0] }))}
                    />
                  </div>
                ))}
                <Button
                  onClick={onAnalyze}
                  disabled={analyzing || !captured}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  size="lg"
                >
                  {analyzing ? <><Loader2 className="size-4 mr-2 animate-spin" /> Analyzing</> : <>Analyze face <ArrowRight className="size-4 ml-1" /></>}
                </Button>
              </div>
            </div>
          </Card>

          {result && (
            <div className="mt-10">
              <ResultDisplay result={result} />
              <div className="mt-6 text-center">
                <Link to="/multimodal">
                  <Button variant="outline">Combine with text & voice →</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
