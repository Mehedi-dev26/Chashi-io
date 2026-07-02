import { useState } from "react";
import { Droplet, Maximize2, MapPin, Compass, Cpu, WifiOff } from "lucide-react";
import type { FieldZone } from "@/hooks/useIrrigationData";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const statusColor: Record<FieldZone["status"], string> = {
  irrigating: "oklch(0.62 0.16 150)",
  idle: "oklch(0.55 0.02 240)",
  scheduled: "oklch(0.68 0.13 200)",
  alert: "oklch(0.58 0.22 25)",
};

const statusBn: Record<FieldZone["status"], string> = {
  irrigating: "সেচ চলছে",
  idle: "নিষ্ক্রিয়",
  scheduled: "সময়সূচি",
  alert: "সতর্কতা",
};

const cropBn: Record<string, string> = {
  Rice: "ধান", Wheat: "গম", Maize: "ভুট্টা", Potato: "আলু", Sugarcane: "আখ",
};

const cropFill: Record<string, string> = {
  Rice: "oklch(0.88 0.08 145)",
  Wheat: "oklch(0.9 0.1 90)",
  Maize: "oklch(0.88 0.11 75)",
  Potato: "oklch(0.86 0.05 60)",
  Sugarcane: "oklch(0.85 0.1 140)",
};

// Central pump location in % coords
const PUMP = { x: 50, y: 50 };

