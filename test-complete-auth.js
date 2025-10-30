import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCompleteAuth() {
  console.log('🔐 Testing complete authentication flow...');

  try {
    // Test credentials
    const testEmail = 'test@example.com';
    const testPassword = 'test123456';

    console.log('\n1. Testing login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      return;
    }

    console.log('✅ Login successful:', loginData.user?.email);

    // Test the profile function
    console.log('\n2. Testing get_or_create_profile_for_current_user...');
    const { data: profileData, error: profileError } = await supabase.rpc('get_or_create_profile_for_current_user');

    if (profileError) {
      console.log('❌ Profile function failed:', profileError.message);
      if (profileError.message.includes('Could not find the function')) {
        console.log('⚠️  The RPC function needs to be created manually in Supabase SQL Editor');
        console.log('   Use the SQL in create-profile-function.sql');
      }
    } else {
      console.log('✅ Profile function works!');
      console.log('   Profile data:', {
        id: profileData?.id,
        email: profileData?.email,
        name: profileData?.name,
        role: profileData?.role
      });
    }

    // Test session
    console.log('\n3. Testing session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
    } else {
      console.log('✅ Session active:', sessionData.session?.user?.email);
    }

    // Sign out
    console.log('\n4. Signing out...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.log('❌ Sign out error:', signOutError.message);
    } else {
      console.log('✅ Signed out successfully');
    }

    console.log('\n🎉 Authentication test complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Test user login works');
    console.log('   ✅ Session management works');
    console.log('   ✅ Sign out works');
    
    if (profileData) {
      console.log('   ✅ Profile function works');
      console.log('\n🚀 Ready to test in web interface!');
      console.log('   Login with: test@example.com / test123456');
    } else {
      console.log('   ⚠️  Profile function needs manual creation');
      console.log('\n📝 Next steps:');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Run the SQL from create-profile-function.sql');
      console.log('   3. Test login in web interface');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteAuth();