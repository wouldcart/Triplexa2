-- =====================================================
-- MANUAL AUTH TRIGGER FIX FOR SUPABASE DASHBOARD
-- =====================================================
-- This file should be executed in the Supabase Dashboard SQL Editor
-- to fix the "Database error saving new user" issue

-- 1. Clean up any existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name text;
  user_role text;
  user_phone text;
  user_company_name text;
  user_department text;
  user_position text;
  user_employee_id text;
  user_avatar text;
  user_preferred_language text;
  user_country text;
  user_city text;
  user_must_change_password boolean;
BEGIN
  -- Extract metadata with fallbacks (prioritize raw_user_meta_data over user_metadata)
  user_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(NEW.user_metadata->>'name', ''),
    split_part(NEW.email, '@', 1)
  );
  
  user_role := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'role', ''),
    NULLIF(NEW.user_metadata->>'role', ''),
    'agent'
  );
  
  user_phone := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.user_metadata->>'phone', '')
  );
  
  user_company_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
    NULLIF(NEW.user_metadata->>'company_name', '')
  );
  
  user_department := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'department', ''),
    NULLIF(NEW.user_metadata->>'department', ''),
    'General'
  );
  
  user_position := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'position', ''),
    NULLIF(NEW.user_metadata->>'position', ''),
    'Agent'
  );
  
  user_employee_id := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'employee_id', ''),
    NULLIF(NEW.user_metadata->>'employee_id', '')
  );
  
  user_avatar := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'avatar', ''),
    NULLIF(NEW.user_metadata->>'avatar', '')
  );
  
  user_preferred_language := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'preferred_language', ''),
    NULLIF(NEW.user_metadata->>'preferred_language', '')
  );
  
  user_country := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'country', ''),
    NULLIF(NEW.user_metadata->>'country', '')
  );
  
  user_city := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'city', ''),
    NULLIF(NEW.user_metadata->>'city', '')
  );
  
  user_must_change_password := COALESCE(
    (NEW.raw_user_meta_data->>'must_change_password')::boolean,
    (NEW.user_metadata->>'must_change_password')::boolean,
    false
  );

  -- Insert profile with extracted metadata
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
    avatar,
    preferred_language,
    country,
    city,
    must_change_password,
    status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_role,
    user_phone,
    user_company_name,
    user_department,
    user_position,
    user_employee_id,
    user_avatar,
    user_preferred_language,
    user_country,
    user_city,
    user_must_change_password,
    'active',
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
    avatar = COALESCE(EXCLUDED.avatar, profiles.avatar),
    preferred_language = COALESCE(EXCLUDED.preferred_language, profiles.preferred_language),
    country = COALESCE(EXCLUDED.country, profiles.country),
    city = COALESCE(EXCLUDED.city, profiles.city),
    must_change_password = COALESCE(EXCLUDED.must_change_password, profiles.must_change_password),
    updated_at = NOW();

  -- Also create an agent record if role is 'agent'
  IF user_role = 'agent' THEN
    INSERT INTO public.agents (
      id,
      name,
      email,
      role,
      department,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      user_name,
      NEW.email,
      user_role,
      user_department,
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, agents.name),
      email = EXCLUDED.email,
      role = COALESCE(EXCLUDED.role, agents.role),
      department = COALESCE(EXCLUDED.department, agents.department),
      updated_at = NOW();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Ensure the function can access auth.users
GRANT SELECT ON auth.users TO postgres;
GRANT SELECT ON auth.users TO service_role;

-- Ensure the function can insert into profiles and agents
GRANT INSERT, UPDATE ON public.profiles TO postgres;
GRANT INSERT, UPDATE ON public.profiles TO service_role;
GRANT INSERT, UPDATE ON public.agents TO postgres;
GRANT INSERT, UPDATE ON public.agents TO service_role;

-- 5. Enable RLS on profiles and agents if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- 6. Create basic RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
CREATE POLICY "Service role can manage all profiles" ON public.profiles
  FOR ALL USING (auth.role() = 'service_role');

-- 7. Create basic RLS policies for agents
DROP POLICY IF EXISTS "Users can view own agent record" ON public.agents;
CREATE POLICY "Users can view own agent record" ON public.agents
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own agent record" ON public.agents;
CREATE POLICY "Users can update own agent record" ON public.agents
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can manage all agents" ON public.agents;
CREATE POLICY "Service role can manage all agents" ON public.agents
  FOR ALL USING (auth.role() = 'service_role');

-- 8. Verification queries (run these after the above to verify)
-- SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
-- SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- =====================================================
-- END OF MANUAL AUTH TRIGGER FIX
-- =====================================================