require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Environment
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars. Check .env for URL, ANON/PUBLISHABLE, SERVICE_ROLE.');
  process.exit(1);
}

// Clients
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Target credentials
const targetEmail = 'agent_company@tripoex.com';
const targetPassword = 'agent123';

async function main() {
  console.log('🔎 Verifying admin upsert fallback for profiles under RLS...');

  // 1) Find user by email using admin
  // Try paginated lookup in case there are many users
  let user = null;
  for (let page = 1; page <= 10 && !user; page++) {
    const { data: pageData, error: pageErr } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (pageErr) {
      console.error('❌ admin.listUsers failed on page', page, ':', pageErr);
      process.exit(1);
    }
    const found = (pageData?.users || []).find(u => (u.email || '').toLowerCase() === targetEmail.toLowerCase());
    if (found) user = found;
    if (!pageData || (pageData.users || []).length === 0) break; // no more pages
  }
  if (!user) {
    console.error('❌ Target user not found in auth.users:', targetEmail);
    process.exit(1);
  }
  console.log('✅ Found auth user:', user.id, user.email);

  // 2) Upsert minimal profile using admin (simulating AuthService.ensureProfileExists fallback)
  const payload = {
    id: user.id,
    name: user.user_metadata?.name || (user.email?.split('@')[0] || 'Agent'),
    email: user.email,
    role: (user.user_metadata?.role) || 'agent',
    department: 'General',
    phone: user.user_metadata?.phone || null,
    status: 'active',
    position: (user.user_metadata?.role) || 'Agent',
    updated_at: new Date().toISOString()
  };

  const { data: upserted, error: upsertErr } = await admin
    .from('profiles')
    .upsert([payload], { onConflict: 'id' })
    .select()
    .single();

  if (upsertErr) {
    console.error('❌ Admin upsert failed:', upsertErr.message || upsertErr);
    process.exit(1);
  }
  console.log('✅ Admin upsert successful. Profile:', JSON.stringify(upserted, null, 2));

  // 3) Sign in with anon client and read profile to confirm RLS access works
  const { data: authData, error: authErr } = await client.auth.signInWithPassword({
    email: targetEmail,
    password: targetPassword
  });
  if (authErr) {
    console.error('❌ Supabase Auth failed:', authErr.message || authErr);
    process.exit(1);
  }
  console.log('✅ Signed in. User ID:', authData.user.id);

  const { data: profile, error: profileErr } = await client
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileErr) {
    console.error('❌ Reading profile failed (RLS?):', profileErr.message || profileErr);
    process.exit(1);
  }

  console.log('✅ Profile read via RLS succeeded:', JSON.stringify(profile, null, 2));
  console.log('\n🎉 Verification complete: Admin upsert enables RLS-safe profile access.');

  await client.auth.signOut();
}

main().catch(err => {
  console.error('💥 Unexpected error:', err);
  process.exit(1);
});