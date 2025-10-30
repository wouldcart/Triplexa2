const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔐 Testing Agent Login with Setup Script Credentials...\n');

async function testAgentLogin() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test credentials from setup-test-accounts.js
    const testEmail = 'agent_company@tripoex.com';
    const testPassword = 'agent123';

    console.log('1. Testing agent login...');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      
      // Check if user exists in auth.users
      console.log('\n2. Checking if user exists in auth.users...');
      const adminClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
      
      const { data: authUsers, error: authError } = await adminClient
        .from('auth.users')
        .select('id, email, email_confirmed_at')
        .eq('email', testEmail);

      if (authError) {
        console.log('❌ Cannot check auth.users:', authError.message);
      } else if (authUsers && authUsers.length > 0) {
        console.log('✅ User exists in auth.users:', authUsers[0]);
        console.log('   Email confirmed:', !!authUsers[0].email_confirmed_at);
      } else {
        console.log('❌ User does not exist in auth.users');
        console.log('💡 Need to run the setup-test-accounts.js script first');
      }
      
      return;
    }

    console.log('✅ Login successful!');
    console.log('   User ID:', loginData.user?.id);
    console.log('   Email:', loginData.user?.email);

    // Test the get_or_create_profile_for_current_user RPC
    console.log('\n3. Testing get_or_create_profile_for_current_user RPC...');
    const { data: profileData, error: profileError } = await supabase.rpc('get_or_create_profile_for_current_user');

    if (profileError) {
      console.log('❌ Profile RPC failed:', profileError.message);
      
      // Check profile directly
      console.log('\n4. Checking profile directly...');
      const { data: directProfile, error: directProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single();

      if (directProfileError) {
        console.log('❌ Direct profile query failed:', directProfileError.message);
      } else {
        console.log('✅ Profile found directly:', {
          id: directProfile.id,
          name: directProfile.name,
          email: directProfile.email,
          role: directProfile.role
        });
      }
    } else {
      console.log('✅ Profile RPC works!');
      console.log('   Profile:', {
        id: profileData?.id,
        name: profileData?.name,
        email: profileData?.email,
        role: profileData?.role
      });
    }

    // Test get_current_user_role
    console.log('\n5. Testing get_current_user_role...');
    const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');

    if (roleError) {
      console.log('❌ Role RPC failed:', roleError.message);
    } else {
      console.log('✅ Role RPC works!');
      console.log('   Current role:', roleData);
    }

    // Test redirect logic simulation
    console.log('\n6. Simulating redirect logic...');
    const userRole = profileData?.role || roleData;
    console.log(`   User role: ${userRole}`);
    
    if (userRole === 'agent') {
      console.log('✅ Should redirect to: /dashboards/agent');
    } else {
      console.log(`❌ Unexpected role: ${userRole}, would redirect elsewhere`);
    }

    // Sign out
    console.log('\n7. Signing out...');
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.log('❌ Sign out failed:', signOutError.message);
    } else {
      console.log('✅ Signed out successfully');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAgentLogin();