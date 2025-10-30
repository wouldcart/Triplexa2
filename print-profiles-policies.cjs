#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase URL or service role key');
  process.exit(1);
}
const sb = createClient(url, key);

async function main() {
  const { data, error } = await sb.rpc('exec_sql', {
    sql_query: `SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
                FROM pg_policies
                WHERE schemaname='public' AND tablename='profiles'
                ORDER BY policyname`
  });
  if (error) {
    const { data: data2, error: error2 } = await sb.rpc('exec_sql', {
      sql: `SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
            FROM pg_policies
            WHERE schemaname='public' AND tablename='profiles'
            ORDER BY policyname`
    });
    if (error2) {
      console.error('Failed to list policies:', error2.message);
      process.exit(1);
    }
    console.log(JSON.stringify(data2, null, 2));
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

main();