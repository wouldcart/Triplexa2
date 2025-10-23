-- supabase/migrations/20240712100000_handle_new_user_trigger.sql

-- Drop the existing trigger and function if they exist, to ensure a clean setup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new profile record for the new user
  -- The 'id' comes from the new user record in auth.users
  -- 'name' can be a default value or extracted from raw_user_meta_data if available
  -- 'email' is also available from the new user record
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING; -- Avoid errors if a profile already exists

  RETURN NEW;
END;
$$;

-- Create the trigger to call the function after a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();