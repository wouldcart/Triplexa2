#!/usr/bin/env node

// Apply a minimal, schema-compatible handle_new_user trigger via PostgREST
// and verify it works by creating a test user and checking profiles.

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('SUPABASE_URL/VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const migrationSQL = `
-- 1) Drop existing trigger to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2) Create minimal, safe handle_new_user matching current profiles schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_role TEXT;
  v_department TEXT;
  v_position TEXT;
BEGIN
  v_name := COALESCE(
    NULLIF(NEW.user_metadata->>'name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(NEW.email, '@', 1)
  );
  v_role := COALESCE(
    NULLIF(NEW.user_metadata->>'role', ''),
    NULLIF(NEW.raw_user_meta_data->>'role', ''),
    'agent'
  );
  v_department := COALESCE(
    NULLIF(NEW.user_metadata->>'department', ''),
    NULLIF(NEW.raw_user_meta_data->>'department', ''),
    'General'
  );
  v_position := COALESCE(
    NULLIF(NEW.user_metadata->>'position', ''),
    NULLIF(NEW.raw_user_meta_data->>'position', ''),
    'Agent'
  );

  -- Insert minimal profile; do not block signup if it fails
  BEGIN
    INSERT INTO public.profiles (
      id, email, name, role, department, status, position, created_at, updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      v_name,
      v_role,
      v_department,
      'active',
      v_position,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'handle_new_user error for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- 3) Reattach trigger to auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Optional: grant for observability; trigger runs as definer
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
`;

async function applyMigration() {
  console.log('🔄 Applying minimal handle_new_user trigger via PostgREST...');
  const response = await fetch(`${supabaseUrl}/rest/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Prefer': 'return=minimal'
    },
    body: migrationSQL
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Migration failed:', response.status, errorText);
    return false;
  }

  console.log('✅ Migration applied');
  return true;
}

async function verify() {
  console.log('🔍 Verifying function and trigger presence...');

  const { data: funcInfo, error: funcErr } = await admin.rpc('exec_sql', {
    sql_query: `SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user');`
  });
  if (funcErr) console.warn('⚠️ Function existence check via RPC failed:', funcErr.message);
  else console.log('📋 handle_new_user exists:', funcInfo?.[0]?.exists ?? funcInfo);

  const { data: trigInfo, error: trigErr } = await admin.rpc('exec_sql', {
    sql_query: `SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created');`
  });
  if (trigErr) console.warn('⚠️ Trigger existence check via RPC failed:', trigErr.message);
  else console.log('📋 on_auth_user_created exists:', trigInfo?.[0]?.exists ?? trigInfo);
}

async function test() {
  console.log('🧪 Creating test user and checking profile auto-creation...');

  const testEmail = `test.agent.${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';

  // Create user with email confirmed to avoid email issues
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: {
      name: 'Test Agent',
      role: 'agent',
      department: 'General',
      position: 'Agent'
    }
  });

  if (createErr) {
    console.error('❌ Admin createUser failed:', createErr.message);
    return false;
  }

  const userId = created.user?.id;
  console.log('✅ Created test user:', userId);

  // Wait briefly for trigger
  await new Promise(r => setTimeout(r, 1500));

  const { data: profile, error: profErr } = await admin
    .from('profiles')
    .select('id,email,name,role,department,status,position,created_at,updated_at')
    .eq('id', userId)
    .maybeSingle();

  if (profErr) {
    console.error('❌ Profiles fetch error:', profErr.message);
  } else if (!profile) {
    console.error('❌ No profile created for user');
  } else {
    console.log('✅ Profile auto-created:', profile);
  }

  // Cleanup
  try {
    await admin.from('profiles').delete().eq('id', userId);
    await admin.auth.admin.deleteUser(userId);
    console.log('🧹 Cleaned up test user and profile');
  } catch (cleanupError) {
    console.warn('⚠️ Cleanup warning:', cleanupError.message);
  }

  return !!profile;
}

async function main() {
  const ok = await applyMigration();
  if (!ok) process.exit(1);

  await verify();
  const passed = await test();
  if (!passed) process.exit(1);
  console.log('🎉 Minimal handle_new_user installed and verified');
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});