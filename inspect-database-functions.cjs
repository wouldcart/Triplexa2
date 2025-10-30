require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function inspectDatabaseFunctions() {
  console.log('🔍 Inspecting database functions and triggers...\n');

  try {
    // Check what functions exist
    console.log('1️⃣ Checking existing functions...');
    
    const { data: functionsData, error: functionsError } = await adminClient.rpc('exec_sql', {
      sql: `
        SELECT 
          routine_name,
          routine_type,
          routine_definition
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name IN ('handle_new_user', 'get_or_create_profile_for_current_user')
        ORDER BY routine_name;
      `
    });

    if (functionsError) {
      console.log('❌ Functions query failed:', functionsError.message);
    } else {
      console.log('✅ Functions found:', functionsData?.length || 0);
      if (functionsData && functionsData.length > 0) {
        functionsData.forEach(func => {
          console.log(`\n📋 Function: ${func.routine_name}`);
          console.log(`   Type: ${func.routine_type}`);
          console.log(`   Definition (first 200 chars): ${func.routine_definition?.substring(0, 200)}...`);
        });
      }
    }

    // Check triggers
    console.log('\n2️⃣ Checking triggers...');
    
    const { data: triggersData, error: triggersError } = await adminClient.rpc('exec_sql', {
      sql: `
        SELECT 
          trigger_name,
          event_manipulation,
          action_statement,
          action_timing
        FROM information_schema.triggers 
        WHERE trigger_schema = 'auth' 
        AND trigger_name = 'on_auth_user_created';
      `
    });

    if (triggersError) {
      console.log('❌ Triggers query failed:', triggersError.message);
    } else {
      console.log('✅ Triggers found:', triggersData?.length || 0);
      if (triggersData && triggersData.length > 0) {
        triggersData.forEach(trigger => {
          console.log(`\n🔗 Trigger: ${trigger.trigger_name}`);
          console.log(`   Event: ${trigger.event_manipulation}`);
          console.log(`   Timing: ${trigger.action_timing}`);
          console.log(`   Action: ${trigger.action_statement}`);
        });
      }
    }

    // Try a different approach - create a simple test function
    console.log('\n3️⃣ Creating a simple test function...');
    
    const testFunctionSQL = `
CREATE OR REPLACE FUNCTION public.test_auth_access() 
RETURNS jsonb 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$ 
DECLARE 
  v_uid uuid := auth.uid(); 
  v_result jsonb;
BEGIN 
  -- Return null if no authenticated user 
  IF v_uid IS NULL THEN 
    RETURN '{"error": "No authenticated user"}'::jsonb; 
  END IF; 

  -- Try to get user data
  SELECT jsonb_build_object(
    'user_id', u.id,
    'email', u.email,
    'raw_user_meta_data', u.raw_user_meta_data,
    'created_at', u.created_at
  ) INTO v_result
  FROM auth.users u 
  WHERE u.id = v_uid; 

  RETURN COALESCE(v_result, '{"error": "User not found"}'::jsonb);
END; 
$$;

GRANT EXECUTE ON FUNCTION public.test_auth_access() TO authenticated;
    `;

    const { data: testCreateData, error: testCreateError } = await adminClient.rpc('exec_sql', {
      sql: testFunctionSQL
    });

    if (testCreateError) {
      console.log('❌ Test function creation failed:', testCreateError.message);
    } else {
      console.log('✅ Test function created successfully');
    }

    // Test the simple function
    console.log('\n4️⃣ Testing the simple function...');
    
    // Create a test user
    const testEmail = `test-inspect-${Date.now()}@example.com`;
    const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      raw_user_meta_data: {
        name: 'Test Inspect User',
        phone: '+1234567890',
        company_name: 'Test Inspect Company'
      },
      email_confirm: true
    });

    if (userError) {
      console.log('❌ Test user creation failed:', userError.message);
      return;
    }

    console.log('✅ Test user created:', userData.user.id);

    // Sign in and test the function
    const regularClient = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: signinData, error: signinError } = await regularClient.auth.signInWithPassword({
      email: testEmail,
      password: 'testpassword123'
    });

    if (signinError) {
      console.log('❌ Test signin failed:', signinError.message);
    } else {
      console.log('✅ Test signin successful');
      
      const { data: testRpcData, error: testRpcError } = await regularClient
        .rpc('test_auth_access');

      if (testRpcError) {
        console.log('❌ Test RPC function failed:', testRpcError.message);
      } else {
        console.log('✅ Test RPC function works!');
        console.log('   Auth data:', testRpcData);
      }
    }

    // Cleanup
    await adminClient.auth.admin.deleteUser(userData.user.id);
    console.log('✅ Test user cleaned up');

    // Check if there are any cached function definitions
    console.log('\n5️⃣ Checking for cached function definitions...');
    
    const { data: cacheData, error: cacheError } = await adminClient.rpc('exec_sql', {
      sql: `
        SELECT 
          proname as function_name,
          prosrc as source_code
        FROM pg_proc 
        WHERE proname IN ('handle_new_user', 'get_or_create_profile_for_current_user')
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
      `
    });

    if (cacheError) {
      console.log('❌ Cache check failed:', cacheError.message);
    } else {
      console.log('✅ Cache check completed');
      if (cacheData && cacheData.length > 0) {
        cacheData.forEach(func => {
          console.log(`\n💾 Cached Function: ${func.function_name}`);
          console.log(`   Source (first 300 chars): ${func.source_code?.substring(0, 300)}...`);
        });
      } else {
        console.log('   No cached functions found');
      }
    }

  } catch (error) {
    console.error('❌ Error inspecting database:', error);
  }
}

inspectDatabaseFunctions();