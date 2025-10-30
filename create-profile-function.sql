-- Create the missing get_or_create_profile_for_current_user function
-- This should be executed in the Supabase SQL Editor

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
BEGIN
  -- Return null if no authenticated user
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  -- Fetch existing profile without RLS restrictions (SECURITY DEFINER)
  SELECT p.* INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_uid;

  -- If profile exists, return it
  IF v_profile IS NOT NULL THEN
    RETURN v_profile;
  END IF;

  -- Try to get email from auth.users (requires SECURITY DEFINER)
  SELECT u.email INTO v_email
  FROM auth.users u
  WHERE u.id = v_uid;

  -- Create minimal profile row if missing, using INSERT ... ON CONFLICT to handle race conditions
  INSERT INTO public.profiles (
    id, email, name, role, department, status, position, created_at, updated_at
  ) VALUES (
    v_uid,
    COALESCE(v_email, v_uid::text || '@local'),
    COALESCE(split_part(v_email, '@', 1), v_uid::text),
    'agent',
    'General',
    'active',
    'Agent',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW()
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated;