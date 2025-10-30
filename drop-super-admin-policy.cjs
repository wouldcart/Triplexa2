#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run(sql) {
  const sb = createClient(url, key);
  // Try both parameter names to cover different exec_sql signatures
  const res1 = await sb.rpc('exec_sql', { sql_query: sql });
  if (res1.error) {
    const res2 = await sb.rpc('exec_sql', { sql });
    if (res2.error) {
      throw new Error(res2.error.message);
    }
    return res2.data;
  }
  return res1.data;
}

async function main() {
  if (!url || !key) {
    console.error('Missing Supabase URL or service role key');
    process.exit(1);
  }

  try {
    console.log('Dropping recursive super-admin profiles policies...');
    await run('DROP POLICY IF EXISTS "Super admins have full access to profiles" ON public.profiles;');
    await run('DROP POLICY IF EXISTS "Super admin full access" ON public.profiles;');
    await run('DROP POLICY IF EXISTS "Allow super_admin full access" ON public.profiles;');
    // Also drop insecure service role policy variant that relies on auth.role()
    await run('DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;');
    console.log('Dropped policies if existed.');

    console.log('Creating safe super-admin policy using auth.users metadata...');
    await run(`CREATE POLICY "Super admins have full access to profiles" ON public.profiles
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
        )
      );`);
    console.log('Created safe policy.');

    console.log('Verifying current profiles policies...');
    const listSql = `SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
                     FROM pg_policies WHERE schemaname='public' AND tablename='profiles' ORDER BY policyname`;
    const out = await run(listSql);
    console.log(JSON.stringify(out, null, 2));
  } catch (err) {
    console.error('Failed:', err.message || err);
    process.exit(1);
  }
}

main();