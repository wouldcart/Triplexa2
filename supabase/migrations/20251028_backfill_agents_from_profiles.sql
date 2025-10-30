-- Backfill agents from existing profiles and user_profile_data
-- Creates or updates agent rows for all profiles with role='agent'

BEGIN;

-- SECURITY DEFINER function to bypass RLS and perform set-based upsert
CREATE OR REPLACE FUNCTION public._tmp_backfill_agents_from_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  has_upd boolean;
  sql text;
BEGIN
  SELECT to_regclass('public.user_profile_data') IS NOT NULL INTO has_upd;

  IF has_upd THEN
    sql := $q$
      INSERT INTO public.agents AS a (
        id, user_id, name, email, agency_name, business_phone, country, city, status,
        source_type, source_details, created_by, created_by_staff, created_at, updated_at
      )
      SELECT
        p.id,
        p.id,
        p.name,
        p.email,
        NULLIF(p.company_name, ''),
        NULLIF(p.phone, ''),
        p.country,
        p.city,
        COALESCE(NULLIF(p.status, ''), 'inactive'),
        COALESCE(NULLIF(upd.source_type, ''), NULLIF(u.raw_user_meta_data->>'source_type', ''), 'signup'),
        COALESCE(NULLIF(upd.source_details, ''), NULLIF(u.raw_user_meta_data->>'source_details', ''), 'web'),
        COALESCE(upd.created_by, p.id),
        COALESCE(NULLIF(upd.created_by_staff, ''), p.name),
        NOW(),
        NOW()
      FROM public.profiles p
      LEFT JOIN public.user_profile_data upd ON upd.id = p.id
      LEFT JOIN auth.users u ON u.id = p.id
      WHERE p.role = 'agent'
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
    $q$;
  ELSE
    sql := $q$
      INSERT INTO public.agents AS a (
        id, user_id, name, email, agency_name, business_phone, country, city, status,
        source_type, source_details, created_by, created_by_staff, created_at, updated_at
      )
      SELECT
        p.id,
        p.id,
        p.name,
        p.email,
        NULLIF(p.company_name, ''),
        NULLIF(p.phone, ''),
        p.country,
        p.city,
        COALESCE(NULLIF(p.status, ''), 'inactive'),
        COALESCE(NULLIF(u.raw_user_meta_data->>'source_type', ''), 'signup'),
        COALESCE(NULLIF(u.raw_user_meta_data->>'source_details', ''), 'web'),
        p.id,
        p.name,
        NOW(),
        NOW()
      FROM public.profiles p
      LEFT JOIN auth.users u ON u.id = p.id
      WHERE p.role = 'agent'
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
    $q$;
  END IF;

  EXECUTE sql;
END;
$$;

-- Execute the backfill now
SELECT public._tmp_backfill_agents_from_profiles();

-- Optionally drop the temp function to avoid lingering
DROP FUNCTION IF EXISTS public._tmp_backfill_agents_from_profiles();

COMMIT;