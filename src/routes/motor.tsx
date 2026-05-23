import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MotorPanel } from "@/components/dashboard/MotorPanel";
import { useIrrigationData } from "@/hooks/useIrrigationData";
import { Gauge, Zap, Timer, ShieldCheck, Wrench, Activity, Brain, Power } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export const Route = createFileRoute("/motor")({
  head: () => ({ meta: [{ title: "মোটর নিয়ন্ত্রণ · BMDA স্মার্ট সেচ" }] }),
  component: MotorPage,
});

type ShutoffLog = { time: string; reason: string; level: number; mode: "auto" | "manual" };

function MotorPage() {
  const { zones, motor, toggleMotor } = useIrrigationData();

  // === AI Auto-Shutoff State ===
  const [aiEnabled, setAiEnabled] = useState(true);
  const [threshold, setThreshold] = useState(95); // % water/soil saturation
  const [shutoffLogs, setShutoffLogs] = useState<ShutoffLog[]>([
    { time: "গতকাল ১৮:৪২", reason: "Z-০৩ পরিপূর্ণতা ৯৬%", level: 96, mode: "auto" },
    { time: "গতকাল ১৪:১০", reason: "Z-০১ পরিপূর্ণতা ৯৭%", level: 97, mode: "auto" },
    { time: "২ দিন আগে ১১:২৫", reason: "ম্যানুয়াল বন্ধ", level: 78, mode: "manual" },
  ]);
  const triggeredRef = useRef(false);

  // Watch zones — if any irrigating zone crosses threshold, auto-stop pump
  useEffect(() => {
    if (!aiEnabled || !motor.isOn) {
      triggeredRef.current = false;
      return;
    }
    const flooded = zones.find((z) => z.valveOpen && z.waterLevel >= threshold);
    if (flooded && !triggeredRef.current) {
      triggeredRef.current = true;
      const log: ShutoffLog = {
        time: new Date().toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }),
        reason: `${flooded.id} পরিপূর্ণতা ${bn(Math.round(flooded.waterLevel))}% — অপচয় রোধ`,
        level: Math.round(flooded.waterLevel),
        mode: "auto",
      };
      setShutoffLogs((l) => [log, ...l].slice(0, 12));
      toggleMotor();
    }
  }, [zones, motor.isOn, aiEnabled, threshold, toggleMotor]);

  const logs = [
    { time: "১০:৪২", event: "পাম্প চালু — চাপ ৪২ PSI", type: "success" },
    { time: "০৯:১৫", event: "রক্ষণাবেক্ষণ পরীক্ষা সম্পন্ন", type: "info" },
    { time: "০৮:০০", event: "দৈনিক স্বাস্থ্য পরীক্ষা", type: "info" },
    { time: "গতকাল ২২:১০", event: "পাম্প বন্ধ — নির্ধারিত সময়", type: "warning" },
  ];


  return (
    <DashboardLayout
      title="মোটর নিয়ন্ত্রণ · প্রধান পাম্প"
      subtitle="গভীর নলকূপ পাম্পের লাইভ টেলিমেট্রি, স্বাস্থ্য ও রক্ষণাবেক্ষণ ব্যবস্থাপনা।"
    >
      <div className="stagger space-y-5">
        <div className="grid lg:grid-cols-[360px_1fr] gap-5">
          <MotorPanel motor={motor} onToggle={toggleMotor} />

          <div className="space-y-5">
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: Gauge, label: "চাপ", value: `${bn(motor.pressure)} PSI`, tone: "primary" },
                { icon: Zap, label: "শক্তি", value: `${bn(((motor.voltage * motor.current) / 1000).toFixed(2))} kW`, tone: "accent" },
                { icon: Timer, label: "মোট রানটাইম", value: `${bn("২,৩৪০")} ঘণ্টা`, tone: "chart-2" },
                { icon: ShieldCheck, label: "স্বাস্থ্য স্কোর", value: `${bn(motor.health)}%`, tone: "success" },
                { icon: Wrench, label: "পরবর্তী সার্ভিস", value: `${bn("১৫")} দিন`, tone: "warning" },
                { icon: Activity, label: "দক্ষতা", value: `${bn("৯২")}%`, tone: "primary" },
              ].map((m) => (
                <div key={m.label} className="glass-card rounded-2xl p-4 hover-lift">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg grid place-items-center" style={{ background: `color-mix(in oklab, var(--color-${m.tone}) 18%, transparent)` }}>
                      <m.icon className="h-4 w-4" style={{ color: `var(--color-${m.tone})` }} />
                    </div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{m.label}</p>
                  </div>
                  <p className="text-xl font-bold mt-2">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-base font-bold mb-3">পাম্প ইভেন্ট লগ</h2>
              <div className="space-y-2">
                {logs.map((l, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg glass-panel p-3 hover-lift">
                    <span className={`h-2 w-2 rounded-full ${l.type === "success" ? "bg-success" : l.type === "warning" ? "bg-warning" : "bg-chart-2"}`} />
                    <p className="text-sm flex-1">{l.event}</p>
                    <p className="text-xs text-muted-foreground font-mono">{l.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-base font-bold mb-3">নিরাপত্তা সীমা ও সুরক্ষা</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "সর্বোচ্চ চাপ", value: `${bn("60")} PSI`, status: "ok" },
              { label: "সর্বনিম্ন ভোল্টেজ", value: `${bn("380")} V`, status: "ok" },
              { label: "ওভারলোড সুরক্ষা", value: "সক্রিয়", status: "ok" },
              { label: "ড্রাই-রান সেন্সর", value: "সক্রিয়", status: "ok" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl glass-panel p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="font-bold">{s.value}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold">● OK</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
