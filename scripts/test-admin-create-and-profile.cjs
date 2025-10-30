#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('SUPABASE_URL/VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const now = Date.now();
  const email = `admin.create.${now}@example.com`;
  const password = 'TestPass123!';
  const metadata = {
    name: 'Admin Created Agent',
    role: 'agent',
    department: 'General',
    position: 'Agent'
  };

  console.log('🔧 Creating user via admin client...');
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata
  });

  if (createErr) {
    console.error('❌ Admin createUser failed:', createErr.message);
    process.exit(1);
  }

  const userId = created.user?.id;
  if (!userId) {
    console.error('❌ No user ID returned');
    process.exit(1);
  }
  console.log('✅ Created user:', userId);

  const name = metadata.name || email.split('@')[0];

  console.log('📝 Upserting profile via admin client...');
  const { error: upsertErr } = await admin
    .from('profiles')
    .upsert({
      id: userId,
      email,
      name,
      role: metadata.role,
      department: metadata.department,
      position: metadata.position,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (upsertErr) {
    console.error('❌ Profile upsert failed:', upsertErr.message);
    // Cleanup before exit
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    process.exit(1);
  }

  console.log('🔍 Verifying profile exists...');
  const { data: profile, error: profErr } = await admin
    .from('profiles')
    .select('id,email,name,role,department,position,status,created_at,updated_at')
    .eq('id', userId)
    .maybeSingle();

  if (profErr) {
    console.error('❌ Fetch profile failed:', profErr.message);
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    process.exit(1);
  }

  if (!profile) {
    console.error('❌ Profile not found');
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    process.exit(1);
  }

  console.log('✅ Profile created:', profile);

  console.log('🧹 Cleaning up...');
  await admin.from('profiles').delete().eq('id', userId).catch(() => {});
  await admin.auth.admin.deleteUser(userId).catch(() => {});
  console.log('🎉 Admin create and profile upsert flow verified');
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});