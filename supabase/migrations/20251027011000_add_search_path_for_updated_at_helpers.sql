-- Add explicit search_path to updated_at trigger helper functions
-- and create missing public.update_updated_at_column for consistent usage.

BEGIN;

-- Ensure public.update_updated_at_column exists and uses explicit search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Ensure public.handle_updated_at_generic uses explicit search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at_generic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Provide public.set_timestamp as a compatibility helper
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Intentionally avoid creating functions in the "storage" schema.
-- Supabase manages the storage schema via extensions and typical roles
-- executing migrations may not have CREATE permission there. We rely on
-- public.update_updated_at_column() and bind triggers to that instead.

-- Ensure sightseeing trigger binds to the public-qualified function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'update_sightseeing_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'sightseeing'
  ) THEN
    EXECUTE 'DROP TRIGGER update_sightseeing_updated_at ON public.sightseeing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name = 'update_updated_at_column'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_sightseeing_updated_at BEFORE UPDATE ON public.sightseeing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

COMMIT;