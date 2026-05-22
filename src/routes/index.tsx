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
import { useIrrigationData } from "@/hooks/useIrrigationData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BMDA স্মার্ট সেচ — IoT নিয়ন্ত্রণ ড্যাশবোর্ড" },
      { name: "description", content: "বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষের জন্য পেশাদার IoT সেচ নিয়ন্ত্রণ সিস্টেম।" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { zones, motor, activity, toggleValve, toggleMotor } = useIrrigationData();

  return (
    <DashboardLayout
      title="মিশন কন্ট্রোল · স্মার্ট সেচ গ্রিড"
      subtitle="৭টি জোন · ৩২.৬ হেক্টর · যেকোনো স্থান থেকে IoT-সক্ষম ভাল্ভ ও পাম্প পরিচালনা করুন।"
    >
      <div className="stagger space-y-5">
        <StatsCards zones={zones} motor={motor} />
        <QuickActions />

        {/* Bigger map full width with motor sidebar */}
        <FieldMap zones={zones} onToggle={toggleValve} />

        <div className="grid lg:grid-cols-3 gap-5">
          <MotorPanel motor={motor} onToggle={toggleMotor} />
          <div className="lg:col-span-2">
            <UsageChart />
          </div>
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
