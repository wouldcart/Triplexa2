-- Fixed version of get_or_create_profile_for_current_user function
-- This function now properly extracts user data from auth.users metadata

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
  v_name text;
  v_phone text;
  v_company_name text;
  v_role text;
  v_department text;
  v_position text;
  v_user_metadata jsonb;
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

  -- Get user data from auth.users including metadata
  SELECT u.email, u.user_metadata INTO v_email, v_user_metadata
  FROM auth.users u 
  WHERE u.id = v_uid; 

  -- Extract user data from metadata with fallbacks
  v_name := COALESCE(
    v_user_metadata->>'name',
    v_user_metadata->>'full_name', 
    split_part(v_email, '@', 1),
    v_uid::text
  );
  
  v_phone := COALESCE(
    v_user_metadata->>'phone',
    v_user_metadata->>'phone_number',
    ''
  );
  
  v_company_name := COALESCE(
    v_user_metadata->>'company_name',
    v_user_metadata->>'company',
    ''
  );
  
  v_role := COALESCE(
    v_user_metadata->>'role',
    'agent'
  );
  
  v_department := COALESCE(
    v_user_metadata->>'department',
    CASE 
      WHEN v_role = 'agent' THEN 'Agents'
      ELSE 'General'
    END
  );
  
  v_position := COALESCE(
    v_user_metadata->>'position',
    CASE 
      WHEN v_role = 'agent' THEN 'Travel Agent'
      ELSE 'Staff'
    END
  );

  -- Create profile with actual user data from metadata
  INSERT INTO public.profiles ( 
    id, 
    email, 
    name, 
    phone,
    company_name,
    role, 
    department, 
    status, 
    position, 
    created_at, 
    updated_at 
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
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    company_name = COALESCE(EXCLUDED.company_name, public.profiles.company_name),
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    department = COALESCE(EXCLUDED.department, public.profiles.department),
    position = COALESCE(EXCLUDED.position, public.profiles.position),
    updated_at = NOW() 
  RETURNING * INTO v_profile; 

  RETURN v_profile; 
END; 
$$; 

-- Grant execute permissions 
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated; 
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO anon;