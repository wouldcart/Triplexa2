-- Add created_by linkage to agents and index for lookups
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Add FK to profiles(id) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'agents'
      AND c.conname = 'agents_created_by_fkey'
  ) THEN
    ALTER TABLE public.agents
      ADD CONSTRAINT agents_created_by_fkey FOREIGN KEY (created_by)
      REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Helpful index for queries by creator
CREATE INDEX IF NOT EXISTS idx_agents_created_by ON public.agents(created_by);