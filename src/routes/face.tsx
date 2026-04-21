import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResultDisplay, type DisplayResult } from "@/components/ResultDisplay";
import { runAnalyzeFace } from "@/lib/api";
import { Loader2, ArrowRight, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/face")({
  head: () => ({
    meta: [
      { title: "Facial Analysis — Serenity" },
      { name: "description", content: "Upload a photo for AI vision-based emotional analysis." },
    ],
  }),
  component: FacePage,
});

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function FacePage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DisplayResult | null>(null);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Image too large (max 6MB)");
      return;
    }
    const url = await fileToDataUrl(file);
    setDataUrl(url);
    setPreview(URL.createObjectURL(file));
    toast.success("Photo ready. Tap Analyze.");
  };

  const onAnalyze = async () => {
    if (!dataUrl) {
      toast.error("Please upload a facial image first");
      return;
    }
    setAnalyzing(true);
    try {
      const { analysis } = await runAnalyzeFace(dataUrl);
      setResult(analysis);
      toast.success("Analysis complete");
    } catch (e: any) {
      toast.error(e?.message ?? "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SiteLayout>
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="font-display text-5xl font-semibold tracking-tight">Facial Analysis</h1>
            <p className="text-muted-foreground mt-3 text-lg">
              Upload a clear photo of your face. The AI infers emotion from visible cues.
            </p>
          </div>

          <Card className="p-8 bg-card border-border shadow-[var(--shadow-soft)]">
            <label className="block max-w-md mx-auto">
              <div className="aspect-square rounded-xl border-2 border-dashed border-border bg-surface-2 grid place-items-center cursor-pointer hover:bg-surface-1 transition overflow-hidden">
                {preview ? (
                  <img src={preview} alt="Captured face" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-6">
                    <Upload className="size-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Upload a photo</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 6MB</p>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
            </label>

            <Button
              onClick={onAnalyze}
              disabled={analyzing || !dataUrl}
              className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/90"
              size="lg"
            >
              {analyzing ? <><Loader2 className="size-4 mr-2 animate-spin" /> Analyzing</> : <>Analyze face <ArrowRight className="size-4 ml-1" /></>}
            </Button>
          </Card>

          {result && (
            <div className="mt-10">
              <ResultDisplay result={result} />
              <div className="mt-6 text-center">
                <Link to="/multimodal"><Button variant="outline">Combine with text & voice →</Button></Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
