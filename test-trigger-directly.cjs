require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testTriggerDirectly() {
  console.log('🔍 Testing trigger directly...\n');

  try {
    // First check if the trigger exists and what function it calls
    console.log('📋 Checking current trigger...');
    const triggerQuery = `
      SELECT 
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created'
    `;

    const { data: triggerResult, error: triggerError } = await adminClient.rpc('exec_sql', {
      sql: triggerQuery
    });

    if (triggerError) {
      console.log(`❌ Trigger query error: ${triggerError.message}`);
    } else {
      console.log('✅ Current trigger:');
      console.log(JSON.stringify(triggerResult, null, 2));
    }

    // Check the function definition
    console.log('\n📋 Checking function definition...');
    const functionQuery = `
      SELECT 
        routine_name,
        routine_definition
      FROM information_schema.routines 
      WHERE routine_name = 'handle_new_user'
      AND routine_schema = 'public'
    `;

    const { data: functionResult, error: functionError } = await adminClient.rpc('exec_sql', {
      sql: functionQuery
    });

    if (functionError) {
      console.log(`❌ Function query error: ${functionError.message}`);
    } else {
      console.log('✅ Function definition found');
      if (functionResult && functionResult.length > 0) {
        const definition = functionResult[0].routine_definition;
        console.log('Function definition length:', definition.length);
        if (definition.includes('raw_user_meta_data')) {
          console.log('✅ Function uses raw_user_meta_data');
        } else {
          console.log('❌ Function does not use raw_user_meta_data');
        }
      }
    }

    // Test the function manually
    console.log('\n🔧 Testing function manually...');
    
    // Create test user first
    const testEmail = `manual-trigger-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testUserData = {
      name: 'Manual Trigger User',
      phone: '+1234567890',
      company_name: 'Manual Company',
      role: 'manager',
      department: 'Engineering',
      position: 'Senior Developer'
    };

    console.log('📝 Creating test user...');
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      user_metadata: testUserData,
      email_confirm: true
    });

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    const testUserId = authData.user.id;
    console.log(`✅ Test user created with ID: ${testUserId}`);

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if profile was created
    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (profileError) {
      console.log(`❌ Profile not found: ${profileError.message}`);
    } else {
      console.log('\n✅ Profile created by trigger:');
      console.log(JSON.stringify(profileData, null, 2));
    }

    // Now manually call the function to see what happens
    console.log('\n🔧 Manually calling handle_new_user function...');
    
    // Delete the profile first
    await adminClient.from('profiles').delete().eq('id', testUserId);
    
    // Get the user data to simulate the trigger
    const { data: userData, error: userError } = await adminClient.rpc('exec_sql', {
      sql: `SELECT * FROM auth.users WHERE id = '${testUserId}'`
    });

    if (userError) {
      console.log(`❌ User data error: ${userError.message}`);
    } else {
      console.log('✅ User data retrieved');
      
      // Manually insert using the same logic as the trigger
      const manualInsertSql = `
        INSERT INTO public.profiles (
          id, 
          email, 
          name,
          role,
          phone,
          company_name,
          department,
          position,
          status,
          created_at,
          updated_at
        )
        SELECT 
          u.id,
          u.email,
          COALESCE(NULLIF(u.raw_user_meta_data->>'name', ''), split_part(u.email, '@', 1)),
          COALESCE(NULLIF(u.raw_user_meta_data->>'role', ''), 'agent'),
          NULLIF(u.raw_user_meta_data->>'phone', ''),
          NULLIF(u.raw_user_meta_data->>'company_name', ''),
          COALESCE(NULLIF(u.raw_user_meta_data->>'department', ''), 'General'),
          COALESCE(NULLIF(u.raw_user_meta_data->>'position', ''), 'Agent'),
          'active',
          NOW(),
          NOW()
        FROM auth.users u
        WHERE u.id = '${testUserId}'
      `;

      const { error: manualInsertError } = await adminClient.rpc('exec_sql', {
        sql: manualInsertSql
      });

      if (manualInsertError) {
        console.log(`❌ Manual insert error: ${manualInsertError.message}`);
      } else {
        console.log('✅ Manual insert successful');
        
        // Check the manually created profile
        const { data: manualProfileData, error: manualProfileError } = await adminClient
          .from('profiles')
          .select('*')
          .eq('id', testUserId)
          .single();

        if (manualProfileError) {
          console.log(`❌ Manual profile query error: ${manualProfileError.message}`);
        } else {
          console.log('\n✅ Manually created profile:');
          console.log(JSON.stringify(manualProfileData, null, 2));
        }
      }
    }

    // Cleanup
    await adminClient.auth.admin.deleteUser(testUserId);
    console.log('\n✅ Test user deleted');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTriggerDirectly().catch(console.error);