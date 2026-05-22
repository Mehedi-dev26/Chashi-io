import { Power, Zap, Gauge, Droplets, Timer, Activity } from "lucide-react";
import type { MotorState } from "@/hooks/useIrrigationData";

export function MotorPanel({ motor, onToggle }: { motor: MotorState; onToggle: () => void }) {
  const metrics = [
    { icon: Gauge, label: "Pressure", value: motor.pressure, unit: "PSI" },
    { icon: Droplets, label: "Flow Rate", value: motor.flowRate, unit: "L/min" },
    { icon: Zap, label: "Current", value: motor.current, unit: "A" },
    { icon: Activity, label: "Voltage", value: motor.voltage, unit: "V" },
    { icon: Timer, label: "Runtime Today", value: motor.runtime.toFixed(2), unit: "h" },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-32 bg-[var(--gradient-glow)] pointer-events-none" />

      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{motor.id}</p>
          <h2 className="font-bold text-base mt-0.5">{motor.name}</h2>
        </div>
        <span
          className={`text-[10px] px-2 py-1 rounded-full font-mono font-semibold ${
            motor.isOn ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
          }`}
        >
          {motor.isOn ? "● RUNNING" : "○ STOPPED"}
        </span>
      </div>

      {/* Power button */}
      <div className="flex justify-center my-5 relative">
        <button
          onClick={onToggle}
          className={`relative h-28 w-28 rounded-full grid place-items-center transition-all ${
            motor.isOn
              ? "bg-gradient-to-br from-primary to-chart-2 glow-primary"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          {motor.isOn && <span className="absolute inset-0 rounded-full border-2 border-primary pulse-ring" />}
          <Power className={`h-10 w-10 ${motor.isOn ? "text-primary-foreground" : "text-muted-foreground"}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 relative">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg bg-background/50 border border-border p-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <m.icon className="h-3 w-3" />
              <span className="text-[10px] uppercase tracking-wider">{m.label}</span>
            </div>
            <p className="mt-1 text-sm font-bold font-mono">
              {m.value} <span className="text-[10px] text-muted-foreground">{m.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg bg-background/50 border border-border p-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Pump Health</span>
          <span className="font-mono font-semibold text-success">{motor.health}%</span>
        </div>
        <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-success to-primary" style={{ width: `${motor.health}%` }} />
        </div>
      </div>
    </div>
  );
}
