import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";

export function DashboardLayout({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-transparent">
          <TopBar />
          <main className="flex-1 px-4 sm:px-6 py-6 space-y-5 animate-fade-in">
            <div className="flex items-start justify-between gap-4 flex-wrap animate-slide-down">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {title.includes("·") ? (
                    <>
                      {title.split("·")[0]}·<span className="text-gradient">{title.split("·")[1]}</span>
                    </>
                  ) : (
                    <span className="text-gradient">{title}</span>
                  )}
                </h1>
                {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
              </div>
              {actions}
            </div>
            <div className="space-y-5">{children}</div>
            <footer className="text-center text-[11px] text-muted-foreground py-6">
              BMDA স্মার্ট সেচ · IoT নিয়ন্ত্রণ v২.৬ · বরেন্দ্র বহুমুখী উন্নয়ন কর্তৃপক্ষ
            </footer>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
