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

  // Debug: verify role logic
  const { data: isHrStaff, error: isHrStaffErr } = await staffClient.rpc('is_hr');
  if (isHrStaffErr) {
    console.warn('Warning: is_hr() RPC failed for staff:', isHrStaffErr.message);
  } else {
    console.log('is_hr() as staff =>', isHrStaff);
  }
  const { data: isHrHr, error: isHrHrErr } = await hrClient.rpc('is_hr');
  if (isHrHrErr) {
    console.warn('Warning: is_hr() RPC failed for HR:', isHrHrErr.message);
  } else {
    console.log('is_hr() as HR =>', isHrHr);
  }

  const BUCKET = 'staff_docs';
  const objectPath = `staff/${staffUser.id}/documents/test-${Date.now()}.txt`;
  const fileBuffer = Buffer.from('Hello, staff document!');

  console.log('Uploading document to storage (as staff)...');
  const { data: uploadData, error: uploadError } = await staffClient.storage
    .from(BUCKET)
    .upload(objectPath, fileBuffer, { contentType: 'text/plain' });
  if (uploadError) throw uploadError;
  console.log('Uploaded:', uploadData);

  console.log('Inserting staff_documents row (as staff)...');
  const { data: insertDoc, error: insertErr } = await staffClient
    .from('staff_documents')
    .insert({
      staff_id: staffUser.id,
      doc_type: 'id_card',
      file_name: 'test.txt',
      mime_type: 'text/plain',
      size_bytes: fileBuffer.length,
      storage_path: objectPath,
      status: 'pending',
      notes: 'Test upload',
    })
    .select('*')
    .single();
  if (insertErr) throw insertErr;
  console.log('Inserted document row:', insertDoc);

  console.log('Attempting to approve as staff (should fail)...');
  const { error: staffApproveErr } = await staffClient
    .from('staff_documents')
    .update({ status: 'approved' })
    .eq('id', insertDoc.id);
  // Fetch to confirm no change occurred
  const { data: afterStaffUpdate, error: fetchErr } = await staffClient
    .from('staff_documents')
    .select('id, status, verified_by, verified_at')
    .eq('id', insertDoc.id)
    .single();
  if (fetchErr) throw fetchErr;
  if (afterStaffUpdate.status !== 'pending' || afterStaffUpdate.verified_by || afterStaffUpdate.verified_at) {
    throw new Error('Staff update unexpectedly changed the status/verification fields.');
  }
  console.log('Staff approve blocked as expected (status unchanged).');

  console.log('Approving document as HR...');
  const { data: approveData, error: approveErr } = await hrClient
    .from('staff_documents')
    .update({ status: 'approved' })
    .eq('id', insertDoc.id)
    .select('id, status, verified_by, verified_at')
    .single();
  if (approveErr) throw approveErr;
  if (approveData.status !== 'approved' || !approveData.verified_by || !approveData.verified_at) {
    throw new Error('Approval did not set verified_by/verified_at correctly.');
  }
  console.log('HR approval successful:', approveData);

  console.log('Creating signed URL (as staff)...');
  const { data: signedUrl, error: signedErr } = await staffClient.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, 60);
  if (signedErr) throw signedErr;
  if (!signedUrl || !signedUrl.signedUrl) throw new Error('Failed to create signed URL.');
  console.log('Signed URL created.');

  console.log('Deleting document (DB and storage) as staff...');
  const { error: delDbErr } = await staffClient
    .from('staff_documents')
    .delete()
    .eq('id', insertDoc.id);
  if (delDbErr) throw delDbErr;

  const { error: delStorageErr } = await staffClient.storage.from(BUCKET).remove([objectPath]);
  if (delStorageErr) throw delStorageErr;
  console.log('Document deleted successfully.');

  console.log('Staff Documents CRUD tests completed successfully.');
}

run().catch((err) => {
  console.error('Staff Documents CRUD test failed:', err);
  process.exit(1);
});