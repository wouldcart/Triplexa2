import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing env: set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const TEST_CATEGORY = 'UpsertTest';
const TEST_KEY = 'upsert_validation';

function logError(label, err) {
  console.error(`❌ ${label}:`, {
    code: err?.code,
    message: err?.message,
    details: err?.details,
    hint: err?.hint
  });
}

async function run() {
  console.log('🔎 Validating app_settings upsert behavior...');

  // Cleanup any previous test rows
  const { error: delErr } = await supabase
    .from('app_settings')
    .delete()
    .eq('category', TEST_CATEGORY)
    .eq('setting_key', TEST_KEY);
  if (delErr) {
    console.warn('⚠️ Cleanup warning:', delErr?.message || delErr);
  }

  // First upsert (acts like insert)
  const firstPayload = {
    category: TEST_CATEGORY,
    setting_key: TEST_KEY,
    setting_value: 'first'
  };
  const { data: first, error: firstErr } = await supabase
    .from('app_settings')
    .upsert(firstPayload, { onConflict: 'category,setting_key' })
    .select()
    .single();
  if (firstErr) {
    logError('First upsert failed', firstErr);
    process.exit(1);
  }
  console.log('✅ First upsert inserted row:', { id: first?.id });

  // Second upsert (should update same row)
  const secondPayload = {
    category: TEST_CATEGORY,
    setting_key: TEST_KEY,
    setting_value: 'second'
  };
  const { data: second, error: secondErr } = await supabase
    .from('app_settings')
    .upsert(secondPayload, { onConflict: 'category,setting_key' })
    .select()
    .single();
  if (secondErr) {
    logError('Second upsert failed', secondErr);
    process.exit(1);
  }
  console.log('✅ Second upsert updated row:', { id: second?.id });

  // Validate only one row exists and value is updated
  const { data: rows, error: selErr } = await supabase
    .from('app_settings')
    .select('id, setting_value')
    .eq('category', TEST_CATEGORY)
    .eq('setting_key', TEST_KEY);
  if (selErr) {
    logError('Select failed', selErr);
    process.exit(1);
  }

  const count = rows?.length || 0;
  const value = rows?.[0]?.setting_value;
  const id = rows?.[0]?.id;

  if (count === 1 && value === 'second') {
    console.log('🎉 Upsert validation PASSED');
    console.log({ id, count, setting_value: value });
    process.exit(0);
  } else {
    console.error('❌ Upsert validation FAILED', { id, count, setting_value: value });
    process.exit(2);
  }
}

run().catch((e) => {
  console.error('💥 Script error:', e);
  process.exit(1);
});