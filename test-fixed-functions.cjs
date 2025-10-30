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

async function testFixedFunctions() {
  console.log('🧪 Testing fixed functions...');

  try {
    // 1. Test direct function call first
    console.log('\n1. Testing direct function call...');
    
    const testMetadata = {
      name: 'Direct Test User',
      phone: '+1111111111',
      company_name: 'Direct Corp',
      role: 'Direct Tester',
      department: 'Direct QA',
      position: 'Direct Senior Tester'
    };

    // Create user
    const { data: directUser, error: directUserError } = await supabase.auth.admin.createUser({
      email: `direct-test-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: testMetadata
    });

    if (directUserError) {
      console.error('❌ Error creating direct test user:', directUserError);
      return;
    }

    console.log('✅ Direct test user created:', directUser.user.id);

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check profile created by trigger
    const { data: triggerProfile, error: triggerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', directUser.user.id)
      .single();

    console.log('\n📊 Profile created by trigger:');
    if (triggerError) {
      console.error('❌ Error:', triggerError);
    } else {
      console.log('✅ Trigger profile:', {
        name: triggerProfile.name,
        phone: triggerProfile.phone,
        company_name: triggerProfile.company_name,
        role: triggerProfile.role,
        department: triggerProfile.department,
        position: triggerProfile.position
      });
    }

    // 2. Test the complete signup flow
    console.log('\n2. Testing complete signup flow...');
    
    const signupMetadata = {
      name: 'Signup Test User',
      phone: '+2222222222',
      company_name: 'Signup Corp',
      role: 'Manager',
      department: 'Sales',
      position: 'Sales Manager'
    };

    const { data: signupUser, error: signupError } = await supabase.auth.admin.createUser({
      email: `signup-test-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: signupMetadata
    });

    if (signupError) {
      console.error('❌ Error creating signup user:', signupError);
    } else {
      console.log('✅ Signup user created:', signupUser.user.id);
      
      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check profile
      const { data: signupProfile, error: signupProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signupUser.user.id)
        .single();

      console.log('\n📊 Signup flow profile:');
      if (signupProfileError) {
        console.error('❌ Error:', signupProfileError);
      } else {
        console.log('✅ Signup profile:', {
          name: signupProfile.name,
          phone: signupProfile.phone,
          company_name: signupProfile.company_name,
          role: signupProfile.role,
          department: signupProfile.department,
          position: signupProfile.position
        });
      }
    }

    // 3. Test get_or_create_profile_for_current_user function
    console.log('\n3. Testing get_or_create_profile_for_current_user...');
    
    const getCreateMetadata = {
      name: 'GetCreate Test User',
      phone: '+3333333333',
      company_name: 'GetCreate Corp',
      role: 'Director',
      department: 'Marketing',
      position: 'Marketing Director'
    };

    const { data: getCreateUser, error: getCreateError } = await supabase.auth.admin.createUser({
      email: `getcreate-test-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: getCreateMetadata
    });

    if (getCreateError) {
      console.error('❌ Error creating get/create user:', getCreateError);
    } else {
      console.log('✅ Get/create user created:', getCreateUser.user.id);
      
      // Delete the profile first to test the get_or_create function
      await supabase
        .from('profiles')
        .delete()
        .eq('id', getCreateUser.user.id);
      
      console.log('✅ Profile deleted for testing get_or_create');
      
      // Test the function
      const { data: getCreateProfile, error: getCreateProfileError } = await supabase.rpc('get_or_create_profile_for_current_user');
      
      console.log('\n📊 Get/create function result:');
      if (getCreateProfileError) {
        console.error('❌ Error:', getCreateProfileError);
      } else {
        console.log('✅ Get/create profile:', {
          name: getCreateProfile?.name,
          phone: getCreateProfile?.phone,
          company_name: getCreateProfile?.company_name,
          role: getCreateProfile?.role,
          department: getCreateProfile?.department,
          position: getCreateProfile?.position
        });
      }
    }

    // 4. Clean up (try to delete users)
    console.log('\n4. Cleaning up...');
    
    const usersToDelete = [directUser?.user?.id, signupUser?.user?.id, getCreateUser?.user?.id].filter(Boolean);
    
    for (const userId of usersToDelete) {
      try {
        await supabase.auth.admin.deleteUser(userId);
        console.log(`✅ Deleted user: ${userId}`);
      } catch (error) {
        console.log(`⚠️ Could not delete user ${userId}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n🎉 Fixed functions testing completed!');
}

testFixedFunctions();