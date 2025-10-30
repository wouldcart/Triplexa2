#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing env');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  console.log('Calling exec_sql with a simple SELECT...');
  const { data, error } = await admin.rpc('exec_sql', { sql_query: 'SELECT 42 as answer' });
  if (error) {
    console.error('RPC error:', error.message);
    process.exit(1);
  }
  console.log('Result:', data);
}

main().catch(err => { console.error(err); process.exit(1); });