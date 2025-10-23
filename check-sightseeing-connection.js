import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing Supabase URL in env (VITE_SUPABASE_URL or SUPABASE_URL).');
  process.exit(1);
}

const hasServiceKey = !!serviceKey;
const supabase = createClient(supabaseUrl, hasServiceKey ? serviceKey : anonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkRead() {
  console.log('🔎 Checking read access to public.sightseeing...');
  const { data, error } = await supabase.from('sightseeing').select('*').limit(3);
  if (error) {
    console.error('❌ Read failed:', error.message);
    return false;
  }
  console.log(`✅ Read succeeded. Rows: ${data?.length ?? 0}`);
  if (data && data.length > 0) {
    console.log('Sample columns:', Object.keys(data[0]).join(', '));
  }
  return true;
}

async function checkWriteAndCleanup() {
  if (!hasServiceKey) {
    console.log('ℹ️ No service role key provided; skipping write test.');
    return true;
  }
  console.log('🧪 Testing insert/update/delete on public.sightseeing...');
  const testExternalId = 987654321;
  const insertPayload = {
    external_id: testExternalId,
    name: 'Sightseeing Connection Check',
    country: 'ZZ',
    city: 'Test City',
    status: 'active',
    images: [],
    transfer_options: [],
    pricing_options: [],
    package_options: [],
    group_size_options: []
  };

  const { data: ins, error: insErr } = await supabase
    .from('sightseeing')
    .insert(insertPayload)
    .select('*')
    .single();
  if (insErr) {
    console.error('❌ Insert failed:', insErr.message);
    return false;
  }
  console.log('✅ Insert succeeded. id:', ins?.id);

  const { data: upd, error: updErr } = await supabase
    .from('sightseeing')
    .update({ timing: '09:00 - 17:00' })
    .eq('external_id', testExternalId)
    .select('*')
    .single();
  if (updErr) {
    console.error('❌ Update failed:', updErr.message);
    return false;
  }
  console.log('✅ Update succeeded. timing:', upd?.timing);

  const { error: delErr } = await supabase
    .from('sightseeing')
    .delete()
    .eq('external_id', testExternalId);
  if (delErr) {
    console.error('❌ Delete failed:', delErr.message);
    return false;
  }
  console.log('✅ Cleanup succeeded.');
  return true;
}

async function main() {
  console.log('🎯 Sightseeing Supabase Connectivity Check');
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log(`🔑 Service key: ${hasServiceKey ? 'present' : 'absent'} | Anon key: ${anonKey ? 'present' : 'absent'}`);
  const readOk = await checkRead();
  const writeOk = await checkWriteAndCleanup();
  if (readOk && writeOk) {
    console.log('\n✅ Sightseeing Management module is connected and operational with Supabase.');
  } else if (readOk && !writeOk) {
    console.log('\n✅ Read works, but write failed (likely missing service key or RLS).');
  } else {
    console.log('\n❌ Connectivity test failed. Check environment variables and RLS policies.');
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});