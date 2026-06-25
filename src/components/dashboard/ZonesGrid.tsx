import { Droplets, Sprout } from "lucide-react";
import type { FieldZone } from "@/hooks/useIrrigationData";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const statusBn: Record<FieldZone["status"], string> = {
  irrigating: "সেচ চলছে",
  idle: "নিষ্ক্রিয়",
  scheduled: "সময়সূচি",
  alert: "সতর্কতা",
};

const cropBn: Record<string, string> = {
  Rice: "ধান",
  Wheat: "গম",
  Maize: "ভুট্টা",
  Potato: "আলু",
  Sugarcane: "আখ",
};

export function ZonesGrid({ zones, onToggle }: { zones: FieldZone[]; onToggle: (id: string) => void }) {
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold">সকল সেচ জোন</h2>
          <p className="text-xs text-muted-foreground">প্রতিটি জমির ভাল্ভ আলাদাভাবে নিয়ন্ত্রণ করুন</p>
        </div>
        <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded-full">
          {bn(zones.length)}টি সেন্সর সক্রিয়
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {zones.map((z) => {
          const accent =
            z.status === "irrigating" ? { border: "border-emerald-400/60", glow: "shadow-emerald-500/20", chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30", on: "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/40" } :
            z.status === "alert"      ? { border: "border-rose-400/60",    glow: "shadow-rose-500/20",    chip: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",       on: "bg-gradient-to-r from-rose-500 to-red-500 shadow-rose-500/40" } :
            z.status === "scheduled"  ? { border: "border-sky-400/60",     glow: "shadow-sky-500/20",     chip: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",          on: "bg-gradient-to-r from-sky-500 to-cyan-500 shadow-sky-500/40" } :
                                        { border: "border-zinc-300/60",    glow: "shadow-zinc-500/10",    chip: "bg-muted text-muted-foreground border-border",                            on: "bg-gradient-to-r from-zinc-400 to-zinc-500 shadow-zinc-500/30" };
          return (
            <div
              key={z.id}
              className={`group rounded-xl glass-panel p-3.5 border-2 ${accent.border} shadow-md ${accent.glow} hover:-translate-y-0.5 hover:shadow-lg transition-all`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">{z.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${accent.chip}`}>
                      {statusBn[z.status]}
                    </span>
                  </div>
                  <p className="font-bold text-sm mt-1 truncate">{z.nameBn}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Sprout className="h-3 w-3" /> {cropBn[z.cropType] ?? z.cropType} · {bn(z.area)} একর
                  </p>
                </div>
                <button
                  onClick={() => onToggle(z.id)}
                  disabled={!z.hasNode || !z.online}
                  title={!z.hasNode ? "কোনো sub-node নেই" : !z.online ? "Sub-node অফলাইন" : ""}
                  className={`h-7 w-12 rounded-full relative transition shrink-0 ring-1 ring-white/30 ${
                    !z.hasNode || !z.online ? "bg-muted opacity-60 cursor-not-allowed border border-border"
                    : z.valveOpen ? `${accent.on} shadow-md`
                    : "bg-muted border border-border"
                  }`}
                  aria-label="ভাল্ভ টগল"
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${
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
          );
        })}
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
