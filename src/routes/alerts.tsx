import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Bell, AlertTriangle, CheckCircle2, Info, AlertCircle, Filter } from "lucide-react";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "বিজ্ঞপ্তি · Chashi.io" }] }),
  component: AlertsPage,
});

const alerts = [
  { id: 1, severity: "critical", title: "জোন Z-০৪ এ পানি সংকট", desc: "মাটির আর্দ্রতা ২২%-এ নেমেছে। অবিলম্বে সেচ প্রয়োজন।", time: "৫ মিনিট আগে", zone: "Z-০৪" },
  { id: 2, severity: "warning", title: "পাম্প চাপ স্বাভাবিকের নিচে", desc: "প্রধান পাম্পের চাপ ৩৮ PSI-এ নেমেছে (স্বাভাবিক ৪২+)।", time: "১২ মিনিট আগে", zone: "PUMP" },
  { id: 3, severity: "info", title: "AI সূচি আপডেট", desc: "আগামীকালের সেচ সূচি AI দ্বারা পুনর্বিন্যাসিত হয়েছে।", time: "১ ঘণ্টা আগে", zone: "AI" },
  { id: 4, severity: "success", title: "জোন Z-০১ সেচ সম্পন্ন", desc: "৪৫ মিনিটের সেচ চক্র সফলভাবে শেষ হয়েছে।", time: "২ ঘণ্টা আগে", zone: "Z-০১" },
  { id: 5, severity: "warning", title: "ভোল্টেজ ওঠানামা শনাক্ত", desc: "গত ৩০ মিনিটে ৩ বার ভোল্টেজ ওঠানামা হয়েছে।", time: "৩ ঘণ্টা আগে", zone: "PUMP" },
  { id: 6, severity: "info", title: "আবহাওয়া আপডেট", desc: "আগামী ৪৮ ঘণ্টায় বৃষ্টির সম্ভাবনা নেই।", time: "৫ ঘণ্টা আগে", zone: "WEATHER" },
];

const styleFor = (s: string) => {
  switch (s) {
    case "critical": return { Icon: AlertCircle, color: "destructive", label: "জরুরি" };
    case "warning": return { Icon: AlertTriangle, color: "warning", label: "সতর্কতা" };
    case "success": return { Icon: CheckCircle2, color: "success", label: "সফল" };
    default: return { Icon: Info, color: "chart-2", label: "তথ্য" };
  }
};

function AlertsPage() {
  const counts = {
    critical: alerts.filter((a) => a.severity === "critical").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
    success: alerts.filter((a) => a.severity === "success").length,
  };

  return (
    <DashboardLayout
      title="বিজ্ঞপ্তি কেন্দ্র · সতর্কতা"
      subtitle="সকল সিস্টেম ইভেন্ট, সতর্কতা ও জরুরি বিজ্ঞপ্তি এক জায়গায়।"
      actions={
        <button className="h-9 px-3 rounded-lg glass-panel text-xs font-semibold flex items-center gap-1.5 hover-lift">
          <Filter className="h-3.5 w-3.5" /> ফিল্টার
        </button>
      }
    >
      <div className="stagger space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "জরুরি", value: counts.critical, tone: "destructive", Icon: AlertCircle },
            { label: "সতর্কতা", value: counts.warning, tone: "warning", Icon: AlertTriangle },
            { label: "তথ্য", value: counts.info, tone: "chart-2", Icon: Info },
            { label: "সফল", value: counts.success, tone: "success", Icon: CheckCircle2 },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-4 hover-lift">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</p>
                <s.Icon className="h-4 w-4" style={{ color: `var(--color-${s.tone})` }} />
              </div>
              <p className="text-3xl font-bold mt-2" style={{ color: `var(--color-${s.tone})` }}>{bn(s.value)}</p>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" /> সব বিজ্ঞপ্তি
            </h2>
            <button className="text-xs text-primary font-semibold hover:underline">সব পড়া হয়েছে চিহ্নিত করুন</button>
          </div>

          <div className="space-y-2.5">
            {alerts.map((a) => {
              const { Icon, color, label } = styleFor(a.severity);
              return (
                <div key={a.id} className="rounded-xl glass-panel p-4 hover-lift flex gap-3">
                  <div
                    className="h-10 w-10 rounded-xl grid place-items-center shrink-0"
                    style={{ background: `color-mix(in oklab, var(--color-${color}) 18%, transparent)` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: `var(--color-${color})` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase"
                        style={{ background: `color-mix(in oklab, var(--color-${color}) 18%, transparent)`, color: `var(--color-${color})` }}
                      >
                        {label}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{a.zone}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{a.time}</span>
                    </div>
                    <p className="font-bold text-sm mt-1">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
