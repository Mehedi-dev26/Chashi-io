ALTER TABLE public.device_telemetry ADD COLUMN IF NOT EXISTS soil_connected boolean NOT NULL DEFAULT true;
ALTER TABLE public.telemetry_history ADD COLUMN IF NOT EXISTS soil_connected boolean;