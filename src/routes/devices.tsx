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
import { Cpu, Wifi, WifiOff, Plus, Trash2, Droplets, Sun, Signal, Power, FlaskConical, Activity, Sprout, MapPin, Eye, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIrrigationData } from "@/hooks/useIrrigationData";

export const Route = createFileRoute("/devices")({
  head: () => ({ meta: [{ title: "ডিভাইস নেটওয়ার্ক · BMDA" }] }),
  component: DevicesPage,
});

type FieldNode = { id: string; device_id: string; zone_id: string | null; label: string; notes: string | null };
type Telemetry = {
  zone_id: string; device_id: string; soil_moisture: number | null; tds_ppm: number | null;
  ldr: number | null; valve_open: boolean | null; temperature: number | null; humidity: number | null;
  rssi: number | null; updated_at: string;
};

const ONLINE_MS = 15000;
const BACKEND_HOST = "https://project--583e7123-43a5-4b02-9812-0f73d31e5ee2-dev.lovable.app";
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
  const { zones, assignNodeToField } = useIrrigationData();
  const [nodes, setNodes] = useState<FieldNode[]>([]);
  // telemetry keyed by device_id for reliable lookup regardless of zone assignment
  const [tele, setTele] = useState<Record<string, Telemetry>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ device_id: "", label: "", zone_id: "", notes: "" });
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [infoNode, setInfoNode] = useState<FieldNode | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [, tick] = useState(0);

  const copy = async (key: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); toast.success("কপি হয়েছে"); setTimeout(() => setCopied(null), 1500); }
    catch { toast.error("কপি করা যায়নি"); }
  };

  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 3000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("field_nodes").select("*").order("created_at").then(({ data }) => {
      if (data) setNodes(data as FieldNode[]);
    });
  }, [user]);

  useEffect(() => {
    supabase.from("device_telemetry").select("*").then(({ data }) => {
      if (data) setTele(Object.fromEntries((data as Telemetry[]).map((t) => [t.device_id, t])));
    });
    const ch = supabase.channel("devices_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "device_telemetry" },
        (payload) => {
          const row = payload.new as Telemetry;
          if (row?.device_id) setTele((p) => ({ ...p, [row.device_id]: row }));
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const reloadNodes = async () => {
    const { data } = await supabase.from("field_nodes").select("*").order("created_at");
    if (data) setNodes(data as FieldNode[]);
  };

  const add = async () => {
    if (!user) { toast.error("আগে লগইন করুন"); return; }
    if (!form.device_id || !form.label) { toast.error("Device ID ও নাম প্রয়োজন"); return; }
    const payload = {
      user_id: user.id,
      device_id: form.device_id,
      label: form.label,
      notes: form.notes || null,
      zone_id: form.zone_id || null,
    };
    const { error } = await supabase.from("field_nodes").insert(payload);
    if (error) { toast.error(error.message); return; }
    if (form.zone_id) {
      await supabase.from("fields").update({ valve_node_id: form.device_id }).eq("user_id", user.id).eq("zone_id", form.zone_id);
    }
    toast.success(`${form.device_id} যোগ হলো — ESP8266-এ firmware flash করুন`);
    setOpen(false);
    await reloadNodes();
    setForm({ device_id: "", label: "", zone_id: "", notes: "" });
  };

  const remove = async (id: string, device_id: string) => {
    // unlink any field first
    if (user) await supabase.from("fields").update({ valve_node_id: null }).eq("user_id", user.id).eq("valve_node_id", device_id);
    const { error } = await supabase.from("field_nodes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setNodes((p) => p.filter((n) => n.id !== id));
    toast.info(`${device_id} মুছে ফেলা হলো`);
  };

  const onAssign = async (n: FieldNode, zoneId: string) => {
    await assignNodeToField(n.device_id, zoneId || null);
    await reloadNodes();
  };

  const toggleValve = async (n: FieldNode) => {
    const t = tele[n.device_id];
    const online = !!(t && Date.now() - new Date(t.updated_at).getTime() < ONLINE_MS);
    if (!online) { toast.error(`${n.device_id} অফলাইন — কমান্ড পাঠানো যাবে না`); return; }
    if (!user) return;
    if (!n.zone_id) { toast.error("আগে এই নোডকে একটি জমিতে assign করুন"); return; }
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

  const onlineCount = nodes.filter((n) => {
    const t = tele[n.device_id];
    return t && Date.now() - new Date(t.updated_at).getTime() < ONLINE_MS;
  }).length;

  // fields assigned-elsewhere lookup for "available" dropdown options
  const assignedZones = new Set(nodes.filter((n) => n.zone_id).map((n) => n.zone_id!));

  return (
    <DashboardLayout
      title="ডিভাইস · নেটওয়ার্ক"
      subtitle={`${bn(onlineCount)}/${bn(nodes.length)} অনলাইন · রিয়েল-টাইম sub-node নিয়ন্ত্রণ`}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />নতুন সাব-নোড</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>নতুন ESP8266 সাব-নোড যোগ করুন</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Device ID</Label><Input value={form.device_id} onChange={(e) => setForm({ ...form, device_id: e.target.value })} placeholder="SUB-01" /></div>
              <div><Label>নাম</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="উত্তর জমির নোড" /></div>
              <div>
                <Label>জমিতে assign করুন (ঐচ্ছিক)</Label>
                <select
                  value={form.zone_id}
                  onChange={(e) => setForm({ ...form, zone_id: e.target.value })}
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">— পরে assign করব —</option>
                  {zones.filter((z) => !assignedZones.has(z.id) && !z.hasNode).map((z) => (
                    <option key={z.id} value={z.id}>{z.id} · {z.nameBn}</option>
                  ))}
                </select>
              </div>
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
            const t = tele[n.device_id];
            const online = !!(t && Date.now() - new Date(t.updated_at).getTime() < ONLINE_MS);
            const moisture = t?.soil_moisture ?? 0;
            const tds = t?.tds_ppm ?? 0;
            const valveOpen = !!t?.valve_open;
            const assignedZone = zones.find((z) => z.id === n.zone_id);
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
                        <p className="font-mono text-[10px] text-muted-foreground">{n.device_id}</p>
                        <p className="font-semibold text-sm leading-tight truncate">{n.label}</p>
                      </div>
                    </div>
                    <Badge variant={online ? "default" : "destructive"} className="gap-1 shrink-0">
                      {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                      {online ? "LIVE" : "OFFLINE"}
                    </Badge>
                  </div>

                  {/* Field assignment */}
                  <div className="mb-3 rounded-lg bg-muted/40 p-2.5">
                    <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> জমিতে assign
                    </Label>
                    <select
                      value={n.zone_id ?? ""}
                      onChange={(e) => onAssign(n, e.target.value)}
                      className="mt-1 w-full h-9 px-2 rounded-md border border-input bg-background text-xs"
                    >
                      <option value="">— unassigned —</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id} disabled={z.hasNode && z.valveNodeId !== n.device_id}>
                          {z.id} · {z.nameBn} {z.hasNode && z.valveNodeId !== n.device_id ? "(নেওয়া)" : ""}
                        </option>
                      ))}
                    </select>
                    {assignedZone && (
                      <p className="text-[10px] text-emerald-600 mt-1 font-semibold">✓ {assignedZone.nameBn}-এর সাথে যুক্ত</p>
                    )}
                  </div>

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

                  <button
                    onClick={() => toggleValve(n)}
                    disabled={!online || pending[n.device_id] || !n.zone_id}
                    className={`w-full rounded-lg py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      !online || !n.zone_id ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : valveOpen ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow shadow-rose-500/30 hover:scale-[1.02]"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow shadow-emerald-500/30 hover:scale-[1.02]"
                    }`}
                  >
                    <Droplets className="h-4 w-4" />
                    {!n.zone_id ? "জমিতে assign করুন"
                      : pending[n.device_id] ? "পাঠানো হচ্ছে…"
                      : !online ? "অফলাইন"
                      : valveOpen ? "Servo বন্ধ করুন" : "Servo খুলুন"}
                    {online && valveOpen && <span className="h-2 w-2 rounded-full bg-white animate-pulse" />}
                  </button>

                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{t ? `শেষ heartbeat: ${ago(t.updated_at)} আগে` : "ডেটা পাওয়া যায়নি"}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setInfoNode(n)}
                        title="কানেকশন তথ্য দেখুন"
                        className="h-7 w-7 rounded-md grid place-items-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow shadow-indigo-500/30 hover:scale-110 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(n.id, n.device_id)}
                        title="মুছে ফেলুন"
                        className="h-7 w-7 rounded-md grid place-items-center bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
          <p>• <b className="text-foreground">Servo motor (SG90)</b> দিয়ে পানির লাইন on/off — solenoid valve-এর সাশ্রয়ী বিকল্প।</p>
          <p>• <b className="text-foreground">জমিতে assign</b>: যেকোনো sub-node-কে drop-down থেকে একটি জমিতে যুক্ত করুন → তখন থেকে সেই জমির ডেটা ও ভাল্ভ এই নোড থেকে আসবে।</p>
          <p>• <b className="text-foreground">Online check</b>: heartbeat ১৫ সেকেন্ডের বেশি না এলে নোড offline দেখানো হয়, valve বোতাম disable হয়ে যায়।</p>
        </CardContent>
      </Card>

      <Dialog open={!!infoNode} onOpenChange={(o) => !o && setInfoNode(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-indigo-500" /> {infoNode?.device_id} · কানেকশন তথ্য
            </DialogTitle>
          </DialogHeader>
          {infoNode && (() => {
            const zoneId = infoNode.zone_id ?? "";
            const snippet = `// ====== ${infoNode.label} ======
// নিচের ৪টি লাইন ESP8266 firmware-এর উপরে paste করুন
const char* WIFI_SSID   = "YOUR_WIFI_SSID";
const char* WIFI_PASS   = "YOUR_WIFI_PASSWORD";
const char* DEVICE_ID   = "${infoNode.device_id}";
const char* ZONE_ID     = "${zoneId || "Z-XX"}";   // ${zoneId ? "Lovable Cloud-এ assigned" : "⚠ এখনো কোনো জমিতে assign করা হয়নি"}
const char* SERVER_HOST = "${BACKEND_HOST}";
// Endpoint: ${BACKEND_HOST}/api/public/telemetry`;
            const rows: Array<[string, string, string]> = [
              ["Device ID", infoNode.device_id, `dev-${infoNode.device_id}`],
              ["Zone ID", zoneId || "— unassigned —", `zone-${infoNode.device_id}`],
              ["Label / নাম", infoNode.label, `label-${infoNode.device_id}`],
              ["Server Host", BACKEND_HOST, `host-${infoNode.device_id}`],
              ["Telemetry POST", `${BACKEND_HOST}/api/public/telemetry`, `tele-${infoNode.device_id}`],
              ["Commands GET", `${BACKEND_HOST}/api/public/commands`, `cmd-${infoNode.device_id}`],
            ];
            return (
              <div className="space-y-4">
                <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs leading-relaxed">
                  <p className="font-bold text-indigo-700 dark:text-indigo-300 mb-1">📋 নতুন ESP8266-এ firmware flash করতে</p>
                  <p className="text-muted-foreground">নিচের মানগুলো হুবহু কপি করে আপনার Arduino IDE-তে sub-node sketch-এর উপরে paste করুন। তারপর WiFi SSID/Password বসিয়ে upload করুন।</p>
                </div>

                <div className="grid gap-2">
                  {rows.map(([k, v, key]) => (
                    <div key={key} className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{k}</p>
                        <p className="font-mono text-xs break-all">{v}</p>
                      </div>
                      <button
                        onClick={() => copy(key, v)}
                        className="h-8 w-8 rounded-md grid place-items-center bg-background border hover:bg-muted shrink-0"
                        title="কপি করুন"
                      >
                        {copied === key ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>

                {!zoneId && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                    ⚠ এই নোডটি এখনো কোনো জমিতে assign করা হয়নি। উপরের কার্ড থেকে "জমিতে assign" drop-down ব্যবহার করুন, না হলে firmware-এ <code className="bg-black/10 px-1 rounded">ZONE_ID</code> placeholder থাকবে।
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-bold">Arduino IDE-তে paste করার জন্য কনফিগ ব্লক</Label>
                    <button
                      onClick={() => copy(`snippet-${infoNode.device_id}`, snippet)}
                      className="text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow"
                    >
                      {copied === `snippet-${infoNode.device_id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      পুরোটা কপি করুন
                    </button>
                  </div>
                  <pre className="text-[11px] leading-relaxed bg-zinc-950 text-zinc-100 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre">{snippet}</pre>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  পূর্ণ sub-node firmware Hardware পেজ থেকে কপি করুন → এই ৪টি constant দিয়ে উপরের প্লেসহোল্ডার গুলো বদলে দিন → ESP8266-এ upload করুন। ৫–১০ সেকেন্ডের মধ্যে কার্ডে <b className="text-emerald-600">LIVE</b> badge দেখাবে।
                </p>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
