import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Phone, Globe, BookOpen, HeartHandshake } from "lucide-react";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources & Help — Serenity" },
      { name: "description", content: "Crisis helplines, self-help guides, and trusted mental health resources." },
      { property: "og:title", content: "Resources & Help — Serenity" },
      { property: "og:description", content: "Get support and learn coping strategies." },
    ],
  }),
  component: ResourcesPage,
});

const HELPLINES = [
  { country: "International (Befrienders Worldwide)", phone: "befrienders.org", url: "https://www.befrienders.org" },
  { country: "United States", phone: "988 (Suicide & Crisis Lifeline)", url: "https://988lifeline.org" },
  { country: "United Kingdom", phone: "116 123 (Samaritans)", url: "https://www.samaritans.org" },
  { country: "Canada", phone: "1-833-456-4566 (Talk Suicide)", url: "https://talksuicide.ca" },
  { country: "Australia", phone: "13 11 14 (Lifeline)", url: "https://www.lifeline.org.au" },
  { country: "India", phone: "9152987821 (iCall)", url: "https://icallhelpline.org" },
];

const STRATEGIES = [
  { title: "Box breathing", desc: "Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 4 cycles." },
  { title: "5-4-3-2-1 grounding", desc: "Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste." },
  { title: "Body scan", desc: "Slowly attend to each part of your body from head to toes for 3 minutes." },
  { title: "Gratitude note", desc: "Write three small things you're grateful for today." },
  { title: "Movement break", desc: "A 10-minute walk, ideally outdoors, lifts mood reliably." },
  { title: "Sleep hygiene", desc: "Consistent bedtime, no screens 30 min before sleep, cool dark room." },
];

function ResourcesPage() {
  return (
    <SiteLayout>
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl font-semibold tracking-tight">Resources & Help</h1>
            <p className="text-muted-foreground mt-3 text-lg">
              You are not alone. If you're in crisis, please reach out.
            </p>
          </div>

          <Card className="p-6 md:p-8 bg-gradient-to-br from-accent/15 to-primary/15 border-border mb-10">
            <div className="flex items-start gap-4">
              <HeartHandshake className="size-8 text-accent shrink-0" />
              <div>
                <h2 className="font-display text-2xl font-semibold mb-1">In immediate danger?</h2>
                <p className="text-muted-foreground">
                  Please contact your local emergency services right away, or call one of the crisis helplines below.
                </p>
              </div>
            </div>
          </Card>

          <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
            <Phone className="size-5 text-primary" /> Crisis helplines
          </h2>
          <div className="grid md:grid-cols-2 gap-3 mb-12">
            {HELPLINES.map((h) => (
              <a
                key={h.country}
                href={h.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-5 rounded-xl border border-border bg-card hover:shadow-[var(--shadow-soft)] transition"
              >
                <p className="font-semibold">{h.country}</p>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Globe className="size-3.5" /> {h.phone}
                </p>
              </a>
            ))}
          </div>

          <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="size-5 text-primary" /> Self-help strategies
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {STRATEGIES.map((s) => (
              <Card key={s.title} className="p-5 bg-card border-border">
                <h3 className="font-semibold mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
