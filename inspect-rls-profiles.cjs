require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase env: VITE_SUPABASE_URL and a key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function exec(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

async function main() {
  console.log('🔍 Inspecting RLS policies on public.profiles...');
  const rows = await exec(`
    SELECT
      polname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
    ORDER BY polname;
  `);

  if (rows.length === 0) {
    console.log('ℹ️ No policies found (RLS might be disabled).');
    return;
  }

  for (const r of rows) {
    console.log(`\n• ${r.polname} (${r.cmd}) roles=${r.roles}`);
    console.log(`  USING: ${r.qual}`);
    console.log(`  WITH CHECK: ${r.with_check}`);
  }
}

main().catch(err => {
  console.error('❌ Inspect error:', err.message);
  process.exit(1);
});