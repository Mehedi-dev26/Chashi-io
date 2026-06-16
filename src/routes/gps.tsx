import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Crosshair, Layers, Locate, MapPin, Sprout, Gauge, Power, Trash2, Loader2, Save, X, Search, Eye, EyeOff, Globe, Spline, Undo2, CheckCircle2, MousePointer2 } from "lucide-react";
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
type FilterKind = Kind | "all";
type Pipeline = { id: string; user_id: string; label: string; color: string; points: [number, number][]; notes: string | null };

const PIPELINE_COLORS = ["#0ea5e9", "#f97316", "#10b981", "#a855f7", "#ef4444", "#eab308"];

const CENTER: [number, number] = [24.3745, 88.6042];

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
  const [visibleKind, setVisibleKind] = useState<FilterKind>("all");
  const [showLabels, setShowLabels] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);

  // Geocoder search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);

  // Pipelines
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [drawMode, setDrawMode] = useState(false);
  const [drawPts, setDrawPts] = useState<[number, number][]>([]);
  const [drawLabel, setDrawLabel] = useState("");
  const [drawColor, setDrawColor] = useState(PIPELINE_COLORS[0]);
  const [savingPipe, setSavingPipe] = useState(false);

  const pipelineAssets = useMemo(() => assets.filter((a) => a.kind === "motor" || a.kind === "valve"), [assets]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingAssets(true);
      const [aRes, pRes] = await Promise.all([
        supabase.from("gps_assets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("gps_pipelines").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (aRes.error) toast.error(aRes.error.message);
      else {
        const list = (aRes.data ?? []) as Asset[];
        setAssets(list);
        const motor = list.find((a) => a.kind === "motor");
        if (motor) setFlyTo([motor.lat, motor.lng]);
      }
      if (pRes.error) toast.error(pRes.error.message);
      else setPipelines(((pRes.data ?? []) as any[]).map((p) => ({ ...p, points: p.points as [number, number][] })));
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

  // Map click — routes to either pipeline draw or asset pending
  const handleMapClick = (lat: number, lng: number) => {
    if (drawMode) {
      if (drawPts.length === 0) {
        toast.error("প্রথমে একটি মোটর নির্বাচন করুন");
        return;
      }
      setDrawPts((p) => [...p, [lat, lng]]);
    } else {
      setPending({ lat, lng }); setLabel(""); setNotes("");
    }
  };

  const addPipelineAssetPoint = (asset: Asset) => {
    if (!drawMode) {
      setSelected(asset.id);
      setFlyTo([asset.lat, asset.lng]);
      return;
    }
    if (drawPts.length === 0 && asset.kind !== "motor") {
      toast.error("পাইপলাইন মোটর থেকে শুরু করুন");
      return;
    }
    if (drawPts.length > 0 && asset.kind !== "valve") {
      toast.error("মোটরের পরে ভাল্ভ নির্বাচন করুন");
      return;
    }
    const alreadyPicked = drawPts.some(([lat, lng]) => Math.abs(lat - asset.lat) < 0.000001 && Math.abs(lng - asset.lng) < 0.000001);
    if (alreadyPicked) {
      toast.error("এই পয়েন্টটি ইতিমধ্যে যুক্ত আছে");
      return;
    }
    setSelected(asset.id);
    setDrawPts((p) => [...p, [asset.lat, asset.lng]]);
    toast.success(`${KIND_META[asset.kind].label} যুক্ত হয়েছে: ${asset.label}`);
  };

  const savePipeline = async () => {
    if (!user || drawPts.length < 2 || !drawLabel.trim()) return;
    setSavingPipe(true);
    const { data, error } = await supabase.from("gps_pipelines").insert({
      user_id: user.id, label: drawLabel.trim(), color: drawColor,
      points: drawPts as any, notes: null,
    }).select().single();
    setSavingPipe(false);
    if (error) return toast.error(error.message);
    setPipelines((p) => [{ ...(data as any), points: (data as any).points as [number, number][] }, ...p]);
    toast.success(`পাইপলাইন সংরক্ষিত: ${drawLabel}`);
    setDrawPts([]); setDrawLabel(""); setDrawMode(false);
  };

  const deletePipeline = async (id: string) => {
    const { error } = await supabase.from("gps_pipelines").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPipelines((p) => p.filter((x) => x.id !== id));
    toast.success("পাইপলাইন মুছে ফেলা হয়েছে");
  };

  const locate = () => {
    if (!navigator.geolocation) return toast.error("ব্রাউজার GPS সমর্থন করে না");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setFlyTo([pos.coords.latitude, pos.coords.longitude]); toast.success("আপনার অবস্থানে যাচ্ছি…"); },
      () => toast.error("অবস্থান পাওয়া যায়নি"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setSearchBusy(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`,
        { headers: { "Accept-Language": "bn,en" } },
      );
      const j = await r.json();
      setSearchResults(j);
      if (!j.length) toast.error("কোনো ফলাফল পাওয়া যায়নি");
    } catch {
      toast.error("সার্চ ব্যর্থ হয়েছে");
    } finally {
      setSearchBusy(false);
    }
  };

  const counts = useMemo(() => ({
    field: assets.filter((a) => a.kind === "field").length,
    valve: assets.filter((a) => a.kind === "valve").length,
    motor: assets.filter((a) => a.kind === "motor").length,
  }), [assets]);

  const shownAssets = useMemo(
    () => visibleKind === "all" ? assets : assets.filter((a) => a.kind === visibleKind),
    [assets, visibleKind],
  );

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
          {/* Toolbar */}
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

            <span className="w-px h-6 bg-border mx-1" />
            <span className="text-xs font-bold text-muted-foreground">দেখান:</span>
            {(["all", "field", "valve", "motor"] as FilterKind[]).map((k) => {
              const active = visibleKind === k;
              const m = k === "all" ? null : KIND_META[k];
              const activeBg = m
                ? m.color
                : `linear-gradient(90deg, ${KIND_META.field.color} 0%, ${KIND_META.valve.color} 50%, ${KIND_META.motor.color} 100%)`;
              return (
                <button key={k} onClick={() => setVisibleKind(k)}
                  className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-bold transition-all ring-1 ${
                    active ? "text-white shadow-md ring-white/30" : "text-foreground ring-border bg-background hover:bg-muted"}`}
                  style={active ? { background: activeBg } : undefined}
                >
                  {m ? <m.Icon className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
                  {k === "all" ? `সব (${bn(assets.length)})` : `${m!.label} ${bn(counts[k as Kind])}`}
                </button>
              );
            })}

            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8" onClick={() => setShowLabels((v) => !v)}>
                {showLabels ? <Eye className="h-3.5 w-3.5 mr-1" /> : <EyeOff className="h-3.5 w-3.5 mr-1" />}
                নাম
              </Button>
              <Button size="sm" variant={searchOpen ? "default" : "outline"} className="h-8"
                onClick={() => setSearchOpen((v) => !v)}>
                <Search className="h-3.5 w-3.5 mr-1" />জায়গা খুঁজুন
              </Button>
            </div>
          </div>

          {/* Search panel */}
          {searchOpen && (
            <div className="px-4 py-3 border-b bg-muted/30 space-y-2">
              <form onSubmit={(e) => { e.preventDefault(); runSearch(searchQ); }} className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="শহর, গ্রাম, ঠিকানা বা স্থান লিখুন (যেমন: রাজশাহী, বরেন্দ্র)"
                    className="pl-8 h-9" autoFocus />
                </div>
                <Button type="submit" size="sm" className="h-9" disabled={searchBusy || !searchQ.trim()}>
                  {searchBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                </Button>
                <Button type="button" size="sm" variant="ghost" className="h-9"
                  onClick={() => { setSearchOpen(false); setSearchResults([]); setSearchQ(""); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </form>
              {searchResults.length > 0 && (
                <div className="rounded-lg border bg-background max-h-56 overflow-y-auto divide-y">
                  {searchResults.map((r, i) => (
                    <button key={i} className="w-full text-left px-3 py-2 hover:bg-muted text-xs flex items-start gap-2"
                      onClick={() => {
                        setFlyTo([parseFloat(r.lat), parseFloat(r.lon)]);
                        toast.success("মানচিত্র সরানো হচ্ছে…");
                      }}>
                      <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                      <span className="flex-1">{r.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="relative aspect-[16/10] bg-muted">
            {mounted && !authLoading ? (
              <LeafletMap
                layer={layer}
                assets={shownAssets}
                showLabels={showLabels}
                onMapClick={handleMapClick}
                onSelect={drawMode ? addPipelineAssetPoint : (asset) => setSelected(asset.id)}
                selected={selected}
                flyTo={flyTo}
                pipelines={pipelines}
                drawPts={drawPts}
                drawColor={drawColor}
                drawMode={drawMode}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> মানচিত্র লোড হচ্ছে…
              </div>
            )}
            {drawMode && (
              <div className="absolute top-2 left-2 right-2 z-[400] rounded-lg px-3 py-2 bg-foreground/90 text-background text-xs font-semibold flex items-center gap-2 shadow-lg">
                <Spline className="h-3.5 w-3.5" />
                পাইপলাইন আঁকার মোড — মানচিত্রে ক্লিক করে পয়েন্ট যোগ করুন ({bn(drawPts.length)} টি)
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

                <div>
                  <p className="text-[11px] font-bold text-muted-foreground mb-1.5">ধরন নির্বাচন করুন</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(Object.keys(KIND_META) as Kind[]).map((k) => {
                      const m = KIND_META[k];
                      const active = pickKind === k;
                      return (
                        <button key={k} type="button" onClick={() => setPickKind(k)}
                          className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[11px] font-bold transition-all ring-2 ${
                            active ? "text-white shadow-md ring-white/40" : "text-foreground ring-border bg-background hover:bg-muted"}`}
                          style={active ? { background: m.color } : undefined}
                        >
                          <m.Icon className="h-4 w-4" /> {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

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
                মানচিত্রের যেকোনো স্থানে <b className="mx-1 text-foreground">click</b> করে নতুন পিন যোগ করুন। ফর্মেই ধরন (জমি/ভাল্ভ/মোটর) বদলানো যাবে।
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

          {/* Pipelines */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Spline className="h-4 w-4" style={{ color: drawColor }} /> পাইপলাইন
                </span>
                <Badge variant="secondary" className="text-[10px]">{bn(pipelines.length)} টি</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              {!drawMode ? (
                <Button size="sm" className="w-full h-8 text-xs"
                  onClick={() => { setDrawMode(true); setDrawPts([]); setPending(null); }}>
                  <Spline className="h-3.5 w-3.5 mr-1" /> মোটর থেকে পাইপলাইন যুক্ত করুন
                </Button>
              ) : (
                <div className="rounded-lg border-2 p-2 space-y-2" style={{ borderColor: drawColor + "55" }}>
                  <div className="rounded-md bg-muted/60 px-2 py-1.5 text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <MousePointer2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{drawPts.length === 0 ? "প্রথমে নিচের তালিকা থেকে মোটর নির্বাচন করুন, এরপর এক বা একাধিক ভাল্ভ নির্বাচন করুন।" : "এখন ভাল্ভ নির্বাচন করুন; প্রয়োজনে মানচিত্রে ক্লিক করে মাঝের বাঁক-পয়েন্ট যোগ করা যাবে।"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PIPELINE_COLORS.map((c) => (
                      <button key={c} onClick={() => setDrawColor(c)}
                        className={`h-6 w-6 rounded-full transition ring-2 ${drawColor === c ? "ring-foreground scale-110" : "ring-transparent"}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                  <Input value={drawLabel} onChange={(e) => setDrawLabel(e.target.value)}
                    placeholder="পাইপলাইনের নাম" className="h-8 text-xs" />
                  <div className="grid grid-cols-2 gap-1 max-h-28 overflow-y-auto rounded-md border bg-background p-1">
                    {pipelineAssets.length === 0 ? (
                      <p className="col-span-2 px-2 py-3 text-center text-[11px] text-muted-foreground">প্রথমে মোটর ও ভাল্ভ যুক্ত করুন</p>
                    ) : pipelineAssets.map((a) => {
                      const m = KIND_META[a.kind];
                      const isSelectedPoint = drawPts.some(([lat, lng]) => Math.abs(lat - a.lat) < 0.000001 && Math.abs(lng - a.lng) < 0.000001);
                      const disabled = (drawPts.length === 0 && a.kind !== "motor") || (drawPts.length > 0 && a.kind !== "valve") || isSelectedPoint;
                      return (
                        <button key={a.id} type="button" disabled={disabled} onClick={() => addPipelineAssetPoint(a)}
                          className="min-w-0 rounded-md border px-2 py-1.5 text-left text-[11px] transition hover:bg-muted disabled:opacity-45 disabled:hover:bg-transparent"
                          style={isSelectedPoint ? { borderColor: m.color, background: `${m.color}14` } : undefined}>
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: m.color }} />
                            <span className="font-bold truncate">{a.label}</span>
                          </span>
                          <span className="block text-[10px] text-muted-foreground">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>পয়েন্ট: {bn(drawPts.length)}</span>
                    <button onClick={() => setDrawPts((p) => p.slice(0, -1))}
                      disabled={drawPts.length === 0}
                      className="flex items-center gap-1 hover:text-foreground disabled:opacity-30">
                      <Undo2 className="h-3 w-3" /> পূর্বাবস্থা
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" className="flex-1 h-7 text-[11px]"
                      disabled={drawPts.length < 2 || !drawLabel.trim() || savingPipe}
                      onClick={savePipeline}>
                      {savingPipe ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                      সংরক্ষণ
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-[11px]"
                      onClick={() => { setDrawMode(false); setDrawPts([]); setDrawLabel(""); }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {pipelines.length === 0 ? (
                  <p className="text-center text-[11px] text-muted-foreground py-3">
                    এখনো কোনো পাইপলাইন আঁকা হয়নি
                  </p>
                ) : pipelines.map((p) => (
                  <div key={p.id} className="group flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ background: p.color, boxShadow: `0 0 0 2px ${p.color}33` }} />
                    <button onClick={() => p.points[0] && setFlyTo(p.points[0])} className="flex-1 text-left min-w-0">
                      <p className="text-xs font-semibold truncate">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground">{bn(p.points.length)} পয়েন্ট</p>
                    </button>
                    <button onClick={() => deletePipeline(p.id)}
                      className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-destructive/15 text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
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
import { MapContainer, Marker, Polyline, Popup, CircleMarker, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";

const TILES = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: 'Imagery © <a href="https://www.esri.com">Esri</a>',
    maxNativeZoom: 17,
  },
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxNativeZoom: 19,
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attr: 'Map data: © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxNativeZoom: 17,
  },
};

// Place-name overlay for satellite view (roads, labels, boundaries)
const SATELLITE_LABELS = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  attr: "Labels © Esri",
};
const SATELLITE_ROADS = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
  attr: "Transportation © Esri",
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
  useEffect(() => { if (to) map.flyTo(to, Math.max(map.getZoom(), 18), { duration: 1.2 }); }, [to, map]);
  return null;
}

function LeafletMap({
  layer, assets, showLabels, onMapClick, onSelect, selected, flyTo,
  pipelines, drawPts, drawColor, drawMode,
}: {
  layer: "satellite" | "street" | "terrain";
  assets: Asset[];
  showLabels: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onSelect: (asset: Asset) => void;
  selected: string | null;
  flyTo: [number, number] | null;
  pipelines: Pipeline[];
  drawPts: [number, number][];
  drawColor: string;
  drawMode: boolean;
}) {
  const t = TILES[layer];
  return (
    <MapContainer center={CENTER} zoom={14} maxZoom={22} className="absolute inset-0 w-full h-full" scrollWheelZoom>
      <TileLayer key={layer} url={t.url} attribution={t.attr} maxNativeZoom={t.maxNativeZoom} maxZoom={22} />
      {layer === "satellite" && (
        <>
          <TileLayer url={SATELLITE_ROADS.url} attribution={SATELLITE_ROADS.attr} maxNativeZoom={17} maxZoom={22} />
          <TileLayer url={SATELLITE_LABELS.url} attribution={SATELLITE_LABELS.attr} maxNativeZoom={17} maxZoom={22} />
        </>
      )}
      <ClickHandler onClick={onMapClick} />
      <FlyTo to={flyTo} />

      {/* Saved pipelines */}
      {pipelines.map((p) => (
        <Polyline key={p.id} positions={p.points} pathOptions={{ color: p.color, weight: 4, opacity: 0.85 }}>
          <Tooltip permanent direction="center" className="!bg-transparent !border-0 !shadow-none !p-0">
            <span style={{
              background: "rgba(255,255,255,0.94)",
              border: `2px solid ${p.color}`,
              color: "#111827",
              borderRadius: 999,
              boxShadow: "0 4px 12px rgba(0,0,0,0.28)",
              fontSize: 11,
              fontWeight: 800,
              padding: "2px 8px",
              whiteSpace: "nowrap",
            }}>{p.label}</span>
          </Tooltip>
        </Polyline>
      ))}

      {/* Live drawing line */}
      {drawMode && drawPts.length > 0 && (
        <>
          <Polyline positions={drawPts} pathOptions={{ color: drawColor, weight: 4, opacity: 0.9, dashArray: "6 6" }} />
          {drawPts.map((pt, i) => (
            <CircleMarker key={i} center={pt} radius={5}
              pathOptions={{ color: "#fff", weight: 2, fillColor: drawColor, fillOpacity: 1 }} />
          ))}
        </>
      )}

      {assets.map((a) => {
        const m = KIND_META[a.kind];
        return (
          <Marker key={a.id} position={[a.lat, a.lng]} icon={makeIcon(a.kind)}
                  eventHandlers={{ click: (e) => { e.originalEvent.stopPropagation(); onSelect(a); } }}>
            {showLabels && (
              <Tooltip
                permanent
                direction="top"
                offset={[0, -32]}
                className="!bg-transparent !border-0 !shadow-none !p-0"
              >
                <span
                  style={{
                    background: m.color,
                    color: "#fff",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.45), 0 0 0 2px rgba(255,255,255,0.9)",
                    whiteSpace: "nowrap",
                    fontFamily: "inherit",
                  }}
                >
                  {a.label}
                </span>
              </Tooltip>
            )}
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-sm" style={{ color: m.color }}>
                  {m.label} · {a.label}
                </p>
                <p className="font-mono text-[10px] opacity-70">{a.lat.toFixed(6)}, {a.lng.toFixed(6)}</p>
                {a.notes && <p className="mt-1">{a.notes}</p>}
                {selected === a.id && <p className="mt-1 text-[10px] opacity-60">✓ নির্বাচিত</p>}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
