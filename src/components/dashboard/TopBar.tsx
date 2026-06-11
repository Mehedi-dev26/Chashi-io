import { useEffect, useState } from "react";
import { Activity, Bell, Wifi, Search, ChevronRight, Sun, CloudRain } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRouterState, Link } from "@tanstack/react-router";

const bnDigits = (s: string) => s.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const ROUTE_LABEL: Record<string, string> = {
  "/": "ড্যাশবোর্ড",
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

export function TopBar() {
  const [now, setNow] = useState<string>("");
  const path = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    const update = () => {
      const formatted = new Intl.DateTimeFormat("bn-BD", {
        weekday: "short", day: "2-digit", month: "long",
        hour: "2-digit", minute: "2-digit",
      }).format(new Date());
      setNow(formatted);
    };
    update();
    const t = setInterval(update, 30_000);
    return () => clearInterval(t);
  }, []);

  const label = ROUTE_LABEL[path] ?? "পাতা";

  return (
    <header className="sticky top-0 z-30 backdrop-blur-2xl bg-background/60 border-b border-border/60 shadow-[0_1px_0_0_rgba(255,255,255,0.5)_inset]">
      <div className="px-4 sm:px-6 py-2.5 flex items-center gap-3">
        <SidebarTrigger className="h-9 w-9 rounded-lg hover:bg-secondary/80 transition" />

        {/* Breadcrumb */}
        <nav className="hidden sm:flex items-center gap-1.5 text-xs min-w-0">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition font-medium">BMDA</Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
          <span className="font-semibold text-foreground truncate">{label}</span>
        </nav>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-xl bg-secondary/50 border border-border/70 hover:border-primary/30 transition w-[280px] ml-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="জোন, মোটর বা সেন্সর খুঁজুন..."
            className="bg-transparent text-sm flex-1 outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="text-[10px] font-mono text-muted-foreground bg-background/90 border border-border px-1.5 py-0.5 rounded">⌘K</kbd>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          {/* Weather chip */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 h-8 rounded-full bg-accent/15 border border-accent/30">
            <Sun className="h-3.5 w-3.5 text-accent-foreground" />
            <span className="text-xs font-semibold text-accent-foreground">{bnDigits("32")}°C</span>
            <span className="opacity-40">·</span>
            <CloudRain className="h-3 w-3 text-chart-2" />
            <span className="text-[10px] text-muted-foreground">{bnDigits("18")}%</span>
          </div>

          {/* Live time */}
          <div className="hidden lg:flex items-center gap-2 px-3 h-8 rounded-full bg-background/60 border border-border">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-60" />
              <span className="relative rounded-full h-2 w-2 bg-success" />
            </span>
            <span className="text-[11px] font-semibold text-success">LIVE</span>
            <span className="opacity-30">·</span>
            <span className="text-[11px] text-muted-foreground font-medium" suppressHydrationWarning>{now}</span>
          </div>

          {/* Devices */}
          <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-full bg-success/10 border border-success/30">
            <Wifi className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-bold text-success">{bnDigits("7")}</span>
            <span className="hidden sm:inline text-[10px] text-success/80 font-medium">ডিভাইস</span>
          </div>

          <button className="relative h-9 w-9 grid place-items-center rounded-xl border border-border bg-background/60 hover:bg-secondary transition">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
          </button>

          <div className="flex items-center gap-2 pl-2 ml-1 border-l border-border">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary via-chart-2 to-chart-5 grid place-items-center text-primary-foreground text-xs font-bold shadow-lg ring-2 ring-background">
              রহ
            </div>
            <div className="hidden xl:block leading-tight">
              <p className="text-xs font-bold">মোঃ রহমান</p>
              <p className="text-[10px] text-muted-foreground">অপারেটর · L2</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
