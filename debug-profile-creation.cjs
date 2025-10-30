require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugProfileCreation() {
  console.log('🔍 Debugging profile creation mechanism...\n');

  try {
    // Step 1: Check all triggers on auth.users
    console.log('📋 Step 1: Checking all triggers on auth.users...');
    
    const checkTriggersSql = `
      SELECT 
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement,
        action_orientation
      FROM information_schema.triggers 
      WHERE event_object_table = 'users' 
      AND event_object_schema = 'auth'
      ORDER BY trigger_name;
    `;

    const { data: triggersData, error: triggersError } = await adminSupabase.rpc('exec_sql', {
      sql: checkTriggersSql
    });

    if (triggersError) {
      console.error('❌ Triggers check failed:', triggersError);
    } else {
      console.log('✅ Triggers on auth.users:', JSON.stringify(triggersData, null, 2));
    }

    // Step 2: Check all functions that might handle user creation
    console.log('\n📋 Step 2: Checking functions related to user handling...');
    
    const checkFunctionsSql = `
      SELECT 
        routine_name,
        routine_type,
        routine_definition
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      AND (
        routine_name LIKE '%user%' 
        OR routine_name LIKE '%profile%'
        OR routine_name LIKE '%handle%'
      )
      ORDER BY routine_name;
    `;

    const { data: functionsData, error: functionsError } = await adminSupabase.rpc('exec_sql', {
      sql: checkFunctionsSql
    });

    if (functionsError) {
      console.error('❌ Functions check failed:', functionsError);
    } else {
      console.log('✅ Related functions found:', functionsData?.length || 0);
      if (functionsData && functionsData.length > 0) {
        functionsData.forEach(func => {
          console.log(`  - ${func.routine_name} (${func.routine_type})`);
        });
      }
    }

    // Step 3: Create a test user and monitor the profile creation timing
    console.log('\n📋 Step 3: Creating test user and monitoring profile creation...');
    
    const testEmail = `debug-profile-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testUserData = {
      name: 'Debug Profile User',
      role: 'agent',
      department: 'Sales',
      phone: '+9876543210',
      position: 'Senior Agent',
      employee_id: 'DEBUG001',
      company_name: 'Debug Company',
      city: 'Los Angeles',
      country: 'United States',
      must_change_password: false
    };

    console.log('Creating user with metadata:', JSON.stringify(testUserData, null, 2));

    // Check if profile exists before user creation (shouldn't)
    const { data: preProfileData, error: preProfileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail);

    console.log('Profiles before user creation:', preProfileData?.length || 0);

    // Create user
    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: testUserData
    });

    if (userError) {
      console.error('❌ User creation failed:', userError);
      return;
    }

    const testUserId = userData.user.id;
    console.log('✅ User created with ID:', testUserId);

    // Check profile immediately after user creation
    const { data: immediateProfileData, error: immediateProfileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId);

    console.log('Profiles immediately after user creation:', immediateProfileData?.length || 0);
    if (immediateProfileData && immediateProfileData.length > 0) {
      console.log('Immediate profile data:', JSON.stringify(immediateProfileData[0], null, 2));
    }

    // Wait and check again
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: delayedProfileData, error: delayedProfileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId);

    console.log('Profiles after 2 second delay:', delayedProfileData?.length || 0);
    if (delayedProfileData && delayedProfileData.length > 0) {
      console.log('Delayed profile data:', JSON.stringify(delayedProfileData[0], null, 2));
    }

    // Step 4: Try to manually call our trigger function
    console.log('\n📋 Step 4: Testing manual trigger function call...');
    
    const manualTriggerSql = `
      SELECT public.handle_new_user() as result;
    `;

    const { data: manualTriggerData, error: manualTriggerError } = await adminSupabase.rpc('exec_sql', {
      sql: manualTriggerSql
    });

    if (manualTriggerError) {
      console.error('❌ Manual trigger call failed:', manualTriggerError);
    } else {
      console.log('✅ Manual trigger call result:', JSON.stringify(manualTriggerData, null, 2));
    }

    // Cleanup
    await adminSupabase.from('profiles').delete().eq('id', testUserId);
    await adminSupabase.auth.admin.deleteUser(testUserId);
    console.log('✅ Test user cleaned up');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugProfileCreation().catch(console.error);