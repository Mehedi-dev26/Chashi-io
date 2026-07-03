import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FieldMap } from "@/components/dashboard/FieldMap";
import { useIrrigationData, PUMP_SPEC } from "@/hooks/useIrrigationData";
import { MapPin, Layers, Radio, Compass } from "lucide-react";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "জমির মানচিত্র · BMDA স্মার্ট সেচ" }] }),
  component: MapPage,
});

// 1 একর ≈ ৪০৪৭ m² → মোট আয়তন থেকে বাস্তব field dimensions (16:10 aspect) derive
// তারপর প্রতিটি zone-এর %-coord কে মিটারে রূপান্তর করে পাম্প (50,50) থেকে দূরত্ব যোগ
function computePipelineKm(zones: { x: number; y: number; area: number }[]) {
  const totalAcres = zones.reduce((s, z) => s + z.area, 0);
  if (!totalAcres) return 0;
  const totalM2 = totalAcres * 4047;
  // 16:10 aspect → width = √(A * 1.6), height = width / 1.6
  const widthM = Math.sqrt(totalM2 * 1.6);
  const heightM = widthM / 1.6;
  let totalM = 0;
  for (const z of zones) {
    const dx = ((z.x - 50) / 100) * widthM;
    const dy = ((z.y - 50) / 100) * heightM;
    totalM += Math.sqrt(dx * dx + dy * dy);
  }
  return totalM / 1000;
}

function MapPage() {
  const { zones, toggleValve } = useIrrigationData();
  const totalArea = zones.reduce((s, z) => s + z.area, 0);
  const active = zones.filter((z) => z.valveOpen).length;
  const pipelineKm = computePipelineKm(zones);
  const now = Date.now();
  const onlineNodes = zones.filter((z) => z.lastSeen && now - z.lastSeen < PUMP_SPEC.heartbeatMs).length;
  const totalNodesWithHw = zones.filter((z) => z.hasNode).length;

  const cards = [
    {
      label: "মোট এলাকা",
      value: `${bn(totalArea.toFixed(1))} একর`,
      sub: `${bn((totalArea * 0.4047).toFixed(2))} হেক্টর`,
      icon: Compass,
      gradient: "from-emerald-500 via-teal-500 to-cyan-600",
      shadow: "shadow-emerald-500/40",
    },
    {
      label: "সক্রিয় জোন",
      value: `${bn(active)} / ${bn(zones.length)}`,
      sub: active > 0 ? "সেচ চলছে" : "কোনো ভাল্ভ খোলা নেই",
      icon: MapPin,
      gradient: "from-fuchsia-500 via-purple-500 to-indigo-600",
      shadow: "shadow-purple-500/40",
    },
    {
      label: "পাইপলাইন দৈর্ঘ্য",
      value: `${bn(pipelineKm.toFixed(2))} কিমি`,
      sub: `${bn(zones.length)}টি জোন পাম্প থেকে`,
      icon: Layers,
      gradient: "from-sky-500 via-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/40",
    },
    {
      label: "সংযুক্ত সাব-নোড",
      value: `${bn(onlineNodes)} / ${bn(totalNodesWithHw)}`,
      sub: totalNodesWithHw ? `${bn(Math.round((onlineNodes / Math.max(1, totalNodesWithHw)) * 100))}% অনলাইন` : "কোনো নোড যুক্ত নয়",
      icon: Radio,
      gradient: "from-orange-500 via-amber-500 to-rose-500",
      shadow: "shadow-orange-500/40",
    },
  ];

  return (
    <DashboardLayout
      title="জমির মানচিত্র · লাইভ টপোলজি"
      subtitle="স্যাটেলাইট ভিউ ও পাইপলাইন নেটওয়ার্কে সকল সেচ জোন দেখুন এবং নিয়ন্ত্রণ করুন।"
    >
      <div className="stagger space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((s) => (
            <div
              key={s.label}
              className={`group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${s.gradient} shadow-lg ${s.shadow} ring-1 ring-white/30 text-white hover-lift transition-transform`}
            >
              <span className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/15 blur-2xl group-hover:bg-white/25 transition-colors" />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-white/10" />
              <div className="relative flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wider font-bold text-white/90">{s.label}</p>
                <s.icon className="h-4 w-4 text-white/90 drop-shadow" />
              </div>
              <p className="relative text-2xl font-extrabold mt-2 tabular-nums drop-shadow">{s.value}</p>
              <p className="relative text-[10px] font-semibold text-white/85 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        <FieldMap zones={zones} onToggle={toggleValve} />

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">জোন তালিকা ও স্থানাঙ্ক</h2>
              <p className="text-xs text-muted-foreground">প্রতিটি জমির রিয়েল-টাইম পরিসংখ্যান ও অবস্থা</p>
            </div>
            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded-full">
              {bn(zones.length)}টি জোন
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {zones.map((z) => {
              const statusGrad = z.valveOpen
                ? "from-emerald-500 via-green-500 to-teal-500"
                : "from-slate-400 via-zinc-500 to-slate-600";
              return (
                <div
                  key={z.id}
                  className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg ring-1 ring-white/30 border-2 border-white/20 hover-lift group"
                >
                  <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-white/15 blur-2xl group-hover:bg-white/25 transition-colors duration-500" />

                  <div className="relative flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono opacity-90">{z.id}</p>
                      <h3 className="font-black text-lg truncate drop-shadow">{z.nameBn}</h3>
                      <p className="text-[11px] opacity-90 font-medium">{z.cropType}</p>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-1 rounded-lg bg-gradient-to-r ${statusGrad} ring-1 ring-white/40 shadow-md shrink-0`}>
                      {z.valveOpen ? "সেচ চলছে" : "নিষ্ক্রিয়"}
                    </span>
                  </div>

                  <div className="relative mt-3 grid grid-cols-3 gap-2">
                    <Tile grad="from-sky-500 via-cyan-500 to-blue-500" label="পানির স্তর" value={`${bn(z.waterLevel.toFixed(0))}%`} />
                    <Tile grad="from-lime-500 via-green-500 to-emerald-500" label="আর্দ্রতা" value={`${bn(z.soilMoisture.toFixed(0))}%`} />
                    <Tile grad="from-orange-500 via-amber-500 to-yellow-500" label="একর" value={bn(z.area)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Tile({ grad, label, value }: { grad: string; label: string; value: string }) {
  return (
    <div className={`rounded-xl p-2 bg-gradient-to-br ${grad} ring-1 ring-white/40 shadow-md text-white`}>
      <p className="text-[9px] uppercase tracking-wider opacity-90 font-bold truncate">{label}</p>
      <p className="text-base font-black tabular-nums drop-shadow">{value}</p>
    </div>
  );
}
