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
  head: () => ({ meta: [{ title: "ML পূর্বাভাস · Chashi.io" }] }),
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
          { label: "Model Accuracy",       val: "৯২.৪%",                                                                       icon: Brain,      grad: "from-indigo-500 via-violet-500 to-fuchsia-500", ring: "ring-indigo-300/40" },
          { label: "পরবর্তী ২৪ঘ চাহিদা",   val: `${(hourly.reduce((s,h)=>s+h.predicted,0)/1000).toFixed(1)} m³`,             icon: TrendingUp, grad: "from-sky-500 via-blue-500 to-cyan-500",         ring: "ring-sky-300/40" },
          { label: "Peak সময়",             val: "৬-৯ AM",                                                                      icon: Zap,        grad: "from-amber-500 via-orange-500 to-rose-500",     ring: "ring-amber-300/40" },
          { label: "প্রত্যাশিত সাশ্রয়",     val: "১৮.৭%",                                                                       icon: Sparkles,   grad: "from-emerald-500 via-teal-500 to-lime-500",     ring: "ring-emerald-300/40" },
        ].map((s, i) => (
          <div
            key={i}
            className={`relative overflow-hidden rounded-2xl p-4 text-white bg-gradient-to-br ${s.grad} shadow-lg ring-1 ${s.ring} border-2 border-white/20 animate-fade-in hover-lift`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
            <div className="h-9 w-9 rounded-xl bg-white/20 grid place-items-center backdrop-blur-sm">
              <s.icon className="h-5 w-5 drop-shadow" />
            </div>
            <p className="text-[11px] uppercase tracking-wider font-bold mt-2 opacity-95">{s.label}</p>
            <p className="text-2xl font-extrabold mt-0.5 drop-shadow">{s.val}</p>
          </div>
        ))}
      </div>

      <Card className="border-2 border-sky-400/30 shadow-md shadow-sky-500/10 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500" />
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-sky-500"/>২৪-ঘণ্টা চাহিদা পূর্বাভাস (লিটার)</CardTitle></CardHeader>
        <CardContent className="h-72"><ResponsiveContainer>
          <ComposedChart data={hourly}>
            <defs>
              <linearGradient id="fBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#0ea5e9"/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
            <XAxis dataKey="h" fontSize={10}/><YAxis fontSize={11}/>
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
            <Legend />
            <Bar dataKey="predicted" name="পূর্বাভাসিত চাহিদা" fill="url(#fBar)" radius={[6,6,0,0]}/>
            <Line type="monotone" dataKey="rain" name="বৃষ্টি (mm)" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: "#10b981" }}/>
          </ComposedChart>
        </ResponsiveContainer></CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-2 border-fuchsia-400/30 shadow-md shadow-fuchsia-500/10 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500" />
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-fuchsia-500"/>জোন-ভিত্তিক ঝুঁকি প্রোফাইল</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer>
            <RadarChart data={zoneScores}>
              <PolarGrid opacity={0.3}/>
              <PolarAngleAxis dataKey="zone" fontSize={11}/>
              <PolarRadiusAxis fontSize={10}/>
              <Radar dataKey="পূর্বাভাস" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4}/>
              <Radar dataKey="ঝুঁকি" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3}/>
              <Legend wrapperStyle={{ fontSize: 11 }}/>
            </RadarChart>
          </ResponsiveContainer></CardContent>
        </Card>

        <Card className="border-2 border-emerald-400/30 shadow-md shadow-emerald-500/10 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-500"/>AI সুপারিশ</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {recommendations.map((r, i) => {
              const tone = r.urgency === "high"
                ? { ring: "ring-rose-400/50",    bar: "from-rose-500 to-red-500",         text: "text-rose-700 dark:text-rose-300" }
                : r.urgency === "med"
                ? { ring: "ring-amber-400/50",   bar: "from-amber-500 to-orange-500",     text: "text-amber-700 dark:text-amber-300" }
                : { ring: "ring-emerald-400/50", bar: "from-emerald-500 to-teal-500",     text: "text-emerald-700 dark:text-emerald-300" };
              return (
                <div key={r.zone} className={`relative p-3 rounded-xl border-2 bg-card/60 ring-1 ${tone.ring} shadow-sm animate-fade-in overflow-hidden`} style={{ animationDelay: `${i * 80}ms` }}>
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${tone.bar}`} />
                  <div className="flex items-start justify-between mb-2 pl-2">
                    <div>
                      <p className="font-bold text-sm">{r.zone} · {r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.water} L প্রয়োজন</p>
                    </div>
                    <Badge variant={r.urgency === "high" ? "destructive" : r.urgency === "med" ? "default" : "secondary"} className="font-bold">
                      {r.urgency === "high" && <AlertCircle className="h-3 w-3 mr-1"/>}{r.action}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] pl-2">
                    <span className="text-muted-foreground">আত্মবিশ্বাস</span>
                    <Progress value={r.confidence} className="h-1.5 flex-1"/>
                    <span className={`font-mono font-bold ${tone.text}`}>{r.confidence}%</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-indigo-400/30 shadow-md shadow-indigo-500/10 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
        <CardContent className="p-4 text-xs text-muted-foreground flex items-start gap-2">
          <Brain className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5"/>
          <span><b>Model details:</b> LSTM (২ layer × ৬৪ unit) trained on ১৮০ দিনের historical telemetry + OpenWeatherMap forecast + crop stage encoding. Inference: ESP32-S3 edge অথবা cloud (Lovable AI Gateway)। Retrain frequency: প্রতি ৭ দিনে।</span>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
