-- Comprehensive fix for user creation trigger to handle all required profile fields
-- This addresses the "Database error saving new user" issue

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create comprehensive function to handle new user creation
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
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'agent');
  user_phone := NEW.raw_user_meta_data->>'phone';
  user_department := COALESCE(NEW.raw_user_meta_data->>'department', 'Agents');
  user_position := COALESCE(NEW.raw_user_meta_data->>'position', 'External Agent');
  user_employee_id := NEW.raw_user_meta_data->>'employee_id';

  -- Insert profile with all required fields
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    role, 
    phone, 
    department, 
    position, 
    employee_id,
    status,
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
    employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
    updated_at = NOW();

  -- If role is 'agent', also create agent record
  IF user_role = 'agent' THEN
    INSERT INTO public.agents (
      user_id, 
      name, 
      email, 
      status, 
      created_at, 
      updated_at
    ) VALUES (
      NEW.id,
      user_name,
      NEW.email,
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.agents TO authenticated;