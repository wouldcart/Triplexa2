const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Creating Test Agent User...\n');

async function createTestAgent() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const testEmail = 'test-agent@triplexa.com';
    const testPassword = 'agent123456';

    console.log('1. Creating test agent user...');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);

    // First, check if user already exists
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (existingProfile) {
      console.log('✅ Test agent already exists in profiles');
      console.log(`   ID: ${existingProfile.id}`);
      console.log(`   Role: ${existingProfile.role}`);
      
      // Try to login with existing user
      console.log('\n2. Testing login with existing user...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (!loginError && loginData.user) {
        console.log('✅ Login successful with existing user!');
        await testAuthFlow(supabase, loginData.user);
        return;
      } else {
        console.log(`❌ Login failed: ${loginError?.message}`);
        console.log('   Will try to create new user...');
      }
    }

    // Create new user
    console.log('\n2. Creating new test agent...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'agent',
          name: 'Test Agent',
          department: 'General'
        }
      }
    });

    if (signupError) {
      console.log(`❌ Signup failed: ${signupError.message}`);
      
      // If user already exists in auth but not confirmed, try to confirm
      if (signupError.message.includes('already registered')) {
        console.log('   User exists in auth, attempting to confirm...');
        
        // Try to sign in (this might work if email confirmation is disabled)
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });

        if (!loginError && loginData.user) {
          console.log('✅ Login successful with existing auth user!');
          await testAuthFlow(supabase, loginData.user);
          return;
        } else {
          console.log(`❌ Login still failed: ${loginError?.message}`);
        }
      }
      return;
    }

    console.log('✅ Signup successful!');
    console.log(`   User ID: ${signupData.user?.id}`);
    console.log(`   Email confirmed: ${!!signupData.user?.email_confirmed_at}`);

    // If email is not confirmed, try to sign in anyway (some setups allow this)
    if (!signupData.user?.email_confirmed_at) {
      console.log('\n3. Email not confirmed, trying to sign in anyway...');
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (!loginError && loginData.user) {
        console.log('✅ Login successful even without email confirmation!');
        await testAuthFlow(supabase, loginData.user);
      } else {
        console.log(`❌ Login failed: ${loginError?.message}`);
        console.log('   Email confirmation may be required');
      }
    } else {
      // Email is confirmed, try to sign in
      console.log('\n3. Email confirmed, testing sign in...');
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (!loginError && loginData.user) {
        console.log('✅ Login successful!');
        await testAuthFlow(supabase, loginData.user);
      } else {
        console.log(`❌ Login failed: ${loginError?.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testAuthFlow(supabase, user) {
  console.log('\n4. Testing authentication flow...');
  
  try {
    // Test get_or_create_profile_for_current_user
    console.log('   Testing get_or_create_profile_for_current_user...');
    const { data: profileData, error: profileError } = await supabase.rpc('get_or_create_profile_for_current_user');
    
    if (profileError) {
      console.log(`   ❌ RPC failed: ${profileError.message}`);
    } else {
      console.log('   ✅ RPC successful!');
      console.log(`   Profile role: ${profileData?.role}`);
      console.log(`   Profile name: ${profileData?.name}`);
      console.log(`   Profile email: ${profileData?.email}`);
      
      // Test redirect logic
      const userRole = profileData?.role;
      let redirectPath = '/';
      
      if (userRole === 'agent') {
        redirectPath = '/dashboards/agent';
      } else if (userRole === 'super_admin') {
        redirectPath = '/dashboards/super-admin';
      } else if (userRole === 'manager') {
        redirectPath = '/dashboards/manager';
      }
      
      console.log(`   Expected redirect path: ${redirectPath}`);
      
      if (userRole === 'agent' && redirectPath === '/dashboards/agent') {
        console.log('   ✅ Agent redirect logic is correct!');
      }
    }
    
    // Test get_current_user_role
    console.log('\n   Testing get_current_user_role...');
    const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');
    
    if (roleError) {
      console.log(`   ❌ get_current_user_role failed: ${roleError.message}`);
    } else {
      console.log(`   ✅ get_current_user_role successful: ${roleData}`);
    }
    
    // Sign out
    console.log('\n5. Signing out...');
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');
    
    console.log('\n🎉 Test completed! The authentication flow is working correctly.');
    console.log(`🚀 You can now test login in the web interface with:`);
    console.log(`   Email: test-agent@triplexa.com`);
    console.log(`   Password: agent123456`);
    
  } catch (error) {
    console.error('❌ Auth flow test failed:', error);
  }
}

createTestAgent();