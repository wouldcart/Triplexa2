-- Enhanced handle_new_user trigger to load comprehensive auth user data
-- This migration expands the trigger to extract and populate additional fields
-- from auth.users.raw_user_meta_data into the profiles and agents tables

BEGIN;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create enhanced function to handle comprehensive auth user data loading
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Basic profile fields
  user_name TEXT;
  user_role TEXT;
  user_phone TEXT;
  user_department TEXT;
  user_position TEXT;
  user_employee_id TEXT;
  user_company_name TEXT;
  user_city TEXT;
  user_country TEXT;
  
  -- Extended profile fields
  user_profile_image TEXT;
  user_preferred_language TEXT;
  user_business_address TEXT;
  user_business_type TEXT;
  user_specialization TEXT;
  user_specializations TEXT[];
  user_source_type TEXT;
  user_source_details TEXT;
  user_status TEXT;
  
  -- Additional metadata fields
  user_work_location TEXT;
  user_join_date TEXT;
  user_reporting_manager TEXT;
  user_avatar TEXT;
  user_timezone TEXT;
  user_nationality TEXT;
  user_date_of_birth TEXT;
  user_emergency_contact_name TEXT;
  user_emergency_contact_phone TEXT;
  user_emergency_contact_relationship TEXT;
BEGIN
  -- Extract basic metadata with sensible fallbacks
  user_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1));
  user_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'agent');
  user_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  user_department := NULLIF(NEW.raw_user_meta_data->>'department', '');
  user_position := NULLIF(NEW.raw_user_meta_data->>'position', '');
  user_employee_id := NULLIF(NEW.raw_user_meta_data->>'employee_id', '');
  user_company_name := NULLIF(NEW.raw_user_meta_data->>'company_name', '');
  user_city := NULLIF(NEW.raw_user_meta_data->>'city', '');
  user_country := NULLIF(NEW.raw_user_meta_data->>'country', '');
  
  -- Extract extended metadata fields
  user_profile_image := NULLIF(NEW.raw_user_meta_data->>'profile_image', '');
  user_preferred_language := COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_language', ''), 'en');
  user_business_address := NULLIF(NEW.raw_user_meta_data->>'business_address', '');
  user_business_type := NULLIF(NEW.raw_user_meta_data->>'business_type', '');
  user_specialization := NULLIF(NEW.raw_user_meta_data->>'specialization', '');
  user_source_type := COALESCE(NULLIF(NEW.raw_user_meta_data->>'source_type', ''), 'organic');
  user_source_details := COALESCE(NULLIF(NEW.raw_user_meta_data->>'source_details', ''), 'direct_signup');
  user_status := COALESCE(NULLIF(NEW.raw_user_meta_data->>'status', ''), 'active');
  
  -- Extract additional metadata fields
  user_work_location := NULLIF(NEW.raw_user_meta_data->>'work_location', '');
  user_join_date := NULLIF(NEW.raw_user_meta_data->>'join_date', '');
  user_reporting_manager := NULLIF(NEW.raw_user_meta_data->>'reporting_manager', '');
  user_avatar := NULLIF(NEW.raw_user_meta_data->>'avatar', '');
  user_timezone := NULLIF(NEW.raw_user_meta_data->>'timezone', '');
  user_nationality := NULLIF(NEW.raw_user_meta_data->>'nationality', '');
  user_date_of_birth := NULLIF(NEW.raw_user_meta_data->>'date_of_birth', '');
  user_emergency_contact_name := NULLIF(NEW.raw_user_meta_data->>'emergency_contact_name', '');
  user_emergency_contact_phone := NULLIF(NEW.raw_user_meta_data->>'emergency_contact_phone', '');
  user_emergency_contact_relationship := NULLIF(NEW.raw_user_meta_data->>'emergency_contact_relationship', '');
  
  -- Handle specializations array
  IF NEW.raw_user_meta_data ? 'specializations' THEN
    user_specializations := ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'specializations'));
  ELSIF user_specialization IS NOT NULL THEN
    user_specializations := ARRAY[user_specialization];
  END IF;

  -- Upsert comprehensive profile data
  INSERT INTO public.profiles (
    id, email, name, role, phone, department, position, employee_id, 
    company_name, city, country, profile_image, preferred_language,
    status, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email, user_name, user_role, user_phone, user_department, 
    user_position, user_employee_id, user_company_name, user_city, user_country,
    user_profile_image, user_preferred_language, user_status, NOW(), NOW()
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
    profile_image = COALESCE(EXCLUDED.profile_image, profiles.profile_image),
    preferred_language = COALESCE(EXCLUDED.preferred_language, profiles.preferred_language),
    status = COALESCE(EXCLUDED.status, profiles.status),
    updated_at = NOW();

  -- Create agent record if role is 'agent' with comprehensive data
  IF user_role = 'agent' THEN
    INSERT INTO public.agents (
      id, user_id, name, email, agency_name, business_phone, business_address,
      city, country, agent_type, specializations, source_type, source_details,
      status, created_at, updated_at, created_by
    ) VALUES (
      NEW.id, NEW.id, user_name, NEW.email, user_company_name, user_phone, 
      user_business_address, user_city, user_country, user_business_type,
      user_specializations, user_source_type, user_source_details,
      CASE WHEN user_status = 'active' THEN 'active' ELSE 'inactive' END,
      NOW(), NOW(), NEW.id
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, agents.name),
      email = COALESCE(EXCLUDED.email, agents.email),
      agency_name = COALESCE(EXCLUDED.agency_name, agents.agency_name),
      business_phone = COALESCE(EXCLUDED.business_phone, agents.business_phone),
      business_address = COALESCE(EXCLUDED.business_address, agents.business_address),
      city = COALESCE(EXCLUDED.city, agents.city),
      country = COALESCE(EXCLUDED.country, agents.country),
      agent_type = COALESCE(EXCLUDED.agent_type, agents.agent_type),
      specializations = COALESCE(EXCLUDED.specializations, agents.specializations),
      source_type = COALESCE(EXCLUDED.source_type, agents.source_type),
      source_details = COALESCE(EXCLUDED.source_details, agents.source_details),
      status = COALESCE(EXCLUDED.status, agents.status),
      updated_at = NOW();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Error in enhanced handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Add helpful comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Enhanced trigger function that extracts comprehensive auth user metadata and populates profiles and agents tables with all available fields from raw_user_meta_data';

COMMIT;