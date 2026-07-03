import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, Legend,
} from "recharts";
import { Download, Calendar, Droplets, Thermometer, Activity } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "ঐতিহাসিক তথ্য · Chashi.io" },
      { name: "description", content: "৭/৩০ দিনের sensor data, পানি ব্যবহার ও মাটির আর্দ্রতার trend chart।" },
    ],
  }),
  component: HistoryPage,
});

type Row = { t: string; soil: number; water: number; temp: number; usage: number };

function genSeries(days: number): Row[] {
  const out: Row[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const label = days <= 7
      ? d.toLocaleDateString("bn-BD", { weekday: "short" })
      : `${d.getDate()}/${d.getMonth() + 1}`;
    const base = 55 + Math.sin(i / 2) * 12;
    out.push({
      t: label,
      soil: +Math.max(20, Math.min(90, base + (Math.random() - 0.5) * 10)).toFixed(1),
      water: +Math.max(15, Math.min(95, base + 8 + (Math.random() - 0.5) * 14)).toFixed(1),
      temp: +(26 + Math.sin(i / 3) * 4 + Math.random() * 2).toFixed(1),
      usage: Math.round(800 + Math.random() * 600 + (i % 3 === 0 ? 400 : 0)),
    });
  }
  return out;
}

function HistoryPage() {
  const [range, setRange] = useState<7 | 30 | 90>(7);
  const data = useMemo(() => genSeries(range), [range]);
  const totalUsage = data.reduce((s, r) => s + r.usage, 0);
  const avgSoil = (data.reduce((s, r) => s + r.soil, 0) / data.length).toFixed(1);

  const exportCsv = () => {
    const header = "date,soil_moisture,water_level,temperature,usage_liters\n";
    const rows = data.map(r => `${r.t},${r.soil},${r.water},${r.temp},${r.usage}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bmda-history-${range}d.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout
      title="ঐতিহাসিক · তথ্য বিশ্লেষণ"
      subtitle="Sensor trend ও পানি ব্যবহারের সময়-ভিত্তিক রিপোর্ট"
      actions={
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <Button key={d} size="sm" variant={range === d ? "default" : "outline"} onClick={() => setRange(d as 7|30|90)}>
              {d} দিন
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />CSV</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "মোট পানি ব্যবহার",  val: `${(totalUsage / 1000).toFixed(1)} m³`, icon: Droplets,    grad: "from-sky-500 via-blue-500 to-indigo-500",         ring: "ring-sky-300/40" },
          { label: "গড় মাটির আর্দ্রতা", val: `${avgSoil}%`,                          icon: Activity,    grad: "from-emerald-500 via-teal-500 to-cyan-500",       ring: "ring-emerald-300/40" },
          { label: "গড় তাপমাত্রা",      val: `${(data.reduce((s,r)=>s+r.temp,0)/data.length).toFixed(1)}°C`, icon: Thermometer, grad: "from-amber-500 via-orange-500 to-rose-500", ring: "ring-amber-300/40" },
          { label: "ডেটা পয়েন্ট",       val: `${data.length * 24}`,                   icon: Calendar,    grad: "from-indigo-500 via-violet-500 to-fuchsia-500",  ring: "ring-indigo-300/40" },
        ].map((s, i) => (
          <div
            key={i}
            className={`relative overflow-hidden rounded-2xl p-4 text-white bg-gradient-to-br ${s.grad} shadow-lg ring-1 ${s.ring} border-2 border-white/20 animate-fade-in hover-lift`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-white/20 grid place-items-center backdrop-blur-sm shrink-0">
                <s.icon className="h-5 w-5 drop-shadow" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider font-bold opacity-95">{s.label}</p>
                <p className="text-2xl font-extrabold drop-shadow truncate">{s.val}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card className="border-2 border-sky-400/30 shadow-md shadow-sky-500/10 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-sky-500 via-emerald-500 to-cyan-500" />
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Droplets className="h-4 w-4 text-sky-500"/>মাটির আর্দ্রতা ও পানির স্তর</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.55}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.55}/><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
              <XAxis dataKey="t" fontSize={11}/><YAxis fontSize={11}/>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
              <Legend />
              <Area type="monotone" dataKey="soil" name="মাটির আর্দ্রতা %" stroke="#10b981" fill="url(#g1)" strokeWidth={2.5}/>
              <Area type="monotone" dataKey="water" name="পানির স্তর %" stroke="#0ea5e9" fill="url(#g2)" strokeWidth={2.5}/>
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-2 border-violet-400/30 shadow-md shadow-violet-500/10 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Droplets className="h-4 w-4 text-violet-500"/>দৈনিক পানি ব্যবহার (লিটার)</CardTitle></CardHeader>
          <CardContent className="h-64"><ResponsiveContainer>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gUsage" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
              <XAxis dataKey="t" fontSize={11}/><YAxis fontSize={11}/>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
              <Area type="monotone" dataKey="usage" stroke="#8b5cf6" fill="url(#gUsage)" strokeWidth={2.5}/>
            </AreaChart>
          </ResponsiveContainer></CardContent>
        </Card>
        <Card className="border-2 border-orange-400/30 shadow-md shadow-orange-500/10 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Thermometer className="h-4 w-4 text-orange-500"/>তাপমাত্রা ট্রেন্ড (°C)</CardTitle></CardHeader>
          <CardContent className="h-64"><ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
              <XAxis dataKey="t" fontSize={11}/><YAxis fontSize={11}/>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
              <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={3} dot={{ r: 3, fill: "#f97316" }} activeDot={{ r: 5 }}/>
            </LineChart>
          </ResponsiveContainer></CardContent>
        </Card>
      </div>

      <Card className="border-2 border-emerald-400/30 shadow-md shadow-emerald-500/10 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-500"/>বিস্তারিত লগ</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
              <tr className="text-left text-[11px] uppercase tracking-wider">
                <th className="p-3 font-bold">তারিখ</th><th className="p-3 font-bold">মাটি %</th>
                <th className="p-3 font-bold">পানি %</th><th className="p-3 font-bold">তাপ °C</th>
                <th className="p-3 font-bold">ব্যবহার (L)</th><th className="p-3 font-bold">অবস্থা</th>
              </tr>
            </thead>
            <tbody>{data.slice(-10).reverse().map((r, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-emerald-500/5 transition-colors">
                <td className="p-3 font-semibold">{r.t}</td>
                <td className="p-3"><span className="font-mono font-bold text-emerald-600">{r.soil}%</span></td>
                <td className="p-3"><span className="font-mono font-bold text-sky-600">{r.water}%</span></td>
                <td className="p-3"><span className="font-mono font-bold text-orange-600">{r.temp}°</span></td>
                <td className="p-3 font-mono">{r.usage.toLocaleString()}</td>
                <td className="p-3"><Badge variant={r.soil < 35 ? "destructive" : r.soil > 70 ? "default" : "secondary"} className="font-bold">
                  {r.soil < 35 ? "শুষ্ক" : r.soil > 70 ? "ভেজা" : "স্বাভাবিক"}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
