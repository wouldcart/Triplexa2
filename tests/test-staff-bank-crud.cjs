#!/usr/bin/env node
/* eslint-disable no-console */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars. Ensure VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureProfile(userId, email, name, role = 'staff', department = 'Sales') {
  const { error } = await admin
    .from('profiles')
    .upsert(
      {
        id: userId,
        email,
        name,
        role,
        department,
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  if (error) throw error;
}

async function createUser(email, password, role) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'Test User', role },
  });
  if (error) throw error;
  return data.user;
}

async function createUserClient(email, password) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function run() {
  const staffEmail = `test.staff.${Date.now()}@example.com`;
  const staffPassword = 'Passw0rd!123';
  const hrEmail = `test.hr.${Date.now()}@example.com`;
  const hrPassword = 'Passw0rd!123';

  console.log('Creating test users...');
  const staffUser = await createUser(staffEmail, staffPassword, 'staff');
  const hrUser = await createUser(hrEmail, hrPassword, 'hr_manager');

  console.log('Ensuring profiles exist for RLS policies...');
  await ensureProfile(staffUser.id, staffEmail, 'Test Staff', 'staff');
  await ensureProfile(hrUser.id, hrEmail, 'Test HR', 'hr_manager');

  console.log('Signing in users...');
  const staffClient = await createUserClient(staffEmail, staffPassword);
  const hrClient = await createUserClient(hrEmail, hrPassword);

  console.log('Upserting bank account (RPC) as staff...');
  const { data: upsertData, error: upsertErr } = await staffClient.rpc('upsert_staff_bank_account', {
    p_staff_id: staffUser.id,
    p_bank_name: 'Test Bank',
    p_account_holder_name: 'Test Staff',
    p_account_number_plain: '123456789012',
    p_ifsc_or_swift: 'IFSC001',
    p_country: 'IN',
    p_branch: 'Main Branch',
  });
  if (upsertErr) throw upsertErr;
  if (!upsertData || !upsertData.id) {
    throw new Error('RPC did not return inserted/updated bank account.');
  }
  console.log('Bank account upserted:', upsertData);

  console.log('Attempting to set verified_status as staff (should fail)...');
  const { error: staffVerifyErr } = await staffClient
    .from('staff_bank_accounts')
    .update({ verified_status: 'verified' })
    .eq('id', upsertData.id);
  if (!staffVerifyErr) {
    throw new Error('Staff was able to change verified_status, trigger should prevent this.');
  }
  console.log('Staff verify blocked as expected:', staffVerifyErr.message);

  console.log('Verifying bank account as HR...');
  const { data: verifyData, error: verifyErr } = await hrClient
    .from('staff_bank_accounts')
    .update({ verified_status: 'verified' })
    .eq('id', upsertData.id)
    .select('id, verified_status, verified_by, verified_at, account_number_last4')
    .single();
  if (verifyErr) throw verifyErr;
  if (verifyData.verified_status !== 'verified' || !verifyData.verified_by || !verifyData.verified_at) {
    throw new Error('Verification did not set verified_by/verified_at correctly.');
  }
  console.log('HR verification successful:', verifyData);

  console.log('Deleting bank account as staff...');
  const { error: delErr } = await staffClient
    .from('staff_bank_accounts')
    .delete()
    .eq('id', upsertData.id);
  if (delErr) throw delErr;
  console.log('Bank account deleted successfully.');

  console.log('Staff Bank Accounts CRUD tests completed successfully.');
}

run().catch((err) => {
  console.error('Staff Bank Accounts CRUD test failed:', err);
  process.exit(1);
});