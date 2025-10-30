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

async function main() {
  console.log('🧪 Testing minimal insert into agents to detect required columns...');
  const testId = '00000000-0000-0000-0000-000000000001';
  try {
    const { error } = await supabase
      .from('agents')
      .insert({ id: testId, status: 'pending' })
      .select();

    if (error) {
      console.error('❌ Minimal insert error:', error.message);
      // Try a slightly expanded insert using common columns
      console.log('➡️ Retrying with common columns...');
      const { error: error2 } = await supabase
        .from('agents')
        .insert({
          id: testId,
          status: 'pending',
          name: 'Test Agent',
          email: `minimal-${Date.now()}@triplexa.com`
        })
        .select();
      if (error2) {
        console.error('❌ Expanded insert error:', error2.message);
      } else {
        console.log('✅ Expanded insert succeeded');
      }
    } else {
      console.log('✅ Minimal insert succeeded');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  } finally {
    // cleanup
    await supabase.from('agents').delete().eq('id', testId);
  }
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});