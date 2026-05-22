import { createFileRoute } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
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
      { title: "BMDA স্মার্ট সেচ — IoT নিয়ন্ত্রণ ড্যাশবোর্ড" },
      { name: "description", content: "বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষের জন্য পেশাদার IoT সেচ নিয়ন্ত্রণ সিস্টেম — লাইভ জমি পর্যবেক্ষণ, মোটর নিয়ন্ত্রণ, AI পরামর্শ ও দূরবর্তী ভাল্ভ ব্যবস্থাপনা।" },
      { property: "og:title", content: "BMDA স্মার্ট সেচ নিয়ন্ত্রণ" },
      { property: "og:description", content: "AI-চালিত, IoT-প্রস্তুত সেচ ড্যাশবোর্ড — লাইভ ডেটা ও দূরবর্তী নিয়ন্ত্রণ সহ।" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { zones, motor, activity, toggleValve, toggleMotor } = useIrrigationData();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 px-4 sm:px-6 py-6 space-y-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                মিশন কন্ট্রোল · <span className="text-gradient">স্মার্ট সেচ গ্রিড</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                ৭টি জোন · ৩২.৬ হেক্টর · যেকোনো স্থান থেকে IoT-সক্ষম ভাল্ভ ও পাম্প পরিচালনা করুন।
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

            <footer className="text-center text-[11px] text-muted-foreground py-6">
              BMDA স্মার্ট সেচ · IoT নিয়ন্ত্রণ v২.৬ · Webhook / HTTP ইন্টিগ্রেশনের জন্য প্রস্তুত
            </footer>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
