import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useIrrigationData } from "@/hooks/useIrrigationData";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Area, AreaChart } from "recharts";
import { Satellite, Leaf, Calendar, Download, RefreshCw, Info, AlertTriangle, CheckCircle2, Droplets, Sprout, TrendingUp, Eye, Sun, CloudRain } from "lucide-react";

export const Route = createFileRoute("/satellite")({
  head: () => ({ meta: [
    { title: "স্যাটেলাইট NDVI বিশ্লেষণ · Chashi.io" },
    { name: "description", content: "Sentinel-2 স্যাটেলাইট থেকে NDVI সূচকে ফসলের স্বাস্থ্য, জোনভিত্তিক সমস্যা চিহ্নিতকরণ ও সেচ পরামর্শ।" },
  ] }),
  component: SatPage,
});

// Bangla digits
const bn = (n: number | string) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

function ndviColor(v: number) {
  if (v < 0.2) return "rgb(160, 60, 40)";
  if (v < 0.4) return "rgb(220, 160, 50)";
  if (v < 0.6) return "rgb(200, 220, 80)";
  if (v < 0.75) return "rgb(120, 200, 80)";
  return "rgb(40, 140, 60)";
}

function ndviStatus(v: number) {
  if (v >= 0.75) return { label: "চমৎকার", tone: "emerald", advice: "ফসল সুস্থ — বর্তমান সেচ সময়সূচি বজায় রাখুন।" };
  if (v >= 0.6) return { label: "ভালো", tone: "green", advice: "স্বাভাবিক বৃদ্ধি — নিয়মিত পর্যবেক্ষণ চালিয়ে যান।" };
  if (v >= 0.4) return { label: "মাঝারি", tone: "amber", advice: "হালকা চাপ — সেচ ২০% বাড়ানোর কথা বিবেচনা করুন।" };
  if (v >= 0.2) return { label: "চাপে", tone: "orange", advice: "গাছে চাপ — জরুরি সেচ ও পাতা পরিদর্শন দরকার।" };
  return { label: "সঙ্কট", tone: "red", advice: "খালি মাটি বা রোগ — মাঠ পরিদর্শন ও কৃষি বিশেষজ্ঞের পরামর্শ নিন।" };
}

