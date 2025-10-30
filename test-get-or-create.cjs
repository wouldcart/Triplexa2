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

async function testGetOrCreate() {
  console.log('🧪 Testing get_or_create_profile_for_current_user function...');

  try {
    // 1. Create a test user with metadata
    console.log('\n1. Creating test user with metadata...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: 'Get Or Create Test User',
        phone: '+1234567890',
        company_name: 'Get Or Create Company',
        role: 'get_or_create_tester',
        department: 'Testing',
        position: 'QA Engineer'
      }
    });

    if (authError) {
      console.error('❌ Error creating test user:', authError);
      return;
    }

    console.log('✅ Test user created:', authData.user.id);

    // 2. Wait a moment for any trigger (though it might not work)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Check if profile was created by trigger
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('❌ Error checking existing profile:', profileError);
    } else {
      console.log('📊 Profile created by trigger:', existingProfile);
    }

    // 4. Delete the profile to test get_or_create
    if (existingProfile && existingProfile.length > 0) {
      console.log('\n4. Deleting existing profile to test get_or_create...');
      
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', authData.user.id);

      if (deleteError) {
        console.error('❌ Error deleting profile:', deleteError);
      } else {
        console.log('✅ Profile deleted');
      }
    }

    // 5. Create a client with the test user's credentials
    console.log('\n5. Creating client with test user credentials...');
    
    const userClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Error signing in test user:', signInError);
      return;
    }

    console.log('✅ Test user signed in');

    // 6. Call get_or_create_profile_for_current_user
    console.log('\n6. Calling get_or_create_profile_for_current_user...');
    
    const { data: profileData, error: getOrCreateError } = await userClient
      .rpc('get_or_create_profile_for_current_user');

    if (getOrCreateError) {
      console.error('❌ Error calling get_or_create:', getOrCreateError);
    } else {
      console.log('📊 Profile from get_or_create:', profileData);
      
      if (profileData && profileData.length > 0) {
        const profile = profileData[0];
        const hasData = profile.name && profile.name !== '';
        console.log(`\n🎉 Metadata extracted by get_or_create: ${hasData}`);
        
        if (hasData) {
          console.log('🎉 SUCCESS! get_or_create_profile_for_current_user is working with metadata extraction!');
          console.log('✅ Name:', profile.name);
          console.log('✅ Phone:', profile.phone);
          console.log('✅ Company:', profile.company_name);
          console.log('✅ Role:', profile.role);
          console.log('✅ Department:', profile.department);
          console.log('✅ Position:', profile.position);
        } else {
          console.log('❌ get_or_create metadata extraction not working');
        }
      } else {
        console.log('❌ No profile returned from get_or_create');
      }
    }

    // 7. Sign out the test user
    await userClient.auth.signOut();

    // 8. Cleanup
    console.log('\n8. Cleaning up...');
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.log('✅ Test user deleted');

  } catch (error) {
    console.error('❌ Error in get_or_create test:', error);
    throw error;
  }

  console.log('\n🎉 get_or_create test completed!');
}

testGetOrCreate();