-- Minimal, safe handle_new_user to unblock signup
-- Scope: only ensures a profiles row; defers any agent-related work
-- Rationale: avoid brittle inserts into varying agent/profile schemas during auth

BEGIN;

-- Remove any previous trigger/function to avoid multiple/inconsistent versions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Hardened minimal function: upsert profiles only, swallow errors, set search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_role TEXT;
BEGIN
  -- Derive name and role safely from raw_user_meta_data
  user_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'name',''), split_part(NEW.email,'@',1));
  user_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'agent');

  -- Ensure a profiles row exists and stays in sync
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, user_name, user_role, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    updated_at = NOW();

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Avoid blocking signup; log and continue
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Reattach the trigger cleanly
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

COMMIT;