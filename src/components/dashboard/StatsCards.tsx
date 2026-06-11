import { Droplets, Gauge, Sprout, Zap, TrendingUp, TrendingDown, Activity, CloudRain, Wifi, Brain } from "lucide-react";
import type { FieldZone, MotorState } from "@/hooks/useIrrigationData";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export function StatsCards({ zones, motor }: { zones: FieldZone[]; motor: MotorState }) {
  const totalArea = zones.reduce((s, z) => s + z.area, 0);
  const irrigating = zones.filter((z) => z.valveOpen).length;
  const avgMoisture = zones.reduce((s, z) => s + z.soilMoisture, 0) / zones.length;
  const kw = (motor.voltage * motor.current) / 1000;

  const items = [
    { label: "মোট জমি",         value: bn(totalArea.toFixed(1)),               unit: "একর",        icon: Sprout,    ratio: 0.78,                       trend: 4.2,  up: true,  grad: "from-emerald-500 via-teal-500 to-cyan-500",     ring: "ring-emerald-300/40" },
    { label: "সক্রিয় ভাল্ভ",     value: bn(irrigating),                          unit: `/ ${bn(zones.length)} জোন`, icon: Droplets,  ratio: irrigating / zones.length,  trend: 12,   up: true,  grad: "from-sky-500 via-blue-500 to-indigo-500",       ring: "ring-sky-300/40" },
    { label: "পাম্পের চাপ",      value: bn(motor.pressure),                      unit: "PSI",         icon: Gauge,     ratio: motor.pressure / 60,        trend: 2.1,  up: false, grad: "from-orange-500 via-amber-500 to-yellow-500",   ring: "ring-amber-300/40" },
    { label: "বিদ্যুৎ ব্যবহার",   value: bn(kw.toFixed(1)),                       unit: "কিলোওয়াট",   icon: Zap,       ratio: 0.65,                       trend: 8.4,  up: false, grad: "from-violet-500 via-fuchsia-500 to-pink-500",   ring: "ring-violet-300/40" },
    { label: "প্রবাহ হার",        value: bn(Math.round(motor.flowRate)),         unit: "লিটার/মিনিট", icon: Activity,  ratio: motor.flowRate / 1500,      trend: 5.6,  up: true,  grad: "from-cyan-500 via-sky-500 to-blue-500",         ring: "ring-cyan-300/40" },
    { label: "গড় মাটির আর্দ্রতা", value: `${bn(avgMoisture.toFixed(0))}%`,        unit: "rh",          icon: CloudRain, ratio: avgMoisture / 100,          trend: 3.8,  up: true,  grad: "from-lime-500 via-green-500 to-emerald-500",    ring: "ring-lime-300/40" },
    { label: "নেটওয়ার্ক স্বাস্থ্য", value: `${bn(motor.health)}%`,                unit: "অনলাইন",      icon: Wifi,      ratio: motor.health / 100,         trend: 0.4,  up: true,  grad: "from-teal-500 via-emerald-500 to-green-500",    ring: "ring-teal-300/40" },
    { label: "AI স্বয়ংক্রিয়তা",  value: bn(92),                                  unit: "% সিদ্ধান্ত", icon: Brain,     ratio: 0.92,                       trend: 6.7,  up: true,  grad: "from-indigo-500 via-violet-500 to-fuchsia-500", ring: "ring-indigo-300/40" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((it) => {
        const TrendIcon = it.up ? TrendingUp : TrendingDown;
        return (
          <div
            key={it.label}
            className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white bg-gradient-to-br ${it.grad} shadow-lg ring-1 ${it.ring} border-2 border-white/20 hover-lift group`}
          >
            <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-white/15 blur-2xl group-hover:bg-white/25 transition-colors duration-500" />

            <div className="flex items-start justify-between gap-2 relative min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.12em] font-bold opacity-95 truncate">
                  {it.label}
                </p>
                <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight tabular-nums drop-shadow">{it.value}</span>
                  <span className="text-[10px] sm:text-[11px] opacity-90 font-medium truncate">{it.unit}</span>
                </div>
              </div>
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-white/20 backdrop-blur-sm grid place-items-center shadow-md ring-1 ring-white/30 shrink-0">
                <it.icon className="h-5 w-5 drop-shadow" />
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between gap-2 relative">
              <div className="flex-1 h-1.5 bg-black/25 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/90 rounded-full transition-all duration-700 relative"
                  style={{ width: `${Math.min(100, Math.max(6, it.ratio * 100))}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer bg-[length:200%_100%] opacity-70" />
                </div>
              </div>
              <div className="flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-sm ring-1 ring-white/30 shrink-0">
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
