import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Cpu, Wifi, WifiOff, Plus, Trash2, Droplets, Sun, Signal, Power, FlaskConical, Activity, Sprout } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/devices")({
  head: () => ({ meta: [{ title: "ডিভাইস নেটওয়ার্ক · BMDA" }] }),
  component: DevicesPage,
});

type FieldNode = { id: string; device_id: string; zone_id: string; label: string; notes: string | null };
type Telemetry = {
  zone_id: string; device_id: string; soil_moisture: number | null; tds_ppm: number | null;
  ldr: number | null; valve_open: boolean | null; temperature: number | null; humidity: number | null;
  rssi: number | null; updated_at: string;
};

const ONLINE_MS = 15000;
const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const ago = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 5) return "এইমাত্র";
  if (s < 60) return `${bn(s)} সেকেন্ড`;
  if (s < 3600) return `${bn(Math.floor(s / 60))} মিনিট`;
  return `${bn(Math.floor(s / 3600))} ঘণ্টা`;
};

function DevicesPage() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<FieldNode[]>([]);
  const [tele, setTele] = useState<Record<string, Telemetry>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ device_id: "", label: "", zone_id: "", notes: "" });
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [, tick] = useState(0);

  // tick every 3s so "ago" + online indicator refresh
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 3000); return () => clearInterval(t); }, []);

  // load nodes
  useEffect(() => {
    if (!user) return;
    supabase.from("field_nodes").select("*").order("created_at").then(({ data }) => {
      if (data) setNodes(data as FieldNode[]);
    });
  }, [user]);

  // realtime telemetry
  useEffect(() => {
    supabase.from("device_telemetry").select("*").then(({ data }) => {
      if (data) setTele(Object.fromEntries((data as Telemetry[]).map((t) => [t.zone_id, t])));
    });
    const ch = supabase.channel("devices_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "device_telemetry" },
        (payload) => {
          const row = payload.new as Telemetry;
          if (row?.zone_id) setTele((p) => ({ ...p, [row.zone_id]: row }));
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const add = async () => {
    if (!user) { toast.error("আগে লগইন করুন"); return; }
    if (!form.device_id || !form.label || !form.zone_id) { toast.error("Device ID, নাম ও জোন প্রয়োজন"); return; }
    const { error } = await supabase.from("field_nodes").insert({ ...form, user_id: user.id });
    if (error) { toast.error(error.message); return; }
    toast.success(`${form.device_id} যোগ হলো — ESP8266-এ firmware flash করুন`);
    setOpen(false);
    const { data } = await supabase.from("field_nodes").select("*").order("created_at");
    if (data) setNodes(data as FieldNode[]);
    setForm({ device_id: "", label: "", zone_id: "", notes: "" });
  };

  const remove = async (id: string, device_id: string) => {
    const { error } = await supabase.from("field_nodes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setNodes((p) => p.filter((n) => n.id !== id));
    toast.info(`${device_id} মুছে ফেলা হলো`);
  };

  const toggleValve = async (n: FieldNode) => {
    const t = tele[n.zone_id];
    const online = t && Date.now() - new Date(t.updated_at).getTime() < ONLINE_MS;
    if (!online) { toast.error(`${n.device_id} অফলাইন — কমান্ড পাঠানো যাবে না`); return; }
    if (!user) return;
    const target = !t?.valve_open;
    setPending((p) => ({ ...p, [n.device_id]: true }));
    const { error } = await supabase.from("device_commands").insert({
      device_id: n.device_id, zone_id: n.zone_id,
      action: target ? "valve_open" : "valve_close", issued_by: user.id,
    });
    setPending((p) => ({ ...p, [n.device_id]: false }));
    if (error) { toast.error(error.message); return; }
    toast.success(`${n.device_id} ভাল্ভ ${target ? "খোলার" : "বন্ধের"} কমান্ড পাঠানো হলো`);
  };

  const online = nodes.filter((n) => {
    const t = tele[n.zone_id];
    return t && Date.now() - new Date(t.updated_at).getTime() < ONLINE_MS;
  }).length;

  return (
    <DashboardLayout
      title="ডিভাইস · নেটওয়ার্ক"
      subtitle={`${bn(online)}/${bn(nodes.length)} অনলাইন · রিয়েল-টাইম sub-node নিয়ন্ত্রণ`}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />নতুন সাব-নোড</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>নতুন ESP8266 সাব-নোড যোগ করুন</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Device ID</Label><Input value={form.device_id} onChange={(e) => setForm({ ...form, device_id: e.target.value })} placeholder="SUB-01" /></div>
              <div><Label>নাম</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="উত্তর জমির নোড" /></div>
              <div><Label>জোন ID</Label><Input value={form.zone_id} onChange={(e) => setForm({ ...form, zone_id: e.target.value })} placeholder="Z-01" /></div>
              <div><Label>নোট (ঐচ্ছিক)</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <p className="text-[11px] text-muted-foreground">যোগ করার পর Hardware পেজ থেকে sub-node code copy করে Device ID + Zone বদলে ESP8266-এ upload করুন।</p>
            </div>
            <DialogFooter><Button onClick={add}>যোগ করুন</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {nodes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center space-y-3">
            <Cpu className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-bold text-lg">এখনো কোনো sub-node যোগ করা হয়নি</h3>
            <p className="text-sm text-muted-foreground">উপরে "নতুন সাব-নোড" বোতাম থেকে শুরু করুন। প্রতিটি sub-node মাটির TDS sensor দিয়ে আর্দ্রতা পরিমাপ করবে এবং servo motor দিয়ে পানির লাইন on/off করবে।</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {nodes.map((n, i) => {
            const t = tele[n.zone_id];
            const online = !!(t && Date.now() - new Date(t.updated_at).getTime() < ONLINE_MS);
            const moisture = t?.soil_moisture ?? 0;
            const tds = t?.tds_ppm ?? 0;
            const valveOpen = !!t?.valve_open;
            return (
              <Card key={n.id} className="overflow-hidden animate-fade-in hover:shadow-lg transition-all" style={{ animationDelay: `${i * 40}ms` }}>
                <div className={`h-1 ${online ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-rose-500/60"}`} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 ${online ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}>
                        <Cpu className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] text-muted-foreground">{n.device_id} · {n.zone_id}</p>
                        <p className="font-semibold text-sm leading-tight truncate">{n.label}</p>
                      </div>
                    </div>
                    <Badge variant={online ? "default" : "destructive"} className="gap-1 shrink-0">
                      {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                      {online ? "LIVE" : "OFFLINE"}
                    </Badge>
                  </div>

                  {/* Live readings */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-lg p-2.5 bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow shadow-sky-500/30">
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"><Sprout className="h-3 w-3" />আর্দ্রতা</div>
                      <p className="mt-1 text-xl font-extrabold">{bn(moisture.toFixed(0))}<span className="text-xs">%</span></p>
                    </div>
                    <div className="rounded-lg p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow shadow-amber-500/30">
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"><FlaskConical className="h-3 w-3" />TDS</div>
                      <p className="mt-1 text-xl font-extrabold">{bn(tds.toFixed(0))}<span className="text-xs"> ppm</span></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[10px] mb-3">
                    <div className="text-center p-1.5 rounded bg-muted/40">
                      <Sun className="h-3 w-3 mx-auto text-muted-foreground" />
                      <p className="font-semibold">{bn((t?.ldr ?? 0).toFixed(0))}%</p>
                    </div>
                    <div className="text-center p-1.5 rounded bg-muted/40">
                      <Activity className="h-3 w-3 mx-auto text-muted-foreground" />
                      <p className="font-semibold">{t?.temperature != null ? `${bn(t.temperature.toFixed(0))}°` : "—"}</p>
                    </div>
                    <div className="text-center p-1.5 rounded bg-muted/40">
                      <Signal className="h-3 w-3 mx-auto text-muted-foreground" />
                      <p className="font-semibold">{t?.rssi != null ? bn(t.rssi.toFixed(0)) : "—"}</p>
                    </div>
                  </div>

                  {/* Servo valve toggle */}
                  <button
                    onClick={() => toggleValve(n)}
                    disabled={!online || pending[n.device_id]}
                    className={`w-full rounded-lg py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      !online ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : valveOpen ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow shadow-rose-500/30 hover:scale-[1.02]"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow shadow-emerald-500/30 hover:scale-[1.02]"
                    }`}
                  >
                    <Droplets className="h-4 w-4" />
                    {pending[n.device_id] ? "পাঠানো হচ্ছে…" : valveOpen ? "Servo বন্ধ করুন" : "Servo খুলুন"}
                    {online && valveOpen && <span className="h-2 w-2 rounded-full bg-white animate-pulse" />}
                  </button>

                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{t ? `শেষ heartbeat: ${ago(t.updated_at)} আগে` : "ডেটা পাওয়া যায়নি"}</span>
                    <button onClick={() => remove(n.id, n.device_id)} className="text-destructive hover:text-rose-600">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Power className="h-4 w-4" />কীভাবে কাজ করে?</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• প্রতিটি sub-node (ESP8266) প্রতি ৫ সেকেন্ডে heartbeat পাঠায় → আপনি এখানে লাইভ ডেটা দেখেন।</p>
          <p>• <b className="text-foreground">TDS sensor</b> (Gravity TDS / generic) থেকে raw analog পড়া → temperature compensation → মাটির আর্দ্রতা শতাংশে রূপান্তর।</p>
          <p>• <b className="text-foreground">Servo motor (SG90)</b> দিয়ে পানির লাইন on/off — solenoid valve-এর সাশ্রয়ী বিকল্প। ০° = বন্ধ, ৯০° = খোলা।</p>
          <p>• <b className="text-foreground">Online check</b>: heartbeat ১৫ সেকেন্ডের বেশি না এলে নোড offline দেখানো হয়, valve বোতাম disable হয়ে যায়।</p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