export function FieldMap({ zones, onToggle }: { zones: FieldZone[]; onToggle: (id: string) => void }) {
  const [selected, setSelected] = useState<string | null>(zones[0]?.id ?? null);
  const [hover, setHover] = useState<string | null>(null);
  const active = zones.find((z) => z.id === selected);

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            জমির মানচিত্র · লাইভ টপোলজি
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">স্যাটেলাইট-স্টাইল ভিউতে প্রতিটি জোনের সেচ ও সেন্সর ডেটা</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] flex-wrap">
          {(["irrigating", "scheduled", "idle", "alert"] as const).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: statusColor[s] }} />
              <span className="text-muted-foreground">{statusBn[s]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-border bg-[oklch(0.96_0.03_140)]">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="terrain" width="2" height="2" patternUnits="userSpaceOnUse">
                <rect width="2" height="2" fill="oklch(0.95 0.04 140)" />
                <circle cx="1" cy="1" r="0.15" fill="oklch(0.85 0.06 140)" opacity="0.5" />
              </pattern>
              <linearGradient id="river" x1="0" y1="0" x2="1" y2="0.5">
                <stop offset="0" stopColor="oklch(0.7 0.1 220)" />
                <stop offset="1" stopColor="oklch(0.62 0.12 215)" />
              </linearGradient>
              <linearGradient id="pipe" x1="0" x2="1">
                <stop offset="0" stopColor="oklch(0.55 0.17 150)" />
                <stop offset="1" stopColor="oklch(0.6 0.14 200)" />
              </linearGradient>
              <radialGradient id="hub">
                <stop offset="0" stopColor="oklch(0.7 0.18 150)" />
                <stop offset="1" stopColor="oklch(0.45 0.18 155)" />
              </radialGradient>
            </defs>

            {/* terrain background */}
            <rect width="100" height="100" fill="url(#terrain)" />

            {/* river running along bottom-left */}
            <path d="M -2 88 Q 20 80, 38 92 T 80 96 L 105 100 L -2 102 Z"
                  fill="url(#river)" opacity="0.85" />
            <path d="M -2 88 Q 20 80, 38 92 T 80 96"
                  fill="none" stroke="oklch(0.85 0.06 220)" strokeWidth="0.3" opacity="0.6"
                  vectorEffect="non-scaling-stroke" />

            {/* dirt road */}
            <path d="M 0 50 L 36 50 M 64 50 L 100 50 M 50 0 L 50 36 M 50 64 L 50 100"
                  stroke="oklch(0.78 0.06 70)" strokeWidth="1.6"
                  strokeDasharray="0.6 0.4" vectorEffect="non-scaling-stroke" opacity="0.7" />

            {/* zone polygons */}
            {zones.map((z) => {
              const isHover = hover === z.id || selected === z.id;
              return (
                <g key={z.id}>
                  <polygon
                    points={z.polygon}
                    fill={cropFill[z.cropType] ?? "oklch(0.9 0.05 140)"}
                    stroke={statusColor[z.status]}
                    strokeWidth={isHover ? 0.7 : 0.35}
                    opacity={isHover ? 1 : 0.9}
                    vectorEffect="non-scaling-stroke"
                    style={{ cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={() => setHover(z.id)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setSelected(z.id)}
                  />
                  {z.valveOpen && (
                    <polygon
                      points={z.polygon}
                      fill={statusColor[z.status]}
                      opacity="0.15"
                      pointerEvents="none"
                    />
                  )}
                </g>
              );
            })}

            {/* pipelines from pump → zone center */}
            {zones.map((z) => (
              <line
                key={`p-${z.id}`}
                x1={PUMP.x} y1={PUMP.y} x2={z.x} y2={z.y}
                stroke="url(#pipe)"
                strokeWidth={z.valveOpen ? 0.55 : 0.3}
                opacity={z.valveOpen ? 0.95 : 0.4}
                strokeDasharray={z.valveOpen ? "1 0.6" : "0.3 0.4"}
                className={z.valveOpen ? "flow-line" : ""}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* reservoir tank top-right corner indicator */}
            <g transform="translate(92,8)">
              <rect x="-3" y="-3" width="6" height="6" rx="0.6" fill="oklch(0.7 0.1 220)" opacity="0.4" />
              <rect x="-3" y="0" width="6" height="3" rx="0.4" fill="oklch(0.6 0.12 220)" />
            </g>
          </svg>

          {/* central pump hub */}
          <div className="absolute" style={{ left: `${PUMP.x}%`, top: `${PUMP.y}%`, transform: "translate(-50%, -50%)" }}>
            <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-primary to-chart-2 grid place-items-center shadow-[var(--shadow-glow)] ring-2 ring-background">
              <Droplet className="h-5 w-5 text-primary-foreground" />
              <span className="absolute inset-0 rounded-full border-2 border-primary pulse-ring" />
            </div>
            <p className="mt-1 text-[10px] text-center font-bold bg-background/85 px-1.5 rounded">পাম্প হাব</p>
          </div>

          {/* zone markers */}
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => setSelected(z.id)}
              onMouseEnter={() => setHover(z.id)}
              onMouseLeave={() => setHover(null)}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${z.x}%`, top: `${z.y}%` }}
            >
              <div className="relative">
                <div
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg grid place-items-center transition-all backdrop-blur"
                  style={{
                    background: `color-mix(in oklab, ${statusColor[z.status]} 28%, white)`,
                    border: `1.5px solid ${statusColor[z.status]}`,
                    boxShadow: selected === z.id ? `0 0 20px ${statusColor[z.status]}, 0 4px 12px rgba(0,0,0,0.15)` : "0 2px 6px rgba(0,0,0,0.12)",
                    transform: selected === z.id ? "scale(1.15)" : "scale(1)",
                  }}
                >
                  <span className="text-[10px] font-extrabold" style={{ color: statusColor[z.status] }}>{bn(z.id.slice(2))}</span>
                </div>
                {z.valveOpen && (
                  <span className="absolute inset-0 rounded-lg pulse-ring" style={{ border: `2px solid ${statusColor[z.status]}` }} />
                )}
                {/* sub-node status pin (top-right) */}
                <span
                  className={`absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full grid place-items-center ring-2 ring-background ${
                    !z.hasNode ? "bg-zinc-400"
                    : z.online ? "bg-emerald-500 animate-pulse"
                    : "bg-rose-500"
                  }`}
                  title={!z.hasNode ? "কোনো sub-node নেই" : z.online ? "Sub-node অনলাইন" : "Sub-node অফলাইন"}
                >
                  {!z.hasNode ? <WifiOff className="h-2 w-2 text-white" /> : <Cpu className="h-2 w-2 text-white" />}
                </span>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold whitespace-nowrap bg-background/90 backdrop-blur px-1.5 py-0.5 rounded border border-border">
                  {z.nameBn.split(" ").slice(-1)} · {z.hasNode ? `${bn(z.soilMoisture.toFixed(0))}%` : "নো নোড"}
                </div>
                {z.online && z.hasNode && !z.soilConnected && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-extrabold whitespace-nowrap bg-rose-600 text-white px-1.5 py-0.5 rounded shadow-lg animate-pulse">
                    ⚠ Soil Sensor Disconnect
                  </div>
                )}
              </div>
            </button>
          ))}

          {/* compass */}
          <div className="absolute top-2 left-2 bg-background/85 backdrop-blur rounded-lg p-1.5 border border-border">
            <Compass className="h-4 w-4 text-primary" />
          </div>

          {/* scale bar */}
          <div className="absolute bottom-2 left-2 bg-background/85 backdrop-blur px-2 py-1 rounded text-[10px] font-mono border border-border flex items-center gap-1.5">
            <span className="inline-block w-8 h-0.5 bg-foreground" />
            <span>{bn("500")} মি</span>
          </div>

          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-muted-foreground bg-background/85 backdrop-blur px-2 py-1 rounded border border-border">
            <Maximize2 className="h-3 w-3" /> মোট {bn("32.6")} হেক্টর
          </div>
        </div>

        {active && (
          <div className="rounded-xl glass-panel p-4 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">নির্বাচিত জোন</p>
              <h3 className="font-bold text-lg leading-tight">{active.nameBn}</h3>
              <p className="text-xs text-muted-foreground">
                {active.id} · {cropBn[active.cropType] ?? active.cropType}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Stat label="পানির স্তর" value={`${bn(active.waterLevel.toFixed(0))}%`} color="primary" />
              <Stat label="মাটির আর্দ্রতা" value={`${bn(active.soilMoisture.toFixed(0))}%`} color="chart-2" />
              <Stat label="জমি" value={`${bn(active.area)} একর`} />
              <Stat label="অবস্থা" value={statusBn[active.status]} />
            </div>

            {active.hasNode && active.online && !active.soilConnected && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/40 px-3 py-2 flex items-center gap-2 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <p className="text-[11px] font-extrabold text-rose-600 leading-tight">
                  ⚠ Soil Sensor Disconnect · সেন্সর সংযোগ বিচ্ছিন্ন
                  <span className="block font-medium text-rose-500/80">শেষ পরিচিত মান দেখানো হচ্ছে (সময়ভিত্তিক অনুমান)</span>
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-bold">ভাল্ভ নিয়ন্ত্রণ</p>
              {!active.hasNode ? (
                <div className="rounded-xl bg-muted/60 border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                  ⚠ এই জমিতে কোনো sub-node assign করা নেই · Devices পেজ থেকে যুক্ত করুন
                </div>
              ) : !active.online ? (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/40 p-3 text-center text-xs text-rose-600 font-semibold">
                  ⚠ Sub-node {active.valveNodeId} অফলাইন · নিয়ন্ত্রণ নিষ্ক্রিয়
                </div>
              ) : (
                <button
                  onClick={() => onToggle(active.id)}
                  className={`group relative w-full h-12 rounded-xl font-extrabold text-sm tracking-wide overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] ring-1 ${
                    active.valveOpen
                      ? "bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 text-white shadow-lg shadow-red-500/40 ring-white/30"
                      : "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/40 ring-white/30"
                  }`}
                >
                  <span className="absolute inset-0 bg-gradient-to-t from-black/15 to-white/15 opacity-0 group-hover:opacity-100 transition" />
                  <span className="relative flex items-center justify-center gap-2 drop-shadow">
                    {active.valveOpen ? "● ভাল্ভ বন্ধ করুন" : "▶ ভাল্ভ খুলে সেচ শুরু"}
                  </span>
                </button>
              )}
              {active.hasNode && (
                <p className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
                  <Cpu className="h-3 w-3" /> Sub-node: <span className="font-mono">{active.valveNodeId}</span> ·
                  <span className={active.online ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                    {active.online ? "অনলাইন" : "অফলাইন"}
                  </span>
                </p>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-2.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${color ? `text-${color}` : ""}`}>{value}</p>
    </div>
  );
}
