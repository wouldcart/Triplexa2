require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugSecurityDefinerFunction() {
  console.log('🔍 Debugging SECURITY DEFINER function...');

  try {
    // 1. Create a test user with metadata
    const testMetadata = {
      name: 'Debug Test User',
      phone: '+1234567890',
      company_name: 'Debug Corp',
      role: 'Tester',
      department: 'QA',
      position: 'Senior Tester'
    };

    console.log('\n1. Creating test user with metadata:', testMetadata);
    
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: `debug-test-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: testMetadata
    });

    if (userError) {
      console.error('❌ Error creating user:', userError);
      return;
    }

    console.log('✅ User created with ID:', user.user.id);

    // 2. Wait a moment for trigger
    console.log('\n2. Waiting for trigger...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Check if profile was created by trigger
    const { data: triggerProfile, error: triggerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();

    console.log('\n3. Profile created by trigger:');
    if (triggerError) {
      console.error('❌ Error fetching trigger profile:', triggerError);
    } else {
      console.log('📊 Trigger profile:', triggerProfile);
    }

    // 4. Directly call the update_profile_with_metadata function
    console.log('\n4. Directly calling update_profile_with_metadata function...');
    
    const { data: directResult, error: directError } = await supabase.rpc('update_profile_with_metadata', {
      user_id: user.user.id
    });

    if (directError) {
      console.error('❌ Error calling update_profile_with_metadata:', directError);
    } else {
      console.log('✅ Direct function call result:', directResult);
    }

    // 5. Check profile after direct call
    const { data: afterDirectProfile, error: afterDirectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();

    console.log('\n5. Profile after direct function call:');
    if (afterDirectError) {
      console.error('❌ Error fetching profile after direct call:', afterDirectError);
    } else {
      console.log('📊 Profile after direct call:', afterDirectProfile);
    }

    // 6. Check the raw user metadata directly from auth.users
    console.log('\n6. Checking raw user metadata from auth.users...');
    
    const { data: rawUserData, error: rawUserError } = await supabase.rpc('exec_sql', {
      sql: `SELECT id, email, raw_user_meta_data FROM auth.users WHERE id = '${user.user.id}'`
    });

    if (rawUserError) {
      console.error('❌ Error fetching raw user data:', rawUserError);
    } else {
      console.log('📊 Raw user data:', rawUserData);
    }

    // 7. Test manual extraction
    console.log('\n7. Testing manual metadata extraction...');
    
    const { data: manualResult, error: manualError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          id,
          raw_user_meta_data,
          raw_user_meta_data->>'name' as extracted_name,
          raw_user_meta_data->>'phone' as extracted_phone,
          raw_user_meta_data->>'company_name' as extracted_company
        FROM auth.users 
        WHERE id = '${user.user.id}'
      `
    });

    if (manualError) {
      console.error('❌ Error with manual extraction:', manualError);
    } else {
      console.log('📊 Manual extraction result:', manualResult);
    }

    // 8. Clean up
    console.log('\n8. Cleaning up...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.user.id);
    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError);
    } else {
      console.log('✅ Test user deleted');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n🎉 Security definer function debugging completed!');
}

debugSecurityDefinerFunction();