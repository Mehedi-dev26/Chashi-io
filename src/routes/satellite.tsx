import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIrrigationData } from "@/hooks/useIrrigationData";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Satellite, Leaf, Calendar, Download, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/satellite")({
  head: () => ({ meta: [{ title: "স্যাটেলাইট NDVI · BMDA" }] }),
  component: SatPage,
});

function ndviColor(v: number) {
  if (v < 0.2) return "rgb(160, 60, 40)";
  if (v < 0.4) return "rgb(220, 160, 50)";
  if (v < 0.6) return "rgb(200, 220, 80)";
  if (v < 0.75) return "rgb(120, 200, 80)";
  return "rgb(40, 140, 60)";
}

function SatPage() {
  const { zones } = useIrrigationData();
  const [date, setDate] = useState("আজ");

  const ndvi = useMemo(() => zones.map(z => ({
    ...z,
    ndvi: +(0.25 + (z.soilMoisture / 100) * 0.55 + Math.random() * 0.1).toFixed(2),
  })), [zones]);

  const trend = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    ndvi: +(0.35 + Math.sin(i / 3) * 0.18 + (i / 25) + Math.random() * 0.05).toFixed(2),
    rain: Math.round(Math.random() * 40 + (i % 4 === 0 ? 30 : 0)),
  })), []);

  const avgNdvi = (ndvi.reduce((s, z) => s + z.ndvi, 0) / ndvi.length).toFixed(2);

  return (
    <DashboardLayout
      title="স্যাটেলাইট · NDVI বিশ্লেষণ"
      subtitle="Sentinel-2 · ১০ মিটার resolution · ৫ দিন পর পর update"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setDate(date === "আজ" ? "৭ দিন আগে" : "আজ")}>
            <Calendar className="h-3 w-3 mr-1"/>{date}
          </Button>
          <Button size="sm" variant="outline"><RefreshCw className="h-3 w-3 mr-1"/>রিফ্রেশ</Button>
          <Button size="sm"><Download className="h-3 w-3 mr-1"/>GeoTIFF</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "গড় NDVI", val: avgNdvi, sub: +avgNdvi > 0.6 ? "চমৎকার" : "মাঝারি", icon: Leaf, color: "from-success to-chart-4" },
          { label: "সর্বাধিক", val: Math.max(...ndvi.map(z => z.ndvi)).toFixed(2), sub: ndvi.reduce((a, b) => a.ndvi > b.ndvi ? a : b).id, icon: Leaf, color: "from-chart-1 to-chart-2" },
          { label: "সর্বনিম্ন (সমস্যা)", val: Math.min(...ndvi.map(z => z.ndvi)).toFixed(2), sub: ndvi.reduce((a, b) => a.ndvi < b.ndvi ? a : b).id, icon: Leaf, color: "from-warning to-destructive" },
          { label: "সর্বশেষ Pass", val: "২ দিন", sub: "Sentinel-2A", icon: Satellite, color: "from-primary to-chart-3" },
        ].map((s, i) => (
          <Card key={i} className="overflow-hidden animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <CardContent className="p-0">
              <div className={`bg-gradient-to-br ${s.color} p-4 text-white`}>
                <s.icon className="h-5 w-5 opacity-80"/>
                <p className="text-[11px] opacity-90 mt-1.5">{s.label}</p>
                <p className="text-2xl font-bold">{s.val}</p>
                <p className="text-[10px] opacity-80">{s.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card><CardHeader><CardTitle className="text-base">NDVI Heatmap — প্রতি জোন</CardTitle></CardHeader>
          <CardContent>
            <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                {ndvi.map((z) => (
                  <g key={z.id}>
                    <polygon points={z.polygon} fill={ndviColor(z.ndvi)} fillOpacity={0.85} stroke="white" strokeWidth={0.3} strokeOpacity={0.5}
                      className="hover:fill-opacity-100 transition-opacity cursor-pointer"/>
                    <text x={z.x} y={z.y} fontSize={3} fill="white" textAnchor="middle" fontWeight="bold">{z.id}</text>
                    <text x={z.x} y={z.y + 4} fontSize={2.5} fill="white" textAnchor="middle" opacity={0.9}>{z.ndvi}</text>
                  </g>
                ))}
              </svg>
              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 text-[10px] text-white">
                <span>০.০</span>
                <div className="flex-1 h-2 rounded" style={{ background: "linear-gradient(to right, rgb(160,60,40), rgb(220,160,50), rgb(200,220,80), rgb(120,200,80), rgb(40,140,60))" }}/>
                <span>১.০</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">জোন স্বাস্থ্য</CardTitle></CardHeader>
          <CardContent className="p-2 space-y-1 max-h-96 overflow-y-auto">
            {ndvi.sort((a, b) => b.ndvi - a.ndvi).map((z) => (
              <div key={z.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded" style={{ background: ndviColor(z.ndvi) }}/>
                  <div>
                    <p className="text-xs font-semibold">{z.id}</p>
                    <p className="text-[10px] text-muted-foreground">{z.cropType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold">{z.ndvi}</p>
                  <Badge variant={z.ndvi > 0.6 ? "default" : z.ndvi > 0.4 ? "secondary" : "destructive"} className="text-[9px] px-1 py-0">
                    {z.ndvi > 0.6 ? "ভালো" : z.ndvi > 0.4 ? "মাঝারি" : "চাপে"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">১২ সপ্তাহ NDVI vs বৃষ্টিপাত</CardTitle></CardHeader>
        <CardContent className="h-64"><ResponsiveContainer>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
            <XAxis dataKey="week" fontSize={11}/>
            <YAxis yAxisId="l" fontSize={11} domain={[0, 1]}/>
            <YAxis yAxisId="r" orientation="right" fontSize={11}/>
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
            <Legend />
            <Line yAxisId="l" type="monotone" dataKey="ndvi" stroke="hsl(var(--success))" strokeWidth={2.5} dot={false} name="NDVI"/>
            <Line yAxisId="r" type="monotone" dataKey="rain" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="বৃষ্টি (mm)"/>
          </LineChart>
        </ResponsiveContainer></CardContent>
      </Card>

      <Card><CardContent className="p-4 text-xs text-muted-foreground flex items-start gap-2">
        <Satellite className="h-4 w-4 text-primary shrink-0 mt-0.5"/>
        <span><b>Sentinel-2 NDVI</b> = (NIR − Red) / (NIR + Red)। ০.৬+ = সুস্থ গাছ, ০.৩-০.৬ = চাপ/বৃদ্ধি পর্যায়, &lt;০.৩ = খালি মাটি/রোগ। Production-এ Copernicus Open Access Hub বা Sentinel Hub API থেকে free imagery নেওয়া যাবে।</span>
      </CardContent></Card>
    </DashboardLayout>
  );
}
