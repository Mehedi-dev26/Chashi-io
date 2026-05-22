import { Sparkles, TrendingUp, CloudRain, AlertTriangle } from "lucide-react";
import type { FieldZone } from "@/hooks/useIrrigationData";

export function AIInsights({ zones }: { zones: FieldZone[] }) {
  const lowMoisture = zones.filter((z) => z.soilMoisture < 40);
  const insights = [
    {
      icon: AlertTriangle,
      tone: "warning",
      title: "Critical: Zone Z-04 needs immediate irrigation",
      detail: "Soil moisture dropped to 22%. Recommended: 45-min cycle at 38 PSI.",
    },
    {
      icon: CloudRain,
      tone: "chart-2",
      title: "Weather forecast integrated",
      detail: "No rainfall predicted for 48h. Maintain current irrigation schedule.",
    },
    {
      icon: TrendingUp,
      tone: "primary",
      title: "Efficiency up 12% this week",
      detail: `AI scheduling saved ~${(lowMoisture.length * 320).toLocaleString()}L vs. manual baseline.`,
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 h-32 w-32 bg-primary/10 blur-3xl rounded-full" />
      <div className="flex items-center gap-2 relative">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-chart-2 grid place-items-center">
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">AI Insights & Recommendations</h2>
          <p className="text-[10px] text-muted-foreground font-mono">Updated · 3 min ago</p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {insights.map((i, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-background/40 p-3 flex gap-3">
            <div
              className="h-8 w-8 rounded-lg grid place-items-center shrink-0"
              style={{ background: `color-mix(in oklab, var(--color-${i.tone}) 18%, transparent)` }}
            >
              <i.icon className="h-4 w-4" style={{ color: `var(--color-${i.tone})` }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug">{i.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{i.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full h-10 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/15 transition">
        Ask AI · Optimize today's schedule
      </button>
    </div>
  );
}