function SatPage() {
  const { zones } = useIrrigationData();
  const [date, setDate] = useState("আজ");

  const ndvi = useMemo(() => zones.map(z => ({
    ...z,
    ndvi: +(0.25 + (z.soilMoisture / 100) * 0.55 + Math.random() * 0.1).toFixed(2),
  })), [zones]);

  const trend = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    week: `সপ্তাহ ${bn(i + 1)}`,
    ndvi: +(0.35 + Math.sin(i / 3) * 0.18 + (i / 25) + Math.random() * 0.05).toFixed(2),
    rain: Math.round(Math.random() * 40 + (i % 4 === 0 ? 30 : 0)),
  })), []);

  const avgNdvi = +(ndvi.reduce((s, z) => s + z.ndvi, 0) / ndvi.length).toFixed(2);
  const healthy = ndvi.filter(z => z.ndvi >= 0.6).length;
  const stressed = ndvi.filter(z => z.ndvi < 0.4).length;
  const sortedNdvi = [...ndvi].sort((a, b) => b.ndvi - a.ndvi);
  const worst = sortedNdvi[sortedNdvi.length - 1];
  const best = sortedNdvi[0];

  return (
    <DashboardLayout
      title="স্যাটেলাইট NDVI · ফসল স্বাস্থ্য বিশ্লেষণ"
      subtitle="Sentinel-2 · ১০ মিটার resolution · প্রতি ৫ দিন পর পর নতুন ছবি"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setDate(date === "আজ" ? "৭ দিন আগে" : "আজ")}>
            <Calendar className="h-3 w-3 mr-1"/>{date}
          </Button>
          <Button size="sm" variant="outline"><RefreshCw className="h-3 w-3 mr-1"/>রিফ্রেশ</Button>
          <Button size="sm"><Download className="h-3 w-3 mr-1"/>GeoTIFF ডাউনলোড</Button>
        </div>
      }
    >
      {/* Purpose banner — "এটি কি কাজের?" */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 overflow-hidden relative">
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
        <CardContent className="p-5 relative">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center shrink-0 shadow-lg shadow-emerald-500/40">
              <Satellite className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-2 flex-1">
              <h2 className="text-lg font-extrabold">এই পেজ কী কাজের?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <b className="text-foreground">NDVI (Normalized Difference Vegetation Index)</b> হলো ইউরোপীয় স্পেস এজেন্সির <b>Sentinel-2 স্যাটেলাইট</b> থেকে পাওয়া ফসলের সবুজতা ও স্বাস্থ্যের সূচক।
                মাটিতে না নেমেই আপনি জানতে পারবেন — <b>কোন জোনে ফসল সুস্থ, কোথায় পানি বা সারের ঘাটতি, কোথায় রোগ বা পোকার আক্রমণ শুরু হয়েছে।</b> ফলে বড় ক্ষতির আগেই ব্যবস্থা নেওয়া যায়।
              </p>
              <div className="grid sm:grid-cols-3 gap-2 pt-1">
                {[
                  { icon: Eye, t: "দূর থেকে পর্যবেক্ষণ", d: "৭০+ একর মাঠ ঘরে বসে দেখুন" },
                  { icon: AlertTriangle, t: "আগেভাগে সতর্কতা", d: "চোখে দেখার আগেই সমস্যা ধরা" },
                  { icon: Droplets, t: "সেচ পরিকল্পনা", d: "কোন জোনে কতটুকু পানি লাগবে" },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-background/60 border">
                    <f.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">{f.t}</p>
                      <p className="text-[11px] text-muted-foreground">{f.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "গড় NDVI",       val: bn(avgNdvi.toFixed(2)), sub: avgNdvi > 0.6 ? "সামগ্রিকভাবে চমৎকার" : avgNdvi > 0.4 ? "মাঝারি স্বাস্থ্য" : "মনোযোগ দরকার", icon: Leaf,      color: "from-emerald-500 via-teal-500 to-cyan-500",     ring: "ring-emerald-300/40" },
          { label: "সুস্থ জোন",       val: `${bn(healthy)}/${bn(ndvi.length)}`, sub: "NDVI ≥ ০.৬০",                                                            icon: CheckCircle2, color: "from-lime-500 via-green-500 to-emerald-500",    ring: "ring-lime-300/40" },
          { label: "সমস্যাযুক্ত জোন", val: bn(stressed),               sub: stressed > 0 ? "জরুরি হস্তক্ষেপ" : "কোনো সঙ্কট নেই",                                    icon: AlertTriangle,color: "from-amber-500 via-orange-500 to-rose-500",     ring: "ring-amber-300/40" },
          { label: "সর্বশেষ Pass",   val: `${bn(2)} দিন`,               sub: "Sentinel-2A · পরবর্তী ৩ দিন পরে",                                                    icon: Satellite,    color: "from-indigo-500 via-violet-500 to-fuchsia-500", ring: "ring-indigo-300/40" },
        ].map((s, i) => (
          <div key={i}
            className={`relative overflow-hidden rounded-2xl p-4 text-white bg-gradient-to-br ${s.color} shadow-lg ring-1 ${s.ring} border-2 border-white/20 animate-fade-in hover-lift`}
            style={{ animationDelay: `${i * 60}ms` }}>
            <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
            <div className="h-9 w-9 rounded-xl bg-white/20 grid place-items-center backdrop-blur-sm">
              <s.icon className="h-5 w-5 drop-shadow" />
            </div>
            <p className="text-[11px] uppercase tracking-wider font-bold mt-2 opacity-95">{s.label}</p>
            <p className="text-3xl font-extrabold mt-1 drop-shadow">{s.val}</p>
            <p className="text-[10px] opacity-90 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* NDVI scale legend — improved & explanatory */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" /> NDVI স্কেল — রঙ কী বোঝায়?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { range: "০.০ – ০.২", color: "rgb(160,60,40)",  label: "খালি মাটি / রোগ", desc: "ফসল নেই বা মৃত" },
              { range: "০.২ – ০.৪", color: "rgb(220,160,50)", label: "চাপে",           desc: "পানি/সার ঘাটতি" },
              { range: "০.৪ – ০.৬", color: "rgb(200,220,80)", label: "মাঝারি",         desc: "বৃদ্ধি পর্যায়" },
              { range: "০.৬ – ০.৭৫",color: "rgb(120,200,80)", label: "ভালো",           desc: "স্বাস্থ্যকর গাছ" },
              { range: "০.৭৫ – ১.০",color: "rgb(40,140,60)",  label: "চমৎকার",         desc: "সর্বোচ্চ সবুজতা" },
            ].map((s, i) => (
              <div key={i} className="rounded-lg border p-2.5 space-y-1.5 hover-lift">
                <div className="h-8 rounded" style={{ background: s.color }} />
                <p className="text-[11px] font-mono font-bold">{s.range}</p>
                <p className="text-xs font-semibold">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heatmap + Zone health list */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-4 w-4 text-success" /> NDVI Heatmap — প্রতি জোনের বর্তমান স্বাস্থ্য
            </CardTitle>
            <p className="text-xs text-muted-foreground">প্রতিটি জোনের রঙ সেই জোনের ফসল-স্বাস্থ্য বোঝায়। জোনে ক্লিক করে বিস্তারিত দেখুন।</p>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                {ndvi.map((z) => (
                  <g key={z.id}>
                    <polygon points={z.polygon} fill={ndviColor(z.ndvi)} fillOpacity={0.85} stroke="white" strokeWidth={0.3} strokeOpacity={0.5}
                      className="hover:fill-opacity-100 transition-opacity cursor-pointer"/>
                    <text x={z.x} y={z.y} fontSize={3} fill="white" textAnchor="middle" fontWeight="bold">{z.id}</text>
                    <text x={z.x} y={z.y + 4} fontSize={2.5} fill="white" textAnchor="middle" opacity={0.9}>{bn(z.ndvi)}</text>
                  </g>
                ))}
              </svg>
              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 text-[10px] text-white">
                <span>{bn("0.0")}</span>
                <div className="flex-1 h-2 rounded" style={{ background: "linear-gradient(to right, rgb(160,60,40), rgb(220,160,50), rgb(200,220,80), rgb(120,200,80), rgb(40,140,60))" }}/>
                <span>{bn("1.0")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Improved zone health section — with progress bar & recommendations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sprout className="h-4 w-4 text-success" /> জোন স্বাস্থ্য র‍্যাঙ্কিং
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">সবচেয়ে ভালো থেকে দুর্বল ক্রমে সাজানো — কোন জোনে দ্রুত ব্যবস্থা নিতে হবে দেখুন।</p>
          </CardHeader>
          <CardContent className="p-2 space-y-1.5 max-h-[420px] overflow-y-auto">
            {sortedNdvi.map((z) => {
              const st = ndviStatus(z.ndvi);
              return (
                <div key={z.id} className="p-2.5 rounded-lg border hover:bg-muted/50 transition space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded shrink-0 ring-2 ring-white/40" style={{ background: ndviColor(z.ndvi) }}/>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{z.id}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{z.cropType}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-mono font-extrabold">{bn(z.ndvi.toFixed(2))}</p>
                      <Badge variant={z.ndvi > 0.6 ? "default" : z.ndvi > 0.4 ? "secondary" : "destructive"} className="text-[9px] px-1.5 py-0">
                        {st.label}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={z.ndvi * 100} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground leading-snug pl-0.5">{st.advice}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Action recommendations */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4"/> সেরা পারফর্মিং জোন
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-base">{best.id}</span>
              <Badge className="bg-green-600">{bn(best.ndvi.toFixed(2))}</Badge>
            </div>
            <p className="text-muted-foreground">ফসল: <b className="text-foreground">{best.cropType}</b></p>
            <p className="text-muted-foreground leading-relaxed">
              এই জোনের সেচ ও সার প্রয়োগ প্যাটার্ন অন্য জোনে অনুসরণ করলে সামগ্রিক ফলন বাড়ানো সম্ভব।
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-rose-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4"/> জরুরি হস্তক্ষেপ দরকার
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-base">{worst.id}</span>
              <Badge variant="destructive">{bn(worst.ndvi.toFixed(2))}</Badge>
            </div>
            <p className="text-muted-foreground">ফসল: <b className="text-foreground">{worst.cropType}</b></p>
            <p className="text-muted-foreground leading-relaxed">{ndviStatus(worst.ndvi).advice}</p>
            <Button size="sm" variant="outline" className="w-full mt-1">
              <Droplets className="h-3 w-3 mr-1"/> এই জোনে সেচ চালু করুন
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Trend chart — improved */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary"/> ১২ সপ্তাহের প্রবণতা — NDVI বনাম বৃষ্টিপাত
          </CardTitle>
          <p className="text-xs text-muted-foreground">বৃষ্টির পর NDVI বাড়ে কি না দেখে সেচ কার্যকারিতা যাচাই করুন।</p>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="ndviG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
              <XAxis dataKey="week" fontSize={10}/>
              <YAxis yAxisId="l" fontSize={11} domain={[0, 1]}/>
              <YAxis yAxisId="r" orientation="right" fontSize={11}/>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}/>
              <Legend wrapperStyle={{ fontSize: 12 }}/>
              <Area yAxisId="l" type="monotone" dataKey="ndvi" stroke="hsl(var(--success))" strokeWidth={2.5} fill="url(#ndviG)" name="NDVI সূচক"/>
              <Line yAxisId="r" type="monotone" dataKey="rain" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} name="বৃষ্টি (mm)"/>
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* How it works — expanded footer */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4 text-primary"/> কীভাবে কাজ করে?</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3 text-xs">
          {[
            { icon: Sun,       t: "১. স্যাটেলাইট ছবি", d: "Sentinel-2 প্রতি ৫ দিনে ১০ মিটার রেজোলিউশনে বাংলাদেশের ছবি তোলে — বিনামূল্যে।" },
            { icon: Leaf,      t: "২. NDVI গণনা",     d: "NIR (near-infrared) ও লাল আলোর অনুপাত থেকে সবুজতা মাপা হয়: NDVI = (NIR − Red) / (NIR + Red)।" },
            { icon: CloudRain, t: "৩. সিদ্ধান্ত",       d: "মান কম হলে সেচ/সার প্রয়োজন, বৃদ্ধি স্থবির হলে রোগ সন্দেহ — মাঠ পরিদর্শন করুন।" },
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center">
                <s.icon className="h-4 w-4 text-primary"/>
              </div>
              <p className="font-bold text-[13px]">{s.t}</p>
              <p className="text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
          <div className="md:col-span-3 text-[11px] text-muted-foreground pt-1 border-t">
            <b className="text-foreground">Data source:</b> Production-এ Copernicus Open Access Hub বা Sentinel Hub API থেকে বিনামূল্যে NDVI imagery নেওয়া যাবে। বর্তমানে ডেমো ডেটা দেখানো হচ্ছে।
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
