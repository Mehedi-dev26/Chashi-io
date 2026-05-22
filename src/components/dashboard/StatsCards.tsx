import { Droplets, Gauge, Sprout, Zap } from "lucide-react";
import type { FieldZone, MotorState } from "@/hooks/useIrrigationData";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export function StatsCards({ zones, motor }: { zones: FieldZone[]; motor: MotorState }) {
  const totalArea = zones.reduce((s, z) => s + z.area, 0);
  const irrigating = zones.filter((z) => z.valveOpen).length;

  const items = [
    { label: "মোট জমি", value: bn(totalArea.toFixed(1)), unit: "একর", icon: Sprout, ratio: 0.78 },
    { label: "সক্রিয় ভাল্ভ", value: bn(irrigating), unit: `/ ${bn(zones.length)} জোন`, icon: Droplets, ratio: irrigating / zones.length },
    { label: "পাম্পের চাপ", value: bn(motor.pressure), unit: "PSI", icon: Gauge, ratio: motor.pressure / 60 },
    { label: "বিদ্যুৎ ব্যবহার", value: bn(((motor.voltage * motor.current) / 1000).toFixed(1)), unit: "কিলোওয়াট", icon: Zap, ratio: 0.65 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((it) => (
        <div key={it.label} className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
          <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/15 blur-2xl group-hover:bg-primary/25 transition" />
          <div className="flex items-start justify-between relative">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                {it.label}
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{it.value}</span>
                <span className="text-xs text-muted-foreground">{it.unit}</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/12 border border-primary/20 grid place-items-center">
              <it.icon className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full transition-all" style={{ width: `${Math.min(100, it.ratio * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
