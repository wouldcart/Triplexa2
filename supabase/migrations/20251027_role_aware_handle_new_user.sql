-- Role-aware handle_new_user: populates profiles for all roles, agents only when role='agent'
-- Safe, idempotent, and resilient to missing/optional metadata.

-- Drop existing trigger to reattach cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or replace function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  -- Common profile fields
  user_name        text := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name');
  user_role        text := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  user_phone       text := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  user_department  text := NULLIF(NEW.raw_user_meta_data->>'department', '');
  employee_id      text := NULLIF(NEW.raw_user_meta_data->>'employee_id', '');
  profile_image    text := NULLIF(NEW.raw_user_meta_data->>'profile_image', '');
  user_country     text := NULLIF(NEW.raw_user_meta_data->>'country', '');
  user_city        text := NULLIF(NEW.raw_user_meta_data->>'city', '');
  user_status      text := COALESCE(NEW.raw_user_meta_data->>'status', 'active');
  created_by       uuid := NULLIF((NEW.raw_user_meta_data->>'created_by')::uuid, NULL);
  created_by_staff uuid := NULLIF((NEW.raw_user_meta_data->>'created_by_staff')::uuid, NULL);
  source_type      text := NULLIF(NEW.raw_user_meta_data->>'source_type', '');
  source_details   jsonb := NEW.raw_user_meta_data->'source_details';

  -- Agent-specific fields
  agency_name      text := NULLIF(NEW.raw_user_meta_data->>'agency_name', '');
  agency_code      text := NULLIF(NEW.raw_user_meta_data->>'agency_code', '');
  license_number   text := NULLIF(NEW.raw_user_meta_data->>'license_number', '');
  iata_number      text := NULLIF(NEW.raw_user_meta_data->>'iata_number', '');
  business_address text := NULLIF(NEW.raw_user_meta_data->>'business_address', '');
  business_phone   text := NULLIF(NEW.raw_user_meta_data->>'business_phone', '');
  website          text := NULLIF(NEW.raw_user_meta_data->>'website', '');
  alternate_email  text := NULLIF(NEW.raw_user_meta_data->>'alternate_email', '');
  specializations  text[] := COALESCE(ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'specializations')), NULL);
  mobile_numbers   text[] := COALESCE(ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'mobile_numbers')), NULL);
  commission_structure jsonb := NEW.raw_user_meta_data->'commission_structure';
  documents        jsonb := NEW.raw_user_meta_data->'documents';
BEGIN
  BEGIN
    -- Upsert into profiles for every new user
    INSERT INTO public.profiles (
      id, email, name, role, phone, department, employee_id, profile_image,
      country, city, status, created_by, created_by_staff, source_type, source_details,
      created_at, updated_at
    ) VALUES (
      NEW.id, NEW.email, user_name, user_role, user_phone, user_department, employee_id, profile_image,
      user_country, user_city, user_status, created_by, created_by_staff, source_type, source_details,
      NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public.profiles.name),
      role = COALESCE(EXCLUDED.role, public.profiles.role),
      phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
      department = COALESCE(EXCLUDED.department, public.profiles.department),
      employee_id = COALESCE(EXCLUDED.employee_id, public.profiles.employee_id),
      profile_image = COALESCE(EXCLUDED.profile_image, public.profiles.profile_image),
      country = COALESCE(EXCLUDED.country, public.profiles.country),
      city = COALESCE(EXCLUDED.city, public.profiles.city),
      status = COALESCE(EXCLUDED.status, public.profiles.status),
      created_by = COALESCE(EXCLUDED.created_by, public.profiles.created_by),
      created_by_staff = COALESCE(EXCLUDED.created_by_staff, public.profiles.created_by_staff),
      source_type = COALESCE(EXCLUDED.source_type, public.profiles.source_type),
      source_details = COALESCE(EXCLUDED.source_details, public.profiles.source_details),
      updated_at = NOW();

    -- Only create/update agents for users with role 'agent'
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
          business_address, business_phone, specializations, commission_structure,
          user_country, user_city, NULL, NULL, NULL, profile_image,
          source_type, source_details, created_by, created_by_staff, website, alternate_email,
          mobile_numbers, documents, NOW(), NOW()
        );
      ELSE
        UPDATE public.agents AS a SET
          name = COALESCE(user_name, a.name),
          email = COALESCE(NEW.email, a.email),
          status = COALESCE(user_status, a.status),
          agency_name = COALESCE(agency_name, a.agency_name),
          agency_code = COALESCE(agency_code, a.agency_code),
          license_number = COALESCE(license_number, a.license_number),
          iata_number = COALESCE(iata_number, a.iata_number),
          business_address = COALESCE(business_address, a.business_address),
          business_phone = COALESCE(business_phone, a.business_phone),
          specializations = COALESCE(specializations, a.specializations),
          commission_structure = COALESCE(commission_structure, a.commission_structure),
          country = COALESCE(user_country, a.country),
          city = COALESCE(user_city, a.city),
          profile_image = COALESCE(profile_image, a.profile_image),
          source_type = COALESCE(source_type, a.source_type),
          source_details = COALESCE(source_details, a.source_details),
          created_by = COALESCE(created_by, a.created_by),
          created_by_staff = COALESCE(created_by_staff, a.created_by_staff),
          website = COALESCE(website, a.website),
          alternate_email = COALESCE(alternate_email, a.alternate_email),
          mobile_numbers = COALESCE(mobile_numbers, a.mobile_numbers),
          documents = COALESCE(documents, a.documents),
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

-- Recreate trigger using the updated function
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();