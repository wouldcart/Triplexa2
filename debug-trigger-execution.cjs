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

async function debugTriggerExecution() {
  console.log('🔍 Debugging trigger execution and metadata flow...\n');

  const testEmail = `debug-trigger-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testUserData = {
    name: 'Debug Test User',
    role: 'agent',
    department: 'Sales',
    phone: '+9876543210',
    position: 'Senior Agent',
    employee_id: 'DEBUG001',
    company_name: 'Debug Travel Agency',
    city: 'Los Angeles',
    country: 'United States',
    must_change_password: false
  };

  let testUserId = null;

  try {
    // Step 1: Create user and capture the exact data
    console.log('📝 Step 1: Creating user with metadata...');
    console.log('Input metadata:', JSON.stringify(testUserData, null, 2));

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

    testUserId = userData.user.id;
    console.log('✅ User created with ID:', testUserId);

    // Step 2: Check raw data in auth.users
    console.log('\n📋 Step 2: Checking raw data in auth.users...');
    const { data: authUserData, error: authUserError } = await adminSupabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            id,
            email,
            raw_user_meta_data,
            user_metadata,
            created_at
          FROM auth.users 
          WHERE id = '${testUserId}';
        `
      });

    if (authUserError) {
      console.error('❌ Failed to check auth.users:', authUserError);
    } else {
      console.log('✅ Raw auth.users data:', JSON.stringify(authUserData, null, 2));
    }

    // Step 3: Check if profile was created
    console.log('\n📋 Step 3: Checking profile creation...');
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (profileError) {
      console.error('❌ Profile check failed:', profileError);
    } else {
      console.log('✅ Profile data:', JSON.stringify(profileData, null, 2));
    }

    // Step 4: Manually test the trigger function
    console.log('\n📋 Step 4: Testing trigger function manually...');
    const { data: manualTriggerData, error: manualTriggerError } = await adminSupabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            COALESCE((raw_user_meta_data->>'name')::text, '') as extracted_name,
            COALESCE((raw_user_meta_data->>'phone')::text, '') as extracted_phone,
            COALESCE((raw_user_meta_data->>'company_name')::text, '') as extracted_company,
            COALESCE((raw_user_meta_data->>'role')::text, 'agent') as extracted_role,
            raw_user_meta_data
          FROM auth.users 
          WHERE id = '${testUserId}';
        `
      });

    if (manualTriggerError) {
      console.error('❌ Manual trigger test failed:', manualTriggerError);
    } else {
      console.log('✅ Manual extraction test:', JSON.stringify(manualTriggerData, null, 2));
    }

    // Step 5: Update profile manually to test if the extraction logic works
    console.log('\n📋 Step 5: Updating profile manually with extracted data...');
    const { data: updateData, error: updateError } = await adminSupabase
      .rpc('exec_sql', {
        sql: `
          UPDATE public.profiles 
          SET 
            name = COALESCE((
              SELECT (raw_user_meta_data->>'name')::text 
              FROM auth.users 
              WHERE id = '${testUserId}'
            ), ''),
            phone = COALESCE((
              SELECT (raw_user_meta_data->>'phone')::text 
              FROM auth.users 
              WHERE id = '${testUserId}'
            ), ''),
            company = COALESCE((
              SELECT (raw_user_meta_data->>'company_name')::text 
              FROM auth.users 
              WHERE id = '${testUserId}'
            ), ''),
            role = COALESCE((
              SELECT (raw_user_meta_data->>'role')::text 
              FROM auth.users 
              WHERE id = '${testUserId}'
            ), 'agent'),
            updated_at = NOW()
          WHERE id = '${testUserId}';
        `
      });

    if (updateError) {
      console.error('❌ Manual profile update failed:', updateError);
    } else {
      console.log('✅ Manual profile update successful');
    }

    // Step 6: Check updated profile
    console.log('\n📋 Step 6: Checking updated profile...');
    const { data: updatedProfileData, error: updatedProfileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (updatedProfileError) {
      console.error('❌ Updated profile check failed:', updatedProfileError);
    } else {
      console.log('✅ Updated profile data:', JSON.stringify(updatedProfileData, null, 2));
    }

    // Step 7: Test RPC function
    console.log('\n📋 Step 7: Testing RPC function...');
    const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    // Sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError);
    } else {
      console.log('✅ Sign in successful');
      
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_or_create_profile_for_current_user');

      if (rpcError) {
        console.error('❌ RPC function failed:', rpcError);
      } else {
        console.log('✅ RPC function result:', JSON.stringify(rpcData, null, 2));
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  } finally {
    // Cleanup
    if (testUserId) {
      console.log('\n🧹 Cleaning up test user...');
      await adminSupabase.from('profiles').delete().eq('id', testUserId);
      await adminSupabase.auth.admin.deleteUser(testUserId);
      console.log('✅ Test user cleaned up');
    }
  }
}

debugTriggerExecution().catch(console.error);