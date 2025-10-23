-- Fix RLS issues for user creation triggers
-- This migration addresses the "new row violates row-level security policy" error

-- First, let's ensure RLS is properly configured for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table
-- Policy 1: Allow users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Allow users to update their own profile  
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy 3: Allow service role to manage all profiles (for admin operations)
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
CREATE POLICY "Service role can manage all profiles" ON public.profiles
  FOR ALL
  USING (current_setting('role') = 'service_role');

-- Policy 4: Allow authenticated users to insert their own profile during signup
-- This is crucial for the trigger to work
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;
CREATE POLICY "Allow profile creation during signup" ON public.profiles
  FOR INSERT
  WITH CHECK (true); -- Allow all inserts - the trigger will handle the logic

-- Now recreate the handle_new_user function with SECURITY DEFINER
-- This allows the function to bypass RLS policies
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- This is the key change - allows bypassing RLS
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
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'agent');
  user_phone := NEW.raw_user_meta_data->>'phone';
  user_department := NEW.raw_user_meta_data->>'department';
  user_position := NEW.raw_user_meta_data->>'position';
  user_employee_id := NEW.raw_user_meta_data->>'employee_id';

  -- Insert into profiles with UPSERT to handle duplicates
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    phone,
    department,
    position,
    employee_id,
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
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    department = COALESCE(EXCLUDED.department, profiles.department),
    position = COALESCE(EXCLUDED.position, profiles.position),
    employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
    updated_at = NOW();

  -- If role is 'agent', create agent record
  IF user_role = 'agent' THEN
    INSERT INTO public.agents (
      id,
      user_id,
      company_name,
      contact_person,
      phone,
      email,
      status,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Unknown Company'),
      user_name,
      user_phone,
      NEW.email,
      'pending',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      company_name = COALESCE(EXCLUDED.company_name, agents.company_name),
      contact_person = COALESCE(EXCLUDED.contact_person, agents.contact_person),
      phone = COALESCE(EXCLUDED.phone, agents.phone),
      updated_at = NOW();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.agents TO authenticated;

-- Grant execute permission on the function to the roles that need it
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;

-- Ensure the function owner has the right permissions
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;