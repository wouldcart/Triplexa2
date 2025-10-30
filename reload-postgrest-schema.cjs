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

async function rpcExec(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw error;
  return data;
}

async function main() {
  console.log('🔄 Sending PostgREST schema reload notification...');
  try {
    // PostgREST listens on channel 'pgrst' for 'reload schema'
    const result = await rpcExec(`SELECT pg_catalog.pg_notify('pgrst','reload schema') AS notified`);
    console.log('✅ Reload notification sent:', result);
  } catch (err) {
    console.error('❌ Failed to notify PostgREST:', err.message);
  }

  // Verify RPC visibility after reload
  console.log('\n🔍 Verifying RPC availability: get_or_create_profile_for_current_user');
  try {
    const { data, error, status, statusText } = await supabase.rpc('get_or_create_profile_for_current_user');
    if (error) {
      console.log('⚠️ RPC call error:', { status, statusText, error });
    } else {
      console.log('✅ RPC call succeeded:', data);
    }
  } catch (err) {
    console.error('❌ RPC verify error:', err.message);
  }
}

main();