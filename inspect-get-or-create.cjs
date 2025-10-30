require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase env: VITE_SUPABASE_URL and a key (service or publishable)');
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
  console.log('🔍 Inspecting get_or_create_profile_for_current_user definitions...');

  const rows = await exec(`
    SELECT
      n.nspname AS schema,
      p.proname AS name,
      p.oid,
      p.prorettype::regtype AS return_type,
      p.proargnames,
      p.proargtypes::regtype[] AS arg_types,
      pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'get_or_create_profile_for_current_user'
    ORDER BY n.nspname, p.oid;
  `);

  if (rows.length === 0) {
    console.log('❌ No matching functions found in pg_proc');
  } else {
    for (const r of rows) {
      console.log(`\n• ${r.schema}.${r.name} oid=${r.oid}`);
      console.log(`  args=${JSON.stringify(r.arg_types)} return=${r.return_type}`);
      console.log(r.definition);
    }
  }

  console.log('\n🔎 Checking PostgREST cache visibility via information_schema (volatility/stability)');
  const visRows = await exec(`
    SELECT
      routine_schema,
      routine_name,
      data_type,
      routine_type
    FROM information_schema.routines
    WHERE routine_name = 'get_or_create_profile_for_current_user'
      AND routine_schema = 'public';
  `);

  console.log('info_schema routines:', visRows);
}

main().catch(err => {
  console.error('❌ Inspect error:', err.message);
  process.exit(1);
});