const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

async function execSQL(sql, label = 'SQL') {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
    },
    body: JSON.stringify({ sql }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  if (!res.ok) {
    console.log(`❌ ${label} failed:`);
    console.log(text);
    throw new Error(text);
  }
  console.log(`✅ ${label} succeeded`);
  if (json) console.log(json);
  return json ?? text;
}

async function main() {
  console.log('🔥 Backfill profiles from auth.users');

  // 1) Inspect current state
  await execSQL(`
    SELECT COUNT(*) AS profiles_count FROM public.profiles;
  `, 'Count profiles');

  await execSQL(`
    SELECT COUNT(*) AS users_count FROM auth.users;
  `, 'Count auth.users');

  // 2) Ensure RLS off and no policies on profiles
  await execSQL(`
    ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
  `, 'Disable RLS on profiles');

  await execSQL(`
    DO $$ 
    DECLARE pol RECORD;
    BEGIN
      FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles'
      LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.profiles';
      END LOOP;
    END $$;
  `, 'Drop profiles policies');

  // 3) Inspect constraints
  await execSQL(`
    SELECT conname, contype
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass;
  `, 'List profiles constraints');

  // 4) Backfill profiles from auth.users (only missing ones)
  const insertSQL = `
    INSERT INTO public.profiles (id, email, name, role, status, created_at, updated_at)
    SELECT u.id,
           u.email,
           COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'New User') AS name,
           'basic' AS role,
           'active' AS status,
           NOW() AS created_at,
           NOW() AS updated_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE p.id IS NULL
    RETURNING id;
  `;
  const inserted = await execSQL(insertSQL, 'Backfill missing profiles');

  // 5) Verify counts after backfill
  await execSQL(`
    SELECT COUNT(*) AS profiles_count_after FROM public.profiles;
  `, 'Count profiles (after)');

  // 6) Verify trigger on auth.users
  await execSQL(`
    SELECT t.tgname, p.proname, pg_get_triggerdef(t.oid) AS definition
    FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE t.tgrelid = 'auth.users'::regclass
      AND NOT t.tgisinternal;
  `, 'List triggers on auth.users');

  console.log('\n✅ Backfill complete. You can now export to CSV if needed.');
}

main().catch((e) => {
  console.error('Unexpected error:', e.message);
});