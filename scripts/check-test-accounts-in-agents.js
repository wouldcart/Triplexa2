import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const targetEmails = ['manager@triplexa.com', 'sales@triplexa.com'];

async function main() {
  console.log('🔍 Checking agents table for non-agent test accounts...');
  const { data, error } = await supabase
    .from('agents')
    .select('user_id, name, email, status')
    .in('email', targetEmails);

  if (error) {
    console.error('❌ Query failed:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('✅ No agent records found for manager/sales — fix looks good.');
  } else {
    console.log('⚠️ Found unexpected agent records:');
    for (const row of data) {
      console.log(`- ${row.email} (${row.name}) status=${row.status} user_id=${row.user_id}`);
    }
  }
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});