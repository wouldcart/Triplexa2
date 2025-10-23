import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testPgcryptoExtension() {
  console.log('🔍 Testing pgcrypto extension...');
  
  try {
    // Test 1: Check if pgcrypto extension is installed
    console.log('\n1. Checking if pgcrypto extension is installed...');
    const { data: extensions, error: extError } = await adminSupabase
      .from('pg_extension')
      .select('extname')
      .eq('extname', 'pgcrypto');
    
    if (extError) {
      console.log('   ⚠️  Cannot query pg_extension:', extError.message);
    } else {
      console.log('   Extensions found:', extensions);
    }

    // Test 2: Try to enable pgcrypto extension
    console.log('\n2. Attempting to enable pgcrypto extension...');
    const { data: enableData, error: enableError } = await adminSupabase
      .rpc('exec_sql', {
        sql_query: 'CREATE EXTENSION IF NOT EXISTS pgcrypto;'
      });
    
    if (enableError) {
      console.log('   ⚠️  Cannot enable pgcrypto via exec_sql:', enableError.message);
    } else {
      console.log('   ✅ pgcrypto extension enabled:', enableData);
    }

    // Test 3: Test gen_salt function
    console.log('\n3. Testing gen_salt function...');
    const { data: saltData, error: saltError } = await adminSupabase
      .rpc('exec_sql', {
        sql_query: "SELECT gen_salt('bf') as salt;"
      });
    
    if (saltError) {
      console.log('   ❌ gen_salt failed:', saltError.message);
    } else {
      console.log('   ✅ gen_salt works:', saltData);
    }

    // Test 4: Test crypt function
    console.log('\n4. Testing crypt function...');
    const { data: cryptData, error: cryptError } = await adminSupabase
      .rpc('exec_sql', {
        sql_query: "SELECT crypt('test', gen_salt('bf')) as hash;"
      });
    
    if (cryptError) {
      console.log('   ❌ crypt failed:', cryptError.message);
    } else {
      console.log('   ✅ crypt works:', cryptData);
    }

    // Test 5: Check available functions
    console.log('\n5. Checking available pgcrypto functions...');
    const { data: functionsData, error: functionsError } = await adminSupabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT proname, pronargs 
          FROM pg_proc 
          WHERE proname IN ('crypt', 'gen_salt', 'digest', 'hmac')
          ORDER BY proname;
        `
      });
    
    if (functionsError) {
      console.log('   ⚠️  Cannot query functions:', functionsError.message);
    } else {
      console.log('   Available pgcrypto functions:', functionsData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
  
  return true;
}

testPgcryptoExtension()
  .then(success => {
    if (success) {
      console.log('\n✅ pgcrypto extension test completed');
    } else {
      console.log('\n❌ pgcrypto extension test failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });