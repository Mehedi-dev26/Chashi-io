import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FieldMap } from "@/components/dashboard/FieldMap";
import { MotorPanel } from "@/components/dashboard/MotorPanel";
import { ZonesGrid } from "@/components/dashboard/ZonesGrid";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { UsageChart } from "@/components/dashboard/UsageChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Roadmap } from "@/components/dashboard/Roadmap";
import { ConnectivityTest } from "@/components/dashboard/ConnectivityTest";
import { useIrrigationData } from "@/hooks/useIrrigationData";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "মূল প্যানেল · Chashi.io" },
      { name: "description", content: "Chashi.io প্ল্যাটফর্মের কেন্দ্রীয় নিয়ন্ত্রণ প্যানেল।" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { zones, motor, metrics, activity, weather, toggleValve, toggleMotor } = useIrrigationData();
  return (
    <DashboardLayout
      title="কেন্দ্রীয় পরিচালন কেন্দ্র · Chashi.io প্ল্যাটফর্ম"
      subtitle="রিয়েল-টাইম সেন্সর ডেটা · IoT-নিয়ন্ত্রিত ভাল্ভ, পাম্প ও নেটওয়ার্ক"
    >
      <div className="stagger space-y-5">
        <StatsCards zones={zones} motor={motor} metrics={metrics} weather={weather} />

        <QuickActions />
        <ConnectivityTest />
        <FieldMap zones={zones} onToggle={toggleValve} />
        <div className="grid lg:grid-cols-3 gap-5">
          <MotorPanel motor={motor} onToggle={toggleMotor} />
          <div className="lg:col-span-2"><UsageChart /></div>
        </div>
        <ZonesGrid zones={zones} onToggle={toggleValve} />
        <div className="grid lg:grid-cols-2 gap-5">
          <AIInsights zones={zones} />
          <ActivityFeed activity={activity} />
        </div>
        <Roadmap />
      </div>
    </DashboardLayout>
  );
}
