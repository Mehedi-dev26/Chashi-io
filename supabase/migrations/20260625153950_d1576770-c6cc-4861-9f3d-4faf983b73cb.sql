
-- Telemetry: latest snapshot per zone (upserted by ESP32 every 5s)
CREATE TABLE public.device_telemetry (
  zone_id text PRIMARY KEY,
  device_id text NOT NULL,
  soil_moisture numeric DEFAULT 0,
  water_level numeric DEFAULT 0,
  ldr numeric DEFAULT 0,
  temperature numeric,
  humidity numeric,
  valve_open boolean DEFAULT false,
  motor_on boolean DEFAULT false,
  flow_lpm numeric,
  voltage numeric,
  current numeric,
  runtime_sec numeric,
  rssi numeric,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.device_telemetry TO anon, authenticated;
GRANT ALL ON public.device_telemetry TO service_role;
ALTER TABLE public.device_telemetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telemetry public read" ON public.device_telemetry FOR SELECT USING (true);

-- Commands: queued by dashboard, popped by ESP32
CREATE TABLE public.device_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  zone_id text,
  action text NOT NULL CHECK (action IN ('valve_open','valve_close','motor_on','motor_off')),
  consumed boolean NOT NULL DEFAULT false,
  issued_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);
CREATE INDEX device_commands_pending_idx ON public.device_commands (device_id) WHERE consumed = false;
GRANT SELECT, INSERT, UPDATE ON public.device_commands TO authenticated;
GRANT ALL ON public.device_commands TO service_role;
ALTER TABLE public.device_commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commands authenticated read" ON public.device_commands FOR SELECT TO authenticated USING (true);
CREATE POLICY "commands authenticated insert" ON public.device_commands FOR INSERT TO authenticated WITH CHECK (auth.uid() = issued_by);

-- Enable realtime on telemetry so the dashboard updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_telemetry;
ALTER TABLE public.device_telemetry REPLICA IDENTITY FULL;
