require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function verifyFunction() {
  console.log('🔍 Verifying RPC function...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Check if function exists in pg_proc
    console.log('📋 Checking pg_proc...');
    const procResult = await supabase.rpc('exec_sql', {
      sql: `SELECT 
        p.proname,
        p.prorettype::regtype as return_type,
        p.prosecdef,
        n.nspname as schema_name
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname LIKE '%profile%'
      ORDER BY p.proname`
    });
    
    console.log('🔍 Functions with "profile" in name:', procResult.data);
    
    // Check information_schema.routines
    console.log('📋 Checking information_schema.routines...');
    const routinesResult = await supabase.rpc('exec_sql', {
      sql: `SELECT 
        routine_name,
        routine_schema,
        routine_type,
        data_type
      FROM information_schema.routines
      WHERE routine_name LIKE '%profile%'
      ORDER BY routine_name`
    });
    
    console.log('🔍 Routines with "profile" in name:', routinesResult.data);
    
    // Try to call the function directly
    console.log('🧪 Testing direct RPC call...');
    const testResult = await supabase.rpc('get_or_create_profile_for_current_user');
    
    if (testResult.error) {
      console.error('❌ Direct RPC call failed:', testResult.error);
    } else {
      console.log('✅ Direct RPC call successful:', testResult.data);
    }
    
    // Check if exec_sql function exists and works
    console.log('🔧 Testing exec_sql function...');
    const execSqlTest = await supabase.rpc('exec_sql', {
      sql: 'SELECT 1 as test'
    });
    
    if (execSqlTest.error) {
      console.error('❌ exec_sql test failed:', execSqlTest.error);
    } else {
      console.log('✅ exec_sql works:', execSqlTest.data);
    }
    
    // Check current user context
    console.log('👤 Checking current user context...');
    const userTest = await supabase.rpc('exec_sql', {
      sql: 'SELECT current_user, session_user, auth.uid() as auth_uid'
    });
    
    console.log('👤 User context:', userTest.data);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyFunction();