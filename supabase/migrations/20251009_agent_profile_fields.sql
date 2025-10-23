-- Ensure profiles has extended fields for management editing
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_image text,
  ADD COLUMN IF NOT EXISTS preferred_language text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text;

-- Ensure agents has extended fields for management editing
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS agent_type text,
  ADD COLUMN IF NOT EXISTS commission_type text,
  ADD COLUMN IF NOT EXISTS commission_value numeric,
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS source_details text;

-- Add FK from agents.id to profiles.id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'agents'
      AND c.conname = 'agents_id_fkey'
  ) THEN
    ALTER TABLE public.agents
      ADD CONSTRAINT agents_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Optional: indexes for lookup
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_agents_type ON public.agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents(status);