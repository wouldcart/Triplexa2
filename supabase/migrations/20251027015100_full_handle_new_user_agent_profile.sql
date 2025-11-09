-- Comprehensive handle_new_user to populate profiles and agents on signup
-- Notes:
-- - SECURITY DEFINER with explicit search_path to stabilize resolution and bypass RLS
-- - Extracts extensive metadata from auth.users.raw_user_meta_data
-- - Upserts into public.profiles; ensures a single agents row per user_id
-- - Swallows errors to avoid blocking auth signup

BEGIN;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  -- Profile fields
  user_name TEXT;
  user_role TEXT;
  user_department TEXT;
  user_phone TEXT;
  user_status TEXT;
  user_position TEXT;
  user_employee_id TEXT;
  user_company_name TEXT;
  user_avatar TEXT;
  user_preferred_language TEXT;
  user_country TEXT;
  user_city TEXT;
  user_must_change_password BOOLEAN;

  -- Agent fields
  agency_name TEXT;
  agency_code TEXT;
  license_number TEXT;
  iata_number TEXT;
  business_address TEXT;
  business_phone TEXT;
  specializations TEXT[];
  commission_type TEXT;
  commission_value TEXT;
  business_type TEXT;
  profile_image TEXT;
  source_type TEXT;
  source_details TEXT;
  website TEXT;
  alternate_email TEXT;
  mobile_numbers TEXT[];
  documents TEXT[];
  assigned_staff UUID[];
  created_by UUID;
  created_by_staff TEXT;
