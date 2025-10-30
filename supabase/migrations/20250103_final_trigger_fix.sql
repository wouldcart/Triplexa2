
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the new function
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
  user_company_name TEXT;
  user_country TEXT;
  user_city TEXT;
  user_status TEXT;
BEGIN
  -- Extract metadata
  user_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1));
  user_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'agent');
  user_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  user_company_name := NULLIF(NEW.raw_user_meta_data->>'company_name', '');
  user_country := NULLIF(NEW.raw_user_meta_data->>'country', '');
  user_city := NULLIF(NEW.raw_user_meta_data->>'city', '');
  user_status := COALESCE(NULLIF(NEW.raw_user_meta_data->>'status', ''), 'inactive');

  -- Insert/update profile
  INSERT INTO public.profiles (
    id, email, name, role, phone, company_name, country, city, status, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email, user_name, user_role, user_phone, user_company_name, user_country, user_city, user_status, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    country = COALESCE(EXCLUDED.country, profiles.country),
    city = COALESCE(EXCLUDED.city, profiles.city),
    status = COALESCE(EXCLUDED.status, profiles.status),
    updated_at = NOW();

  -- Create agent record if role is agent
  IF user_role = 'agent' THEN
    INSERT INTO public.agents (
      user_id, name, email, agency_name, business_phone, city, country, status, source_type, created_at, updated_at, created_by
    ) VALUES (
      NEW.id, user_name, NEW.email, user_company_name, user_phone, user_city, user_country,
      CASE WHEN user_status = 'active' THEN 'active' ELSE 'inactive' END,
      'auth_signup', NOW(), NOW(), NEW.id
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, agents.name),
      email = COALESCE(EXCLUDED.email, agents.email),
      agency_name = COALESCE(EXCLUDED.agency_name, agents.agency_name),
      business_phone = COALESCE(EXCLUDED.business_phone, agents.business_phone),
      city = COALESCE(EXCLUDED.city, agents.city),
      country = COALESCE(EXCLUDED.country, agents.country),
      status = COALESCE(EXCLUDED.status, agents.status),
      updated_at = NOW();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
    