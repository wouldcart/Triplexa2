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

async function testDirectSQL() {
  console.log('🔍 Testing direct SQL access...');
  
  try {
    // Test 1: Try to call a simple function that should exist
    console.log('\n1. Testing simple function call...');
    const { data: versionData, error: versionError } = await adminSupabase
      .rpc('version');
    
    if (versionError) {
      console.log('   ⚠️  version() function failed:', versionError.message);
    } else {
      console.log('   ✅ version() works:', versionData);
    }

    // Test 2: Try to access a system table
    console.log('\n2. Testing system table access...');
    const { data: tablesData, error: tablesError } = await adminSupabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
    
    if (tablesError) {
      console.log('   ⚠️  Cannot access information_schema.tables:', tablesError.message);
    } else {
      console.log('   ✅ Tables found:', tablesData);
    }

    // Test 3: Check if we can see our RPC functions
    console.log('\n3. Checking available RPC functions...');
    const { data: rpcData, error: rpcError } = await adminSupabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_schema', 'public')
      .in('routine_name', ['set_agent_credentials', 'authenticate_managed_agent', 'exec_sql']);
    
    if (rpcError) {
      console.log('   ⚠️  Cannot access information_schema.routines:', rpcError.message);
    } else {
      console.log('   ✅ RPC functions found:', rpcData);
    }

    // Test 4: Try to call our agent functions directly
    console.log('\n4. Testing agent functions...');
    
    // Test set_agent_credentials with invalid data to see if function exists
    const { data: setData, error: setError } = await adminSupabase
      .rpc('set_agent_credentials', {
        p_id: '00000000-0000-0000-0000-000000000000',
        p_username: 'test',
        p_password: 'test',
        p_is_temporary: false
      });
    
    if (setError) {
      console.log('   set_agent_credentials error:', setError.message);
    } else {
      console.log('   set_agent_credentials result:', setData);
    }

    // Test authenticate_managed_agent
    const { data: authData, error: authError } = await adminSupabase
      .rpc('authenticate_managed_agent', {
        p_username: 'nonexistent',
        p_password: 'test'
      });
    
    if (authError) {
      console.log('   authenticate_managed_agent error:', authError.message);
    } else {
      console.log('   authenticate_managed_agent result:', authData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
  
  return true;
}

testDirectSQL()
  .then(success => {
    if (success) {
      console.log('\n✅ Direct SQL test completed');
    } else {
      console.log('\n❌ Direct SQL test failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });