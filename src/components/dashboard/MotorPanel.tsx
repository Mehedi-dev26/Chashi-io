import { Power, Zap, Gauge, Droplets, Timer, Activity, Wifi, WifiOff, CalendarRange } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { MotorState } from "@/hooks/useIrrigationData";
import { getMonthlyRuntime } from "@/lib/motorRuntime.functions";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const fmtAgo = (ts: number | null) => {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "এইমাত্র";
  if (s < 60) return `${bn(s)} সেকেন্ড আগে`;
  if (s < 3600) return `${bn(Math.floor(s / 60))} মিনিট আগে`;
  return `${bn(Math.floor(s / 3600))} ঘণ্টা আগে`;
};

/** Smart runtime formatter — picks the most natural unit. */
const fmtRuntime = (totalSec: number): { value: string; unit: string } => {
  const s = Math.max(0, Math.floor(totalSec));
  if (s < 60) return { value: bn(s), unit: "সেকেন্ড" };
  if (s < 3600) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return { value: r ? `${bn(m)}:${bn(String(r).padStart(2, "0"))}` : bn(m), unit: r ? "মি:সে" : "মিনিট" };
  }
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return { value: m ? `${bn(h)}:${bn(String(m).padStart(2, "0"))}` : bn(h), unit: m ? "ঘ:মি" : "ঘণ্টা" };
};

