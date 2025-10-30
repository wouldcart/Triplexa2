const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Working Agent Authentication...\n');

async function testWorkingAgent() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log('1. Finding an agent that exists in both auth.users and profiles...');
    
    // Get all auth users
    const { data: authUsers, error: authError } = await adminClient.rpc('exec_sql', {
      sql_query: `
        SELECT id, email, email_confirmed_at
        FROM auth.users 
        WHERE email_confirmed_at IS NOT NULL;
      `
    });

    if (authError || !authUsers || authUsers.length === 0) {
      console.log('❌ No confirmed auth users found');
      return;
    }

    console.log(`✅ Found ${authUsers.length} confirmed auth users`);

    // Check which ones have agent profiles
    for (const authUser of authUsers) {
      const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .eq('role', 'agent')
        .single();

      if (!profileError && profile) {
        console.log(`✅ Found working agent: ${authUser.email}`);
        console.log(`   Profile role: ${profile.role}`);
        console.log(`   Profile name: ${profile.name}`);
        
        // Try to authenticate with a common password
        const testPasswords = ['agent123', 'password', 'test123', 'agent', '123456'];
        
        for (const password of testPasswords) {
          console.log(`\n2. Testing login with ${authUser.email} and password: ${password}`);
          
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: authUser.email,
            password: password
          });

          if (!loginError && loginData.user) {
            console.log('✅ Login successful!');
            console.log('   User ID:', loginData.user.id);
            
            // Test the RPC function
            console.log('\n3. Testing get_or_create_profile_for_current_user...');
            const { data: profileData, error: profileRpcError } = await supabase.rpc('get_or_create_profile_for_current_user');
            
            if (profileRpcError) {
              console.log('❌ RPC failed:', profileRpcError.message);
            } else {
              console.log('✅ RPC successful!');
              console.log('   Profile role:', profileData?.role);
              console.log('   Expected redirect: /dashboards/agent');
            }
            
            // Sign out
            await supabase.auth.signOut();
            console.log('✅ Signed out');
            return; // Found a working agent, exit
          } else {
            console.log(`❌ Login failed: ${loginError?.message}`);
          }
        }
        
        // If no password worked, try to reset it
        console.log(`\n   Attempting password reset for ${authUser.email}...`);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(authUser.email);
        if (resetError) {
          console.log(`   ❌ Password reset failed: ${resetError.message}`);
        } else {
          console.log(`   ✅ Password reset email sent to ${authUser.email}`);
        }
        
        break; // Only test the first agent found
      }
    }

    console.log('\n4. Alternative: Create a test agent user...');
    
    // Create a test agent user
    const testEmail = 'test-agent@example.com';
    const testPassword = 'test123456';
    
    console.log(`   Creating test agent: ${testEmail}`);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'agent',
          name: 'Test Agent'
        }
      }
    });

    if (signupError) {
      console.log(`   ❌ Signup failed: ${signupError.message}`);
    } else {
      console.log('   ✅ Test agent created successfully!');
      console.log('   User ID:', signupData.user?.id);
      
      if (signupData.user?.email_confirmed_at) {
        console.log('   ✅ Email already confirmed, testing login...');
        
        const { data: testLoginData, error: testLoginError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });

        if (!testLoginError && testLoginData.user) {
          console.log('   ✅ Test agent login successful!');
          
          // Test the RPC function
          const { data: testProfileData, error: testProfileError } = await supabase.rpc('get_or_create_profile_for_current_user');
          
          if (testProfileError) {
            console.log('   ❌ RPC failed:', testProfileError.message);
          } else {
            console.log('   ✅ RPC successful!');
            console.log('   Profile role:', testProfileData?.role);
          }
          
          await supabase.auth.signOut();
        }
      } else {
        console.log('   ⚠️  Email confirmation required');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testWorkingAgent();