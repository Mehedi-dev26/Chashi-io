-- =====================================================================
-- Chashi.io — COMPLETE BACKEND SETUP (single-file, idempotent)
-- =====================================================================
-- Run this once in the SQL editor of a FRESH Supabase project.
-- It recreates: enums, tables, grants, RLS policies, indexes,
-- functions, triggers, realtime publication.
-- Afterwards only the .env values need to be changed in the app:
--   VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_PROJECT_ID
--   SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SUPABASE_SERVICE_ROLE_KEY
-- NOTE: admin bootstrap e-mail is set in handle_new_user() near the bottom.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- ---------------------------------------------------------------------
-- 1. ENUM TYPES
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'operator', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.gps_asset_kind AS ENUM ('field', 'valve', 'motor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- 2. SHARED FUNCTIONS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ---------------------------------------------------------------------
-- 3. PROFILES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text,
  display_name text,
  avatar_url   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------
-- 4. USER ROLES (never store roles on profiles!)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

DROP POLICY IF EXISTS "Users see own roles" ON public.user_roles;
CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert roles" ON public.user_roles;
CREATE POLICY "Admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update roles" ON public.user_roles;
CREATE POLICY "Admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete roles" ON public.user_roles;
CREATE POLICY "Admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 5. FIELDS (zones)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fields (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id       text NOT NULL,
  name          text NOT NULL,
  name_bn       text NOT NULL,
  area_acres    numeric NOT NULL DEFAULT 1,
  crop_type     text NOT NULL DEFAULT 'Rice',
  x             numeric NOT NULL DEFAULT 50,
  y             numeric NOT NULL DEFAULT 50,
  polygon       text NOT NULL DEFAULT '20,20 60,20 60,60 20,60',
  valve_node_id text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, zone_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fields TO authenticated;
GRANT ALL ON public.fields TO service_role;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own fields" ON public.fields;
CREATE POLICY "Users manage own fields" ON public.fields
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS fields_updated_at ON public.fields;
CREATE TRIGGER fields_updated_at BEFORE UPDATE ON public.fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 6. FIELD NODES (sub-node ESP devices)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.field_nodes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id  text NOT NULL UNIQUE,
  zone_id    text,
  label      text NOT NULL,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.field_nodes TO authenticated;
GRANT ALL ON public.field_nodes TO service_role;
ALTER TABLE public.field_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own field nodes" ON public.field_nodes;
CREATE POLICY "Users manage own field nodes" ON public.field_nodes
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS field_nodes_updated_at ON public.field_nodes;
CREATE TRIGGER field_nodes_updated_at BEFORE UPDATE ON public.field_nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 7. DEVICE TELEMETRY (latest snapshot per zone; written by service role)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.device_telemetry (
  zone_id        text PRIMARY KEY,
  device_id      text NOT NULL,
  soil_moisture  numeric DEFAULT 0,
  water_level    numeric DEFAULT 0,
  ldr            numeric DEFAULT 0,
  temperature    numeric,
  humidity       numeric,
  valve_open     boolean DEFAULT false,
  motor_on       boolean DEFAULT false,
  flow_lpm       numeric,
  voltage        numeric,
  current        numeric,
  runtime_sec    numeric,
  rssi           numeric,
  tds_ppm        numeric,
  soil_connected boolean NOT NULL DEFAULT true,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.device_telemetry TO authenticated;
GRANT ALL ON public.device_telemetry TO service_role;
ALTER TABLE public.device_telemetry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own device telemetry" ON public.device_telemetry;
CREATE POLICY "Users read own device telemetry" ON public.device_telemetry
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.field_nodes fn
            WHERE fn.device_id = device_telemetry.device_id AND fn.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.fields f
            WHERE f.zone_id = device_telemetry.zone_id AND f.user_id = auth.uid())
    OR (device_id = 'MASTER-01' AND EXISTS (SELECT 1 FROM public.fields f WHERE f.user_id = auth.uid()))
  );

