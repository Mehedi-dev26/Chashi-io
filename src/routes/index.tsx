import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/dashboard/TopBar";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { FieldMap } from "@/components/dashboard/FieldMap";
import { MotorPanel } from "@/components/dashboard/MotorPanel";
import { ZonesGrid } from "@/components/dashboard/ZonesGrid";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { UsageChart } from "@/components/dashboard/UsageChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { useIrrigationData } from "@/hooks/useIrrigationData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BMDA SmartIrrigation — IoT Control Dashboard" },
      { name: "description", content: "Professional IoT-based irrigation control system for BMDA: real-time field monitoring, motor control, AI insights, and remote valve management." },
      { property: "og:title", content: "BMDA SmartIrrigation Control" },
      { property: "og:description", content: "AI-powered, IoT-ready irrigation dashboard with live telemetry and remote control." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { zones, motor, activity, toggleValve, toggleMotor } = useIrrigationData();

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Mission Control · <span className="text-gradient">Smart Irrigation Grid</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor 7 zones · 32.6 hectares · Operate from anywhere with IoT-enabled valves & pumps.
          </p>
        </div>

        <StatsCards zones={zones} motor={motor} />

        <div className="grid lg:grid-cols-[1fr_360px] gap-5">
          <FieldMap zones={zones} onToggle={toggleValve} />
          <MotorPanel motor={motor} onToggle={toggleMotor} />
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <UsageChart />
            <ZonesGrid zones={zones} onToggle={toggleValve} />
          </div>
          <div className="space-y-5">
            <AIInsights zones={zones} />
            <ActivityFeed activity={activity} />
          </div>
        </div>

        <footer className="text-center text-[11px] text-muted-foreground font-mono py-6">
          BMDA SmartIrrigation · IoT Control v2.6 · Ready for webhook / HTTP integration
        </footer>
      </main>
    </div>
  );
}
