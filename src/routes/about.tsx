import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Brain, Mic, Camera, Layers, ShieldCheck, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Serenity" },
      { name: "description", content: "How the multi-modal mental health monitoring system works." },
      { property: "og:title", content: "About Serenity" },
      { property: "og:description", content: "Architecture and intelligent techniques used." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl font-semibold tracking-tight">About Serenity</h1>
            <p className="text-muted-foreground mt-3 text-lg">
              A multi-modal mental health monitoring system using intelligent techniques.
            </p>
          </div>

          <div className="prose prose-neutral max-w-none">
            <Card className="p-7 bg-card border-border mb-6">
              <h2 className="font-display text-2xl font-semibold mb-3">What it does</h2>
              <p className="text-muted-foreground leading-relaxed">
                Serenity helps you reflect on your mental state by analyzing three complementary signals — what
                you write, how you speak, and how you look. Each modality contributes evidence; the system fuses
                them to give a single, more reliable assessment along with personalized suggestions.
              </p>
            </Card>

            <h2 className="font-display text-2xl font-semibold mb-4 mt-8">Intelligent techniques</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-6 bg-card border-border">
                <Brain className="size-6 text-primary mb-3" />
                <h3 className="font-semibold mb-1.5">Text NLP</h3>
                <p className="text-sm text-muted-foreground">
                  Lexicon-based scoring with negation/intensifier handling and softmax normalization across 8 emotion classes.
                </p>
              </Card>
              <Card className="p-6 bg-card border-border">
                <Mic className="size-6 text-primary mb-3" />
                <h3 className="font-semibold mb-1.5">Acoustic analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Heuristic mapping of pitch, energy, speaking rate, and jitter to emotional valence and arousal.
                </p>
              </Card>
              <Card className="p-6 bg-card border-border">
                <Camera className="size-6 text-primary mb-3" />
                <h3 className="font-semibold mb-1.5">Facial action units</h3>
                <p className="text-sm text-muted-foreground">
                  Smile, brow furrow, eye openness, mouth frown, and jaw tension are combined into emotional cues.
                </p>
              </Card>
              <Card className="p-6 bg-card border-border">
                <Layers className="size-6 text-primary mb-3" />
                <h3 className="font-semibold mb-1.5">Late fusion</h3>
                <p className="text-sm text-muted-foreground">
                  Probability distributions from each modality are weighted (text 0.5, voice 0.25, face 0.25) and combined.
                </p>
              </Card>
              <Card className="p-6 bg-card border-border">
                <Lightbulb className="size-6 text-primary mb-3" />
                <h3 className="font-semibold mb-1.5">Risk scoring</h3>
                <p className="text-sm text-muted-foreground">
                  Weighted emotion contributions plus crisis-keyword detection determine a four-level risk indicator.
                </p>
              </Card>
              <Card className="p-6 bg-card border-border">
                <ShieldCheck className="size-6 text-primary mb-3" />
                <h3 className="font-semibold mb-1.5">Privacy-first</h3>
                <p className="text-sm text-muted-foreground">
                  All analysis runs locally in your browser. Nothing leaves your device.
                </p>
              </Card>
            </div>

            <Card className="p-6 mt-8 bg-amber-50 border-amber-200">
              <h3 className="font-semibold mb-2 text-amber-900">Disclaimer</h3>
              <p className="text-sm text-amber-900/80 leading-relaxed">
                Serenity is intended for educational and self-reflection purposes. It is not a diagnostic tool and
                does not replace professional medical advice, diagnosis, or treatment. If you are concerned about
                your mental health, please consult a qualified clinician.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
