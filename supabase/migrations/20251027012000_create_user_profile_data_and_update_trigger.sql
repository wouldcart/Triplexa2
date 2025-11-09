-- Create a new user_profile_data table and update handle_new_user
-- to populate it. Agents are created/updated only when role='agent'.

-- 1) New table for capturing signup metadata (avoids touching profiles)
CREATE TABLE IF NOT EXISTS public.user_profile_data (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  role text,
  name text,
  phone text,
  department text,
  position text,
  employee_id text,
  company_name text,
  avatar text,
  profile_image text,
  preferred_language text,
  country text,
  city text,
  must_change_password boolean DEFAULT false,
  specializations text[],
  mobile_numbers text[],
  documents text[],
  assigned_staff uuid[],
  source_type text,
  source_details text,
  commission_structure jsonb,
  created_by uuid,
  created_by_staff text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profile_data_email ON public.user_profile_data(email);
CREATE INDEX IF NOT EXISTS idx_user_profile_data_role ON public.user_profile_data(role);

-- 2) Reset trigger to attach cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3) Role-aware function that writes into user_profile_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  -- Common profile-like fields
  user_name        text := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name');
  user_role        text := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  user_phone       text := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  user_department  text := NULLIF(NEW.raw_user_meta_data->>'department', '');
  position_title   text := NULLIF(NEW.raw_user_meta_data->>'position', '');
  employee_id_val  text := NULLIF(NEW.raw_user_meta_data->>'employee_id', '');
  company_name_val text := NULLIF(NEW.raw_user_meta_data->>'company_name', '');
  avatar_url       text := NULLIF(NEW.raw_user_meta_data->>'avatar', '');
  profile_image_url text := COALESCE(NULLIF(NEW.raw_user_meta_data->>'profile_image', ''), avatar_url);
  preferred_lang   text := NULLIF(NEW.raw_user_meta_data->>'preferred_language', '');
  user_country     text := NULLIF(NEW.raw_user_meta_data->>'country', '');
  user_city        text := NULLIF(NEW.raw_user_meta_data->>'city', '');
  must_change_pw   boolean := COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false);
  specializations_arr text[] := COALESCE(ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'specializations')), NULL);
  mobile_numbers_arr  text[] := COALESCE(ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'mobile_numbers')), NULL);
  documents_arr       text[] := COALESCE(ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'documents')), NULL);
  assigned_staff_arr  uuid[] := COALESCE(ARRAY(SELECT (jsonb_array_elements_text(NEW.raw_user_meta_data->'assigned_staff'))::uuid), NULL);
  source_type_val     text := COALESCE(NULLIF(NEW.raw_user_meta_data->>'source_type', ''), 'auth');
  source_details_val  text := COALESCE(NULLIF(NEW.raw_user_meta_data->>'source_details', ''), 'on_auth_user_created');
  commission_structure_val jsonb := NEW.raw_user_meta_data->'commission_structure';
  created_by_uuid     uuid := NULLIF(NEW.raw_user_meta_data->>'created_by', '')::uuid;
  created_by_staff_val text := NULLIF(NEW.raw_user_meta_data->>'created_by_staff', '');

  -- Agent-only fields
  agency_name      text := NULLIF(NEW.raw_user_meta_data->>'agency_name', '');
  agency_code      text := NULLIF(NEW.raw_user_meta_data->>'agency_code', '');
  license_number   text := NULLIF(NEW.raw_user_meta_data->>'license_number', '');
  iata_number      text := NULLIF(NEW.raw_user_meta_data->>'iata_number', '');
  business_address text := NULLIF(NEW.raw_user_meta_data->>'business_address', '');
  business_phone   text := NULLIF(NEW.raw_user_meta_data->>'business_phone', '');
  business_type    text := NULLIF(NEW.raw_user_meta_data->>'business_type', '');
  commission_type  text := NULLIF(NEW.raw_user_meta_data->>'commission_type', '');
  commission_value_num numeric := NULLIF(NEW.raw_user_meta_data->>'commission_value', '')::numeric;
  website          text := NULLIF(NEW.raw_user_meta_data->>'website', '');
  alternate_email  text := NULLIF(NEW.raw_user_meta_data->>'alternate_email', '');
  documents_json   jsonb := NEW.raw_user_meta_data->'documents';
