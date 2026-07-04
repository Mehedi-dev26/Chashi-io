import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell, Wifi, Search, ChevronRight, Thermometer, Droplets,
  Cpu, MapPin, Sparkles, Command, X, AlertCircle, AlertTriangle, CheckCircle2, Info,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRouterState, Link, useNavigate } from "@tanstack/react-router";
import { useIrrigationData, PUMP_SPEC } from "@/hooks/useIrrigationData";
import { useAuth } from "@/hooks/useAuth";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const ROUTE_LABEL: Record<string, string> = {
  "/app": "ড্যাশবোর্ড",
  "/map": "জমির মানচিত্র",
  "/gps": "GPS স্যাটেলাইট",
  "/zones": "সেচ জোন",
  "/motor": "মোটর নিয়ন্ত্রণ",
  "/devices": "ডিভাইস নেটওয়ার্ক",
  "/hardware": "হার্ডওয়্যার গাইড",
  "/ai": "AI পরামর্শ",
  "/forecast": "ML পূর্বাভাস",
  "/satellite": "NDVI স্যাটেলাইট",
  "/history": "ঐতিহাসিক তথ্য",
  "/analytics": "পরিসংখ্যান",
  "/billing": "বিলিং",
  "/alerts": "বিজ্ঞপ্তি",
  "/settings": "সেটিংস",
};

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const pick = (w: string) => w.match(/[\p{L}]/u)?.[0] ?? "";
  return (pick(parts[0]) + (parts.length > 1 ? pick(parts[parts.length - 1]) : "")).toUpperCase() || "?";
};

const activityIcon: Record<string, { Icon: typeof AlertCircle; tone: string }> = {
  alert:   { Icon: AlertCircle,     tone: "text-rose-500 bg-rose-500/10" },
  warning: { Icon: AlertTriangle,   tone: "text-amber-500 bg-amber-500/10" },
  success: { Icon: CheckCircle2,    tone: "text-emerald-500 bg-emerald-500/10" },
  info:    { Icon: Info,            tone: "text-sky-500 bg-sky-500/10" },
};

