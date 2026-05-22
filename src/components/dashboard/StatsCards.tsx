import { Droplets, Gauge, Sprout, Zap } from "lucide-react";
import type { FieldZone, MotorState } from "@/hooks/useIrrigationData";

export function StatsCards({ zones, motor }: { zones: FieldZone[]; motor: MotorState }) {
  const totalArea = zones.reduce((s, z) => s + z.area, 0);
  const irrigating = zones.filter((z) => z.valveOpen).length;
  const avgMoisture = zones.reduce((s, z) => s + z.soilMoisture, 0) / zones.length;

  const items = [
    { label: "Total Coverage", value: `${totalArea.toFixed(1)}`, unit: "acres", icon: Sprout, tone: "primary" },
    { label: "Active Valves", value: `${irrigating}`, unit: `/ ${zones.length} zones`, icon: Droplets, tone: "chart-2" },
    { label: "Pump Pressure", value: `${motor.pressure}`, unit: "PSI", icon: Gauge, tone: "accent" },
    { label: "Power Draw", value: `${(motor.voltage * motor.current / 1000).toFixed(1)}`, unit: "kW", icon: Zap, tone: "warning" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((it) => (
        <div key={it.label} className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
          <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition" />
          <div className="flex items-start justify-between relative">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                {it.label}
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight">{it.value}</span>
                <span className="text-xs text-muted-foreground font-mono">{it.unit}</span>
              </div>
            </div>
            <div className="h-9 w-9 rounded-xl bg-primary/15 grid place-items-center">
              <it.icon className="h-4.5 w-4.5 text-primary" />
            </div>
          </div>
          <div className="mt-3 h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full" style={{ width: `${60 + Math.random() * 30}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
