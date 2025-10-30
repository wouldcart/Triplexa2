import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Create a client for information_schema so we can query metadata
const infoClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'information_schema' }
});

async function checkAuthUsersTriggers() {
  console.log('\n🔍 Triggers on auth.users');
  const { data, error } = await infoClient
    .from('triggers')
    .select('trigger_name, trigger_schema, event_manipulation, action_timing, event_object_schema, event_object_table, action_statement')
    .eq('event_object_schema', 'auth')
    .eq('event_object_table', 'users');
  if (error) {
    console.log('❌ Failed to fetch triggers:', error.message);
    return [];
  }
  data?.forEach(t => {
    console.log(`  • ${t.trigger_name} [${t.action_timing} ${t.event_manipulation}] -> ${t.action_statement}`);
  });
  return data || [];
}

async function checkFunctionsPresence(names) {
  console.log('\n🔍 Function presence (public schema)');
  const { data, error } = await infoClient
    .from('routines')
    .select('routine_name, routine_schema')
    .eq('routine_schema', 'public');
  if (error) {
    console.log('❌ Failed to fetch routines:', error.message);
    return;
  }
  const existing = new Set((data || []).map(r => r.routine_name));
  names.forEach(name => {
    console.log(`  • ${name}: ${existing.has(name) ? 'FOUND' : 'MISSING'}`);
  });
}

async function checkAgentsConstraints() {
  console.log('\n🔍 Agents table constraints (status check)');
  const { data, error } = await infoClient
    .from('check_constraints')
    .select('constraint_name, check_clause')
    .ilike('constraint_name', '%agents_status_check%');
  if (error) {
    console.log('❌ Failed to fetch constraints:', error.message);
    return;
  }
  (data || []).forEach(c => {
    console.log(`  • ${c.constraint_name}: ${c.check_clause}`);
  });
}

async function main() {
  console.log('🎯 Auth Health Check');
  console.log('====================');
  await checkAuthUsersTriggers();
  await checkFunctionsPresence([
    'handle_new_user',
    'handle_agent_profile_insert',
    'handle_agent_profile_update',
    'profiles_to_staff_sync',
    'update_updated_at_column'
  ]);
  await checkAgentsConstraints();
  console.log('\n✅ Check complete');
}

main().catch(err => {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
});