import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Cpu, Wifi, WifiOff, Plus, Copy, CheckCircle2, Battery, Signal, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/devices")({
  head: () => ({ meta: [{ title: "ডিভাইস নেটওয়ার্ক · BMDA" }] }),
  component: DevicesPage,
});

type Device = {
  id: string; name: string; zone: string; ip: string;
  online: boolean; rssi: number; battery: number; firmware: string; lastSeen: string;
  sensors: string[];
};

const seed: Device[] = [
  { id: "ESP-001", name: "উত্তর মাস্টার", zone: "Z-01", ip: "192.168.1.21", online: true, rssi: -54, battery: 92, firmware: "v2.6.1", lastSeen: "এইমাত্র", sensors: ["Soil", "Water", "DHT22", "Valve"] },
  { id: "ESP-002", name: "উত্তর নোড B", zone: "Z-02", ip: "192.168.1.22", online: true, rssi: -68, battery: 78, firmware: "v2.6.1", lastSeen: "২ সেকেন্ড", sensors: ["Soil", "LDR", "Valve"] },
  { id: "ESP-003", name: "পূর্ব নোড", zone: "Z-03", ip: "192.168.1.23", online: true, rssi: -72, battery: 65, firmware: "v2.6.0", lastSeen: "৫ সেকেন্ড", sensors: ["Soil", "Water", "Valve"] },
  { id: "ESP-004", name: "কেন্দ্রীয় নোড", zone: "Z-04", ip: "192.168.1.24", online: false, rssi: -90, battery: 12, firmware: "v2.5.8", lastSeen: "১৫ মিনিট", sensors: ["Soil", "Rain", "Valve"] },
  { id: "ESP-005", name: "দক্ষিণ মাস্টার", zone: "Z-05", ip: "192.168.1.25", online: true, rssi: -61, battery: 88, firmware: "v2.6.1", lastSeen: "১ সেকেন্ড", sensors: ["Soil", "Water", "DHT22", "NPK", "Valve"] },
  { id: "ESP-006", name: "পাম্প কন্ট্রোলার", zone: "PUMP", ip: "192.168.1.10", online: true, rssi: -48, battery: 100, firmware: "v2.6.1", lastSeen: "এইমাত্র", sensors: ["Relay×4", "Voltage", "Current"] },
];

const FIRMWARE_SNIPPET = `// ১. এই ৩টি লাইন বদলান:
const char* WIFI_SSID = "আপনার_WIFI";
const char* WIFI_PASS = "আপনার_পাসওয়ার্ড";
const char* DEVICE_ID = "ESP-007";        // ← নতুন ID দিন
const char* ZONE_ID   = "Z-08";           // ← যে জোনে বসাবেন
const char* API_URL   = "https://project--583e7123-43a5-4b02-9812-0f73d31e5ee2.lovable.app/api/public/telemetry";

// ২. Arduino IDE → Board: ESP32 Dev Module → Upload
// ৩. Serial Monitor (115200 baud) — "Connected ✓" দেখলে এই page-এ auto add হবে`;

function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>(seed);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: "", name: "", zone: "" });

  const add = () => {
    if (!form.id || !form.name) { toast.error("ID ও নাম প্রয়োজন"); return; }
    setDevices(d => [...d, {
      id: form.id, name: form.name, zone: form.zone || "—",
      ip: `192.168.1.${20 + d.length}`, online: false, rssi: -100,
      battery: 100, firmware: "v2.6.1", lastSeen: "pending", sensors: ["Soil", "Valve"],
    }]);
    toast.success(`${form.id} pending registration — ESP32-এ firmware flash করুন`);
    setOpen(false); setForm({ id: "", name: "", zone: "" });
  };

  const remove = (id: string) => { setDevices(d => d.filter(x => x.id !== id)); toast.info(`${id} মুছে ফেলা হলো`); };

  const online = devices.filter(d => d.online).length;

  return (
    <DashboardLayout
      title="ডিভাইস · নেটওয়ার্ক"
      subtitle={`${online}/${devices.length} অনলাইন · ESP32 mesh`}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1"/>নতুন ডিভাইস</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>নতুন ESP32 ডিভাইস যোগ করুন</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Device ID</Label><Input value={form.id} onChange={e => setForm({...form, id: e.target.value})} placeholder="ESP-007"/></div>
              <div><Label>নাম</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="দক্ষিণ নোড C"/></div>
              <div><Label>জোন</Label><Input value={form.zone} onChange={e => setForm({...form, zone: e.target.value})} placeholder="Z-08"/></div>
            </div>
            <DialogFooter><Button onClick={add}>যোগ করুন</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {devices.map((d, i) => (
            <Card key={d.id} className="overflow-hidden animate-fade-in hover:shadow-lg transition-shadow" style={{ animationDelay: `${i * 50}ms` }}>
              <div className={`h-1 ${d.online ? "bg-gradient-to-r from-success to-chart-2" : "bg-destructive/60"}`}/>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-10 w-10 rounded-lg grid place-items-center ${d.online ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                      <Cpu className="h-5 w-5"/>
                    </div>
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{d.id}</p>
                      <p className="font-semibold text-sm leading-tight">{d.name}</p>
                    </div>
                  </div>
                  <Badge variant={d.online ? "default" : "destructive"} className="gap-1">
                    {d.online ? <Wifi className="h-3 w-3"/> : <WifiOff className="h-3 w-3"/>}
                    {d.online ? "Live" : "Offline"}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-muted-foreground">জোন</p><p className="font-semibold">{d.zone}</p></div>
                  <div><p className="text-muted-foreground flex items-center gap-1"><Signal className="h-3 w-3"/>RSSI</p><p className="font-semibold">{d.rssi}dBm</p></div>
                  <div><p className="text-muted-foreground flex items-center gap-1"><Battery className="h-3 w-3"/>ব্যাটারি</p><p className={`font-semibold ${d.battery < 20 ? "text-destructive" : ""}`}>{d.battery}%</p></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {d.sensors.map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                </div>
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{d.firmware} · {d.ip}</span>
                  <button onClick={() => remove(d.id)} className="text-destructive hover:underline"><Trash2 className="h-3 w-3"/></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="self-start sticky top-4">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4"/>নতুন device কীভাবে add করব?</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
              <li>ESP32 + sensor wire করুন (Pin map → Settings)</li>
              <li>Arduino IDE-তে firmware খুলুন (<code className="text-xs bg-muted px-1 rounded">device-firmware/esp32_bmda.ino</code>)</li>
              <li>নিচের ৩টি লাইন বদলান</li>
              <li>Board: <b>ESP32 Dev Module</b> → Upload</li>
              <li>উপরে "নতুন ডিভাইস" button → ID লিখুন</li>
              <li>Serial Monitor-এ "✓ Registered" দেখলে কাজ শেষ</li>
            </ol>
            <div className="relative">
              <pre className="text-[10px] bg-muted p-3 rounded-md overflow-x-auto leading-relaxed">{FIRMWARE_SNIPPET}</pre>
              <button onClick={() => { navigator.clipboard.writeText(FIRMWARE_SNIPPET); toast.success("কপি হয়েছে"); }}
                className="absolute top-2 right-2 p-1.5 rounded bg-background border hover:bg-accent">
                <Copy className="h-3 w-3"/>
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-success">
              <CheckCircle2 className="h-4 w-4"/> একসাথে ৫০+ ESP32 সমর্থিত
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
