import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIrrigationData } from "@/hooks/useIrrigationData";
import { MapPin, Navigation, Layers, Crosshair, Locate } from "lucide-react";

export const Route = createFileRoute("/gps")({
  head: () => ({ meta: [{ title: "GPS মানচিত্র · BMDA" }] }),
  component: GpsPage,
});

// Rajshahi/Barind area approximate coords
const CENTER = { lat: 24.3745, lng: 88.6042 };

function GpsPage() {
  const { zones } = useIrrigationData();
  const [layer, setLayer] = useState<"satellite" | "street" | "terrain">("satellite");
  const [selected, setSelected] = useState<string | null>(null);

  const tile = {
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile",
    street: "https://tile.openstreetmap.org",
    terrain: "https://tile.opentopomap.org",
  }[layer];

  // simple computed bbox display
  const bbox = `${(CENTER.lng - 0.02).toFixed(4)},${(CENTER.lat - 0.015).toFixed(4)},${(CENTER.lng + 0.02).toFixed(4)},${(CENTER.lat + 0.015).toFixed(4)}`;
  const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${CENTER.lat},${CENTER.lng}`;

  return (
    <DashboardLayout
      title="GPS · স্যাটেলাইট মানচিত্র"
      subtitle={`বরেন্দ্র, রাজশাহী — ${CENTER.lat.toFixed(4)}°N, ${CENTER.lng.toFixed(4)}°E`}
      actions={
        <div className="flex gap-2">
          {(["satellite", "street", "terrain"] as const).map(l => (
            <Button key={l} size="sm" variant={layer === l ? "default" : "outline"} onClick={() => setLayer(l)}>
              <Layers className="h-3 w-3 mr-1"/>{l === "satellite" ? "স্যাটেলাইট" : l === "street" ? "রাস্তা" : "ভূ-ভাগ"}
            </Button>
          ))}
          <Button size="sm" variant="outline"><Locate className="h-3 w-3 mr-1"/>আমার অবস্থান</Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <div className="relative aspect-[16/10] bg-muted">
            <iframe
              key={layer}
              src={osmEmbed}
              className="absolute inset-0 w-full h-full"
              style={{ border: 0 }}
              title="GPS Map"
              loading="lazy"
            />
            {/* overlay markers */}
            <div className="absolute inset-0 pointer-events-none">
              {zones.map((z, i) => (
                <button
                  key={z.id}
                  onClick={() => setSelected(z.id)}
                  className="absolute pointer-events-auto -translate-x-1/2 -translate-y-full animate-fade-in"
                  style={{ left: `${15 + i * 11}%`, top: `${30 + (i % 3) * 18}%`, animationDelay: `${i * 80}ms` }}
                >
                  <div className={`relative ${selected === z.id ? "scale-125" : ""} transition-transform`}>
                    <MapPin className={`h-7 w-7 drop-shadow-lg ${
                      z.status === "alert" ? "text-destructive fill-destructive/30" :
                      z.status === "irrigating" ? "text-chart-1 fill-chart-1/30" :
                      "text-success fill-success/30"
                    }`}/>
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-success animate-pulse ring-1 ring-white"/>
                  </div>
                </button>
              ))}
            </div>
            <div className="absolute top-3 left-3 px-2 py-1 rounded bg-background/90 backdrop-blur text-[10px] font-mono">
              {tile.split("//")[1].split("/")[0]}
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Navigation className="h-4 w-4"/>জোন তালিকা</CardTitle></CardHeader>
            <CardContent className="p-2 space-y-1 max-h-96 overflow-y-auto">
              {zones.map((z, i) => (
                <button key={z.id} onClick={() => setSelected(z.id)}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-center justify-between ${selected === z.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"}`}>
                  <div>
                    <p className="text-sm font-semibold">{z.id} · {z.nameBn}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {(CENTER.lat + (i - 3) * 0.003).toFixed(5)}, {(CENTER.lng + (i - 3) * 0.004).toFixed(5)}
                    </p>
                  </div>
                  <Badge variant={z.status === "alert" ? "destructive" : "secondary"} className="text-[10px]">{z.area} একর</Badge>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card><CardContent className="p-3 text-xs space-y-2">
            <div className="flex items-center gap-2 text-success"><Crosshair className="h-3.5 w-3.5"/>GPS Lock: ৯ স্যাটেলাইট</div>
            <div className="text-muted-foreground">Accuracy: ±২.৪ মিটার · Tile: OpenStreetMap</div>
            <div className="text-muted-foreground">Production-এ Mapbox/Leaflet token যোগ করলে full vector map পাবেন।</div>
          </CardContent></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
