-- Fix profiles RLS recursion by introducing a SECURITY DEFINER RPC
-- This function safely returns the current user's profile and creates it if missing,
-- bypassing table RLS evaluation paths that can recurse.

BEGIN;

-- Create or replace SECURITY DEFINER function
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
  -- Fetch existing profile without RLS restrictions (SECURITY DEFINER)
  SELECT p.* INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_uid;

  IF v_profile IS NOT NULL THEN
    RETURN v_profile;
  END IF;

  -- Try to get email from auth.users (requires SECURITY DEFINER)
  SELECT u.email INTO v_email
  FROM auth.users u
  WHERE u.id = v_uid;

  -- Create minimal profile row if missing
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
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated;

COMMIT;