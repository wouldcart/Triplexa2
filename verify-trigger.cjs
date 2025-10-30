const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🔎 Verify on_auth_user_created trigger populates profiles');
  const email = `trigger-test-${Date.now()}@example.com`;
  const password = 'TriggerTest123!';

  // 1) Sign up a new user
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: 'Trigger Test User' }
    }
  });

  if (signupError) {
    console.error('❌ Signup failed:', signupError.message);
    return;
  }
  const userId = signupData.user?.id;
  console.log('✅ Signup ok, userId:', userId);

  // 2) Wait for trigger to execute
  console.log('⏳ Waiting 3s for trigger...');
  await wait(3000);

  // 3) Check profile row
  const { data: profileRows, error: profileError } = await supabase
    .from('profiles')
    .select('id,email,name,role,status,created_at,updated_at')
    .eq('id', userId);

  if (profileError) {
    console.error('❌ Profile query failed:', profileError.message);
  } else if (profileRows && profileRows.length > 0) {
    console.log('✅ Trigger SUCCESS: profile row exists');
    console.log(profileRows[0]);
  } else {
    console.log('❌ Trigger FAILED: no profile row found for user');
  }

  // 4) Cleanup test user and any profile row
  console.log('🧹 Cleaning up test artifacts');
  try {
    await supabase.from('profiles').delete().eq('id', userId);
  } catch (e) {
    console.log('Profile cleanup error (ignored):', e.message);
  }
  try {
    await supabase.auth.admin.deleteUser(userId);
  } catch (e) {
    console.log('User cleanup error (ignored):', e.message);
  }

  console.log('✅ Verify complete');
}

main().catch((e) => {
  console.error('Unexpected error:', e);
});