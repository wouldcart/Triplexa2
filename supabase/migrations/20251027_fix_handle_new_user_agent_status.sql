-- Harden handle_new_user for agent signup: avoid invalid status and column mismatches
-- - Inserts/Upserts into profiles only
-- - Creates agent row with minimal columns and valid status ('inactive')
-- - Keeps SECURITY DEFINER and exception handling to prevent signup failures

BEGIN;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

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
  -- Extract metadata with fallbacks
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  user_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'agent');
  user_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  user_department := NULLIF(NEW.raw_user_meta_data->>'department', '');
  user_position := NULLIF(NEW.raw_user_meta_data->>'position', '');
  user_employee_id := NULLIF(NEW.raw_user_meta_data->>'employee_id', '');

  -- Upsert profile
  INSERT INTO public.profiles (
    id, email, name, role, phone, department, position, employee_id, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email, user_name, user_role, user_phone, user_department, user_position, user_employee_id, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    department = COALESCE(EXCLUDED.department, profiles.department),
    position = COALESCE(EXCLUDED.position, profiles.position),
    employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
    updated_at = NOW();

  -- Create agent row only for agent role, with valid status
  IF user_role = 'agent' THEN
    INSERT INTO public.agents (
      user_id, name, email, status, created_at, updated_at
    ) VALUES (
      NEW.id, user_name, NEW.email, 'inactive', NOW(), NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure trigger is attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;