BEGIN
  BEGIN
    -- Write signup metadata into user_profile_data (safe, non-blocking)
    INSERT INTO public.user_profile_data (
      id, email, role, name, phone, department, position, employee_id, company_name,
      avatar, profile_image, preferred_language, country, city, must_change_password,
      specializations, mobile_numbers, documents, assigned_staff,
      source_type, source_details, commission_structure,
      created_by, created_by_staff, created_at, updated_at
    ) VALUES (
      NEW.id, NEW.email, user_role, user_name, user_phone, user_department, position_title, employee_id_val, company_name_val,
      avatar_url, profile_image_url, preferred_lang, user_country, user_city, must_change_pw,
      specializations_arr, mobile_numbers_arr, documents_arr, assigned_staff_arr,
      source_type_val, source_details_val, commission_structure_val,
      created_by_uuid, created_by_staff_val, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = COALESCE(EXCLUDED.role, public.user_profile_data.role),
      name = COALESCE(EXCLUDED.name, public.user_profile_data.name),
      phone = COALESCE(EXCLUDED.phone, public.user_profile_data.phone),
      department = COALESCE(EXCLUDED.department, public.user_profile_data.department),
      position = COALESCE(EXCLUDED.position, public.user_profile_data.position),
      employee_id = COALESCE(EXCLUDED.employee_id, public.user_profile_data.employee_id),
      company_name = COALESCE(EXCLUDED.company_name, public.user_profile_data.company_name),
      avatar = COALESCE(EXCLUDED.avatar, public.user_profile_data.avatar),
      profile_image = COALESCE(EXCLUDED.profile_image, public.user_profile_data.profile_image),
      preferred_language = COALESCE(EXCLUDED.preferred_language, public.user_profile_data.preferred_language),
      country = COALESCE(EXCLUDED.country, public.user_profile_data.country),
      city = COALESCE(EXCLUDED.city, public.user_profile_data.city),
      must_change_password = COALESCE(EXCLUDED.must_change_password, public.user_profile_data.must_change_password),
      specializations = COALESCE(EXCLUDED.specializations, public.user_profile_data.specializations),
      mobile_numbers = COALESCE(EXCLUDED.mobile_numbers, public.user_profile_data.mobile_numbers),
      documents = COALESCE(EXCLUDED.documents, public.user_profile_data.documents),
      assigned_staff = COALESCE(EXCLUDED.assigned_staff, public.user_profile_data.assigned_staff),
      source_type = COALESCE(EXCLUDED.source_type, public.user_profile_data.source_type),
      source_details = COALESCE(EXCLUDED.source_details, public.user_profile_data.source_details),
      commission_structure = COALESCE(EXCLUDED.commission_structure, public.user_profile_data.commission_structure),
      created_by = COALESCE(EXCLUDED.created_by, public.user_profile_data.created_by),
      created_by_staff = COALESCE(EXCLUDED.created_by_staff, public.user_profile_data.created_by_staff),
      updated_at = NOW();

    -- Create/Update agents only when role='agent'
    IF user_role = 'agent' THEN
      IF NOT EXISTS (SELECT 1 FROM public.agents WHERE user_id = NEW.id) THEN
        INSERT INTO public.agents (
          user_id, name, email, status, agency_name, agency_code, license_number, iata_number,
          business_address, business_phone, specializations, commission_structure,
          country, city, business_type, commission_type, commission_value, profile_image,
          source_type, source_details, created_by, created_by_staff, website, alternate_email,
          mobile_numbers, documents, created_at, updated_at
        ) VALUES (
          NEW.id, user_name, NEW.email, 'active', agency_name, agency_code, license_number, iata_number,
          business_address, business_phone, specializations_arr, commission_structure_val,
          user_country, user_city, business_type, commission_type, commission_value_num, profile_image_url,
          source_type_val, source_details_val, created_by_uuid, created_by_staff_val, website, alternate_email,
          mobile_numbers_arr, documents_json, NOW(), NOW()
        );
      ELSE
        UPDATE public.agents AS a SET
          name = COALESCE(user_name, a.name),
          email = COALESCE(NEW.email, a.email),
          status = COALESCE('active', a.status),
          agency_name = COALESCE(agency_name, a.agency_name),
          agency_code = COALESCE(agency_code, a.agency_code),
          license_number = COALESCE(license_number, a.license_number),
          iata_number = COALESCE(iata_number, a.iata_number),
          business_address = COALESCE(business_address, a.business_address),
          business_phone = COALESCE(business_phone, a.business_phone),
          specializations = COALESCE(specializations_arr, a.specializations),
          commission_structure = COALESCE(commission_structure_val, a.commission_structure),
          country = COALESCE(user_country, a.country),
          city = COALESCE(user_city, a.city),
          business_type = COALESCE(business_type, a.business_type),
          commission_type = COALESCE(commission_type, a.commission_type),
          commission_value = COALESCE(commission_value_num, a.commission_value),
          profile_image = COALESCE(profile_image_url, a.profile_image),
          source_type = COALESCE(source_type_val, a.source_type),
          source_details = COALESCE(source_details_val, a.source_details),
          created_by = COALESCE(created_by_uuid, a.created_by),
          created_by_staff = COALESCE(created_by_staff_val, a.created_by_staff),
          website = COALESCE(website, a.website),
          alternate_email = COALESCE(alternate_email, a.alternate_email),
          mobile_numbers = COALESCE(mobile_numbers_arr, a.mobile_numbers),
          documents = COALESCE(documents_json, a.documents),
          updated_at = NOW()
        WHERE a.user_id = NEW.id;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Do not block signup on downstream issues; log and continue
    RAISE NOTICE 'handle_new_user error for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- 4) Reattach trigger to auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();