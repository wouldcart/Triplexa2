require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function exec(sql, label = 'SQL') {
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.log(`❌ ${label} failed:`, error.message);
    return { ok: false, error };
  }
  return { ok: true, data };
}

async function update_get_or_create_profile() {
  console.log('\n1) Updating get_or_create_profile_for_current_user...');
  const ddl = `
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
    $$;
  `;

  const result = await exec(ddl, 'Update get_or_create_profile_for_current_user');
  if (!result.ok) return false;

  const grant = `GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated;`;
  await exec(grant, 'Grant execute to authenticated');
  return true;
}

async function update_exec_sql() {
  console.log('\n2) Updating exec_sql utility...');
  const ddl = `
    CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE result json;
    BEGIN
      EXECUTE format('SELECT coalesce(json_agg(t), ''[]''::json) FROM (%s) t', sql) INTO result;
      RETURN result;
    EXCEPTION WHEN OTHERS THEN
      RETURN json_build_object('error', SQLERRM);
    END;
    $$;
  `;
  const result = await exec(ddl, 'Update exec_sql');
  if (!result.ok) return false;

  // Caution: exposing exec_sql widely is dangerous; keep to authenticated only.
  const grant = `GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;`;
  await exec(grant, 'Grant execute on exec_sql');
  return true;
}

async function update_handle_new_user() {
  console.log('\n3) Updating handle_new_user trigger function...');
  const ddl = `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, auth
    AS $$
    BEGIN
      INSERT INTO public.profiles (id, email, created_at, updated_at)
      VALUES (NEW.id, NEW.email, now(), now())
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END;
    $$;
  `;
  const result = await exec(ddl, 'Update handle_new_user');
  if (!result.ok) return false;

  const trigger = `
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
  `;
  const tRes = await exec(trigger, 'Create trigger on_auth_user_created');
  return !!tRes.ok;
}

async function update_profiles_enrich() {
  console.log('\n4) Updating profiles_enrich_after_basic trigger function...');
  const ddl = `
    CREATE OR REPLACE FUNCTION public.profiles_enrich_after_basic()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, auth
    AS $$
    DECLARE v_email text;
    DECLARE v_name text;
    BEGIN
      SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;
      v_name := split_part(coalesce(v_email, ''), '@', 1);

      UPDATE public.profiles p
      SET
        email = COALESCE(NULLIF(p.email, ''), v_email),
        name  = CASE WHEN p.name IS NULL OR p.name = '' THEN v_name ELSE p.name END,
        updated_at = now()
      WHERE p.id = NEW.id;

      RETURN NEW;
    END;
    $$;
  `;
  const result = await exec(ddl, 'Update profiles_enrich_after_basic');
  if (!result.ok) return false;

  const trigger = `
    DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
    CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.profiles_enrich_after_basic();
  `;
  const tRes = await exec(trigger, 'Create trigger on_profile_created');
  return !!tRes.ok;
}

async function verify() {
  console.log('\n5) Verifying updated functions and triggers...');
  const fnCheck = `
    SELECT proname AS name FROM pg_proc WHERE proname IN (
      'get_or_create_profile_for_current_user', 'exec_sql', 'handle_new_user', 'profiles_enrich_after_basic'
    ) ORDER BY 1;
  `;
  const trCheck = `
    SELECT trigger_name, event_object_table FROM information_schema.triggers
    WHERE trigger_name IN ('on_auth_user_created','on_profile_created') ORDER BY 1;
  `;
  const f = await exec(fnCheck, 'Verify functions');
  const t = await exec(trCheck, 'Verify triggers');
  if (f.ok) console.log('✅ Functions verified');
  if (t.ok) console.log('✅ Triggers verified');

  const { data: unauth, error } = await supabase.rpc('get_or_create_profile_for_current_user');
  if (!error) {
    console.log('✅ Main function works unauthenticated (returns nulls):', unauth && unauth.id === null);
  } else {
    console.log('⚠️ Main function unauth test error:', error.message);
  }
}

async function main() {
  console.log('🚀 Updating Supabase functions and triggers...');
  const s1 = await update_get_or_create_profile();
  const s2 = await update_exec_sql();
  const s3 = await update_handle_new_user();
  const s4 = await update_profiles_enrich();
  if (s1 && s2 && s3 && s4) {
    console.log('\n🎉 Updates applied successfully');
  } else {
    console.log('\n❌ Some updates failed — check logs above');
  }
  await verify();
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
});