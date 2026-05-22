import { Droplets, Sprout, MapPin } from "lucide-react";
import type { FieldZone } from "@/hooks/useIrrigationData";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const statusBn: Record<FieldZone["status"], string> = {
  irrigating: "সেচ চলছে",
  idle: "নিষ্ক্রিয়",
  scheduled: "সময়সূচি",
  alert: "সতর্কতা",
};

const statusBadge: Record<FieldZone["status"], string> = {
  irrigating: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  idle: "bg-slate-500/15 text-slate-700 border-slate-400/30",
  scheduled: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  alert: "bg-rose-500/15 text-rose-700 border-rose-500/30",
};

const cropBn: Record<string, string> = {
  Rice: "ধান", Wheat: "গম", Maize: "ভুট্টা", Potato: "আলু", Sugarcane: "আখ",
};

const cropGradient: Record<string, string> = {
  Rice: "from-emerald-400/40 to-green-500/30",
  Wheat: "from-amber-300/40 to-yellow-500/30",
  Maize: "from-orange-300/40 to-amber-500/30",
  Potato: "from-stone-300/40 to-amber-400/30",
  Sugarcane: "from-lime-400/40 to-green-500/30",
};

const cropStroke: Record<string, string> = {
  Rice: "oklch(0.55 0.17 150)",
  Wheat: "oklch(0.7 0.16 90)",
  Maize: "oklch(0.65 0.18 75)",
  Potato: "oklch(0.6 0.06 60)",
  Sugarcane: "oklch(0.6 0.17 140)",
};

export function ZonesGrid({ zones, onToggle }: { zones: FieldZone[]; onToggle: (id: string) => void }) {
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> প্লট ভিত্তিক জমির তালিকা
          </h2>
          <p className="text-xs text-muted-foreground">প্রতিটি জমির আকৃতি, ফসল ও ভাল্ভ আলাদাভাবে নিয়ন্ত্রণ করুন</p>
        </div>
        <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded-full">
          {bn(zones.length)}টি সক্রিয় প্লট
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {zones.map((z) => {
          const stroke = cropStroke[z.cropType] ?? "oklch(0.55 0.17 150)";
          return (
            <div
              key={z.id}
              className="group rounded-2xl border border-border bg-card overflow-hidden hover-lift relative"
            >
              {/* Plot visual preview */}
              <div className={`relative h-28 bg-gradient-to-br ${cropGradient[z.cropType] ?? "from-emerald-300/40 to-green-500/30"} overflow-hidden`}>
                <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                  <defs>
                    <pattern id={`furrow-${z.id}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                      <line x1="0" y1="0" x2="0" y2="4" stroke={stroke} strokeOpacity="0.25" strokeWidth="0.6" />
                    </pattern>
                  </defs>
                  <rect width="100" height="60" fill={`url(#furrow-${z.id})`} />
                  {/* normalized polygon */}
                  <polygon
                    points={normalizePolygon(z.polygon)}
                    fill={stroke}
                    fillOpacity="0.2"
                    stroke={stroke}
                    strokeWidth="1.2"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="text-[9px] font-mono bg-background/80 backdrop-blur px-1.5 py-0.5 rounded border border-border">{z.id}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${statusBadge[z.status]} backdrop-blur`}>
                    {statusBn[z.status]}
                  </span>
                </div>
                <div className="absolute top-2 right-2 text-[10px] font-bold bg-background/85 backdrop-blur px-1.5 py-0.5 rounded border border-border">
                  {bn(z.area)} একর
                </div>
                {z.valveOpen && (
                  <span className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30 animate-pulse" />
                )}
              </div>

              {/* body */}
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{z.nameBn}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Sprout className="h-3 w-3" /> {cropBn[z.cropType] ?? z.cropType}
                    </p>
                  </div>
                  <button
                    onClick={() => onToggle(z.id)}
                    className={`h-7 w-12 rounded-full relative transition shrink-0 ${z.valveOpen ? "bg-primary" : "bg-muted border border-border"}`}
                    aria-label="ভাল্ভ টগল"
                  >
                    <span
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-card shadow-sm transition-all ${
                        z.valveOpen ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  <Bar label="পানির স্তর" value={z.waterLevel} icon={Droplets} />
                  <Bar label="মাটির আর্দ্রতা" value={z.soilMoisture} icon={Sprout} colorVar="--color-chart-2" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Normalize polygon to fit the 100×60 mini canvas (zones use 0-100 coords)
function normalizePolygon(poly: string): string {
  const pts = poly.split(/\s+/).map((p) => p.split(",").map(Number));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = maxX - minX || 1, h = maxY - minY || 1;
  const pad = 8;
  return pts
    .map(([x, y]) => [
      pad + ((x - minX) / w) * (100 - pad * 2),
      pad + ((y - minY) / h) * (60 - pad * 2),
    ].join(","))
    .join(" ");
}

function Bar({
  label, value, icon: Icon, colorVar = "--color-primary",
}: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; colorVar?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] mb-0.5">
        <span className="flex items-center gap-1 text-muted-foreground"><Icon className="h-2.5 w-2.5" />{label}</span>
        <span className="font-semibold">{bn(value.toFixed(0))}%</span>
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
