import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ZonesGrid } from "@/components/dashboard/ZonesGrid";
import { useIrrigationData } from "@/hooks/useIrrigationData";
import { Droplets, Filter, Plus } from "lucide-react";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export const Route = createFileRoute("/zones")({
  head: () => ({ meta: [{ title: "সেচ জোন · BMDA স্মার্ট সেচ" }] }),
  component: ZonesPage,
});

function ZonesPage() {
  const { zones, toggleValve } = useIrrigationData();
  const irrigating = zones.filter((z) => z.valveOpen).length;
  const alerts = zones.filter((z) => z.status === "alert").length;
  const avgMoisture = zones.reduce((s, z) => s + z.soilMoisture, 0) / zones.length;

  return (
    <DashboardLayout
      title="সেচ জোন · ব্যবস্থাপনা"
      subtitle="প্রতিটি জমির ভাল্ভ, পানির স্তর ও মাটির আর্দ্রতা আলাদাভাবে নিয়ন্ত্রণ করুন।"
      actions={
        <div className="flex gap-2">
          <button className="h-9 px-3 rounded-lg glass-panel text-xs font-semibold flex items-center gap-1.5 hover-lift">
            <Filter className="h-3.5 w-3.5" /> ফিল্টার
          </button>
          <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover-lift glow-primary">
            <Plus className="h-3.5 w-3.5" /> নতুন জোন
          </button>
        </div>
      }
    >
      <div className="stagger space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "মোট জোন",    value: bn(zones.length), grad: "from-emerald-500 via-teal-500 to-cyan-500",   ring: "ring-emerald-300/40",  pct: 100 },
            { label: "সেচ চলছে",   value: bn(irrigating),   grad: "from-sky-500 via-blue-500 to-indigo-500",       ring: "ring-sky-300/40",       pct: (irrigating / zones.length) * 100 },
            { label: "সতর্কতা",     value: bn(alerts),       grad: "from-rose-500 via-red-500 to-orange-500",       ring: "ring-rose-300/40",      pct: (alerts / zones.length) * 100 },
            { label: "গড় আর্দ্রতা", value: `${bn(avgMoisture.toFixed(0))}%`, grad: "from-amber-500 via-yellow-500 to-lime-500", ring: "ring-amber-300/40", pct: avgMoisture },
          ].map((s) => (
            <div
              key={s.label}
              className={`relative overflow-hidden rounded-2xl p-4 text-white bg-gradient-to-br ${s.grad} shadow-lg ring-1 ${s.ring} hover-lift border-2 border-white/20`}
            >
              <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
              <p className="text-[11px] uppercase tracking-wider font-bold drop-shadow">{s.label}</p>
              <p className="text-3xl font-extrabold mt-2 drop-shadow">{s.value}</p>
              <div className="mt-3 h-1.5 rounded-full overflow-hidden bg-black/20">
                <div className="h-full bg-white/90 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(6, s.pct))}%` }} />
              </div>
            </div>
          ))}
        </div>

        <ZonesGrid zones={zones} onToggle={toggleValve} />

        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-base font-bold flex items-center gap-2 mb-3">
            <Droplets className="h-4 w-4 text-primary" /> দ্রুত গ্রুপ অ্যাকশন
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <button className="rounded-xl glass-panel p-4 hover-lift text-left">
              <p className="font-bold text-sm">সব ভাল্ভ খুলুন</p>
              <p className="text-xs text-muted-foreground mt-1">সকল ৭টি জোনে একসাথে সেচ শুরু করুন</p>
            </button>
            <button className="rounded-xl glass-panel p-4 hover-lift text-left">
              <p className="font-bold text-sm">সব ভাল্ভ বন্ধ করুন</p>
              <p className="text-xs text-muted-foreground mt-1">সকল সেচ লাইন তাৎক্ষণিক বন্ধ করুন</p>
            </button>
            <button className="rounded-xl glass-panel p-4 hover-lift text-left">
              <p className="font-bold text-sm">AI স্বয়ংক্রিয় মোড</p>
              <p className="text-xs text-muted-foreground mt-1">মাটির আর্দ্রতা অনুযায়ী AI সিদ্ধান্ত নেবে</p>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