-- ---------------------------------------------------------------------
-- 8. TELEMETRY HISTORY (time series)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telemetry_history (
  id             bigserial PRIMARY KEY,
  device_id      text NOT NULL,
  zone_id        text NOT NULL,
  soil_moisture  numeric,
  water_level    numeric,
  ldr            numeric,
  temperature    numeric,
  humidity       numeric,
  valve_open     boolean,
  motor_on       boolean,
  flow_lpm       numeric,
  voltage        numeric,
  current        numeric,
  rssi           numeric,
  tds_ppm        numeric,
  soil_connected boolean,
  created_at     timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.telemetry_history TO authenticated;
GRANT ALL ON public.telemetry_history TO service_role;
ALTER TABLE public.telemetry_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read telemetry history" ON public.telemetry_history;
CREATE POLICY "Authenticated users can read telemetry history" ON public.telemetry_history
  FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_telemetry_history_created_at ON public.telemetry_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_history_zone_time   ON public.telemetry_history (zone_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_history_device_time ON public.telemetry_history (device_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 9. DEVICE COMMANDS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.device_commands (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   text NOT NULL,
  zone_id     text,
  action      text NOT NULL,
  consumed    boolean NOT NULL DEFAULT false,
  issued_by   uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);

GRANT SELECT, INSERT ON public.device_commands TO authenticated;
GRANT ALL ON public.device_commands TO service_role;
ALTER TABLE public.device_commands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own device commands" ON public.device_commands;
CREATE POLICY "Users read own device commands" ON public.device_commands
  FOR SELECT TO authenticated
  USING (
    auth.uid() = issued_by
    OR EXISTS (SELECT 1 FROM public.field_nodes fn
               WHERE fn.device_id = device_commands.device_id AND fn.user_id = auth.uid())
    OR (device_id = 'MASTER-01' AND EXISTS (SELECT 1 FROM public.fields f WHERE f.user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "commands authenticated insert" ON public.device_commands;
CREATE POLICY "commands authenticated insert" ON public.device_commands
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = issued_by);

CREATE INDEX IF NOT EXISTS device_commands_pending_idx
  ON public.device_commands (device_id) WHERE consumed = false;

-- ---------------------------------------------------------------------
-- 10. MOTOR RUNTIME LOG
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.motor_runtime_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   text NOT NULL,
  delta_sec   integer NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.motor_runtime_log TO authenticated;
GRANT ALL ON public.motor_runtime_log TO service_role;
ALTER TABLE public.motor_runtime_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own motor runtime" ON public.motor_runtime_log;
CREATE POLICY "Users read own motor runtime" ON public.motor_runtime_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.field_nodes fn
            WHERE fn.device_id = motor_runtime_log.device_id AND fn.user_id = auth.uid())
    OR (device_id = 'MASTER-01' AND EXISTS (SELECT 1 FROM public.fields f WHERE f.user_id = auth.uid()))
  );

CREATE INDEX IF NOT EXISTS motor_runtime_log_device_recorded_idx
  ON public.motor_runtime_log (device_id, recorded_at DESC);

-- ---------------------------------------------------------------------
-- 11. GPS ASSETS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gps_assets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind       public.gps_asset_kind NOT NULL,
  label      text NOT NULL,
  lat        double precision NOT NULL,
  lng        double precision NOT NULL,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gps_assets TO authenticated;
GRANT ALL ON public.gps_assets TO service_role;
ALTER TABLE public.gps_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own gps assets" ON public.gps_assets;
CREATE POLICY "Users manage own gps assets" ON public.gps_assets
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS gps_assets_user_idx ON public.gps_assets (user_id);

DROP TRIGGER IF EXISTS gps_assets_updated ON public.gps_assets;
CREATE TRIGGER gps_assets_updated BEFORE UPDATE ON public.gps_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 12. GPS PIPELINES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gps_pipelines (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label      text NOT NULL,
  color      text NOT NULL DEFAULT '#0ea5e9',
  points     jsonb NOT NULL,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gps_pipelines TO authenticated;
GRANT ALL ON public.gps_pipelines TO service_role;
ALTER TABLE public.gps_pipelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own pipelines" ON public.gps_pipelines;
CREATE POLICY "Users manage own pipelines" ON public.gps_pipelines
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_gps_pipelines_user ON public.gps_pipelines (user_id);

DROP TRIGGER IF EXISTS update_gps_pipelines_updated_at ON public.gps_pipelines;
CREATE TRIGGER update_gps_pipelines_updated_at BEFORE UPDATE ON public.gps_pipelines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 13. AI CHATS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_chats (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chats TO authenticated;
GRANT ALL ON public.ai_chats TO service_role;
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ai chats" ON public.ai_chats;
CREATE POLICY "Users manage own ai chats" ON public.ai_chats
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS ai_chats_user_created_idx ON public.ai_chats (user_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 14. NEW USER BOOTSTRAP (profile + default role)
--     >>> change the admin e-mail below when migrating <<<
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  IF NEW.email = 'mehediworkpc@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------
-- 15. REALTIME
-- ---------------------------------------------------------------------
ALTER TABLE public.device_telemetry REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.device_telemetry;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- DONE.
-- Post-migration checklist:
--  1. Auth > Providers: enable Email (and Google if used).
--  2. Set project secrets: LOVABLE_API_KEY (or your AI key).
--  3. Update the app .env with the new project URL + keys.
--  4. Sign up with the admin e-mail so the admin role is granted.
-- =====================================================================
