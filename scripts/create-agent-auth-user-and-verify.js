import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAgentUser(email) {
  const password = 'AgentTestPassword123!';
  const name = 'Test Agent';
  console.log(`🧪 Creating agent auth user: ${email}`);

  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    user_metadata: {
      role: 'agent',
      name,
      department: 'External',
      position: 'Travel Agent',
      phone: '+1-555-9999',
      company_name: 'TestCo'
    },
    email_confirm: true
  });

  if (error) {
    console.error(`❌ Failed to create agent user:`, error.message);
    if (error.status) console.error(`   Status: ${error.status}`);
    if (error.name) console.error(`   Name: ${error.name}`);
    // Show raw error if available
    try {
      console.error('   Raw error:', JSON.stringify(error, null, 2));
    } catch {}
    return null;
  }

  const userId = data.user?.id;
  console.log(`✅ Created agent user with id: ${userId}`);
  return userId;
}

async function verifyAgent(userId, email) {
  await new Promise(r => setTimeout(r, 1200));

  const { data: profile, error: profileErr } = await adminSupabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .maybeSingle();

  if (profileErr) {
    console.error('❌ Profile lookup failed:', profileErr.message);
  } else if (profile) {
    console.log(`📄 Profile: id=${profile.id} email=${profile.email} role=${profile.role}`);
  } else {
    console.log('⚠️ Profile not found yet');
  }

  const { data: agentRows, error: agentErr } = await adminSupabase
    .from('agents')
    .select('id, user_id, email, name, status, agency_name')
    .eq('user_id', userId);

  if (agentErr) {
    console.error('❌ Agents lookup failed:', agentErr.message);
    return;
  }

  if (!agentRows || agentRows.length === 0) {
    console.log(`⚠️ No agent rows found for ${email}. If signup failed, this is expected.`);
  } else {
    console.log(`✅ Agent rows exist for ${email}:`);
    for (const r of agentRows) {
      console.log(`- id=${r.id} user_id=${r.user_id} name=${r.name} email=${r.email} status=${r.status} agency_name=${r.agency_name}`);
    }
  }
}

async function main() {
  const email = `agent-${Date.now()}@triplexa.com`;
  const userId = await createAgentUser(email);
  if (userId) await verifyAgent(userId, email);
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});