import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { loadHistory, clearHistory, EMOTION_COLORS, type AnalysisResult } from "@/lib/analyzer";
import { Trash2, History as HistoryIcon, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Serenity" },
      { name: "description", content: "Track your mental wellbeing patterns over time." },
      { property: "og:title", content: "History — Serenity" },
      { property: "og:description", content: "Your wellbeing trend." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [items, setItems] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    setItems(loadHistory());
  }, []);

  const onClear = () => {
    clearHistory();
    setItems([]);
    toast.success("History cleared");
  };

  const avgWellbeing =
    items.length > 0 ? Math.round(items.reduce((a, b) => a + b.wellbeingScore, 0) / items.length) : 0;

  return (
    <SiteLayout>
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <h1 className="font-display text-5xl font-semibold tracking-tight">Your History</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                {items.length > 0 ? `${items.length} sessions recorded` : "No sessions yet"}
              </p>
            </div>
            {items.length > 0 && (
              <Button variant="outline" onClick={onClear}>
                <Trash2 className="size-4 mr-1.5" /> Clear all
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <Card className="p-16 text-center bg-card border-border">
              <HistoryIcon className="size-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-2xl font-semibold mb-2">No sessions yet</h3>
              <p className="text-muted-foreground mb-6">Start an analysis to see your wellbeing trend.</p>
              <Link to="/">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Start a session</Button>
              </Link>
            </Card>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <Card className="p-6 bg-card border-border">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Sessions</p>
                  <p className="font-display text-4xl font-semibold mt-1">{items.length}</p>
                </Card>
                <Card className="p-6 bg-card border-border">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg wellbeing</p>
                  <p className="font-display text-4xl font-semibold mt-1">{avgWellbeing}/100</p>
                </Card>
                <Card className="p-6 bg-card border-border">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest state</p>
                  <p className="font-display text-3xl font-semibold mt-1">{items[0].fused.label}</p>
                </Card>
              </div>

              {/* Trend sparkline */}
              <Card className="p-6 bg-card border-border mb-8">
                <div className="flex items-center gap-2 text-sm font-medium mb-4 text-muted-foreground">
                  <TrendingUp className="size-4" /> Wellbeing trend (newest → oldest)
                </div>
                <div className="flex items-end gap-1.5 h-32">
                  {items.slice(0, 30).reverse().map((it) => (
                    <div
                      key={it.id}
                      className="flex-1 rounded-t-md transition-all hover:opacity-80"
                      style={{
                        height: `${it.wellbeingScore}%`,
                        background: EMOTION_COLORS[it.fused.label],
                      }}
                      title={`${it.fused.label} · ${it.wellbeingScore}/100`}
                    />
                  ))}
                </div>
              </Card>

              <div className="space-y-3">
                {items.map((it) => (
                  <Card key={it.id} className="p-5 bg-card border-border hover:shadow-[var(--shadow-soft)] transition-shadow">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <Badge style={{ background: EMOTION_COLORS[it.fused.label], color: "white" }} className="border-0">
                            {it.fused.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(it.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {it.inputPreview && (
                          <p className="text-sm text-muted-foreground line-clamp-2">"{it.inputPreview}"</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-display text-2xl font-semibold tabular-nums">{it.wellbeingScore}</p>
                        <p className="text-xs text-muted-foreground">wellbeing</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
