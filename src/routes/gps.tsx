import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Crosshair, Layers, Locate, MapPin, Sprout, Gauge, Power, Trash2, Loader2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/gps")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "GPS মানচিত্র · জমি ও যন্ত্রপাতি Link Up · BMDA" },
      { name: "description", content: "OpenStreetMap-ভিত্তিক কৃষি GPS মানচিত্র — জমি, ভাল্ভ ও মোটর সরাসরি লিঙ্ক করুন।" },
    ],
  }),
  component: GpsPage,
});

type Kind = "field" | "valve" | "motor";
type Asset = { id: string; user_id: string; kind: Kind; label: string; lat: number; lng: number; notes: string | null };

const CENTER: [number, number] = [24.3745, 88.6042]; // Rajshahi / Barind

const KIND_META: Record<Kind, { label: string; color: string; ring: string; Icon: typeof MapPin }> = {
  field: { label: "জমি",   color: "#10b981", ring: "shadow-emerald-500/40", Icon: Sprout },
  valve: { label: "ভাল্ভ", color: "#0ea5e9", ring: "shadow-sky-500/40",     Icon: Gauge },
  motor: { label: "মোটর",  color: "#f97316", ring: "shadow-orange-500/40",  Icon: Power },
};

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

function GpsPage() {
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [layer, setLayer] = useState<"satellite" | "street" | "terrain">("satellite");
  const [pickKind, setPickKind] = useState<Kind>("field");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingAssets(true);
      const { data, error } = await supabase
        .from("gps_assets").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      else setAssets((data ?? []) as Asset[]);
      setLoadingAssets(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user || !pending || !label.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from("gps_assets").insert({
      user_id: user.id, kind: pickKind, label: label.trim(),
      lat: pending.lat, lng: pending.lng, notes: notes.trim() || null,
    }).select().single();
    setSaving(false);
    if (error) return toast.error(error.message);
    setAssets((p) => [data as Asset, ...p]);
    toast.success(`${KIND_META[pickKind].label} যুক্ত হয়েছে: ${label}`);
    setPending(null); setLabel(""); setNotes("");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("gps_assets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setAssets((p) => p.filter((a) => a.id !== id));
    toast.success("মুছে ফেলা হয়েছে");
  };

  const locate = () => {
    if (!navigator.geolocation) return toast.error("ব্রাউজার GPS সমর্থন করে না");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setFlyTo([pos.coords.latitude, pos.coords.longitude]); toast.success("আপনার অবস্থানে যাচ্ছি…"); },
      () => toast.error("অবস্থান পাওয়া যায়নি"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const counts = useMemo(() => ({
    field: assets.filter((a) => a.kind === "field").length,
    valve: assets.filter((a) => a.kind === "valve").length,
    motor: assets.filter((a) => a.kind === "motor").length,
  }), [assets]);

  return (
    <DashboardLayout
      title="কৃষি GPS · OpenStreetMap মানচিত্র"
      subtitle="মানচিত্রে ক্লিক করে আপনার জমি, ভাল্ভ ও মোটর সরাসরি লিঙ্ক করুন। সব ডেটা আপনার একাউন্টে নিরাপদে সংরক্ষিত।"
      actions={
        <div className="flex gap-2 flex-wrap">
          {(["satellite", "street", "terrain"] as const).map((l) => (
            <Button key={l} size="sm" variant={layer === l ? "default" : "outline"} onClick={() => setLayer(l)}>
              <Layers className="h-3 w-3 mr-1" />
              {l === "satellite" ? "স্যাটেলাইট" : l === "street" ? "রাস্তা" : "ভূ-ভাগ"}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={locate}><Locate className="h-3 w-3 mr-1" />আমার অবস্থান</Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden">
          <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-wrap border-b">
            <span className="text-xs font-bold text-muted-foreground">যোগ করুন:</span>
            {(Object.keys(KIND_META) as Kind[]).map((k) => {
              const m = KIND_META[k];
              const active = pickKind === k;
              return (
                <button key={k} onClick={() => setPickKind(k)}
                  className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-bold transition-all ring-1 ${
                    active ? "text-white shadow-md ring-white/30" : "text-foreground ring-border bg-background hover:bg-muted"}`}
                  style={active ? { background: m.color } : undefined}
                >
                  <m.Icon className="h-3.5 w-3.5" /> {m.label}
                </button>
              );
            })}
            <span className="ml-auto text-[11px] text-muted-foreground">
              মানচিত্রে ক্লিক করে নতুন <b className="text-foreground">{KIND_META[pickKind].label}</b> পিন বসান
            </span>
          </div>

          <div className="relative aspect-[16/10] bg-muted">
            {mounted && !authLoading ? (
              <LeafletMap
                layer={layer}
                assets={assets}
                onMapClick={(lat, lng) => { setPending({ lat, lng }); setLabel(""); setNotes(""); }}
                onSelect={setSelected}
                selected={selected}
                flyTo={flyTo}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> মানচিত্র লোড হচ্ছে…
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-3">
          {pending ? (
            <Card className="border-2 border-primary/40 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="grid place-items-center h-7 w-7 rounded-lg text-white shadow"
                        style={{ background: KIND_META[pickKind].color }}>
                    {(() => { const I = KIND_META[pickKind].Icon; return <I className="h-3.5 w-3.5" />; })()}
                  </span>
                  নতুন {KIND_META[pickKind].label} যুক্ত করুন
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <p className="text-[11px] font-mono text-muted-foreground">
                  📍 {pending.lat.toFixed(6)}, {pending.lng.toFixed(6)}
                </p>
                <Input placeholder="নাম (যেমন: উত্তর জমি)" value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
                <Textarea placeholder="নোট (ঐচ্ছিক)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" disabled={!label.trim() || saving} onClick={handleSave}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                    সংরক্ষণ
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPending(null)}><X className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                মানচিত্রের যেকোনো স্থানে <b className="mx-1 text-foreground">click</b> করে নতুন
                <b className="mx-1 text-foreground">{KIND_META[pickKind].label}</b> পিন যোগ করুন। উপরের চিপ থেকে ধরন পরিবর্তন করতে পারেন।
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>আপনার সম্পদ তালিকা</span>
                <Badge variant="secondary" className="text-[10px]">{bn(assets.length)} টি</Badge>
              </CardTitle>
              <div className="flex gap-1.5 text-[10px] mt-1">
                {(Object.keys(KIND_META) as Kind[]).map((k) => (
                  <span key={k} className="px-2 py-0.5 rounded-full text-white font-bold" style={{ background: KIND_META[k].color }}>
                    {KIND_META[k].label} {bn(counts[k])}
                  </span>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-2 space-y-1.5 max-h-96 overflow-y-auto">
              {loadingAssets ? (
                <div className="text-center py-6 text-muted-foreground text-xs"><Loader2 className="h-4 w-4 animate-spin inline mr-1" />লোড হচ্ছে…</div>
              ) : assets.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-6">এখনো কোনো সম্পদ যুক্ত করা হয়নি</p>
              ) : assets.map((a) => {
                const m = KIND_META[a.kind];
                const Icon = m.Icon;
                return (
                  <div key={a.id}
                    className={`group rounded-lg p-2 border transition-colors ${selected === a.id ? "border-primary/50 bg-primary/5" : "border-transparent hover:bg-muted"}`}>
                    <div className="flex items-start gap-2">
                      <span className="grid place-items-center h-7 w-7 rounded-lg text-white shrink-0 shadow" style={{ background: m.color }}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <button onClick={() => { setSelected(a.id); setFlyTo([a.lat, a.lng]); }} className="flex-1 text-left min-w-0">
                        <p className="text-sm font-bold truncate">{a.label}</p>
                        <p className="text-[10px] font-mono text-muted-foreground truncate">{a.lat.toFixed(5)}, {a.lng.toFixed(5)}</p>
                        {a.notes && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{a.notes}</p>}
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-destructive/15 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-success font-semibold"><Crosshair className="h-3.5 w-3.5" />GPS Lock · {bn(9)} স্যাটেলাইট</div>
              <div className="text-muted-foreground">নির্ভুলতা: ±{bn("2.4")} মিটার</div>
              <div className="text-muted-foreground">Tile: OpenStreetMap (open source · কৃষি-উপযোগী)</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ────────────────────────── Leaflet (client-only) ────────────────────────── */

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

const TILES = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: 'Imagery © <a href="https://www.esri.com">Esri</a>',
  },
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attr: 'Map data: © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
  },
};

function makeIcon(kind: Kind) {
  const m = KIND_META[kind];
  return L.divIcon({
    className: "",
    html: `<div style="
      width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      background:${m.color};display:grid;place-items:center;
      box-shadow:0 6px 14px ${m.color}66, 0 2px 4px rgba(0,0,0,0.25);
      border:2.5px solid #fff;
    "><div style="transform:rotate(45deg);color:#fff;font-weight:800;font-size:13px;line-height:1">${
      kind === "field" ? "🌾" : kind === "valve" ? "💧" : "⚡"
    }</div></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
    popupAnchor: [0, -30],
  });
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function FlyTo({ to }: { to: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (to) map.flyTo(to, Math.max(map.getZoom(), 15), { duration: 1.2 }); }, [to, map]);
  return null;
}

function LeafletMap({
  layer, assets, onMapClick, onSelect, selected, flyTo,
}: {
  layer: "satellite" | "street" | "terrain";
  assets: Asset[];
  onMapClick: (lat: number, lng: number) => void;
  onSelect: (id: string) => void;
  selected: string | null;
  flyTo: [number, number] | null;
}) {
  const t = TILES[layer];
  return (
    <MapContainer center={CENTER} zoom={14} className="absolute inset-0 w-full h-full" scrollWheelZoom>
      <TileLayer key={layer} url={t.url} attribution={t.attr} maxZoom={19} />
      <ClickHandler onClick={onMapClick} />
      <FlyTo to={flyTo} />
      {assets.map((a) => (
        <Marker key={a.id} position={[a.lat, a.lng]} icon={makeIcon(a.kind)}
                eventHandlers={{ click: () => onSelect(a.id) }}>
          <Popup>
            <div className="text-xs">
              <p className="font-bold text-sm" style={{ color: KIND_META[a.kind].color }}>
                {KIND_META[a.kind].label} · {a.label}
              </p>
              <p className="font-mono text-[10px] opacity-70">{a.lat.toFixed(6)}, {a.lng.toFixed(6)}</p>
              {a.notes && <p className="mt-1">{a.notes}</p>}
              {selected === a.id && <p className="mt-1 text-[10px] opacity-60">✓ নির্বাচিত</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
