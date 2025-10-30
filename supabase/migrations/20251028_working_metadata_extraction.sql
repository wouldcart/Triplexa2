-- Migration: Fix user metadata extraction with working approach
-- Created: 2025-10-28
-- Description: Create a working trigger function that correctly extracts metadata from raw_user_meta_data

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the working handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile with metadata extraction using the working approach
  INSERT INTO public.profiles (
    id, 
    email, 
    name,
    role,
    phone,
    company_name,
    department,
    position,
    employee_id,
    city,
    country,
    status,
    must_change_password,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'agent'),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'department', ''), 'General'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'position', ''), 'Agent'),
    NULLIF(NEW.raw_user_meta_data->>'employee_id', ''),
    NULLIF(NEW.raw_user_meta_data->>'city', ''),
    NULLIF(NEW.raw_user_meta_data->>'country', ''),
    'active',
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    department = COALESCE(EXCLUDED.department, profiles.department),
    position = COALESCE(EXCLUDED.position, profiles.position),
    employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
    city = COALESCE(EXCLUDED.city, profiles.city),
    country = COALESCE(EXCLUDED.country, profiles.country),
    must_change_password = COALESCE(EXCLUDED.must_change_password, profiles.must_change_password),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update the get_or_create_profile_for_current_user function with working approach
CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
  user_email text;
  user_metadata jsonb;
  profile_record record;
  result jsonb;
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Get user data from auth.users using the working approach
  SELECT 
    email,
    raw_user_meta_data
  INTO user_email, user_metadata
  FROM auth.users 
  WHERE id = user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User not found in auth.users');
  END IF;

  -- Try to get existing profile
  SELECT * INTO profile_record FROM public.profiles WHERE id = user_id;

  IF NOT FOUND THEN
    -- Create new profile with metadata extraction
    INSERT INTO public.profiles (
      id, 
      email, 
      name,
      role,
      phone,
      company_name,
      department,
      position,
      employee_id,
      city,
      country,
      status,
      must_change_password,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      user_email,
      COALESCE(NULLIF(user_metadata->>'name', ''), split_part(user_email, '@', 1)),
      COALESCE(NULLIF(user_metadata->>'role', ''), 'agent'),
      NULLIF(user_metadata->>'phone', ''),
      NULLIF(user_metadata->>'company_name', ''),
      COALESCE(NULLIF(user_metadata->>'department', ''), 'General'),
      COALESCE(NULLIF(user_metadata->>'position', ''), 'Agent'),
      NULLIF(user_metadata->>'employee_id', ''),
      NULLIF(user_metadata->>'city', ''),
      NULLIF(user_metadata->>'country', ''),
      'active',
      COALESCE((user_metadata->>'must_change_password')::boolean, false),
      NOW(),
      NOW()
    )
    RETURNING * INTO profile_record;
  END IF;

  -- Return the profile as JSON
  result := to_jsonb(profile_record);
  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO service_role;

-- Ensure auth.users access permissions
GRANT SELECT ON auth.users TO postgres;
GRANT SELECT ON auth.users TO service_role;