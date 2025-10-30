import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testFixedAuth() {
  console.log('🧪 Testing fixed authentication...');

  try {
    // Login with test user
    console.log('\n1. Logging in...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test123456'
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      return;
    }

    console.log('✅ Login successful');
    console.log('   User ID:', loginData.user.id);

    // Test the RPC function
    console.log('\n2. Testing get_or_create_profile_for_current_user...');
    const { data: profileData, error: profileError } = await supabase.rpc('get_or_create_profile_for_current_user');

    if (profileError) {
      console.log('❌ Profile function failed:', profileError.message);
      
      if (profileError.code === '23505') {
        console.log('🔍 Still getting unique constraint violation');
        console.log('   The function still needs the ON CONFLICT clause');
        console.log('   Please update the function in Supabase SQL Editor');
      } else if (profileError.message.includes('Could not find the function')) {
        console.log('🔍 Function not found');
        console.log('   Please create the function in Supabase SQL Editor');
      }
    } else {
      console.log('✅ Profile function works!');
      console.log('   Profile:', {
        id: profileData?.id,
        email: profileData?.email,
        name: profileData?.name,
        role: profileData?.role
      });
    }

    // Test session
    console.log('\n3. Testing session...');
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('✅ Session active:', !!sessionData.session);

    // Sign out
    console.log('\n4. Signing out...');
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');

    if (profileData) {
      console.log('\n🎉 All tests passed! Authentication is working properly.');
      console.log('🚀 You can now test login in the web interface.');
    } else {
      console.log('\n⚠️  Function needs manual fix in Supabase SQL Editor.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFixedAuth();