import type { supabaseAdmin as SupabaseAdmin } from "@/integrations/supabase/client.server";

type RuntimeRow = { delta_sec: number | null; recorded_at?: string | null };

export const PAGE_SIZE = 1000;

export const sumPagedRuntime = async (
  supabaseAdmin: typeof SupabaseAdmin,
  deviceId: string,
  sinceIso: string,
) => {
  let totalSec = 0;
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data: page, error } = await supabaseAdmin
      .from("motor_runtime_log")
      .select("delta_sec")
      .eq("device_id", deviceId)
      .gte("recorded_at", sinceIso)
      .order("recorded_at", { ascending: true })
      .range(from, to);

    if (error) throw error;
    const rows = (page ?? []) as RuntimeRow[];
    totalSec += rows.reduce((sum, row) => sum + Number(row.delta_sec || 0), 0);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return totalSec;
};

export const fetchPagedRuntimeRows = async (
  supabaseAdmin: typeof SupabaseAdmin,
  deviceId: string,
  sinceIso: string,
) => {
  const allRows: RuntimeRow[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data: page, error } = await supabaseAdmin
      .from("motor_runtime_log")
      .select("delta_sec, recorded_at")
      .eq("device_id", deviceId)
      .gte("recorded_at", sinceIso)
      .order("recorded_at", { ascending: true })
      .range(from, to);

    if (error) throw error;
    const rows = (page ?? []) as RuntimeRow[];
    allRows.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows;
};
