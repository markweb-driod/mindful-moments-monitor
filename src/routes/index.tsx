import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ResultDisplay, type DisplayResult } from "@/components/ResultDisplay";
import { runAnalyzeText } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Mic, Camera, Layers, Sparkles, Brain, ShieldCheck, ArrowRight, Loader2, Lock, Heart, Activity } from "lucide-react";
import { toast } from "sonner";
import heroImg from "@/assets/hero-bloom.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Serenity — Multi-modal Mental Health Monitoring" },
      { name: "description", content: "Understand your emotional wellbeing through intelligent text, voice, and facial analysis." },
      { property: "og:title", content: "Serenity — Mental Health Monitoring" },
      { property: "og:description", content: "Multi-modal AI insights for your mental wellbeing." },
    ],
  }),
  component: HomePage,
});

const MIN_LEN = 10;
const MAX_LEN = 2000;

function HomePage() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DisplayResult | null>(null);

  const validate = () => {
    const t = text.trim();
    if (t.length < MIN_LEN) {
      toast.error(`Please share at least ${MIN_LEN} characters so we can analyze meaningfully.`);
      return false;
    }
    if (t.length > MAX_LEN) {
      toast.error(`Please keep your entry under ${MAX_LEN} characters.`);
      return false;
    }
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const response = await runAnalyzeText(text);
      const analysis = response?.analysis;
      if (!analysis?.fused || !analysis?.suggestions) {
        throw new Error("Invalid analysis response");
      }
      setResult(analysis);
      toast.success("Analysis complete");
      setTimeout(() => {
        document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: any) {
      toast.error(err?.message ?? "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SiteLayout requireAuth={false}>
      {!user && (
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="container mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border text-xs font-semibold text-foreground/80 mb-6 shadow-[var(--shadow-soft)]">
              <Sparkles className="size-3.5 text-accent" />
              Multi-modal AI · Text · Voice · Face
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02] text-foreground">
              Find clarity. <br />
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Be held.</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/75 mt-6 max-w-xl leading-relaxed">
              Serenity reads what you write, how you speak, and how you look — surfacing patterns
              in your wellbeing so you can act with insight, not guesswork.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/auth" className="inline-flex">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[var(--shadow-glow)] h-12 px-6 text-base">
                  Get started free <ArrowRight className="size-4 ml-1" />
                </Button>
              </Link>
              <a href="#analyze">
                <Button size="lg" variant="outline" className="h-12 px-6 text-base border-foreground/15 hover:bg-card">
                  Try it now
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-xs font-medium text-foreground/60">
              <span className="inline-flex items-center gap-1.5"><Lock className="size-3.5" /> End-to-end private</span>
              <span className="inline-flex items-center gap-1.5"><Heart className="size-3.5" /> Built with care</span>
              <span className="inline-flex items-center gap-1.5"><Activity className="size-3.5" /> Real AI inference</span>
            </div>
          </div>

          <div className="md:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-[var(--shadow-glow)] border border-border/60 aspect-square">
              <img
                src={heroImg}
                alt="Calming abstract waveform representing emotional wellbeing"
                width={1280}
                height={1280}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-4 bottom-4 grid grid-cols-2 gap-2.5">
                {[
                  { icon: Brain, title: "Text", desc: "Sentiment & risk" },
                  { icon: Mic, title: "Voice", desc: "Tone & speech" },
                  { icon: Camera, title: "Face", desc: "Vision read" },
                  { icon: ShieldCheck, title: "Private", desc: "Your data only" },
                ].map((f) => (
                  <div key={f.title} className="px-3 py-2.5 rounded-xl bg-card/95 backdrop-blur-md border border-border/70 flex items-center gap-2.5">
                    <f.icon className="size-4 text-accent shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground leading-tight">{f.title}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight truncate">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      <section id="analyze" className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="font-display text-4xl font-semibold tracking-tight">
            {user ? "Welcome back. How are you feeling today?" : "How are you feeling today?"}
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">
            {user
              ? "Write a quick check-in and get your latest wellbeing analysis."
              : "Describe your thoughts in your own words. The system will analyze and respond."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="max-w-3xl mx-auto">
          <Card className="p-6 md:p-8 bg-card border-border shadow-[var(--shadow-soft)]">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="I've been feeling… today I noticed that…"
              className="min-h-[200px] text-base resize-none border-0 focus-visible:ring-0 shadow-none p-0 placeholder:text-muted-foreground/60"
              maxLength={MAX_LEN}
              aria-label="Describe your feelings"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={text.length > MAX_LEN * 0.9 ? "text-accent font-medium" : ""}>
                  {text.length}/{MAX_LEN}
                </span>
                <span>· min {MIN_LEN}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/voice"><Button type="button" variant="outline" size="sm"><Mic className="size-4 mr-1.5" /> Add voice</Button></Link>
                <Link to="/face"><Button type="button" variant="outline" size="sm"><Camera className="size-4 mr-1.5" /> Add face</Button></Link>
                <Button type="submit" disabled={analyzing} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {analyzing ? (<><Loader2 className="size-4 mr-1.5 animate-spin" /> Analyzing</>) : (<>Analyze <ArrowRight className="size-4 ml-1" /></>)}
                </Button>
              </div>
            </div>
          </Card>
        </form>

        {result && (
          <div id="result" className="max-w-3xl mx-auto mt-10">
            <ResultDisplay result={result} />
          </div>
        )}
      </section>

      {!user && (
      <section className="container mx-auto px-6 pb-10">
        <Card className="p-8 md:p-10 bg-gradient-to-br from-primary/15 via-card to-accent/15 border-border">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-2xl md:text-3xl font-semibold">Combine all signals for richer insights</h3>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Multi-modal fusion blends text, voice, and facial cues into a single, more reliable picture.
              </p>
            </div>
            <Link to="/multimodal">
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90">
                <Layers className="size-4 mr-1.5" /> Try multi-modal
              </Button>
            </Link>
          </div>
        </Card>
      </section>
      )}
    </SiteLayout>
  );
}
