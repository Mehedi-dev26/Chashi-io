import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ZonesGrid } from "@/components/dashboard/ZonesGrid";
import { useIrrigationData } from "@/hooks/useIrrigationData";
import { Droplets, Plus, Trash2, X, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

type AvailableNode = { device_id: string; label: string; zone_id: string | null };

export const Route = createFileRoute("/zones")({
  head: () => ({ meta: [{ title: "সেচ জোন · Chashi.io" }] }),
  component: ZonesPage,
});

function ZonesPage() {
  const { zones, toggleValve, addField, deleteField } = useIrrigationData();
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({ zone_id: "", nameBn: "", area: 1, crop: "Rice", valveNodeId: "" });
  const [availableNodes, setAvailableNodes] = useState<AvailableNode[]>([]);
  const irrigating = zones.filter((z) => z.valveOpen).length;
  const alerts = zones.filter((z) => z.status === "alert").length;
  const validMoisture = zones.filter((z) => z.soilMoisture > 0);
  const avgMoisture = validMoisture.length ? validMoisture.reduce((s, z) => s + z.soilMoisture, 0) / validMoisture.length : 0;

  useEffect(() => {
    if (!openAdd) return;
    supabase.from("field_nodes").select("device_id,label,zone_id").is("zone_id", null).then(({ data }) => {
      setAvailableNodes((data ?? []) as AvailableNode[]);
    });
  }, [openAdd]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.zone_id || !form.nameBn) return;
    await addField({
      zone_id: form.zone_id,
      nameBn: form.nameBn,
      area: form.area,
      crop: form.crop,
      valveNodeId: form.valveNodeId || null,
    });
    setForm({ zone_id: "", nameBn: "", area: 1, crop: "Rice", valveNodeId: "" });
    setOpenAdd(false);
  };


  return (
    <DashboardLayout
      title="সেচ জোন · ব্যবস্থাপনা"
      subtitle="প্রতিটি জমির তথ্য database-এ সংরক্ষিত · ভাল্ভ, পানি ও আর্দ্রতা real-time।"
      actions={
        <button onClick={() => setOpenAdd(true)} className="h-9 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md ring-1 ring-white/30 hover:scale-[1.03] transition">
          <Plus className="h-3.5 w-3.5" /> নতুন জমি যোগ করুন
        </button>
      }
    >
      <div className="stagger space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "মোট জমি", value: bn(zones.length), grad: "from-emerald-500 via-teal-500 to-cyan-500", ring: "ring-emerald-300/40", pct: 100 },
            { label: "সেচ চলছে", value: bn(irrigating), grad: "from-sky-500 via-blue-500 to-indigo-500", ring: "ring-sky-300/40", pct: zones.length ? (irrigating / zones.length) * 100 : 0 },
            { label: "সতর্কতা", value: bn(alerts), grad: "from-rose-500 via-red-500 to-orange-500", ring: "ring-rose-300/40", pct: zones.length ? (alerts / zones.length) * 100 : 0 },
            { label: "গড় আর্দ্রতা", value: `${bn(avgMoisture.toFixed(0))}%`, grad: "from-amber-500 via-yellow-500 to-lime-500", ring: "ring-amber-300/40", pct: avgMoisture },
          ].map((s) => (
            <div key={s.label} className={`relative overflow-hidden rounded-2xl p-4 text-white bg-gradient-to-br ${s.grad} shadow-lg ring-1 ${s.ring} hover-lift border-2 border-white/20`}>
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
            <Trash2 className="h-4 w-4 text-rose-500" /> জমি মুছে ফেলুন
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {zones.map((z) => (
              <div key={z.id} className="flex items-center justify-between glass-panel rounded-lg p-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{z.nameBn}</p>
                  <p className="text-[10px] text-muted-foreground">{z.id} · {bn(z.area)} একর</p>
                </div>
                <button onClick={() => { if (confirm(`${z.id} মুছে ফেলবেন?`)) deleteField(z.id); }} className="h-7 w-7 rounded-md bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 grid place-items-center shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {openAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4" onClick={() => setOpenAdd(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl border-2 border-emerald-300/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold flex items-center gap-2"><Droplets className="h-5 w-5 text-emerald-500" /> নতুন জমি</h3>
              <button type="button" onClick={() => setOpenAdd(false)} className="h-8 w-8 rounded-lg hover:bg-muted grid place-items-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold">জোন ID (যেমন Z-08)</label>
                <input value={form.zone_id} onChange={(e) => setForm({ ...form, zone_id: e.target.value.toUpperCase() })} required className="mt-1 w-full h-10 px-3 rounded-lg border-2 border-border bg-background text-sm outline-none focus:border-emerald-500" placeholder="Z-08" />
              </div>
              <div>
                <label className="text-xs font-semibold">বাংলা নাম</label>
                <input value={form.nameBn} onChange={(e) => setForm({ ...form, nameBn: e.target.value })} required className="mt-1 w-full h-10 px-3 rounded-lg border-2 border-border bg-background text-sm outline-none focus:border-emerald-500" placeholder="যেমন: মাঠের জমি" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold">আয়তন (একর)</label>
                  <input type="number" step="0.1" min="0.1" value={form.area} onChange={(e) => setForm({ ...form, area: parseFloat(e.target.value) || 0 })} required className="mt-1 w-full h-10 px-3 rounded-lg border-2 border-border bg-background text-sm outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold">ফসল</label>
                  <select value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border-2 border-border bg-background text-sm outline-none focus:border-emerald-500">
                    {["Rice", "Wheat", "Maize", "Potato", "Sugarcane"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold flex items-center gap-1"><Cpu className="h-3 w-3" /> ভাল্ভ সাব-নোড (ঐচ্ছিক)</label>
                <select value={form.valveNodeId} onChange={(e) => setForm({ ...form, valveNodeId: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border-2 border-border bg-background text-sm outline-none focus:border-emerald-500">
                  <option value="">— কোনো নোড নয় —</option>
                  {availableNodes.map((n) => (
                    <option key={n.device_id} value={n.device_id}>{n.device_id} · {n.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {availableNodes.length === 0
                    ? "কোনো উপলব্ধ sub-node নেই · Devices পেজ থেকে নতুন যোগ করুন"
                    : `${bn(availableNodes.length)}টি sub-node উপলব্ধ`}
                </p>
              </div>
            </div>

            <button type="submit" className="mt-5 w-full h-11 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-md ring-1 ring-white/30 hover:scale-[1.02] transition">
              যোগ করুন
            </button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
