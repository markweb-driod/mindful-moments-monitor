import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResultDisplay, type DisplayResult } from "@/components/ResultDisplay";
import { runAnalyzeVoice } from "@/lib/api";
import { Mic, Square, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/voice")({
  head: () => ({
    meta: [
      { title: "Voice Analysis — Serenity" },
      { name: "description", content: "Record your voice and get AI emotional analysis from tone and speech." },
    ],
  }),
  component: VoicePage,
});

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

function VoicePage() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DisplayResult | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
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
      toast.info("Recording… speak naturally, then tap stop");
    } catch (e: any) {
      toast.error(e?.message ?? "Microphone permission denied");
    }
  };

  const stop = () => {
    recRef.current?.stop();
    setRecording(false);
  };

  const onAnalyze = async () => {
    if (!audioBlob) {
      toast.error("Please record a sample first");
      return;
    }
    setAnalyzing(true);
    try {
      const dataUrl = await blobToDataUrl(audioBlob);
      const { analysis } = await runAnalyzeVoice(dataUrl, audioBlob.type);
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
            <h1 className="font-display text-5xl font-semibold tracking-tight">Voice Analysis</h1>
            <p className="text-muted-foreground mt-3 text-lg">
              Record a short voice sample. Our AI listens for tone, pace, and word choice.
            </p>
          </div>

          <Card className="p-8 bg-card border-border shadow-[var(--shadow-soft)]">
            <div className="flex flex-col items-center text-center py-6">
              <button
                onClick={recording ? stop : start}
                className={`size-28 rounded-full grid place-items-center transition-all ${
                  recording ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-accent text-accent-foreground hover:scale-105"
                }`}
              >
                {recording ? <Square className="size-10" /> : <Mic className="size-10" />}
              </button>
              <p className="mt-4 text-sm text-muted-foreground">
                {recording ? "Recording... tap to stop" : audioBlob ? "Sample captured" : "Tap to record"}
              </p>
            </div>

            {audioUrl && !recording && (
              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <audio src={audioUrl} controls className="w-full" />
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
                <Link to="/multimodal"><Button variant="outline">Combine with text & face →</Button></Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
