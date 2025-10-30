-- Fix user metadata extraction using the correct column name: raw_user_meta_data
-- The previous migration failed because we were looking for 'user_metadata' 
-- but the actual column name in auth.users is 'raw_user_meta_data'

BEGIN;

-- 1. Drop existing trigger to ensure clean update
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Create updated handle_new_user function that uses raw_user_meta_data
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
  user_status TEXT;
  user_must_change_password BOOLEAN;
BEGIN
  -- Extract metadata from raw_user_meta_data (the actual column name)
  user_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'name', ''), 
    split_part(NEW.email, '@', 1)
  );
  
  user_role := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'role', ''), 
    'agent'
  );
  
  user_phone := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'phone', '')
  );
  
  user_department := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'department', ''),
    'General'
  );
  
  user_position := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'position', ''),
    'Agent'
  );
  
  user_employee_id := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'employee_id', '')
  );
  
  user_company_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'company_name', '')
  );
  
  user_city := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'city', '')
  );
  
  user_country := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'country', '')
  );
  
  user_status := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'status', ''),
    'active'
  );
  
  user_must_change_password := COALESCE(
    (NEW.raw_user_meta_data->>'must_change_password')::boolean,
    false
  );

  -- Insert profile with all extracted fields
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    role, 
    phone, 
    department, 
    position, 
    employee_id,
    company_name,
    city,
    country,
    status,
    must_change_password,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_role,
    user_phone,
    user_department,
    user_position,
    user_employee_id,
    user_company_name,
    user_city,
    user_country,
    user_status,
    user_must_change_password,
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
    employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    city = COALESCE(EXCLUDED.city, profiles.city),
    country = COALESCE(EXCLUDED.country, profiles.country),
    status = COALESCE(EXCLUDED.status, profiles.status),
    must_change_password = COALESCE(EXCLUDED.must_change_password, profiles.must_change_password),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Create the trigger to execute after user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Update get_or_create_profile_for_current_user function to use raw_user_meta_data
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
  v_raw_user_metadata jsonb;
  v_name text;
  v_phone text;
  v_company_name text;
  v_role text;
  v_department text;
  v_position text;
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

  -- Get user data from auth.users (requires SECURITY DEFINER) 
  SELECT u.email, u.raw_user_meta_data INTO v_email, v_raw_user_metadata
  FROM auth.users u 
  WHERE u.id = v_uid; 

  -- Extract metadata from raw_user_meta_data
  v_name := COALESCE(
    NULLIF(v_raw_user_metadata->>'name', ''),
    split_part(v_email, '@', 1)
  );
  
  v_phone := COALESCE(
    NULLIF(v_raw_user_metadata->>'phone', '')
  );
  
  v_company_name := COALESCE(
    NULLIF(v_raw_user_metadata->>'company_name', '')
  );
  
  v_role := COALESCE(
    NULLIF(v_raw_user_metadata->>'role', ''),
    'agent'
  );
  
  v_department := COALESCE(
    NULLIF(v_raw_user_metadata->>'department', ''),
    'General'
  );
  
  v_position := COALESCE(
    NULLIF(v_raw_user_metadata->>'position', ''),
    'Agent'
  );

  -- Create profile row with extracted metadata
  INSERT INTO public.profiles ( 
    id, email, name, phone, company_name, role, department, status, position, created_at, updated_at 
  ) VALUES ( 
    v_uid, 
    COALESCE(v_email, v_uid::text || '@local'),
    v_name,
    v_phone,
    v_company_name,
    v_role,
    v_department,
    'active',
    v_position,
    NOW(), 
    NOW() 
  ) 
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    department = COALESCE(EXCLUDED.department, profiles.department),
    position = COALESCE(EXCLUDED.position, profiles.position),
    updated_at = NOW() 
  RETURNING * INTO v_profile; 

  RETURN v_profile; 
END; 
$$; 

-- 5. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated, anon;

-- 6. Add helpful comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function that extracts user metadata from raw_user_meta_data for profile creation';
COMMENT ON FUNCTION public.get_or_create_profile_for_current_user() IS 'Function that extracts user metadata from raw_user_meta_data for profile creation';

COMMIT;