-- Ensure only 'agent' profiles create rows in public.agents
-- Drop legacy unguarded triggers and clean up existing non-agent rows

BEGIN;

-- 1) Drop legacy triggers that sync agents without role checks
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_profile_insert_sync_agent') THEN
    EXECUTE 'DROP TRIGGER on_profile_insert_sync_agent ON public.profiles';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_profile_update_sync_agent') THEN
    EXECUTE 'DROP TRIGGER on_profile_update_sync_agent ON public.profiles';
  END IF;
END $$;

-- 2) Role-aware agent sync functions (idempotent)
CREATE OR REPLACE FUNCTION public.handle_agent_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role = 'agent' THEN
    INSERT INTO public.agents (
      user_id, name, email, status, country, city, created_at, updated_at
    ) VALUES (
      NEW.id, NEW.name, NEW.email, COALESCE(NEW.status, 'active'), NEW.country, NEW.city, NOW(), NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_agent_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- 3) Ensure role-aware triggers are attached (and only these)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_agent_profile_insert') THEN
    EXECUTE 'CREATE TRIGGER on_agent_profile_insert AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_agent_profile_insert()';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_agent_profile_update') THEN
    EXECUTE 'CREATE TRIGGER on_agent_profile_update AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_agent_profile_update()';
  END IF;
END $$;

-- 4) Ensure handle_new_user only creates agent rows for agent role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_role TEXT;
  user_phone TEXT;
  user_department TEXT;
  user_position TEXT;
  user_employee_id TEXT;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'agent');
  user_phone := NEW.raw_user_meta_data->>'phone';
  user_department := NEW.raw_user_meta_data->>'department';
  user_position := NEW.raw_user_meta_data->>'position';
  user_employee_id := NEW.raw_user_meta_data->>'employee_id';

  INSERT INTO public.profiles (
    id, email, name, role, phone, department, position, employee_id, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email, user_name, user_role, user_phone, user_department, user_position, user_employee_id, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    department = COALESCE(EXCLUDED.department, profiles.department),
    position = COALESCE(EXCLUDED.position, profiles.position),
    employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
    updated_at = NOW();

  IF user_role = 'agent' THEN
    INSERT INTO public.agents (
      user_id, name, email, status, created_at, updated_at
    ) VALUES (
      NEW.id, user_name, NEW.email, 'active', NOW(), NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 5) Cleanup: remove agent rows tied to non-agent profiles
DELETE FROM public.agents a
USING public.profiles p
WHERE a.user_id = p.id
AND COALESCE(p.role, 'agent') <> 'agent';

COMMIT;