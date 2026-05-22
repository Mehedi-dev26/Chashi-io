import { useState } from "react";
import { Droplet, Maximize2, MapPin } from "lucide-react";
import type { FieldZone } from "@/hooks/useIrrigationData";

const statusColor: Record<FieldZone["status"], string> = {
  irrigating: "var(--color-primary)",
  idle: "var(--color-muted-foreground)",
  scheduled: "var(--color-chart-2)",
  alert: "var(--color-destructive)",
};

export function FieldMap({ zones, onToggle }: { zones: FieldZone[]; onToggle: (id: string) => void }) {
  const [selected, setSelected] = useState<string | null>(zones[0]?.id ?? null);
  const active = zones.find((z) => z.id === selected);

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Field Topology · Live Map
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time zone telemetry & valve control</p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono">
          {(["irrigating", "scheduled", "idle", "alert"] as const).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: statusColor[s] }} />
              <span className="uppercase text-muted-foreground">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        {/* Map */}
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-border grid-bg bg-secondary/30">
          {/* Pipeline network */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pipe" x1="0" x2="1">
                <stop offset="0" stopColor="oklch(0.78 0.18 155)" stopOpacity="0.8" />
                <stop offset="1" stopColor="oklch(0.7 0.16 200)" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {/* Central hub to zones */}
            {zones.map((z) => (
              <line
                key={z.id}
                x1="50" y1="50" x2={z.x} y2={z.y}
                stroke="url(#pipe)"
                strokeWidth={z.valveOpen ? 0.6 : 0.3}
                opacity={z.valveOpen ? 1 : 0.35}
                className={z.valveOpen ? "flow-line" : ""}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {/* Central pump */}
          <div className="absolute" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
            <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-primary to-chart-2 grid place-items-center shadow-[var(--shadow-glow)]">
              <Droplet className="h-5 w-5 text-primary-foreground" />
              <span className="absolute inset-0 rounded-full border-2 border-primary pulse-ring" />
            </div>
            <p className="mt-1 text-[9px] font-mono text-center text-muted-foreground">PUMP</p>
          </div>

          {/* Zones */}
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => setSelected(z.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${z.x}%`, top: `${z.y}%` }}
            >
              <div className="relative">
                <div
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg grid place-items-center transition-all"
                  style={{
                    background: `color-mix(in oklab, ${statusColor[z.status]} 25%, transparent)`,
                    border: `1.5px solid ${statusColor[z.status]}`,
                    boxShadow: selected === z.id ? `0 0 20px ${statusColor[z.status]}` : "none",
                    transform: selected === z.id ? "scale(1.15)" : "scale(1)",
                  }}
                >
                  <span className="text-[9px] sm:text-[10px] font-bold font-mono">{z.id.slice(2)}</span>
                </div>
                {z.valveOpen && (
                  <span className="absolute inset-0 rounded-lg pulse-ring" style={{ border: `2px solid ${statusColor[z.status]}` }} />
                )}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-foreground/70 whitespace-nowrap">
                  {z.waterLevel.toFixed(0)}%
                </div>
              </div>
            </button>
          ))}

          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-background/60 backdrop-blur px-2 py-1 rounded">
            <Maximize2 className="h-3 w-3" /> 32.6 ha total
          </div>
        </div>

        {/* Detail panel */}
        {active && (
          <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Selected Zone</p>
              <h3 className="font-bold text-lg leading-tight">{active.name}</h3>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                {active.nameBn} · {active.cropType}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Stat label="Water Level" value={`${active.waterLevel.toFixed(0)}%`} color="primary" />
              <Stat label="Soil Moisture" value={`${active.soilMoisture.toFixed(0)}%`} color="chart-2" />
              <Stat label="Area" value={`${active.area} ac`} />
              <Stat label="Status" value={active.status} />
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Valve Control</p>
              <button
                onClick={() => onToggle(active.id)}
                className={`w-full h-10 rounded-lg font-medium text-sm transition relative overflow-hidden ${
                  active.valveOpen
                    ? "bg-destructive/15 border border-destructive/40 text-destructive hover:bg-destructive/25"
                    : "bg-primary text-primary-foreground hover:opacity-90 glow-primary"
                }`}
              >
                {active.valveOpen ? "● Close Valve" : "▶ Open Valve & Irrigate"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 p-2.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 capitalize ${color ? `text-${color}` : ""}`}>{value}</p>
    </div>
  );
}
