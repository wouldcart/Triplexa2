#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase env: SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sqlPath = path.resolve(__dirname, '../supabase/sql/create_profiles_with_rls.sql');
if (!fs.existsSync(sqlPath)) {
  console.error(`❌ SQL file not found: ${sqlPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');

async function applySQL() {
  console.log('🚀 Applying profiles table with RLS via /rest/v1/query...');
  const res = await fetch(`${supabaseUrl}/rest/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.pgrst.object+json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Prefer': 'return=minimal'
    },
    body: sql
  });

  const text = await res.text();
  if (!res.ok) {
    console.error('❌ SQL apply failed:');
    console.error(text);
    process.exit(1);
  }

  console.log('✅ SQL applied successfully');
}

applySQL().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});