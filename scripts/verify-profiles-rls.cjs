#!/usr/bin/env node

require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase env: SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function runQuery(sql, label) {
  const res = await fetch(`${supabaseUrl}/rest/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.pgrst.object+json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Prefer': 'return=representation'
    },
    body: sql
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`❌ ${label} failed:`);
    console.error(text);
    process.exit(1);
  }
  console.log(`✅ ${label} succeeded`);
  console.log(text);
}

async function main() {
  console.log('🔎 Verifying profiles table, RLS policies, and RPC functions...');

  const checkTableSQL = `
    SELECT EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles'
    ) AS has_table;
  `;

  const checkPoliciesSQL = `
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' ORDER BY policyname;
  `;

  const checkFunctionsSQL = `
    SELECT routine_name FROM information_schema.routines 
    WHERE routine_schema = 'public' 
      AND routine_name IN ('get_or_create_my_profile', 'update_my_profile')
    ORDER BY routine_name;
  `;

  await runQuery(checkTableSQL, 'Check profiles table');
  await runQuery(checkPoliciesSQL, 'List profiles policies');
  await runQuery(checkFunctionsSQL, 'List RPC functions');

  console.log('🎉 Verification complete');
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});