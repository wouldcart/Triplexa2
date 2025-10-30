require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function exec(sql, label) {
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.log(`❌ ${label} failed:`, error.message);
    return false;
  }
  return true;
}

async function main() {
  console.log('🚀 Applying user-provided function SQL...');

  const dropSql = `DROP FUNCTION IF EXISTS public.get_or_create_profile_for_current_user();`;
  const createSql = `
CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user() 
RETURNS json 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth 
AS $$ 
DECLARE 
  user_id uuid; 
  user_email text; 
  user_name text; 
  profile_record json; 
BEGIN 
  user_id := auth.uid(); 
  IF user_id IS NULL THEN 
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

  SELECT email INTO user_email FROM auth.users WHERE id = user_id; 
  user_name := split_part(coalesce(user_email, ''), '@', 1); 

  INSERT INTO public.profiles ( 
    id, email, name, created_at, updated_at 
  ) VALUES ( 
    user_id, user_email, user_name, now(), now() 
  ) 
  ON CONFLICT (id) DO UPDATE SET 
    email = COALESCE(NULLIF(profiles.email, ''), EXCLUDED.email), 
    name  = CASE WHEN profiles.name IS NULL OR profiles.name = '' THEN EXCLUDED.name ELSE profiles.name END, 
    updated_at = now(); 

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
  ) INTO profile_record 
  FROM public.profiles p 
  WHERE p.id = user_id; 

  RETURN profile_record; 
END; 
$$;`;

  const grantSql = `GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated;`;

  const dropped = await exec(dropSql, 'Drop function');
  if (!dropped) {
    console.log('⚠️ Drop may have failed or function did not exist; continuing...');
  }

  const created = await exec(createSql, 'Create function');
  if (!created) {
    console.log('❌ Create failed; aborting');
    return;
  }

  const granted = await exec(grantSql, 'Grant execute');
  if (!granted) {
    console.log('⚠️ Grant failed; you may need to run it manually');
  }

  // Verify
  const { data: verifyFn, error: verifyErr } = await supabase.rpc('exec_sql', { sql: `
    SELECT proname FROM pg_proc WHERE proname = 'get_or_create_profile_for_current_user';
  ` });
  if (!verifyErr) {
    console.log('✅ Function present:', Array.isArray(verifyFn) ? verifyFn.length > 0 : true);
  }

  const { data: unauth, error: unauthErr } = await supabase.rpc('get_or_create_profile_for_current_user');
  if (!unauthErr) {
    console.log('✅ Unauthenticated call returns nulls:', unauth && unauth.id === null);
  } else {
    console.log('⚠️ Unauthenticated test error:', unauthErr.message);
  }

  console.log('🎉 Applied user-provided function SQL');
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
});