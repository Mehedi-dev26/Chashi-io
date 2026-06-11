import { Droplets, Gauge, Sprout, Zap, TrendingUp, TrendingDown } from "lucide-react";
import type { FieldZone, MotorState } from "@/hooks/useIrrigationData";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export function StatsCards({ zones, motor }: { zones: FieldZone[]; motor: MotorState }) {
  const totalArea = zones.reduce((s, z) => s + z.area, 0);
  const irrigating = zones.filter((z) => z.valveOpen).length;

  const items = [
    { label: "মোট জমি", value: bn(totalArea.toFixed(1)), unit: "একর", icon: Sprout, ratio: 0.78, trend: 4.2, up: true, accent: "from-primary to-chart-2" },
    { label: "সক্রিয় ভাল্ভ", value: bn(irrigating), unit: `/ ${bn(zones.length)} জোন`, icon: Droplets, ratio: irrigating / zones.length, trend: 12, up: true, accent: "from-chart-2 to-chart-5" },
    { label: "পাম্পের চাপ", value: bn(motor.pressure), unit: "PSI", icon: Gauge, ratio: motor.pressure / 60, trend: 2.1, up: false, accent: "from-accent to-warning" },
    { label: "বিদ্যুৎ ব্যবহার", value: bn(((motor.voltage * motor.current) / 1000).toFixed(1)), unit: "কিলোওয়াট", icon: Zap, ratio: 0.65, trend: 8.4, up: false, accent: "from-chart-4 to-destructive" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((it) => {
        const TrendIcon = it.up ? TrendingUp : TrendingDown;
        return (
          <div key={it.label} className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover-lift">
            <div className={`absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br ${it.accent} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500`} />
            <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${it.accent} opacity-70`} />

            <div className="flex items-start justify-between relative">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-bold">
                  {it.label}
                </p>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-foreground tabular-nums">{it.value}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">{it.unit}</span>
                </div>
              </div>
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${it.accent} bg-opacity-10 grid place-items-center shadow-lg ring-1 ring-white/40 shrink-0`}>
                <it.icon className="h-5 w-5 text-white drop-shadow" />
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between gap-2">
              <div className="flex-1 h-1.5 bg-muted/70 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${it.accent} rounded-full transition-all duration-700 relative`}
                  style={{ width: `${Math.min(100, it.ratio * 100)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer bg-[length:200%_100%]" />
                </div>
              </div>
              <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${it.up ? "text-success bg-success/10" : "text-destructive bg-destructive/10"}`}>
                <TrendIcon className="h-2.5 w-2.5" />
                <span>{bn(it.trend.toFixed(1))}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
