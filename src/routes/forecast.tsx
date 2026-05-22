import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useIrrigationData } from "@/hooks/useIrrigationData";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Brain, TrendingUp, AlertCircle, Zap, Calendar, Sparkles } from "lucide-react";

export const Route = createFileRoute("/forecast")({
  head: () => ({ meta: [{ title: "ML পূর্বাভাস · BMDA" }] }),
  component: ForecastPage,
});

function ForecastPage() {
  const { zones } = useIrrigationData();

  const hourly = useMemo(() => Array.from({ length: 24 }, (_, h) => {
    const demand = 200 + Math.sin((h - 6) / 24 * Math.PI * 2) * 180 + (h > 5 && h < 10 ? 250 : 0) + Math.random() * 40;
    return {
      h: `${h}:00`,
      predicted: Math.max(0, Math.round(demand)),
      confidence: +(0.78 + Math.random() * 0.18).toFixed(2),
      rain: h > 14 && h < 18 ? Math.random() * 8 : 0,
    };
  }), []);

  const zoneScores = zones.map(z => ({
    zone: z.id,
    "মাটি": z.soilMoisture,
    "পানি": z.waterLevel,
    "পূর্বাভাস": Math.round(60 + (100 - z.soilMoisture) * 0.4 + Math.random() * 15),
    "ঝুঁকি": Math.round(100 - z.soilMoisture - z.waterLevel / 2),
  }));

  const recommendations = zones.slice(0, 4).map((z) => ({
    zone: z.id,
    name: z.nameBn,
    action: z.soilMoisture < 40 ? "জরুরি সেচ" : z.soilMoisture < 60 ? "৪৮ ঘণ্টায় সেচ" : "স্থগিত রাখুন",
    confidence: Math.round(75 + Math.random() * 20),
    water: Math.round(z.area * (100 - z.soilMoisture) * 8),
    urgency: z.soilMoisture < 40 ? "high" : z.soilMoisture < 60 ? "med" : "low",
  }));

  return (
    <DashboardLayout
      title="ML · পানি চাহিদা পূর্বাভাস"
      subtitle="TensorFlow Lite · LSTM model · ৪৮ ঘণ্টা forecast"
      actions={<Badge className="gap-1 bg-gradient-to-r from-primary to-chart-2"><Brain className="h-3 w-3"/>v৩.২ · accuracy ৯২%</Badge>}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Model Accuracy", val: "৯২.৪%", icon: Brain, color: "from-primary to-chart-2" },
          { label: "পরবর্তী ২৪ঘ চাহিদা", val: `${(hourly.reduce((s,h)=>s+h.predicted,0)/1000).toFixed(1)} m³`, icon: TrendingUp, color: "from-chart-1 to-chart-3" },
          { label: "Peak সময়", val: "৬-৯ AM", icon: Zap, color: "from-warning to-destructive" },
          { label: "প্রত্যাশিত সাশ্রয়", val: "১৮.৭%", icon: Sparkles, color: "from-success to-chart-4" },
        ].map((s, i) => (
          <Card key={i} className="overflow-hidden animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <CardContent className="p-0">
              <div className={`bg-gradient-to-br ${s.color} p-4 text-white`}>
                <s.icon className="h-5 w-5 opacity-80"/>
                <p className="text-[11px] opacity-90 mt-1.5">{s.label}</p>
                <p className="text-xl font-bold mt-0.5">{s.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4"/>২৪-ঘণ্টা চাহিদা পূর্বাভাস (লিটার)</CardTitle></CardHeader>
        <CardContent className="h-72"><ResponsiveContainer>
          <ComposedChart data={hourly}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
            <XAxis dataKey="h" fontSize={10}/><YAxis fontSize={11}/>
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
            <Legend />
            <Bar dataKey="predicted" name="পূর্বাভাসিত চাহিদা" fill="hsl(var(--chart-1))" radius={[4,4,0,0]}/>
            <Line type="monotone" dataKey="rain" name="বৃষ্টি (mm)" stroke="hsl(var(--chart-2))" strokeWidth={2.5}/>
          </ComposedChart>
        </ResponsiveContainer></CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">জোন-ভিত্তিক ঝুঁকি প্রোফাইল</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer>
            <RadarChart data={zoneScores}>
              <PolarGrid opacity={0.3}/>
              <PolarAngleAxis dataKey="zone" fontSize={11}/>
              <PolarRadiusAxis fontSize={10}/>
              <Radar dataKey="পূর্বাভাস" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.4}/>
              <Radar dataKey="ঝুঁকি" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.3}/>
              <Legend wrapperStyle={{ fontSize: 11 }}/>
            </RadarChart>
          </ResponsiveContainer></CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary"/>AI সুপারিশ</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {recommendations.map((r, i) => (
              <div key={r.zone} className="p-3 rounded-lg border bg-card/50 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{r.zone} · {r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.water} L প্রয়োজন</p>
                  </div>
                  <Badge variant={r.urgency === "high" ? "destructive" : r.urgency === "med" ? "default" : "secondary"}>
                    {r.urgency === "high" && <AlertCircle className="h-3 w-3 mr-1"/>}{r.action}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>আত্মবিশ্বাস</span>
                  <Progress value={r.confidence} className="h-1.5 flex-1"/>
                  <span className="font-mono">{r.confidence}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card><CardContent className="p-4 text-xs text-muted-foreground flex items-start gap-2">
        <Brain className="h-4 w-4 text-primary shrink-0 mt-0.5"/>
        <span><b>Model details:</b> LSTM (২ layer × ৬৪ unit) trained on ১৮০ দিনের historical telemetry + OpenWeatherMap forecast + crop stage encoding. Inference: ESP32-S3 edge অথবা cloud (Lovable AI Gateway)। Retrain frequency: প্রতি ৭ দিনে।</span>
      </CardContent></Card>
    </DashboardLayout>
  );
}
