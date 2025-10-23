import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('❌ Missing Supabase env: VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function logResult(ok, msg) {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${msg}`);
}

async function main() {
  const email = `test.agent.${Date.now()}@example.com`;
  const password = 'TempPassword123!';

  const test = {
    agency_name: 'Test Company Ltd',
    name: 'Test Contact',
    email,
    business_phone: '+1-555-1234',
    business_address: '123 Test Street, Suite 100',
    city: 'Testville',
    country: 'Testland',
    type: 'Travel Agency',
    specializations: ['Leisure Travel'],
    status: 'inactive',
  };

  console.log('🔧 Creating auth user for mapping test:', email);

  // 0) Create auth user using service-role admin
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'agent',
      name: test.name,
      phone: test.business_phone,
      company_name: test.agency_name,
    }
  });

  if (createErr || !created?.user) {
    logResult(false, `auth.admin.createUser failed: ${(createErr && createErr.message) || 'unknown error'}`);
    process.exit(1);
  }

  const id = created.user.id;
  console.log('🔧 Using profile/agent id:', id);

  // 1) Insert matching profile first to satisfy FK (profiles.id -> auth.users.id)
  const { error: pErr } = await supabase
    .from('profiles')
    .upsert({
      id,
      name: test.name,
      email: test.email,
      phone: test.business_phone,
      company_name: test.agency_name,
      role: 'agent',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  if (pErr) {
    logResult(false, `profiles upsert failed: ${pErr.message}`);
    await supabase.auth.admin.deleteUser(id).catch(() => {});
    process.exit(1);
  }
  logResult(true, 'profiles upsert succeeded');

  // 2) Upsert into agents with core fields
  const { data: agentCore, error: aErr } = await supabase
    .from('agents')
    .upsert({
      id,
      user_id: id,
      agency_name: test.agency_name,
      business_phone: test.business_phone,
      business_address: test.business_address,
      specializations: test.specializations,
      status: test.status,
      created_by: id,
      source_type: 'test_script',
      source_details: 'Admin service-role upsert'
    }, { onConflict: 'id' })
    .select('*')
    .single();

  if (aErr) {
    logResult(false, `agents upsert failed: ${aErr.message}`);
    await supabase.auth.admin.deleteUser(id).catch(() => {});
    process.exit(1);
  }
  logResult(true, 'agents upsert core fields succeeded');

  // 3) Update additional fields (name/email/city/country/type)
  const { error: updErr } = await supabase
    .from('agents')
    .update({
      name: test.name,
      email: test.email,
      city: test.city,
      country: test.country,
      type: test.type,
    })
    .eq('id', id);
  if (updErr) {
    logResult(false, `agents update failed: ${updErr.message}`);
    await supabase.auth.admin.deleteUser(id).catch(() => {});
    process.exit(1);
  }
  logResult(true, 'agents update additional fields succeeded');

  // 4) Read back and verify mappings
  const { data: row, error: readErr } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single();
  if (readErr) {
    logResult(false, `agents select failed: ${readErr.message}`);
    await supabase.auth.admin.deleteUser(id).catch(() => {});
    process.exit(1);
  }

  const checks = [
    ['agency_name', row.agency_name, test.agency_name],
    ['name', row.name, test.name],
    ['email', row.email, test.email],
    ['business_phone', row.business_phone, test.business_phone],
    ['business_address', row.business_address, test.business_address],
    ['city', row.city, test.city],
    ['country', row.country, test.country],
    ['type', row.type, test.type],
    ['specializations[0]', Array.isArray(row.specializations) ? row.specializations[0] : null, test.specializations[0]],
  ];

  let allOk = true;
  for (const [field, got, expected] of checks) {
    const ok = got === expected;
    allOk = allOk && ok;
    logResult(ok, `${field} = ${JSON.stringify(got)} (expected ${JSON.stringify(expected)})`);
  }

  if (allOk) {
    logResult(true, 'All field mappings verified in agents table ✅');
  } else {
    logResult(false, 'Some field mappings did not match ❌');
  }

  // 5) Cleanup test records
  const { error: delAgentsErr } = await supabase.from('agents').delete().eq('id', id);
  if (delAgentsErr) {
    logResult(false, `cleanup agents failed: ${delAgentsErr.message}`);
  } else {
    logResult(true, 'cleanup agents succeeded');
  }
  const { error: delProfilesErr } = await supabase.from('profiles').delete().eq('id', id);
  if (delProfilesErr) {
    logResult(false, `cleanup profiles failed: ${delProfilesErr.message}`);
  } else {
    logResult(true, 'cleanup profiles succeeded');
  }
  await supabase.auth.admin.deleteUser(id).catch(() => {});
  logResult(true, 'cleanup auth user succeeded');

  console.log('\n🎉 Agent insert mapping test complete');
}

main().catch(err => {
  console.error('❌ Test crashed:', err);
  process.exit(1);
});