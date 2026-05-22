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
          <h2 className="text-base font-bold mb-3">জোন তালিকা ও স্থানাঙ্ক</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase text-muted-foreground border-b border-border">
                <tr className="text-left">
                  <th className="py-2 px-2">ID</th>
                  <th className="px-2">জোন</th>
                  <th className="px-2">ফসল</th>
                  <th className="px-2">এলাকা</th>
                  <th className="px-2">অবস্থা</th>
                  <th className="px-2">পানির স্তর</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id} className="border-b border-border/50 hover:bg-secondary/40 transition">
                    <td className="py-2 px-2 font-mono text-xs">{z.id}</td>
                    <td className="px-2 font-semibold">{z.nameBn}</td>
                    <td className="px-2 text-muted-foreground">{z.cropType}</td>
                    <td className="px-2">{bn(z.area)} একর</td>
                    <td className="px-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${z.valveOpen ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {z.valveOpen ? "সেচ চলছে" : "নিষ্ক্রিয়"}
                      </span>
                    </td>
                    <td className="px-2 font-semibold">{bn(z.waterLevel.toFixed(0))}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
