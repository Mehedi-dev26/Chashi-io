import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { UsageChart } from "@/components/dashboard/UsageChart";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, TrendingDown, Download } from "lucide-react";

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "পরিসংখ্যান · BMDA স্মার্ট সেচ" }] }),
  component: AnalyticsPage,
});

const weeklyData = ["শনি", "রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র"].map((d, i) => ({
  day: d,
  water: 1200 + Math.sin(i) * 400 + i * 100,
  power: 18 + Math.sin(i / 2) * 6 + i,
}));

const cropData = [
  { name: "ধান", value: 42, color: "oklch(0.58 0.17 150)" },
  { name: "গম", value: 18, color: "oklch(0.68 0.13 200)" },
  { name: "ভুট্টা", value: 12, color: "oklch(0.75 0.15 85)" },
  { name: "আলু", value: 16, color: "oklch(0.6 0.17 280)" },
  { name: "আখ", value: 12, color: "oklch(0.6 0.2 25)" },
];

function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <DashboardLayout
      title="পরিসংখ্যান · কর্মক্ষমতা রিপোর্ট"
      subtitle="সাপ্তাহিক, মাসিক ও মৌসুমি পানি, বিদ্যুৎ ও ফলন বিশ্লেষণ।"
      actions={
        <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover-lift">
          <Download className="h-3.5 w-3.5" /> রিপোর্ট ডাউনলোড
        </button>
      }
    >
      <div className="stagger space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "মোট পানি (এ মাসে)", value: `${bn("৩২,৪০০")} L`, trend: 8, up: false },
            { label: "মোট বিদ্যুৎ", value: `${bn("৪৮০")} kWh`, trend: 12, up: false },
            { label: "সক্রিয় দিন", value: `${bn(২৪)}`, trend: 5, up: true },
            { label: "AI দক্ষতা", value: `${bn(৯২)}%`, trend: 4, up: true },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-4 hover-lift">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</p>
              <p className="text-2xl font-bold mt-2">{s.value}</p>
              <div className={`mt-1 flex items-center gap-1 text-xs font-semibold ${s.up ? "text-success" : "text-chart-2"}`}>
                {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {bn(s.trend)}% {s.up ? "বৃদ্ধি" : "সাশ্রয়"}
              </div>
            </div>
          ))}
        </div>

        <UsageChart />

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="glass-card rounded-2xl p-5 hover-lift">
            <h2 className="text-base font-bold mb-3">সাপ্তাহিক ব্যবহার</h2>
            <div className="h-[260px]">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.02 150)" />
                    <XAxis dataKey="day" stroke="oklch(0.55 0.04 160)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="oklch(0.55 0.04 160)" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.88 0.02 150)", borderRadius: 10 }} />
                    <Bar dataKey="water" fill="oklch(0.58 0.17 150)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="power" fill="oklch(0.75 0.15 85)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 hover-lift">
            <h2 className="text-base font-bold mb-3">ফসল অনুযায়ী বরাদ্দ (একর)</h2>
            <div className="h-[260px] flex items-center gap-4">
              <div className="flex-1 h-full">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={cropData} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={3}>
                        {cropData.map((c) => <Cell key={c.name} fill={c.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.88 0.02 150)", borderRadius: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="space-y-2 text-sm">
                {cropData.map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm" style={{ background: c.color }} />
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-muted-foreground">{bn(c.value)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
