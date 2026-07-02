
CREATE TABLE public.telemetry_history (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  zone_id TEXT NOT NULL,
  soil_moisture NUMERIC,
  water_level NUMERIC,
  ldr NUMERIC,
  temperature NUMERIC,
  humidity NUMERIC,
  valve_open BOOLEAN,
  motor_on BOOLEAN,
  flow_lpm NUMERIC,
  voltage NUMERIC,
  current NUMERIC,
  rssi NUMERIC,
  tds_ppm NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telemetry_history_device_time ON public.telemetry_history (device_id, created_at DESC);
CREATE INDEX idx_telemetry_history_zone_time ON public.telemetry_history (zone_id, created_at DESC);
CREATE INDEX idx_telemetry_history_created_at ON public.telemetry_history (created_at DESC);

GRANT SELECT ON public.telemetry_history TO authenticated;
GRANT ALL ON public.telemetry_history TO service_role;

ALTER TABLE public.telemetry_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read telemetry history"
  ON public.telemetry_history FOR SELECT
  TO authenticated
  USING (true);
