-- Make profile→agent sync resilient when public.user_profile_data is absent

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_agent_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_source_type text;
  v_source_details text;
  v_created_by uuid;
  v_created_by_staff text;
  v_agency_name text := NULLIF(NEW.company_name, '');
  v_business_phone text := NULLIF(NEW.phone, '');
  v_city text := NEW.city;
  v_country text := NEW.country;
BEGIN
  IF NEW.role <> 'agent' THEN
    RETURN NEW;
  END IF;

  -- Try user_profile_data; tolerate missing table
  BEGIN
    SELECT upd.source_type, upd.source_details, upd.created_by, upd.created_by_staff
      INTO v_source_type, v_source_details, v_created_by, v_created_by_staff
      FROM public.user_profile_data AS upd
      WHERE upd.id = NEW.id
      LIMIT 1;
  EXCEPTION WHEN undefined_table THEN
    v_source_type := NULL;
    v_source_details := NULL;
    v_created_by := NULL;
    v_created_by_staff := NULL;
  END;

  -- Fallback to auth.users metadata
  IF v_source_type IS NULL OR v_source_type = '' THEN
    SELECT u.raw_user_meta_data->>'source_type', u.raw_user_meta_data->>'source_details'
      INTO v_source_type, v_source_details
      FROM auth.users AS u
      WHERE u.id = NEW.id
      LIMIT 1;
  END IF;

  -- Defaults for /signup/agent
  v_source_type := COALESCE(NULLIF(v_source_type, ''), 'signup');
  v_source_details := COALESCE(NULLIF(v_source_details, ''), 'web');
  v_created_by := COALESCE(v_created_by, NEW.id);
  v_created_by_staff := COALESCE(NULLIF(v_created_by_staff, ''), NEW.name);

  INSERT INTO public.agents AS a (
    id, user_id, name, email, agency_name, business_phone, country, city, status,
    source_type, source_details, created_by, created_by_staff, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.id, NEW.name, NEW.email, v_agency_name, v_business_phone,
    v_country, v_city, COALESCE(NEW.status, 'inactive'),
    v_source_type, v_source_details, v_created_by, v_created_by_staff, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, a.name),
    email = COALESCE(EXCLUDED.email, a.email),
    agency_name = COALESCE(EXCLUDED.agency_name, a.agency_name),
    business_phone = COALESCE(EXCLUDED.business_phone, a.business_phone),
    country = COALESCE(EXCLUDED.country, a.country),
    city = COALESCE(EXCLUDED.city, a.city),
    source_type = COALESCE(EXCLUDED.source_type, a.source_type),
    source_details = COALESCE(EXCLUDED.source_details, a.source_details),
    created_by = COALESCE(a.created_by, EXCLUDED.created_by),
    created_by_staff = COALESCE(a.created_by_staff, EXCLUDED.created_by_staff),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_agent_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_source_type text;
  v_source_details text;
  v_created_by uuid;
  v_created_by_staff text;
  v_agency_name text := NULLIF(NEW.company_name, '');
  v_business_phone text := NULLIF(NEW.phone, '');
  v_city text := NEW.city;
  v_country text := NEW.country;
BEGIN
  IF NEW.role <> 'agent' THEN
    RETURN NEW;
  END IF;

  -- Try user_profile_data; tolerate missing table
  BEGIN
    SELECT upd.source_type, upd.source_details, upd.created_by, upd.created_by_staff
      INTO v_source_type, v_source_details, v_created_by, v_created_by_staff
      FROM public.user_profile_data AS upd
      WHERE upd.id = NEW.id
      LIMIT 1;
  EXCEPTION WHEN undefined_table THEN
    v_source_type := NULL;
    v_source_details := NULL;
    v_created_by := NULL;
    v_created_by_staff := NULL;
  END;

  -- Fallback to auth.users metadata
  IF v_source_type IS NULL OR v_source_type = '' THEN
    SELECT u.raw_user_meta_data->>'source_type', u.raw_user_meta_data->>'source_details'
      INTO v_source_type, v_source_details
      FROM auth.users AS u
      WHERE u.id = NEW.id
      LIMIT 1;
  END IF;

  -- Defaults
  v_source_type := COALESCE(NULLIF(v_source_type, ''), 'signup');
  v_source_details := COALESCE(NULLIF(v_source_details, ''), 'web');
  v_created_by := COALESCE(v_created_by, NEW.id);
  v_created_by_staff := COALESCE(NULLIF(v_created_by_staff, ''), NEW.name);

  INSERT INTO public.agents AS a (
    id, user_id, name, email, agency_name, business_phone, country, city, status,
    source_type, source_details, created_by, created_by_staff, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.id, NEW.name, NEW.email, v_agency_name, v_business_phone,
    v_country, v_city, COALESCE(NEW.status, 'inactive'),
    v_source_type, v_source_details, v_created_by, v_created_by_staff, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, a.name),
    email = COALESCE(EXCLUDED.email, a.email),
    agency_name = COALESCE(EXCLUDED.agency_name, a.agency_name),
    business_phone = COALESCE(EXCLUDED.business_phone, a.business_phone),
    country = COALESCE(EXCLUDED.country, a.country),
    city = COALESCE(EXCLUDED.city, a.city),
    source_type = COALESCE(EXCLUDED.source_type, a.source_type),
    source_details = COALESCE(EXCLUDED.source_details, a.source_details),
    created_by = COALESCE(a.created_by, EXCLUDED.created_by),
    created_by_staff = COALESCE(a.created_by_staff, EXCLUDED.created_by_staff),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

COMMIT;