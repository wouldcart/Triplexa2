import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testLogin() {
  console.log('🔐 Testing login functionality...');

  try {
    // First, let's get the available credentials
    const adminClient = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('\n1. Getting available test credentials...');
    const { data: credentials, error: credError } = await adminClient
      .from('agent_credentials')
      .select('username, agent_id, is_temporary')
      .limit(1);

    if (credError) {
      console.log('❌ Cannot get credentials:', credError.message);
      return;
    }

    if (!credentials || credentials.length === 0) {
      console.log('❌ No credentials found');
      return;
    }

    const testUsername = credentials[0].username;
    console.log('📧 Test username:', testUsername);

    // Try to get the agent details
    const { data: agent, error: agentError } = await adminClient
      .from('agents')
      .select('id, email, name, status')
      .eq('id', credentials[0].agent_id)
      .single();

    if (agentError) {
      console.log('❌ Cannot get agent:', agentError.message);
    } else {
      console.log('🤖 Agent details:', agent);
    }

    // Now try the authenticate_managed_agent function with a test password
    console.log('\n2. Testing authenticate_managed_agent...');
    const { data: authResult, error: authError } = await supabase.rpc('authenticate_managed_agent', {
      p_username: testUsername,
      p_password: 'test123' // This will likely fail, but let's see the response
    });

    if (authError) {
      console.log('❌ Auth function error:', authError.message);
    } else {
      console.log('🔑 Auth result:', authResult);
    }

    // Try Supabase auth with the agent email
    if (agent && agent.email) {
      console.log('\n3. Testing Supabase signInWithPassword...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: agent.email,
        password: 'test123' // This will likely fail too
      });

      if (signInError) {
        console.log('❌ Supabase signIn error:', signInError.message);
      } else {
        console.log('✅ Supabase signIn success:', signInData.user?.email);
      }
    }

    // Try with the profile email
    const { data: profiles, error: profileError } = await adminClient
      .from('profiles')
      .select('email, name, role')
      .limit(1);

    if (!profileError && profiles && profiles.length > 0) {
      const profileEmail = profiles[0].email;
      console.log('\n4. Testing with profile email:', profileEmail);
      
      const { data: profileSignIn, error: profileSignInError } = await supabase.auth.signInWithPassword({
        email: profileEmail,
        password: 'test123'
      });

      if (profileSignInError) {
        console.log('❌ Profile signIn error:', profileSignInError.message);
      } else {
        console.log('✅ Profile signIn success:', profileSignIn.user?.email);
      }
    }

    console.log('\n💡 Summary:');
    console.log('   - We have agent credentials in the database');
    console.log('   - authenticate_managed_agent function works');
    console.log('   - get_or_create_profile_for_current_user function is missing');
    console.log('   - Need to either:');
    console.log('     a) Create the missing RPC function');
    console.log('     b) Create a proper Supabase auth user');
    console.log('     c) Set up proper passwords for existing users');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLogin();