import { Droplets, Gauge, Sprout, Zap, TrendingUp, TrendingDown, Activity, CloudRain, Thermometer, Brain } from "lucide-react";
import type { FieldZone, MotorState, NetworkMetrics, WeatherState } from "@/hooks/useIrrigationData";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export function StatsCards({ zones, motor, metrics, weather }: { zones: FieldZone[]; motor: MotorState; metrics: NetworkMetrics; weather: WeatherState }) {
  const totalArea = zones.reduce((s, z) => s + z.area, 0);
  const irrigating = zones.filter((z) => z.valveOpen).length;
  const validMoisture = zones.filter((z) => z.soilMoisture > 0);
  const avgMoisture = validMoisture.length ? validMoisture.reduce((s, z) => s + z.soilMoisture, 0) / validMoisture.length : 0;
  const kw = (motor.voltage * motor.current) / 1000;

  const P_AMBER  = { grad: "from-orange-500 via-amber-500 to-yellow-500",   ring: "ring-amber-300/40" };
  const P_VIOLET = { grad: "from-violet-500 via-fuchsia-500 to-pink-500",   ring: "ring-violet-300/40" };
  const P_LIME   = { grad: "from-lime-500 via-green-500 to-emerald-500",    ring: "ring-lime-300/40" };
  const P_SKY    = { grad: "from-sky-500 via-cyan-500 to-teal-500",         ring: "ring-cyan-300/40" };

  // Weather card values (DHT22 from sub-node)
  const wHasData = weather.temperature != null || weather.humidity != null;
  const wFresh   = weather.lastSeen != null && Date.now() - weather.lastSeen < 30_000;
  const tStr = weather.temperature != null ? bn(weather.temperature.toFixed(1)) : "—";
  const hStr = weather.humidity != null ? bn(weather.humidity.toFixed(0)) : "—";
  const weatherSubtitle = wHasData
    ? `${hStr}% আর্দ্রতা · ${wFresh ? (weather.sourceZone ?? "Sub-Node") : "stale"}`
    : "DHT22 অপেক্ষমাণ…";

  const items = [
    { label: "মোট জমি",          value: bn(totalArea.toFixed(1)),               unit: "একর",         icon: Sprout,    ratio: Math.min(1, totalArea / 50),         trend: zones.length, up: true,  ...P_LIME },
    { label: "সক্রিয় ভাল্ভ",      value: bn(irrigating),                          unit: `/ ${bn(zones.length)} জোন`, icon: Droplets, ratio: zones.length ? irrigating / zones.length : 0, trend: irrigating, up: irrigating>0, ...P_VIOLET },
    { label: "পাম্পের চাপ",       value: bn(motor.pressure.toFixed(1)),           unit: "PSI",          icon: Gauge,     ratio: Math.min(1, motor.pressure / 10),     trend: motor.pressure, up: motor.isOn, ...P_AMBER },
    { label: "বিদ্যুৎ ব্যবহার",    value: bn(kw.toFixed(3)),                       unit: "কিলোওয়াট",    icon: Zap,       ratio: Math.min(1, kw / 0.005),              trend: motor.current, up: motor.isOn, ...P_VIOLET },
    { label: "প্রবাহ হার",         value: bn(motor.flowRate.toFixed(1)),          unit: "লিটার/মিনিট",  icon: Activity,  ratio: Math.min(1, motor.flowRate / 3),      trend: motor.flowRate, up: motor.isOn, ...P_AMBER },
    { label: "গড় মাটির আর্দ্রতা",  value: `${bn(avgMoisture.toFixed(0))}%`,        unit: "TDS থেকে",      icon: CloudRain, ratio: avgMoisture / 100,                    trend: validMoisture.length, up: true, ...P_LIME },
    { label: "তাপমাত্রা · আর্দ্রতা", value: `${tStr}°C`,                            unit: weatherSubtitle, icon: Thermometer, ratio: weather.temperature != null ? Math.min(1, Math.max(0, weather.temperature / 50)) : 0, trend: weather.humidity ?? 0, up: wFresh, ...P_SKY },
    { label: "AI স্বয়ংক্রিয়তা",   value: `${bn(metrics.aiActivity)}%`,            unit: "কমান্ড সম্পন্ন",  icon: Brain,     ratio: metrics.aiActivity / 100,             trend: metrics.aiActivity, up: metrics.aiActivity >= 50, ...P_VIOLET },
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
