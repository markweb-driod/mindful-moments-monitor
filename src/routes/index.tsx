import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ResultDisplay, type DisplayResult } from "@/components/ResultDisplay";
import { runAnalyzeText } from "@/lib/api";
import { Mic, Camera, Layers, Sparkles, Brain, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
      const { analysis } = await runAnalyzeText(text);
      setResult(analysis);
      toast.success("Analysis complete");
      setTimeout(() => {
        document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: any) {
      toast.error(err?.message ?? "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-60" style={{ background: "var(--gradient-calm)" }} aria-hidden />
        <div className="container mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/80 backdrop-blur border border-border text-xs font-medium text-muted-foreground mb-5">
              <Sparkles className="size-3.5 text-accent" /> Intelligent multi-modal analysis
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              Find clarity. <br />
              <span className="text-accent">Be held.</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-prose leading-relaxed">
              Share how you're feeling and let our intelligent system surface patterns across what you write,
              how you speak, and how you look — so you can take care of your mind with insight.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <a href="#analyze" className="inline-flex">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[var(--shadow-soft)]">
                  Start a session <ArrowRight className="size-4 ml-1" />
                </Button>
              </a>
              <Link to="/multimodal">
                <Button size="lg" variant="outline">Try multi-modal</Button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Brain, title: "Text NLP", desc: "AI sentiment & risk detection" },
              { icon: Mic, title: "Voice cues", desc: "Tone & speech analysis" },
              { icon: Camera, title: "Facial signals", desc: "Vision-based emotion read" },
              { icon: ShieldCheck, title: "Private", desc: "Your data, your account" },
            ].map((f) => (
              <Card key={f.title} className="p-5 bg-card/80 backdrop-blur border-border">
                <f.icon className="size-6 text-primary mb-3" />
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="analyze" className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="font-display text-4xl font-semibold tracking-tight">How are you feeling today?</h2>
          <p className="text-muted-foreground mt-3 text-lg">
            Describe your thoughts in your own words. The system will analyze and respond.
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
    </SiteLayout>
  );
}
