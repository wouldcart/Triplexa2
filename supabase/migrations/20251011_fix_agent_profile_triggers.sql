-- Fix missing agent profile trigger functions and clean up duplicate FK

-- Helper to maintain updated_at (present in repo, included here for safety)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle agent profile insert
CREATE OR REPLACE FUNCTION handle_agent_profile_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := NEW.role;
BEGIN
  -- Only auto-create agent rows for 'agent' profiles
  IF v_role = 'agent' THEN
    INSERT INTO public.agents (
      user_id, name, email, status, country, city, created_at, updated_at
    ) VALUES (
      NEW.id, NEW.name, NEW.email, COALESCE(NEW.status, 'active'), NEW.country, NEW.city, NOW(), NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle agent profile update
CREATE OR REPLACE FUNCTION handle_agent_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.agents AS a
  SET
    name = COALESCE(NEW.name, a.name),
    email = COALESCE(NEW.email, a.email),
    status = COALESCE(NEW.status, a.status),
    country = COALESCE(NEW.country, a.country),
    city = COALESCE(NEW.city, a.city),
    updated_at = NOW()
  WHERE a.user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wire up triggers on profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_agent_profile_insert'
  ) THEN
    EXECUTE 'DROP TRIGGER on_agent_profile_insert ON public.profiles';
  END IF;
  EXECUTE 'CREATE TRIGGER on_agent_profile_insert AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_agent_profile_insert()';
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_agent_profile_update'
  ) THEN
    EXECUTE 'DROP TRIGGER on_agent_profile_update ON public.profiles';
  END IF;
  EXECUTE 'CREATE TRIGGER on_agent_profile_update AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_agent_profile_update()';
END $$;

-- Ensure updated_at trigger is present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    EXECUTE 'DROP TRIGGER update_profiles_updated_at ON public.profiles';
  END IF;
  EXECUTE 'CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
END $$;

-- Drop duplicate FK on agents.user_id (keep the ON DELETE CASCADE one)
ALTER TABLE public.agents
DROP CONSTRAINT IF EXISTS agents_user_id_fkey1;