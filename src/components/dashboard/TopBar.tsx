import { useEffect, useState } from "react";
import { Activity, Bell, Wifi, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

const bnDigits = (s: string) => s.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export function TopBar() {
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const formatted = new Intl.DateTimeFormat("bn-BD", {
        day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }).format(new Date());
      setNow(formatted);
    };
    update();
    const t = setInterval(update, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
        <SidebarTrigger className="h-9 w-9 hover:bg-secondary" />

        <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-lg bg-secondary/60 border border-border min-w-[280px]">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="জোন, মোটর বা সেন্সর খুঁজুন..."
            className="bg-transparent text-sm flex-1 outline-none placeholder:text-muted-foreground"
          />
          <span className="text-[10px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">Ctrl K</span>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-success" />
            <span className="font-semibold text-success">লাইভ</span>
            <span className="opacity-40">·</span>
            <span suppressHydrationWarning>{now}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
            <Wifi className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-medium text-success">{bnDigits("7")}টি ডিভাইস</span>
          </div>
          <button className="relative h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-secondary transition">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
          </button>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-chart-2 grid place-items-center text-primary-foreground text-xs font-bold shrink-0">
            রহ
          </div>
        </div>
      </div>
    </header>
  );
}
