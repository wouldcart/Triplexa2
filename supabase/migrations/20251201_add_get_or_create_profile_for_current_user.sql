-- Ensure get_or_create_profile_for_current_user exists and bypasses RLS

BEGIN;

-- Drop and recreate function idempotently
DROP FUNCTION IF EXISTS public.get_or_create_profile_for_current_user();

CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles;
  v_uid uuid := auth.uid();
  v_email text;
  v_user_meta jsonb;
  v_raw_meta jsonb;
  v_meta jsonb;
  v_name text;
  v_role text;
  v_phone text;
  v_department text;
  v_position text;
  v_company_name text;
  v_city text;
  v_country text;
BEGIN
  -- If not authenticated, return NULL
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  -- Try existing profile first
  SELECT p.* INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_uid;

  IF v_profile IS NOT NULL THEN
    RETURN v_profile;
  END IF;

  -- Get user record from auth.users
  SELECT u.email, u.user_metadata, u.raw_user_meta_data
  INTO v_email, v_user_meta, v_raw_meta
  FROM auth.users u
  WHERE u.id = v_uid;

  -- Prefer user_metadata, fallback to raw_user_meta_data
  v_meta := COALESCE(v_user_meta, v_raw_meta, '{}'::jsonb);

  -- Extract fields with sensible defaults
  v_name := COALESCE(NULLIF(v_meta->>'name', ''), COALESCE(split_part(v_email, '@', 1), v_uid::text));
  v_role := COALESCE(NULLIF(v_meta->>'role', ''), 'agent');
  v_phone := NULLIF(v_meta->>'phone', '');
  v_department := COALESCE(NULLIF(v_meta->>'department', ''), 'General');
  v_position := COALESCE(NULLIF(v_meta->>'position', ''), v_role, 'Agent');
  v_company_name := NULLIF(v_meta->>'company_name', '');
  v_city := NULLIF(v_meta->>'city', '');
  v_country := NULLIF(v_meta->>'country', '');

  -- Create minimal profile row
  INSERT INTO public.profiles (
    id, email, name, role, phone, department, position,
    company_name, city, country, status, created_at, updated_at
  ) VALUES (
    v_uid,
    COALESCE(v_email, v_uid::text || '@local'),
    v_name,
    v_role,
    v_phone,
    v_department,
    v_position,
    v_company_name,
    v_city,
    v_country,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    department = COALESCE(EXCLUDED.department, profiles.department),
    position = COALESCE(EXCLUDED.position, profiles.position),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    city = COALESCE(EXCLUDED.city, profiles.city),
    country = COALESCE(EXCLUDED.country, profiles.country),
    status = COALESCE(profiles.status, 'active'),
    updated_at = NOW()
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

-- Function ownership and execution privileges
ALTER FUNCTION public.get_or_create_profile_for_current_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO anon;

COMMENT ON FUNCTION public.get_or_create_profile_for_current_user() IS
'Returns current user\'s profile; creates it from auth.users metadata if missing. SECURITY DEFINER to bypass RLS.';

COMMIT;