#!/usr/bin/env node

// Inspect which schema the pgcrypto extension is installed in
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env: VITE_SUPABASE_URL/SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

(async () => {
  console.log('🔍 Checking pgcrypto extension schema...');
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT e.extname, n.nspname AS schema
      FROM pg_extension e
      JOIN pg_namespace n ON n.oid = e.extnamespace
      WHERE e.extname = 'pgcrypto'
    `
  });

  if (error) {
    console.error('❌ Query failed:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('⚠️ pgcrypto extension not found');
  } else {
    console.log('✅ pgcrypto extension found:', data);
  }
})();