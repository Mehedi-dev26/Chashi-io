import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
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
      </div>
    </DashboardLayout>
  );
}