export function MotorPanel({ motor, onToggle }: { motor: MotorState; onToggle: () => void }) {
  const runtimeFmt = fmtRuntime(motor.runtime);

  // Monthly cumulative runtime (sum of this calendar month's deltas)
  const fetchMonthly = useServerFn(getMonthlyRuntime);
  const [monthlySec, setMonthlySec] = useState<number>(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await fetchMonthly({ data: { deviceId: motor.id } });
        if (active) setMonthlySec(Math.max(Number(r?.totalSec ?? 0), Number(motor.runtime ?? 0)));
      } catch { /* ignore */ }
    };
    load();
    // refresh quickly so the card tracks real hardware runtime while the motor is active
    const t = window.setInterval(load, motor.isOn ? 5000 : 15000);
    return () => { active = false; window.clearInterval(t); };
  }, [fetchMonthly, motor.id, motor.isOn, motor.runtime]);
  const monthlyFmt = fmtRuntime(monthlySec);

  const metrics = [
    { icon: Gauge,    label: "চাপ",       value: bn(motor.pressure.toFixed(1)), unit: "PSI",       tint: "from-orange-500 to-red-500",     ring: "shadow-orange-500/30" },
    { icon: Droplets, label: "প্রবাহ",    value: bn(motor.flowRate.toFixed(2)), unit: "লি/মি",    tint: "from-sky-500 to-cyan-500",       ring: "shadow-sky-500/30" },
    { icon: Zap,      label: "কারেন্ট",   value: bn(motor.current.toFixed(2)),  unit: "অ্যাম্পি",  tint: "from-amber-500 to-yellow-500",   ring: "shadow-amber-500/30" },
    { icon: Activity, label: "ভোল্টেজ",   value: bn(motor.voltage.toFixed(1)),  unit: "ভোল্ট",    tint: "from-violet-500 to-fuchsia-500", ring: "shadow-violet-500/30" },
    { icon: Timer,         label: "বর্তমান রান",  value: runtimeFmt.value, unit: runtimeFmt.unit, tint: "from-emerald-500 to-teal-600",  ring: "shadow-emerald-500/30" },
    { icon: CalendarRange, label: "মোট রানিং",   value: monthlyFmt.value, unit: monthlyFmt.unit, tint: "from-indigo-500 to-purple-600",  ring: "shadow-indigo-500/30" },
  ];

  const canControl = motor.online;

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-32 bg-[var(--gradient-glow)] pointer-events-none" />

      <div className="flex items-start justify-between relative gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{motor.id}</p>
          <h2 className="font-bold text-base mt-0.5 truncate">{motor.name}</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">শেষ heartbeat: {fmtAgo(motor.lastSeen)}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
            motor.online
              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/40"
              : "bg-rose-500/15 text-rose-600 border border-rose-500/40"
          }`}>
            {motor.online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {motor.online ? "ONLINE" : "OFFLINE"}
            {motor.online && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            motor.isOn ? "bg-primary/15 text-primary border border-primary/30" : "bg-muted text-muted-foreground"
          }`}>
            {motor.isOn ? "● পাম্প চালু" : "○ পাম্প বন্ধ"}
          </span>
        </div>
      </div>

      <div className="flex justify-center my-5 relative">
        <button
          onClick={onToggle}
          disabled={!canControl}
          aria-disabled={!canControl}
          className={`relative h-28 w-28 rounded-full grid place-items-center transition-all ${
            !canControl
              ? "bg-muted/60 border border-border cursor-not-allowed opacity-60"
              : motor.isOn
                ? "bg-gradient-to-br from-primary to-chart-2 glow-primary hover:scale-105"
                : "bg-gradient-to-br from-emerald-500 to-teal-600 hover:scale-105 shadow-lg shadow-emerald-500/30"
          }`}
        >
          {motor.isOn && canControl && <span className="absolute inset-0 rounded-full border-2 border-primary pulse-ring" />}
          <Power className={`h-10 w-10 ${canControl ? "text-white" : "text-muted-foreground"}`} />
        </button>
      </div>
      <p className="text-center text-xs -mt-2 mb-3">
        {!canControl ? (
          <span className="text-rose-600 font-semibold">⚠ হার্ডওয়্যার অফলাইন · নিয়ন্ত্রণ নিষ্ক্রিয়</span>
        ) : motor.isOn ? (
          <span className="text-muted-foreground">পাম্প বন্ধ করতে চাপুন</span>
        ) : (
          <span className="text-muted-foreground">পাম্প চালু করতে চাপুন</span>
        )}
      </p>

      <div className="grid grid-cols-2 gap-2.5 relative">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`relative rounded-xl p-3 bg-gradient-to-br ${m.tint} text-white shadow-lg ${m.ring} ring-1 ring-white/20 overflow-hidden ${!motor.online ? "opacity-70" : ""}`}
          >
            <div className="absolute -top-3 -right-3 h-12 w-12 rounded-full bg-white/15 blur-xl pointer-events-none" />
            <div className="flex items-center gap-1.5 relative">
              <m.icon className="h-3.5 w-3.5 text-white drop-shadow" strokeWidth={2.4} />
              <span className="text-[11px] uppercase tracking-wider font-bold text-white/90">{m.label}</span>
            </div>
            <p className="mt-1.5 text-lg font-extrabold leading-none relative drop-shadow truncate">
              {m.value} <span className="text-[11px] font-semibold text-white/80">{m.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg glass-panel p-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">পাম্পের স্বাস্থ্য</span>
          <span className="font-semibold text-success">{bn(motor.health)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-success to-primary transition-all duration-500" style={{ width: `${motor.health}%` }} />
        </div>
      </div>

      {/* 💧 ট্যাংকের অবস্থা — real telemetry (water_level) থেকে */}
      <div className="mt-2 rounded-lg glass-panel p-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Droplets className="h-3 w-3 text-sky-500" />
            ট্যাংকের অবস্থা
          </span>
          <span className={`font-semibold ${
            motor.tankLevel >= 80 ? "text-sky-600" :
            motor.tankLevel >= 40 ? "text-cyan-600" :
            motor.tankLevel >= 20 ? "text-amber-600" : "text-rose-600"
          }`}>
            {bn(Math.round(motor.tankLevel))}%
          </span>
        </div>
        <div className="relative mt-1.5 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              motor.tankLevel >= 80 ? "bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600" :
              motor.tankLevel >= 40 ? "bg-gradient-to-r from-cyan-400 to-sky-500" :
              motor.tankLevel >= 20 ? "bg-gradient-to-r from-amber-400 to-orange-500" :
              "bg-gradient-to-r from-rose-400 to-red-500"
            }`}
            style={{ width: `${motor.tankLevel}%` }}
          />
        </div>
        {/* Dot markers @ 20/40/60/80/100 */}
        <div className="relative mt-1.5 flex justify-between px-0.5">
          {[20, 40, 60, 80, 100].map((m) => (
            <div key={m} className="flex flex-col items-center gap-0.5">
              <span className={`h-1.5 w-1.5 rounded-full ${
                motor.tankLevel >= m
                  ? "bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.6)]"
                  : "bg-muted-foreground/30"
              }`} />
              <span className="text-[8px] text-muted-foreground font-mono">{bn(m)}%</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          {!motor.online ? "⚠ পাম্প অফলাইন · ট্যাংক ডেটা নেই"
            : motor.tankLevel >= 90 ? "✓ ট্যাংক প্রায় ভর্তি"
            : motor.tankLevel >= 50 ? "● ট্যাংক অর্ধেকের বেশি"
            : motor.tankLevel >= 20 ? "⚠ ট্যাংক কম · রিফিল দরকার"
            : "🔴 ট্যাংক প্রায় খালি"}
        </p>
      </div>
