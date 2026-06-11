import { Power, Zap, Gauge, Droplets, Timer, Activity } from "lucide-react";
import type { MotorState } from "@/hooks/useIrrigationData";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export function MotorPanel({ motor, onToggle }: { motor: MotorState; onToggle: () => void }) {
  const metrics = [
    { icon: Gauge,    label: "চাপ",         value: bn(motor.pressure),            unit: "PSI",      tint: "from-orange-500 to-red-500",      ring: "shadow-orange-500/30" },
    { icon: Droplets, label: "প্রবাহ",      value: bn(motor.flowRate),            unit: "লি/মি",   tint: "from-sky-500 to-cyan-500",        ring: "shadow-sky-500/30" },
    { icon: Zap,      label: "কারেন্ট",     value: bn(motor.current),             unit: "অ্যাম্পি", tint: "from-amber-500 to-yellow-500",    ring: "shadow-amber-500/30" },
    { icon: Activity, label: "ভোল্টেজ",     value: bn(motor.voltage),             unit: "ভোল্ট",   tint: "from-violet-500 to-fuchsia-500",  ring: "shadow-violet-500/30" },
    { icon: Timer,    label: "আজকের সময়",   value: bn(motor.runtime.toFixed(2)),  unit: "ঘণ্টা",   tint: "from-emerald-500 to-teal-600",    ring: "shadow-emerald-500/30" },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-32 bg-[var(--gradient-glow)] pointer-events-none" />

      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{motor.id}</p>
          <h2 className="font-bold text-base mt-0.5">প্রধান গভীর নলকূপ পাম্প</h2>
        </div>
        <span
          className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
            motor.isOn ? "bg-success/15 text-success border border-success/30" : "bg-muted text-muted-foreground"
          }`}
        >
          {motor.isOn ? "● চালু" : "○ বন্ধ"}
        </span>
      </div>

      <div className="flex justify-center my-5 relative">
        <button
          onClick={onToggle}
          className={`relative h-28 w-28 rounded-full grid place-items-center transition-all ${
            motor.isOn
              ? "bg-gradient-to-br from-primary to-chart-2 glow-primary"
              : "bg-muted hover:bg-muted/80 border border-border"
          }`}
        >
          {motor.isOn && <span className="absolute inset-0 rounded-full border-2 border-primary pulse-ring" />}
          <Power className={`h-10 w-10 ${motor.isOn ? "text-primary-foreground" : "text-muted-foreground"}`} />
        </button>
      </div>
      <p className="text-center text-xs text-muted-foreground -mt-2 mb-3">
        {motor.isOn ? "পাম্প বন্ধ করতে চাপুন" : "পাম্প চালু করতে চাপুন"}
      </p>

      <div className="grid grid-cols-2 gap-2.5 relative">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`relative rounded-xl p-3 bg-gradient-to-br ${m.tint} text-white shadow-lg ${m.ring} ring-1 ring-white/20 overflow-hidden`}
          >
            <div className="absolute -top-3 -right-3 h-12 w-12 rounded-full bg-white/15 blur-xl pointer-events-none" />
            <div className="flex items-center gap-1.5 relative">
              <m.icon className="h-3.5 w-3.5 text-white drop-shadow" strokeWidth={2.4} />
              <span className="text-[11px] uppercase tracking-wider font-bold text-white/90">{m.label}</span>
            </div>
            <p className="mt-1.5 text-lg font-extrabold leading-none relative drop-shadow">
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
          <div className="h-full bg-gradient-to-r from-success to-primary" style={{ width: `${motor.health}%` }} />
        </div>
      </div>
    </div>
  );
}
