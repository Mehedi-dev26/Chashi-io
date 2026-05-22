import { Activity, Bell, Cpu, Wifi } from "lucide-react";

export function TopBar() {
  const now = new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 grid place-items-center shadow-[var(--shadow-glow)]">
            <Cpu className="h-5 w-5 text-primary-foreground" />
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-success ring-2 ring-background" />
          </div>
          <div className="leading-tight">
            <h1 className="text-base sm:text-lg font-bold tracking-tight">
              BMDA <span className="text-gradient">SmartIrrigation</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-mono">
              বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষ · IoT Control v2.6
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Activity className="h-3.5 w-3.5 text-success" />
            <span>LIVE</span>
            <span className="opacity-50">·</span>
            <span>{now}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
            <Wifi className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-medium text-success">7 devices</span>
          </div>
          <button className="relative h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-secondary transition">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
          </button>
        </div>
      </div>
    </header>
  );
}
