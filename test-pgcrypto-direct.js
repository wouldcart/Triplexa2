import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPgcryptoDirectly() {
  console.log('🔧 Testing pgcrypto extension directly...');
  
  try {
    // Test 1: Check if pgcrypto extension exists
    console.log('\n1. Checking if pgcrypto extension exists...');
    const { data: extensions, error: extError } = await supabase.rpc('exec_sql', {
      sql: "SELECT * FROM pg_extension WHERE extname = 'pgcrypto';"
    });
    
    if (extError) {
      console.log('   ❌ Cannot check extensions:', extError.message);
    } else {
      console.log('   ✅ Extension check result:', extensions);
    }
    
    // Test 2: Try to create extension
    console.log('\n2. Attempting to create pgcrypto extension...');
    const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
      sql: "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;"
    });
    
    if (createError) {
      console.log('   ❌ Cannot create extension:', createError.message);
    } else {
      console.log('   ✅ Extension creation result:', createResult);
    }
    
    // Test 3: Test gen_salt function
    console.log('\n3. Testing gen_salt function...');
    const { data: saltResult, error: saltError } = await supabase.rpc('exec_sql', {
      sql: "SELECT gen_salt('bf') as salt;"
    });
    
    if (saltError) {
      console.log('   ❌ gen_salt failed:', saltError.message);
    } else {
      console.log('   ✅ gen_salt result:', saltResult);
    }
    
    // Test 4: Test crypt function
    console.log('\n4. Testing crypt function...');
    const { data: cryptResult, error: cryptError } = await supabase.rpc('exec_sql', {
      sql: "SELECT crypt('test', gen_salt('bf')) as hash;"
    });
    
    if (cryptError) {
      console.log('   ❌ crypt failed:', cryptError.message);
    } else {
      console.log('   ✅ crypt result:', cryptResult);
    }
    
    // Test 5: Test authenticate_managed_agent function
    console.log('\n5. Testing authenticate_managed_agent function...');
    const { data: authResult, error: authError } = await supabase.rpc('authenticate_managed_agent', {
      p_username: 'nonexistent',
      p_password: 'test'
    });
    
    if (authError) {
      console.log('   ❌ authenticate_managed_agent failed:', authError.message);
    } else {
      console.log('   ✅ authenticate_managed_agent result:', authResult);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testPgcryptoDirectly();