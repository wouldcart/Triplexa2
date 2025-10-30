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

const testAccounts = [
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'manager@triplexa.com',
    name: 'John Manager',
    role: 'manager',
    company_name: 'TripleXA',
    department: 'Operations',
    position: 'Operations Manager',
    status: 'active'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'sales@triplexa.com',
    name: 'Jane Sales',
    role: 'sales',
    company_name: 'TripleXA',
    department: 'Sales',
    position: 'Sales Representative',
    status: 'active'
  }
];

async function main() {
  console.log('🚀 Seeding non-agent test profiles (service role)...');

  // Check existing emails
  const { data: existing, error: checkError } = await supabase
    .from('profiles')
    .select('email')
    .in('email', testAccounts.map(a => a.email));

  if (checkError) {
    console.error('❌ Failed to check existing profiles:', checkError.message);
    process.exit(1);
  }

  const existingEmails = new Set((existing || []).map(r => r.email));
  const toInsert = testAccounts.filter(a => !existingEmails.has(a.email));

  if (toInsert.length === 0) {
    console.log('ℹ️  Test profiles already exist, skipping insert.');
    return;
  }

  const { error: insertError } = await supabase
    .from('profiles')
    .insert(toInsert);

  if (insertError) {
    console.error('❌ Insert failed:', insertError.message);
    process.exit(1);
  }

  console.log(`✅ Inserted ${toInsert.length} profiles: ${toInsert.map(a => a.email).join(', ')}`);
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});