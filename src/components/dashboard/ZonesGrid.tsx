import { Droplets, Sprout } from "lucide-react";
import type { FieldZone } from "@/hooks/useIrrigationData";

export function ZonesGrid({ zones, onToggle }: { zones: FieldZone[]; onToggle: (id: string) => void }) {
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">All Irrigation Zones</h2>
        <span className="text-[10px] font-mono text-muted-foreground">{zones.length} active sensors</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {zones.map((z) => (
          <div key={z.id} className="rounded-xl border border-border bg-background/40 p-3 hover:border-primary/40 transition">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground">{z.id}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase ${
                      z.status === "irrigating" ? "bg-primary/15 text-primary" :
                      z.status === "alert" ? "bg-destructive/15 text-destructive" :
                      z.status === "scheduled" ? "bg-chart-2/15 text-chart-2" :
                      "bg-muted text-muted-foreground"
                    }`}
                  >
                    {z.status}
                  </span>
                </div>
                <p className="font-semibold text-sm mt-1">{z.name}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Sprout className="h-3 w-3" /> {z.cropType} · {z.area} acres
                </p>
              </div>
              <button
                onClick={() => onToggle(z.id)}
                className={`h-8 w-12 rounded-full relative transition ${z.valveOpen ? "bg-primary" : "bg-muted"}`}
                aria-label="toggle valve"
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-background transition-all ${
                    z.valveOpen ? "left-5" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              <Bar label="Water" value={z.waterLevel} icon={Droplets} />
              <Bar label="Soil" value={z.soilMoisture} icon={Sprout} colorVar="--color-chart-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({
  label, value, icon: Icon, colorVar = "--color-primary",
}: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; colorVar?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] mb-0.5">
        <span className="flex items-center gap-1 text-muted-foreground"><Icon className="h-2.5 w-2.5" />{label}</span>
        <span className="font-mono font-semibold">{value.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: `var(${colorVar})` }}
        />
      </div>
    </div>
  );
}
