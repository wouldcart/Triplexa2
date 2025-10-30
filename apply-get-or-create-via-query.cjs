require('dotenv').config();
const fetch = require('node-fetch').default;

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const sql = `
DROP FUNCTION IF EXISTS public.get_or_create_profile_for_current_user();

CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid;
  v_email text;
  v_name text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN json_build_object(
      'id', null,
      'name', null,
      'email', null,
      'role', null,
      'department', null,
      'phone', null,
      'status', null,
      'position', null,
      'employee_id', null,
      'created_at', null,
      'updated_at', null,
      'company_name', null,
      'avatar', null,
      'preferred_language', null,
      'country', null,
      'city', null,
      'must_change_password', null
    );
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  v_name := split_part(coalesce(v_email, ''), '@', 1);

  INSERT INTO public.profiles (
    id, email, name, created_at, updated_at
  ) VALUES (
    v_uid, v_email, v_name, now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(NULLIF(public.profiles.email, ''), EXCLUDED.email),
    name  = CASE WHEN public.profiles.name IS NULL OR public.profiles.name = '' THEN EXCLUDED.name ELSE public.profiles.name END,
    updated_at = now();

  RETURN (
    SELECT json_build_object(
      'id', p.id,
      'name', p.name,
      'email', p.email,
      'role', p.role,
      'department', p.department,
      'phone', p.phone,
      'status', p.status,
      'position', p.position,
      'employee_id', p.employee_id,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'company_name', p.company_name,
      'avatar', p.avatar,
      'preferred_language', p.preferred_language,
      'country', p.country,
      'city', p.city,
      'must_change_password', p.must_change_password
    ) FROM public.profiles p WHERE p.id = v_uid
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated;
`;

async function main() {
  console.log('🔧 Applying get_or_create_profile_for_current_user via REST /query...');
  const resp = await fetch(`${supabaseUrl}/rest/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
      'Prefer': 'return=minimal'
    },
    body: sql
  });
  const text = await resp.text();
  if (!resp.ok) {
    console.error('❌ Failed to apply SQL:', text);
    process.exit(1);
  }
  console.log('✅ SQL applied');
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});