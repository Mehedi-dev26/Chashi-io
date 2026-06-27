import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FieldMap } from "@/components/dashboard/FieldMap";
import { useIrrigationData } from "@/hooks/useIrrigationData";
import { MapPin, Layers, Satellite, Compass } from "lucide-react";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "জমির মানচিত্র · BMDA স্মার্ট সেচ" }] }),
  component: MapPage,
});

function MapPage() {
  const { zones, toggleValve } = useIrrigationData();
  const totalArea = zones.reduce((s, z) => s + z.area, 0);
  const active = zones.filter((z) => z.valveOpen).length;

  return (
    <DashboardLayout
      title="জমির মানচিত্র · লাইভ টপোলজি"
      subtitle="স্যাটেলাইট ভিউ ও পাইপলাইন নেটওয়ার্কে সকল সেচ জোন দেখুন এবং নিয়ন্ত্রণ করুন।"
      actions={
        <div className="flex gap-2">
          <button className="h-9 px-3 rounded-lg glass-panel text-xs font-semibold flex items-center gap-1.5 hover-lift">
            <Layers className="h-3.5 w-3.5" /> স্তর
          </button>
          <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover-lift">
            <Satellite className="h-3.5 w-3.5" /> স্যাটেলাইট
          </button>
        </div>
      }
    >
      <div className="stagger space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "মোট এলাকা", value: `${bn(totalArea.toFixed(1))} একর`, icon: Compass },
            { label: "সক্রিয় জোন", value: `${bn(active)} / ${bn(zones.length)}`, icon: MapPin },
            { label: "পাইপলাইন", value: `${bn("4.2")} কিমি`, icon: Layers },
            { label: "GPS স্যাটেলাইট", value: `${bn("12")} সংযুক্ত`, icon: Satellite },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-4 hover-lift">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</p>
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold mt-2">{s.value}</p>
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
