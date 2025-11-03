#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing env');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const sql = `
    select nspname, proname
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where p.proname = 'pgp_sym_encrypt'
  `;
  const { data, error } = await admin.rpc('exec_sql', { sql });
  if (error) {
    console.error('exec_sql error:', error.message);
    process.exit(1);
  }
  console.log('pgp_sym_encrypt presence:', data);
}

main().catch(err => { console.error(err); process.exit(1); });