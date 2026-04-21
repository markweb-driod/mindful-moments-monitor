import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ResultDisplay, type DisplayResult } from "@/components/ResultDisplay";
import { runAnalyzeMultimodal } from "@/lib/api";
import { Loader2, Layers, ArrowRight, Mic, Square, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/multimodal")({
  head: () => ({
    meta: [
      { title: "Multi-modal Analysis — Serenity" },
      { name: "description", content: "Combine text, voice, and facial signals for richer insights." },
    ],
  }),
  component: MultimodalPage,
});

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

function MultimodalPage() {
  const [text, setText] = useState("");
  const [useVoice, setUseVoice] = useState(false);
  const [useFace, setUseFace] = useState(false);

  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [imgDataUrl, setImgDataUrl] = useState<string | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);

  const [result, setResult] = useState<DisplayResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch (e: any) {
      toast.error(e?.message ?? "Microphone error");
    }
  };
  const stopRec = () => {
    recRef.current?.stop();
    setRecording(false);
  };

  const onUploadImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) return toast.error("Image too large (6MB max)");
    const r = new FileReader();
    r.onloadend = () => setImgDataUrl(r.result as string);
    r.readAsDataURL(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const onAnalyze = async () => {
    if (!text.trim() && !(useVoice && audioBlob) && !(useFace && imgDataUrl)) {
      toast.error("Provide at least one modality");
      return;
    }
    setAnalyzing(true);
    try {
      const audioDataUrl = useVoice && audioBlob ? await blobToDataUrl(audioBlob) : undefined;
      const { analysis } = await runAnalyzeMultimodal({
        text: text.trim() || undefined,
        imageDataUrl: useFace ? imgDataUrl ?? undefined : undefined,
        audioDataUrl,
        audioMime: audioBlob?.type,
      });
      setResult(analysis);
      toast.success("Multi-modal analysis complete");
    } catch (e: any) {
      toast.error(e?.message ?? "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
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
              Combine text, voice, and a photo. The system fuses all signals into one insight.
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
                <Label className="text-sm font-semibold">Voice</Label>
                <Switch checked={useVoice} onCheckedChange={setUseVoice} />
              </div>
              <div className={useVoice ? "" : "opacity-40 pointer-events-none"}>
                <Button
                  type="button"
                  onClick={recording ? stopRec : startRec}
                  variant={recording ? "destructive" : "outline"}
                  className="w-full"
                >
                  {recording ? <><Square className="size-4 mr-1.5" /> Stop</> : <><Mic className="size-4 mr-1.5" /> {audioBlob ? "Re-record" : "Record"}</>}
                </Button>
                {audioUrl && <audio src={audioUrl} controls className="w-full mt-3" />}
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-sm font-semibold">Facial photo</Label>
                <Switch checked={useFace} onCheckedChange={setUseFace} />
              </div>
              <label className={`block ${useFace ? "" : "opacity-40 pointer-events-none"}`}>
                <div className="aspect-video rounded-lg border-2 border-dashed border-border bg-surface-2 grid place-items-center cursor-pointer overflow-hidden">
                  {imgPreview ? (
                    <img src={imgPreview} alt="Face" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-muted-foreground text-xs">
                      <Upload className="size-6 mx-auto mb-1" /> Upload photo
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={onUploadImg} />
              </label>
            </Card>
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              onClick={onAnalyze}
              disabled={analyzing}
              className="bg-accent text-accent-foreground hover:bg-accent/90 px-8"
            >
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
