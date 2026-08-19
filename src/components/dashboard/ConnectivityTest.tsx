import { useState } from "react";
import { Activity, CheckCircle2, XCircle, Loader2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type DeviceResult = {
  deviceId: string;
  zoneId: string;
  reachable: boolean;
  latencyMs: number | null;
  lastSeenSec: number | null;
  online: boolean;
  error?: string;
};

const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

async function pingEndpoint(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const t0 = performance.now();
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "fjyhsziphwepdkpiqiod";
  try {
    const r = await fetch(`https://${projectId}.functions.supabase.co/telemetry`, { method: "GET", cache: "no-store" });
    const latencyMs = Math.round(performance.now() - t0);
    if (!r.ok) return { ok: false, latencyMs, error: `HTTP ${r.status}` };
    const j = await r.json().catch(() => ({}));
    return { ok: Boolean(j?.ok), latencyMs };
  } catch (e) {
    return { ok: false, latencyMs: Math.round(performance.now() - t0), error: String(e) };
  }
}

export function ConnectivityTest() {
  const [running, setRunning] = useState(false);
  const [ranAt, setRanAt] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<{ ok: boolean; latencyMs: number; error?: string } | null>(null);
  const [devices, setDevices] = useState<DeviceResult[]>([]);

  const run = async () => {
    setRunning(true);
    try {
      const ep = await pingEndpoint();
      setEndpoint(ep);

      // Collect known devices: MASTER-01 + registered field_nodes
      const [{ data: nodes }, { data: tele }] = await Promise.all([
        supabase.from("field_nodes").select("device_id, zone_id"),
        supabase.from("device_telemetry").select("device_id, zone_id, updated_at"),
      ]);

      const known = new Map<string, string>();
      known.set("MASTER-01", "PUMP-HOUSE");
      (nodes ?? []).forEach((n: any) => { if (n?.device_id) known.set(n.device_id, n.zone_id ?? "-"); });

      const teleMap = new Map<string, string>();
      (tele ?? []).forEach((t: any) => { if (t?.device_id && t?.updated_at) teleMap.set(t.device_id, t.updated_at); });

      const now = Date.now();
      const results: DeviceResult[] = Array.from(known.entries()).map(([deviceId, zoneId]) => {
        const seen = teleMap.get(deviceId);
        const lastSeenSec = seen ? Math.floor((now - new Date(seen).getTime()) / 1000) : null;
        const online = lastSeenSec != null && lastSeenSec <= 15;
        return {
          deviceId,
          zoneId,
          reachable: ep.ok,
          latencyMs: ep.ok ? ep.latencyMs : null,
          lastSeenSec,
          online,
        };
      });

      setDevices(results);
      setRanAt(new Intl.DateTimeFormat("bn-BD", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white shadow-md">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">সংযোগ পরীক্ষা</h2>
            <p className="text-xs text-muted-foreground">POST endpoint ও প্রতিটি ডিভাইসের অবস্থা যাচাই</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ranAt && <span className="text-[11px] text-muted-foreground">সর্বশেষ · {bn(ranAt)}</span>}
          <Button onClick={run} disabled={running} size="sm" className="gap-1.5">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
            {running ? "চলছে..." : "পরীক্ষা চালান"}
          </Button>
        </div>
      </div>

      {endpoint && (
        <div className={`mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${endpoint.ok ? "bg-success/10 border-success/30 text-success" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
          {endpoint.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <span className="font-semibold">hardware /telemetry</span>
          <span className="opacity-70">·</span>
          <span>{endpoint.ok ? `উপলব্ধ · ${bn(endpoint.latencyMs)}ms` : `ব্যর্থ · ${endpoint.error ?? "unknown"}`}</span>
        </div>
      )}

      {devices.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border/70">
          <table className="w-full text-xs">
            <thead className="bg-secondary/50">
              <tr className="text-left">
                <th className="px-3 py-2 font-semibold">ডিভাইস</th>
                <th className="px-3 py-2 font-semibold">জোন</th>
                <th className="px-3 py-2 font-semibold">Endpoint</th>
                <th className="px-3 py-2 font-semibold">সর্বশেষ POST</th>
                <th className="px-3 py-2 font-semibold">অবস্থা</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.deviceId} className="border-t border-border/60">
                  <td className="px-3 py-2 font-mono font-semibold">{d.deviceId}</td>
                  <td className="px-3 py-2 font-mono opacity-80">{d.zoneId}</td>
                  <td className="px-3 py-2">
                    {d.reachable ? (
                      <span className="text-success">OK · {bn(d.latencyMs ?? 0)}ms</span>
                    ) : (
                      <span className="text-destructive">ব্যর্থ</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {d.lastSeenSec == null ? (
                      <span className="text-muted-foreground">কখনো না</span>
                    ) : d.lastSeenSec < 60 ? (
                      <span>{bn(d.lastSeenSec)}s আগে</span>
                    ) : d.lastSeenSec < 3600 ? (
                      <span>{bn(Math.floor(d.lastSeenSec / 60))}m আগে</span>
                    ) : (
                      <span>{bn(Math.floor(d.lastSeenSec / 3600))}h আগে</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {d.online ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> অনলাইন
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> অফলাইন
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!endpoint && !running && (
        <p className="text-xs text-muted-foreground">
          বাটনে চাপ দিন — endpoint reachability ও প্রতিটি নিবন্ধিত ডিভাইসের সর্বশেষ POST সময় দেখানো হবে।
        </p>
      )}
    </div>
  );
}
