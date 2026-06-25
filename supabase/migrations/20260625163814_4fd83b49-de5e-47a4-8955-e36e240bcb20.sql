ALTER TABLE public.field_nodes ALTER COLUMN zone_id DROP NOT NULL;
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS valve_node_id text;