export function TopBar() {
  const [now, setNow] = useState<{ date: string; time: string }>({ date: "", time: "" });
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { weather, zones, activity } = useIrrigationData();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const bellWrapRef = useRef<HTMLDivElement>(null);

  // Live clock — per second
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setNow({
        date: new Intl.DateTimeFormat("bn-BD", { weekday: "short", day: "2-digit", month: "long" }).format(d),
        time: new Intl.DateTimeFormat("bn-BD", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(d),
      });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  // Close popovers on outside click / esc
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (bellWrapRef.current && !bellWrapRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setSearchOpen(false); setBellOpen(false); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, []);

  // Cmd/Ctrl+K focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = searchWrapRef.current?.querySelector("input");
        (el as HTMLInputElement | null)?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const label = ROUTE_LABEL[path] ?? "পাতা";

  // Real device counts
  const now_ = Date.now();
  const hwZones = zones.filter((z) => z.hasNode);
  const onlineNodes = hwZones.filter((z) => z.lastSeen && now_ - z.lastSeen < PUMP_SPEC.heartbeatMs).length;

  // Search results — zones + routes
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return { zones: [], routes: [] as { url: string; title: string }[] };
    const rZones = zones.filter((z) =>
      z.id.toLowerCase().includes(term) ||
      z.nameBn.toLowerCase().includes(term) ||
      z.name.toLowerCase().includes(term) ||
      z.cropType.toLowerCase().includes(term) ||
      (z.valveNodeId ?? "").toLowerCase().includes(term)
    ).slice(0, 6);
    const rRoutes = Object.entries(ROUTE_LABEL)
      .filter(([url, title]) => url.slice(1).includes(term) || title.toLowerCase().includes(term))
      .slice(0, 5)
      .map(([url, title]) => ({ url, title }));
    return { zones: rZones, routes: rRoutes };
  }, [q, zones]);

  const totalResults = results.zones.length + results.routes.length;
  const unread = activity.filter((a) => a.type === "alert" || a.type === "warning").length;

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "অতিথি";
  const roleText = profile?.display_name ? "অপারেটর · L2" : (user ? "সংযুক্ত ব্যবহারকারী" : "লগইন করুন");

  return (
    <header className="sticky top-0 z-30 backdrop-blur-2xl bg-background/60 border-b border-border/60 shadow-[0_1px_0_0_rgba(255,255,255,0.5)_inset]">
      <div className="px-4 sm:px-6 py-2.5 flex items-center gap-3">
        <SidebarTrigger className="h-9 w-9 rounded-lg hover:bg-secondary/80 transition" />

        {/* Breadcrumb */}
        <nav className="hidden sm:flex items-center gap-1.5 text-sm min-w-0">
          <Link to="/app" className="hover:opacity-80 transition text-base tracking-tight"><span className="brand-chashi">Chashi</span><span className="brand-chashi-dot">.</span><span className="brand-chashi">io</span></Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
          <span className="font-semibold text-foreground truncate">{label}</span>
        </nav>

        {/* Search */}
        <div ref={searchWrapRef} className="hidden md:block relative ml-2">
          <div
            className={`flex items-center gap-2 px-3 h-9 rounded-xl bg-secondary/50 border transition w-[300px] ${
              searchOpen ? "border-primary/50 ring-2 ring-primary/20" : "border-border/70 hover:border-primary/30"
            }`}
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="জোন, নোড, ফসল বা পাতা খুঁজুন..."
              className="bg-transparent text-sm flex-1 outline-none placeholder:text-muted-foreground/70"
            />
            {q && (
              <button onClick={() => { setQ(""); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <kbd className="text-[10px] font-mono text-muted-foreground bg-background/90 border border-border px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </div>

          {searchOpen && q.trim() && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-xl glass-card border border-border/70 shadow-2xl overflow-hidden z-50">
              {totalResults === 0 ? (
                <div className="p-6 text-center">
                  <Search className="h-6 w-6 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">"{q}" এর জন্য কিছু পাওয়া যায়নি</p>
                </div>
              ) : (
                <div className="max-h-[380px] overflow-y-auto">
                  {results.zones.length > 0 && (
                    <div className="p-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">জোন ও সাব-নোড</p>
                      {results.zones.map((z) => {
                        const isOnline = z.lastSeen && now_ - z.lastSeen < PUMP_SPEC.heartbeatMs;
                        return (
                          <button
                            key={z.id}
                            onClick={() => { setSearchOpen(false); setQ(""); navigate({ to: "/zones" }); }}
                            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-secondary/60 transition text-left group"
                          >
                            <span className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${z.hasNode && isOnline ? "bg-emerald-500/15 text-emerald-600" : z.hasNode ? "bg-rose-500/15 text-rose-600" : "bg-muted text-muted-foreground"}`}>
                              <MapPin className="h-4 w-4" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{z.nameBn} <span className="font-mono text-[10px] text-muted-foreground">· {z.id}</span></p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {z.cropType} · SM {bn(z.soilMoisture.toFixed(0))}%
                                {z.hasNode ? ` · ${z.valveNodeId}` : " · নো নোড"}
                              </p>
                            </div>
                            {z.hasNode && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isOnline ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}>
                                {isOnline ? "LIVE" : "OFF"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {results.routes.length > 0 && (
                    <div className="p-2 border-t border-border/60">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">পাতা</p>
                      {results.routes.map((r) => (
                        <button
                          key={r.url}
                          onClick={() => { setSearchOpen(false); setQ(""); navigate({ to: r.url as "/app" }); }}
                          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-secondary/60 transition text-left"
                        >
                          <span className="h-8 w-8 rounded-lg grid place-items-center shrink-0 bg-primary/15 text-primary">
                            <Sparkles className="h-4 w-4" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{r.title}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">{r.url}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          {/* DHT11 — তাপমাত্রা ও আর্দ্রতা */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 h-8 rounded-full bg-gradient-to-r from-orange-500/10 to-sky-500/10 border border-orange-500/25" title="নোড ১ · DHT11 সেন্সর">
            <Thermometer className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">
              {weather.temperature != null ? `${bn(weather.temperature.toFixed(1))}°C` : "—"}
            </span>
            <span className="opacity-40">·</span>
            <Droplets className="h-3 w-3 text-sky-500" />
            <span className="text-[10px] text-sky-700 dark:text-sky-300 font-semibold">
              {weather.humidity != null ? `${bn(weather.humidity.toFixed(0))}%` : "—"}
            </span>
          </div>

          {/* LIVE clock — full gradient pill with real-time seconds */}
          <div className="hidden lg:flex items-center gap-2 pl-1 pr-3 h-8 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/30 ring-1 ring-white/30 text-white">
            <span className="relative flex h-6 w-6 rounded-full bg-white/25 grid place-items-center">
              <span className="absolute inset-0 rounded-full bg-white/40 animate-ping opacity-70" />
              <span className="relative h-2 w-2 rounded-full bg-white" />
            </span>
            <span className="text-[10px] font-black tracking-wider drop-shadow">LIVE</span>
            <span className="opacity-40">·</span>
            <span className="text-[11px] font-bold tabular-nums drop-shadow" suppressHydrationWarning>{now.time}</span>
            <span className="hidden 2xl:inline text-[10px] font-medium opacity-90" suppressHydrationWarning>· {now.date}</span>
          </div>

          {/* Real devices count — click → /devices */}
          <Link
            to="/devices"
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 hover:border-emerald-500/60 transition"
            title={`${onlineNodes}/${hwZones.length} সাব-নোড অনলাইন`}
          >
            <Wifi className={`h-3.5 w-3.5 ${onlineNodes > 0 ? "text-emerald-600" : "text-muted-foreground"}`} />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {bn(onlineNodes)}<span className="opacity-60">/{bn(hwZones.length)}</span>
            </span>
            <span className="hidden sm:inline text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-semibold">ডিভাইস</span>
          </Link>

          {/* Notifications */}
          <div ref={bellWrapRef} className="relative">
            <button
              onClick={() => setBellOpen((v) => !v)}
              className="relative h-9 w-9 grid place-items-center rounded-xl border border-border bg-background/60 hover:bg-secondary transition"
              title="বিজ্ঞপ্তি"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white text-[9px] font-black grid place-items-center ring-2 ring-background shadow">
                  {bn(Math.min(unread, 9))}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-[340px] rounded-xl glass-card border border-border/70 shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-border/60 bg-gradient-to-r from-rose-500/10 to-orange-500/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold flex items-center gap-1.5"><Bell className="h-3.5 w-3.5" /> লেটেস্ট বিজ্ঞপ্তি</p>
                    <p className="text-[10px] text-muted-foreground">রিয়েল-টাইম সিস্টেম ইভেন্ট</p>
                  </div>
                  <Link
                    to="/alerts"
                    onClick={() => setBellOpen(false)}
                    className="text-[10px] font-bold px-2 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90"
                  >
                    সব দেখুন →
                  </Link>
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  {activity.length === 0 || (activity.length === 1 && activity[0].id === "init") ? (
                    <div className="p-6 text-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500/60 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">কোনো নতুন বিজ্ঞপ্তি নেই</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {activity.slice(0, 8).map((a) => {
                        const style = activityIcon[a.type] ?? activityIcon.info;
                        const Icon = style.Icon;
                        return (
                          <Link
                            key={a.id}
                            to="/alerts"
                            onClick={() => setBellOpen(false)}
                            className="flex items-start gap-2.5 p-3 hover:bg-secondary/50 transition"
                          >
                            <span className={`h-7 w-7 rounded-lg grid place-items-center shrink-0 ${style.tone}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold leading-snug line-clamp-2">{a.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{a.time}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Operator — real profile */}
          <Link
            to="/settings"
            className="flex items-center gap-2 pl-2 ml-1 border-l border-border hover:opacity-90 transition"
            title="সেটিংস-এ যান"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary via-chart-2 to-chart-5 grid place-items-center text-primary-foreground text-xs font-bold shadow-lg ring-2 ring-background overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                initials(displayName)
              )}
            </div>
            <div className="hidden xl:block leading-tight max-w-[140px]">
              <p className="text-xs font-bold truncate">{displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{roleText}</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
