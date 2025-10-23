-- supabase/migrations/20240715120000_fix_handle_new_user_trigger.sql

-- Drop the existing trigger and function to ensure a clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
-- Profile↔Agent sync housekeeping
DROP TRIGGER IF EXISTS on_profile_insert_sync_agent ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_update_sync_agent ON public.profiles;
-- Also drop potential legacy-named triggers
DROP TRIGGER IF EXISTS on_agent_profile_insert ON public.profiles;
DROP TRIGGER IF EXISTS on_agent_profile_update ON public.profiles;
-- Use CASCADE to remove dependent triggers if any remain
DROP FUNCTION IF EXISTS public.handle_agent_profile_insert() CASCADE;
DROP FUNCTION IF EXISTS public.handle_agent_profile_update() CASCADE;

-- Create the function to insert a new user profile
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new profile record for the new user
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    'agent' -- Default role for new sign-ups
  )
  ON CONFLICT (id) DO NOTHING;

  -- Also insert/upsert an agent record linked to the same user
  INSERT INTO public.agents (
    id,
    user_id,
    status,
    name,
    email,
    business_phone,
    source_type,
    source_details
  )
  VALUES (
    NEW.id,
    NEW.id,
    'inactive',
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    'auth',
    'on_auth_user_created'
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    name = COALESCE(EXCLUDED.name, agents.name),
    email = COALESCE(EXCLUDED.email, agents.email),
    status = COALESCE(EXCLUDED.status, agents.status),
    business_phone = COALESCE(EXCLUDED.business_phone, agents.business_phone),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Create the trigger to execute the function after a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Sync agent on profile INSERT
CREATE FUNCTION public.handle_agent_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.agents (
    id,
    user_id,
    status,
    name,
    email,
    agency_name,
    source_type,
    source_details
  )
  VALUES (
    NEW.id,
    NEW.id,
    'inactive',
    COALESCE(NEW.name, NEW.email),
    COALESCE(NEW.email, NEW.id::text),
    NULLIF(NEW.company_name, ''),
    'profile',
    'on_profile_insert'
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    name = COALESCE(EXCLUDED.name, agents.name),
    email = COALESCE(EXCLUDED.email, agents.email),
    agency_name = COALESCE(EXCLUDED.agency_name, agents.agency_name),
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_insert_sync_agent
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_agent_profile_insert();

-- Sync agent on profile UPDATE
CREATE FUNCTION public.handle_agent_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.agents AS a SET
    name = COALESCE(NEW.name, a.name),
    email = COALESCE(NEW.email, a.email),
    agency_name = COALESCE(NULLIF(NEW.company_name, ''), a.agency_name),
    updated_at = now()
  WHERE a.id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_update_sync_agent
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_agent_profile_update();