BEGIN
  -- Extract metadata with fallbacks
  user_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'name',''), split_part(NEW.email,'@',1));
  user_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'agent');
  user_department := NULLIF(NEW.raw_user_meta_data->>'department','');
  user_phone := NULLIF(NEW.raw_user_meta_data->>'phone','');
  user_status := COALESCE(NULLIF(NEW.raw_user_meta_data->>'status',''), 'active');
  user_position := NULLIF(NEW.raw_user_meta_data->>'position','');
  user_employee_id := NULLIF(NEW.raw_user_meta_data->>'employee_id','');
  user_company_name := NULLIF(NEW.raw_user_meta_data->>'company_name','');
  user_avatar := NULLIF(NEW.raw_user_meta_data->>'avatar','');
  user_preferred_language := NULLIF(NEW.raw_user_meta_data->>'preferred_language','');
  user_country := NULLIF(NEW.raw_user_meta_data->>'country','');
  user_city := NULLIF(NEW.raw_user_meta_data->>'city','');
  user_must_change_password := COALESCE((NEW.raw_user_meta_data->>'must_change_password')::BOOLEAN, FALSE);

  agency_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'agency_name',''), user_company_name);
  agency_code := NULLIF(NEW.raw_user_meta_data->>'agency_code','');
  license_number := NULLIF(NEW.raw_user_meta_data->>'license_number','');
  iata_number := NULLIF(NEW.raw_user_meta_data->>'iata_number','');
  business_address := NULLIF(NEW.raw_user_meta_data->>'business_address','');
  business_phone := COALESCE(NULLIF(NEW.raw_user_meta_data->>'business_phone',''), user_phone);
  commission_type := NULLIF(NEW.raw_user_meta_data->>'commission_type','');
  commission_value := NULLIF(NEW.raw_user_meta_data->>'commission_value','');
  business_type := NULLIF(NEW.raw_user_meta_data->>'business_type','');
  profile_image := NULLIF(NEW.raw_user_meta_data->>'profile_image','');
  source_type := COALESCE(NULLIF(NEW.raw_user_meta_data->>'source_type',''), 'auth');
  source_details := COALESCE(NULLIF(NEW.raw_user_meta_data->>'source_details',''), 'on_auth_user_created');
  website := NULLIF(NEW.raw_user_meta_data->>'website','');
  alternate_email := NULLIF(NEW.raw_user_meta_data->>'alternate_email','');
  created_by := NULLIF(NEW.raw_user_meta_data->>'created_by','')::UUID;
  created_by_staff := NULLIF(NEW.raw_user_meta_data->>'created_by_staff','');

  -- Arrays
  IF NEW.raw_user_meta_data ? 'specializations' THEN
    specializations := ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'specializations'));
  END IF;
  IF NEW.raw_user_meta_data ? 'mobile_numbers' THEN
    mobile_numbers := ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'mobile_numbers'));
  END IF;
  IF NEW.raw_user_meta_data ? 'documents' THEN
    documents := ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'documents'));
  END IF;
  IF NEW.raw_user_meta_data ? 'assigned_staff' THEN
    assigned_staff := ARRAY(SELECT jsonb_array_elements(NEW.raw_user_meta_data->'assigned_staff')::uuid);
  END IF;

  -- Upsert into profiles
  INSERT INTO public.profiles (
    id, name, email, role, department, phone, status, position, employee_id,
    created_at, updated_at, company_name, avatar, preferred_language, country, city,
    must_change_password, uuid
  ) VALUES (
    NEW.id, user_name, NEW.email, user_role, user_department, user_phone, user_status, user_position, user_employee_id,
    NOW(), NOW(), user_company_name, user_avatar, user_preferred_language, user_country, user_city,
    user_must_change_password, NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    role = COALESCE(EXCLUDED.role, profiles.role),
    department = COALESCE(EXCLUDED.department, profiles.department),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    status = COALESCE(EXCLUDED.status, profiles.status),
    position = COALESCE(EXCLUDED.position, profiles.position),
    employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    avatar = COALESCE(EXCLUDED.avatar, profiles.avatar),
    preferred_language = COALESCE(EXCLUDED.preferred_language, profiles.preferred_language),
    country = COALESCE(EXCLUDED.country, profiles.country),
    city = COALESCE(EXCLUDED.city, profiles.city),
    must_change_password = COALESCE(EXCLUDED.must_change_password, profiles.must_change_password),
    updated_at = NOW();

  -- Ensure a single agents row per user_id
  IF NOT EXISTS (SELECT 1 FROM public.agents WHERE user_id = NEW.id) THEN
    INSERT INTO public.agents (
      user_id, name, email, status, agency_name, agency_code, license_number, iata_number,
      business_address, business_phone, specializations, commission_structure,
      country, city, business_type, commission_type, commission_value, profile_image,
      source_type, source_details, created_by, created_by_staff, website, alternate_email,
      mobile_numbers, documents, assigned_staff, created_at, updated_at
    ) VALUES (
      NEW.id, user_name, NEW.email, 'active', agency_name, agency_code, license_number, iata_number,
      business_address, business_phone, specializations, COALESCE(NEW.raw_user_meta_data->'commission_structure', '{"type":"percentage","value":10}'::jsonb),
      user_country, user_city, business_type, commission_type, commission_value, profile_image,
      source_type, source_details, created_by, created_by_staff, website, alternate_email,
      mobile_numbers, documents, assigned_staff, NOW(), NOW()
    );
  ELSE
    UPDATE public.agents SET
      name = COALESCE(user_name, agents.name),
      email = COALESCE(NEW.email, agents.email),
      status = COALESCE(user_status, agents.status),
      agency_name = COALESCE(agency_name, agents.agency_name),
      agency_code = COALESCE(agency_code, agents.agency_code),
      license_number = COALESCE(license_number, agents.license_number),
      iata_number = COALESCE(iata_number, agents.iata_number),
      business_address = COALESCE(business_address, agents.business_address),
      business_phone = COALESCE(business_phone, agents.business_phone),
      specializations = COALESCE(specializations, agents.specializations),
      commission_structure = COALESCE(NEW.raw_user_meta_data->'commission_structure', agents.commission_structure),
      country = COALESCE(user_country, agents.country),
      city = COALESCE(user_city, agents.city),
      business_type = COALESCE(business_type, agents.business_type),
      commission_type = COALESCE(commission_type, agents.commission_type),
      commission_value = COALESCE(commission_value, agents.commission_value),
      profile_image = COALESCE(profile_image, agents.profile_image),
      source_type = COALESCE(source_type, agents.source_type),
      source_details = COALESCE(source_details, agents.source_details),
      created_by = COALESCE(created_by, agents.created_by),
      created_by_staff = COALESCE(created_by_staff, agents.created_by_staff),
      website = COALESCE(website, agents.website),
      alternate_email = COALESCE(alternate_email, agents.alternate_email),
      mobile_numbers = COALESCE(mobile_numbers, agents.mobile_numbers),
      documents = COALESCE(documents, agents.documents),
      assigned_staff = COALESCE(assigned_staff, agents.assigned_staff),
      updated_at = NOW()
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

COMMIT;