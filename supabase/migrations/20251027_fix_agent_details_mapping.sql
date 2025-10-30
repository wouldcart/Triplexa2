-- Align agent details mapping from auth metadata and profiles
-- - Expands handle_new_user to populate agents.agency_name, business_phone, city, country
-- - Ensures profile→agent triggers also sync company_name→agency_name and phone→business_phone
-- - Keeps SECURITY DEFINER to bypass RLS safely

BEGIN;

-- 1) Update handle_new_user to upsert profiles and insert richer agent details
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
  user_company_name TEXT;
  user_city TEXT;
  user_country TEXT;
BEGIN
  -- Extract metadata with sensible fallbacks
  user_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1));
  user_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'agent');
  user_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  user_department := NULLIF(NEW.raw_user_meta_data->>'department', '');
  user_position := NULLIF(NEW.raw_user_meta_data->>'position', '');
  user_employee_id := NULLIF(NEW.raw_user_meta_data->>'employee_id', '');
  user_company_name := NULLIF(NEW.raw_user_meta_data->>'company_name', '');
  user_city := NULLIF(NEW.raw_user_meta_data->>'city', '');
  user_country := NULLIF(NEW.raw_user_meta_data->>'country', '');

  -- Upsert profile with extended fields when available
  INSERT INTO public.profiles (
    id, email, name, role, phone, department, position, employee_id,
    company_name, city, country, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email, user_name, user_role, user_phone, user_department, user_position, user_employee_id,
    user_company_name, user_city, user_country, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    department = COALESCE(EXCLUDED.department, profiles.department),
    position = COALESCE(EXCLUDED.position, profiles.position),
    employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    city = COALESCE(EXCLUDED.city, profiles.city),
    country = COALESCE(EXCLUDED.country, profiles.country),
    updated_at = NOW();

  -- Create/Update agent row only for agent role, with richer details
  IF user_role = 'agent' THEN
    INSERT INTO public.agents (
      id, user_id, name, email, agency_name, business_phone, city, country, status, created_at, updated_at
    ) VALUES (
      NEW.id, NEW.id, user_name, NEW.email, user_company_name, user_phone, user_city, user_country, 'inactive', NOW(), NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, public.agents.name),
      email = COALESCE(EXCLUDED.email, public.agents.email),
      agency_name = COALESCE(EXCLUDED.agency_name, public.agents.agency_name),
      business_phone = COALESCE(EXCLUDED.business_phone, public.agents.business_phone),
      city = COALESCE(EXCLUDED.city, public.agents.city),
      country = COALESCE(EXCLUDED.country, public.agents.country),
      -- keep existing status; do not override with 'inactive'
      updated_at = NOW();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Re-attach the trigger to auth.users (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2) Enhance role-aware profile→agent insert to include agency_name and phone
CREATE OR REPLACE FUNCTION public.handle_agent_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role = 'agent' THEN
    INSERT INTO public.agents (
      id, user_id, name, email, agency_name, business_phone, status, country, city, created_at, updated_at
    ) VALUES (
      NEW.id, NEW.id, NEW.name, NEW.email, NULLIF(NEW.company_name, ''), NULLIF(NEW.phone, ''), COALESCE(NEW.status, 'active'), NEW.country, NEW.city, NOW(), NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, public.agents.name),
      email = COALESCE(EXCLUDED.email, public.agents.email),
      agency_name = COALESCE(EXCLUDED.agency_name, public.agents.agency_name),
      business_phone = COALESCE(EXCLUDED.business_phone, public.agents.business_phone),
      country = COALESCE(EXCLUDED.country, public.agents.country),
      city = COALESCE(EXCLUDED.city, public.agents.city),
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Enhance profile→agent update mapping for company_name and phone
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
    agency_name = COALESCE(NULLIF(NEW.company_name, ''), a.agency_name),
    business_phone = COALESCE(NULLIF(NEW.phone, ''), a.business_phone),
    country = COALESCE(NEW.country, a.country),
    city = COALESCE(NEW.city, a.city),
    updated_at = NOW()
  WHERE a.user_id = NEW.id;

  RETURN NEW;
END;
$$;

COMMIT;