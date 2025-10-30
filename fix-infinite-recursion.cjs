#!/usr/bin/env node
// Fix infinite recursion in profiles RLS policies by removing risky policies

const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function runWithPg() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;
  if (!supabaseUrl || !dbPassword) {
    throw new Error('Missing Supabase URL or DB password for PG connection');
  }

  const url = new URL(supabaseUrl);
  const projectRef = url.hostname.split('.')[0];

  const client = new Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected via PG. Inspecting profiles policies...');

  const { rows: policies } = await client.query(
    `SELECT policyname, cmd, permissive, roles, qual, with_check
     FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'profiles'
     ORDER BY policyname`
  );

  for (const p of policies) {
    console.log(`- Found policy: ${p.policyname} | cmd=${p.cmd} | qual=${p.qual}`);
  }

  const risky = policies.filter(p => {
    const q = (p.qual || '').toLowerCase();
    const w = (p.with_check || '').toLowerCase();
    return q.includes('auth.role()') || w.includes('auth.role()') || q.includes(' from profiles ') || w.includes(' from profiles ');
  });
  for (const r of risky) {
    const dropSql = `DROP POLICY IF EXISTS "${r.policyname}" ON public.profiles;`;
    console.log('Executing:', dropSql);
    await client.query(dropSql);
  }

  const upsertServiceRolePolicy = `
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Service role can manage all profiles'
      ) THEN
        EXECUTE 'DROP POLICY "Service role can manage all profiles" ON public.profiles';
      END IF;
      EXECUTE 'CREATE POLICY "Service role can manage all profiles" ON public.profiles FOR ALL USING ((auth.jwt() ->> ''role'') = ''service_role'') WITH CHECK ((auth.jwt() ->> ''role'') = ''service_role'')';
    END $$;`;
  console.log('Upserting JWT-based service role policy...');
  await client.query(upsertServiceRolePolicy);

  const { rows: after } = await client.query(
    `SELECT policyname, cmd, qual
     FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'profiles'
     ORDER BY policyname`
  );
  console.log('Policies after fix:');
  for (const p of after) {
    console.log(`- ${p.policyname} | cmd=${p.cmd} | qual=${p.qual}`);
  }

  await client.end();
}

async function runWithRpc() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase URL or service role key for RPC');
  }
  const sb = createClient(supabaseUrl, serviceKey);

  console.log('Connected via RPC. Dropping risky policies and applying safe one...');
  const sql = `
    DO $$
    DECLARE pol record;
    BEGIN
      FOR pol IN SELECT policyname, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename='profiles' LOOP
        IF position('auth.role()' in coalesce(pol.qual, '')) > 0 OR position('auth.role()' in coalesce(pol.with_check, '')) > 0 OR position(' from profiles ' in lower(coalesce(pol.qual, ''))) > 0 OR position(' from profiles ' in lower(coalesce(pol.with_check, ''))) > 0 THEN
          EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.profiles';
        END IF;
      END LOOP;
      IF EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Service role can manage all profiles'
      ) THEN
        EXECUTE 'DROP POLICY "Service role can manage all profiles" ON public.profiles';
      END IF;
      EXECUTE 'CREATE POLICY "Service role can manage all profiles" ON public.profiles FOR ALL USING ((auth.jwt() ->> ''role'') = ''service_role'') WITH CHECK ((auth.jwt() ->> ''role'') = ''service_role'')';
    END $$;`;

  // Try both parameter names depending on installed exec_sql signature
  const res1 = await sb.rpc('exec_sql', { sql_query: sql });
  if (res1.error) {
    const res2 = await sb.rpc('exec_sql', { sql });
    if (res2.error) throw new Error(`RPC failed: ${res2.error.message}`);
  }
  console.log('RPC policy fix applied.');
}

async function main() {
  try {
    if (process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD) {
      await runWithPg();
    } else {
      await runWithRpc();
    }
    console.log('Done. Policies updated.');
  } catch (err) {
    console.error('Fatal error:', err.message || err);
    process.exit(1);
  }
}

main();