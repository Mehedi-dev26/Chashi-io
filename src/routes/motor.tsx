import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MotorPanel } from "@/components/dashboard/MotorPanel";
import { useIrrigationData } from "@/hooks/useIrrigationData";
import { Gauge, Zap, Timer, ShieldCheck, Wrench, Activity, Brain, Power, Droplets, Wifi, WifiOff, Sprout, Waves } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export const Route = createFileRoute("/motor")({
  head: () => ({ meta: [{ title: "মোটর নিয়ন্ত্রণ · BMDA স্মার্ট সেচ" }] }),
  component: MotorPage,
});

type ShutoffLog = { time: string; reason: string; level: number; mode: "auto" | "manual" };

function MotorPage() {
  const { zones, motor, toggleMotor, toggleValve } = useIrrigationData();

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

        {/* === Sub-Nodes Live Control === */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -top-8 -left-8 h-40 w-40 bg-chart-2/15 blur-3xl rounded-full" />
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4 relative">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 grid place-items-center shadow-lg">
                <Sprout className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-extrabold">ফিল্ড সাব-নোড নিয়ন্ত্রণ</h2>
                <p className="text-xs text-muted-foreground">প্রতিটি জমির ভাল্ভ চালু/বন্ধ · TDS-ভিত্তিক মাটির আর্দ্রতা · derived পানির স্তর (real-time)।</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-success/15 text-success font-bold flex items-center gap-1">
                <Wifi className="h-3 w-3" /> অনলাইন {bn(zones.filter(z => z.online).length)}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-bold flex items-center gap-1">
                <WifiOff className="h-3 w-3" /> অফলাইন {bn(zones.filter(z => z.hasNode && !z.online).length)}
              </span>
            </div>
          </div>

          {zones.filter(z => z.hasNode).length === 0 ? (
            <div className="rounded-xl glass-panel p-6 text-center relative">
              <Sprout className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-semibold mb-1">কোনো সাব-নোড সংযুক্ত নেই</p>
              <p className="text-xs text-muted-foreground">Devices পেজ থেকে নোডগুলো জমির সাথে assign করুন।</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 relative">
              {zones.filter(z => z.hasNode).map((z) => {
                const sm = Math.round(z.soilMoisture);
                const wl = Math.round(z.waterLevel);
                const status = sm < 25 ? { tone: "alert", label: "শুষ্ক", color: "var(--color-destructive)" }
                             : sm > 75 ? { tone: "saturated", label: "সম্পৃক্ত", color: "var(--color-chart-2)" }
                             : { tone: "optimal", label: "উপযুক্ত", color: "var(--color-success)" };
                const canToggle = z.online;
                return (
                  <div key={z.id} className="rounded-2xl border-2 bg-card/70 backdrop-blur p-4 transition-all hover:shadow-lg"
                       style={{ borderColor: z.valveOpen ? "color-mix(in oklab, var(--color-success) 50%, transparent)" : "color-mix(in oklab, var(--color-border) 100%, transparent)" }}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-muted-foreground">{z.id}</p>
                        <p className="text-sm font-extrabold truncate">{z.nameBn}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{z.cropType} · {bn(z.area)} একর</p>
                      </div>
                      <span className={`h-2.5 w-2.5 rounded-full ${z.online ? "bg-success animate-pulse" : "bg-muted-foreground/40"}`}
                            title={z.online ? "অনলাইন" : "অফলাইন"} />
                    </div>

                    {/* Soil Moisture */}
                    <div className="mb-2.5">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="flex items-center gap-1 text-muted-foreground font-semibold">
                          <Sprout className="h-3 w-3" /> মাটির আর্দ্রতা (TDS)
                        </span>
                        <span className="font-mono font-bold">{bn(sm)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                             style={{ width: `${sm}%`, background: "linear-gradient(90deg, var(--color-warning), var(--color-success))" }} />
                      </div>
                    </div>

                    {/* Derived Water Level */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="flex items-center gap-1 text-muted-foreground font-semibold">
                          <Waves className="h-3 w-3" /> পানির স্তর (derived)
                        </span>
                        <span className="font-mono font-bold">{bn(wl)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                             style={{ width: `${wl}%`, background: "linear-gradient(90deg, var(--color-chart-2), var(--color-primary))" }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${status.color}22`, color: status.color }}>
                        ● {status.label}
                      </span>
                      <button
                        onClick={() => toggleValve(z.id)}
                        disabled={!canToggle}
                        className={`h-8 px-3 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                          !canToggle ? "bg-muted text-muted-foreground/60 cursor-not-allowed" :
                          z.valveOpen
                            ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md hover:shadow-lg"
                            : "bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-md hover:shadow-lg"
                        }`}
                      >
                        <Droplets className="h-3 w-3" />
                        {!canToggle ? "অফলাইন" : z.valveOpen ? "বন্ধ করুন" : "চালু করুন"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

        {/* === AI Auto-Shutoff === */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 h-32 w-32 bg-primary/15 blur-3xl rounded-full" />
          <div className="flex items-start justify-between gap-4 flex-wrap relative">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 grid place-items-center glow-primary">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-base font-extrabold">AI অপচয়-রোধ স্বয়ংক্রিয় নিয়ন্ত্রণ</h2>
                <p className="text-xs text-muted-foreground">পরিপূর্ণতা সীমা ছাড়ালে পাম্প স্বয়ংক্রিয়ভাবে বন্ধ হয় — পানি, বিদ্যুৎ ও মাটির ক্ষতি প্রতিরোধ।</p>
              </div>
            </div>
            <button
              onClick={() => setAiEnabled((v) => !v)}
              className={`px-4 h-10 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                aiEnabled ? "bg-success/15 text-success border border-success/40" : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              <Power className="h-4 w-4" /> {aiEnabled ? "AI সক্রিয়" : "AI নিষ্ক্রিয়"}
            </button>
          </div>

          <div className="mt-4 grid lg:grid-cols-[280px_1fr] gap-4 relative">
            <div className="rounded-xl glass-panel p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">শাট-অফ সীমা</p>
              <p className="text-3xl font-black mt-1 text-primary">{bn(threshold)}%</p>
              <input
                type="range" min={70} max={99} value={threshold}
                onChange={(e) => setThreshold(+e.target.value)}
                className="w-full mt-3 accent-primary"
                disabled={!aiEnabled}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                <span>{bn("৭০")}%</span><span>{bn("৯৯")}%</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">যেকোনো সক্রিয় জোন এই সীমা অতিক্রম করলে AI পাম্প বন্ধ করবে।</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-success/10 border border-success/30 p-2">
                  <p className="text-[10px] text-muted-foreground">এ মাসে সাশ্রয়</p>
                  <p className="text-sm font-extrabold text-success">{bn("১৮,৪৩০")} L</p>
                </div>
                <div className="rounded-lg bg-chart-2/10 border border-chart-2/30 p-2">
                  <p className="text-[10px] text-muted-foreground">অটো-শাটঅফ</p>
                  <p className="text-sm font-extrabold text-chart-2">{bn(shutoffLogs.filter((l) => l.mode === "auto").length)} বার</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl glass-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold">শাট-অফ রেকর্ড</p>
                <span className="text-[10px] text-muted-foreground font-mono">সর্বশেষ {bn(shutoffLogs.length)}টি ইভেন্ট</span>
              </div>
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                {shutoffLogs.map((l, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-card/60 border border-border p-2.5 hover-lift">
                    <div className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${l.mode === "auto" ? "bg-primary/15" : "bg-muted"}`}>
                      {l.mode === "auto" ? <Brain className="h-4 w-4 text-primary" /> : <Power className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{l.reason}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{l.time} · {l.mode === "auto" ? "AI স্বয়ংক্রিয়" : "ম্যানুয়াল"}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${l.level >= 95 ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>
                      {bn(l.level)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
