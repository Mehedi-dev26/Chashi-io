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
      { title: "ঐতিহাসিক তথ্য · BMDA স্মার্ট সেচ" },
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
          { label: "মোট পানি ব্যবহার", val: `${(totalUsage / 1000).toFixed(1)} m³`, icon: Droplets, color: "text-chart-1" },
          { label: "গড় মাটির আর্দ্রতা", val: `${avgSoil}%`, icon: Activity, color: "text-chart-2" },
          { label: "গড় তাপমাত্রা", val: `${(data.reduce((s,r)=>s+r.temp,0)/data.length).toFixed(1)}°C`, icon: Thermometer, color: "text-chart-4" },
          { label: "ডেটা পয়েন্ট", val: `${data.length * 24}`, icon: Calendar, color: "text-chart-3" },
        ].map((s, i) => (
          <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg bg-muted grid place-items-center ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">মাটির আর্দ্রতা ও পানির স্তর</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.5}/><stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/></linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.5}/><stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
              <XAxis dataKey="t" fontSize={11}/><YAxis fontSize={11}/>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
              <Legend />
              <Area type="monotone" dataKey="soil" name="মাটির আর্দ্রতা %" stroke="hsl(var(--chart-1))" fill="url(#g1)" strokeWidth={2}/>
              <Area type="monotone" dataKey="water" name="পানির স্তর %" stroke="hsl(var(--chart-2))" fill="url(#g2)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">দৈনিক পানি ব্যবহার (লিটার)</CardTitle></CardHeader>
          <CardContent className="h-64"><ResponsiveContainer>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
              <XAxis dataKey="t" fontSize={11}/><YAxis fontSize={11}/>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
              <Area type="monotone" dataKey="usage" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.3} strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">তাপমাত্রা ট্রেন্ড (°C)</CardTitle></CardHeader>
          <CardContent className="h-64"><ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
              <XAxis dataKey="t" fontSize={11}/><YAxis fontSize={11}/>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
              <Line type="monotone" dataKey="temp" stroke="hsl(var(--chart-4))" strokeWidth={2.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">বিস্তারিত লগ</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30"><tr className="text-left">
              <th className="p-3 font-medium">তারিখ</th><th className="p-3 font-medium">মাটি %</th>
              <th className="p-3 font-medium">পানি %</th><th className="p-3 font-medium">তাপ °C</th>
              <th className="p-3 font-medium">ব্যবহার (L)</th><th className="p-3 font-medium">অবস্থা</th>
            </tr></thead>
            <tbody>{data.slice(-10).reverse().map((r, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                <td className="p-3">{r.t}</td><td className="p-3">{r.soil}%</td><td className="p-3">{r.water}%</td>
                <td className="p-3">{r.temp}°</td><td className="p-3">{r.usage.toLocaleString()}</td>
                <td className="p-3"><Badge variant={r.soil < 35 ? "destructive" : r.soil > 70 ? "default" : "secondary"}>
                  {r.soil < 35 ? "শুষ্ক" : r.soil > 70 ? "ভেজা" : "স্বাভাবিক"}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
