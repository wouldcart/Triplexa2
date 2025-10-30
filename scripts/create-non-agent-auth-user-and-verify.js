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

async function createNonAgentUser(role, email) {
  const name = role === 'manager' ? 'John Manager' : 'Jane Sales';
  const password = 'TestPassword123!';
  console.log(`🧪 Creating ${role} auth user: ${email}`);

  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    user_metadata: {
      role,
      name,
      department: role === 'manager' ? 'Operations' : 'Sales',
      position: role === 'manager' ? 'Operations Manager' : 'Sales Representative'
    },
    email_confirm: true
  });

  if (error) {
    console.error(`❌ Failed to create ${role} user:`, error.message);
    return null;
  }

  const userId = data.user?.id;
  console.log(`✅ Created ${role} user with id: ${userId}`);
  return userId;
}

async function verify(userId, email, role) {
  // Give triggers a moment
  await new Promise(r => setTimeout(r, 1000));

  const { data: profile, error: profileErr } = await adminSupabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .single();

  if (profileErr) {
    console.error('❌ Profile lookup failed:', profileErr.message);
  } else {
    console.log(`📄 Profile: id=${profile.id} email=${profile.email} role=${profile.role}`);
  }

  const { data: agentRows, error: agentErr } = await adminSupabase
    .from('agents')
    .select('user_id, email, name, status')
    .eq('user_id', userId);

  if (agentErr) {
    console.error('❌ Agents lookup failed:', agentErr.message);
    return;
  }

  if (!agentRows || agentRows.length === 0) {
    console.log(`✅ No agent rows created for ${role} (${email}) — correct behavior.`);
  } else {
    console.log(`⚠️ Unexpected agent rows exist for ${role} (${email}):`);
    for (const r of agentRows) {
      console.log(`- user_id=${r.user_id} email=${r.email} name=${r.name} status=${r.status}`);
    }
  }
}

async function main() {
  const managerEmail = `manager-${Date.now()}@triplexa.com`;
  const salesEmail = `sales-${Date.now()}@triplexa.com`;
  const hrEmail = `hr-${Date.now()}@triplexa.com`;

  const managerId = await createNonAgentUser('manager', managerEmail);
  if (managerId) await verify(managerId, managerEmail, 'manager');

  const salesId = await createNonAgentUser('sales', salesEmail);
  if (salesId) await verify(salesId, salesEmail, 'sales');

  const hrId = await createNonAgentUser('hr_manager', hrEmail);
  if (hrId) await verify(hrId, hrEmail, 'hr_manager');
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});