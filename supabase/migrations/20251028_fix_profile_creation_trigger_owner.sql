
DECLARE
  user_name TEXT;
  user_role TEXT;
  user_phone TEXT;
  user_department TEXT;
  user_position TEXT;
  user_employee_id TEXT;
  user_company_name TEXT;
  user_avatar TEXT;
  user_preferred_language TEXT;
  user_country TEXT;
  user_city TEXT;
  user_status TEXT;
  user_must_change_password BOOLEAN;
BEGIN
  -- Extract metadata with sensible fallbacks
  user_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1));
  user_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'agent');
  user_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  user_department := NULLIF(NEW.raw_user_meta_data->>'department', '');
  user_position := NULLIF(NEW.raw_user_meta_data->>'position', '');
  user_employee_id := NULLIF(NEW.raw_user_meta_data->>'employee_id', '');
  user_company_name := NULLIF(NEW.raw_user_meta_data->>'company_name', '');
  user_avatar := NULLIF(NEW.raw_user_meta_data->>'avatar', '');
  user_preferred_language := COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_language', ''), 'en');
  user_country := NULLIF(NEW.raw_user_meta_data->>'country', '');
  user_city := NULLIF(NEW.raw_user_meta_data->>'city', '');
  user_status := COALESCE(NULLIF(NEW.raw_user_meta_data->>'status', ''), 'inactive');
  user_must_change_password := COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false);

  -- Insert/update profile with all available fields
  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    department,
    phone,
    status,
    position,
    employee_id,
    created_at,
    updated_at,
    company_name,
    avatar,
    preferred_language,
    country,
    city,
    must_change_password
  ) VALUES (
    NEW.id,
    user_name,
    NEW.email,
    user_role,
    user_department,
    user_phone,
    user_status,
    user_position,
    user_employee_id,
    NOW(),
    NOW(),
    user_company_name,
    user_avatar,
    user_preferred_language,
    user_country,
    user_city,
    user_must_change_password
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    email = EXCLUDED.email,
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

  -- If role is 'agent', also create/update agent record
  IF user_role = 'agent' THEN
    INSERT INTO public.agents (
      id,
      user_id,
      name,
      email,
      agency_name,
      business_phone,
      city,
      country,
      status,
      created_at,
      updated_at,
      created_by
    ) VALUES (
      NEW.id,
      NEW.id,
      user_name,
      NEW.email,
      user_company_name,
      user_phone,
      user_city,
      user_country,
      CASE WHEN user_status = 'active' THEN 'active' ELSE 'inactive' END,
      NOW(),
      NOW(),
      NEW.id
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
    -- Log error but don't fail the auth process
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
