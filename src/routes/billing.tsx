import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIrrigationData } from "@/hooks/useIrrigationData";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { FileDown, Printer, DollarSign, Droplets, TrendingUp, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/billing")({
  head: () => ({ meta: [{ title: "জল ব্যবহার ও বিলিং · BMDA" }] }),
  component: BillingPage,
});

const RATE = 0.42; // ৳ per liter
const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))", "hsl(var(--accent))"];

function BillingPage() {
  const { zones } = useIrrigationData();
  const [month] = useState(new Date().toLocaleDateString("bn-BD", { month: "long", year: "numeric" }));

  const rows = useMemo(() => zones.map((z, i) => {
    const liters = Math.round(z.area * 4200 + (z.valveOpen ? 1800 : 0) + i * 350);
    const cost = +(liters * RATE).toFixed(2);
    const waste = Math.round(liters * (z.soilMoisture > 70 ? 0.18 : 0.05));
    return { id: z.id, name: z.nameBn, crop: z.cropType, area: z.area, liters, cost, waste };
  }), [zones]);

  const totalLiters = rows.reduce((s, r) => s + r.liters, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalWaste = rows.reduce((s, r) => s + r.waste, 0);

  const exportPdf = () => window.print();
  const exportCsv = () => {
    const csv = "zone,name,crop,area_acre,liters,cost_bdt,waste_liters\n" +
      rows.map(r => `${r.id},${r.name},${r.crop},${r.area},${r.liters},${r.cost},${r.waste}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `bmda-bill-${Date.now()}.csv`; a.click();
  };

  return (
    <DashboardLayout
      title="জল ব্যবহার · ও বিলিং"
      subtitle={`মাসিক রিপোর্ট — ${month}`}
      actions={<div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={exportCsv}><FileDown className="h-4 w-4 mr-1"/>CSV</Button>
        <Button size="sm" onClick={exportPdf}><Printer className="h-4 w-4 mr-1"/>PDF প্রিন্ট</Button>
      </div>}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "মোট পানি", val: `${(totalLiters / 1000).toFixed(2)} m³`, icon: Droplets, color: "from-chart-1 to-chart-2" },
          { label: "মোট বিল", val: `৳ ${totalCost.toLocaleString()}`, icon: DollarSign, color: "from-success to-chart-3" },
          { label: "অপচয়", val: `${totalWaste.toLocaleString()} L`, icon: AlertTriangle, color: "from-warning to-destructive" },
          { label: "সাশ্রয় (AI)", val: `১২.৪%`, icon: TrendingUp, color: "from-chart-4 to-chart-5" },
        ].map((s, i) => (
          <Card key={i} className="overflow-hidden animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <CardContent className="p-0">
              <div className={`bg-gradient-to-br ${s.color} p-4 text-white`}>
                <s.icon className="h-5 w-5 opacity-80"/>
                <p className="text-xs opacity-90 mt-2">{s.label}</p>
                <p className="text-2xl font-bold mt-0.5">{s.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">প্রতি জোনে পানি ব্যবহার</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
              <XAxis dataKey="id" fontSize={11}/><YAxis fontSize={11}/>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
              <Bar dataKey="liters" name="পানি (L)" radius={[6,6,0,0]}>
                {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer></CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-base">খরচের বিতরণ</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer>
            <PieChart>
              <Pie data={rows} dataKey="cost" nameKey="id" innerRadius={45} outerRadius={85} paddingAngle={2}>
                {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
              <Legend wrapperStyle={{ fontSize: 11 }}/>
            </PieChart>
          </ResponsiveContainer></CardContent>
        </Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">বিস্তারিত বিল — প্রতি জোন (Rate: ৳{RATE}/L)</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40"><tr className="text-left">
              <th className="p-3 font-medium">জোন</th><th className="p-3 font-medium">নাম</th>
              <th className="p-3 font-medium">ফসল</th><th className="p-3 font-medium">এলাকা</th>
              <th className="p-3 font-medium text-right">পানি (L)</th>
              <th className="p-3 font-medium text-right">অপচয়</th>
              <th className="p-3 font-medium text-right">খরচ (৳)</th>
            </tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="p-3 font-mono">{r.id}</td><td className="p-3">{r.name}</td>
                <td className="p-3"><Badge variant="outline">{r.crop}</Badge></td>
                <td className="p-3">{r.area} একর</td>
                <td className="p-3 text-right tabular-nums">{r.liters.toLocaleString()}</td>
                <td className="p-3 text-right tabular-nums text-warning">{r.waste.toLocaleString()}</td>
                <td className="p-3 text-right tabular-nums font-semibold">৳ {r.cost.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-muted/40 font-semibold">
              <td className="p-3" colSpan={4}>মোট</td>
              <td className="p-3 text-right">{totalLiters.toLocaleString()}</td>
              <td className="p-3 text-right text-warning">{totalWaste.toLocaleString()}</td>
              <td className="p-3 text-right">৳ {totalCost.toLocaleString()}</td>
            </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
