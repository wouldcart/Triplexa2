require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create admin client
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create regular client for RPC calls
const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);

async function testAdminSignupFlow() {
  console.log('🧪 Testing admin signup flow...\n');
  
  const testEmail = `test-admin-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testUserData = {
    name: 'Test Admin User',
    role: 'agent',
    department: 'Sales',
    phone: '+1234567890',
    position: 'Travel Agent',
    employee_id: 'EMP001',
    company_name: 'Test Travel Co',
    city: 'New York',
    country: 'United States',
    must_change_password: false
  };

  let testUserId = null;

  try {
    // Step 1: Create user with admin client (bypasses email confirmation)
    console.log('📝 Step 1: Creating user with admin client...');
    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: testUserData
    });

    if (userError) {
      console.error('❌ Admin user creation failed:', userError);
      return;
    }

    testUserId = userData.user.id;
    console.log('✅ User created successfully:', {
      id: userData.user.id,
      email: userData.user.email,
      email_confirmed_at: userData.user.email_confirmed_at,
      user_metadata: userData.user.user_metadata
    });

    // Step 2: Check if profile was created by trigger
    console.log('\n📋 Step 2: Checking if profile was created by trigger...');
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (profileError) {
      console.error('❌ Profile check failed:', profileError);
    } else {
      console.log('✅ Profile found:', {
        id: profileData.id,
        name: profileData.name,
        phone: profileData.phone,
        company: profileData.company,
        role: profileData.role,
        created_at: profileData.created_at
      });
    }

    // Step 3: Sign in with the created user
    console.log('\n🔐 Step 3: Signing in with created user...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError);
      return;
    }

    console.log('✅ Sign in successful:', {
      user_id: signInData.user.id,
      email: signInData.user.email,
      access_token: signInData.session.access_token ? 'Present' : 'Missing'
    });

    // Step 4: Test RPC function with authenticated user
    console.log('\n🔧 Step 4: Testing RPC function...');
    
    // Set the session for RPC calls
    await supabase.auth.setSession(signInData.session);
    
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_or_create_profile_for_current_user');

    if (rpcError) {
      console.error('❌ RPC function failed:', rpcError);
    } else {
      console.log('✅ RPC function successful:', {
        id: rpcData?.id,
        name: rpcData?.name,
        phone: rpcData?.phone,
        company: rpcData?.company,
        role: rpcData?.role
      });
    }

    // Step 5: Create agent record (simulate AgentManagementService.signupAgent)
    console.log('\n👤 Step 5: Creating agent record...');
    const agentData = {
      user_id: testUserId,
      name: testUserData.name,
      email: testEmail,
      phone: testUserData.phone,
      department: testUserData.department,
      position: testUserData.position,
      employee_id: testUserData.employee_id,
      company_name: testUserData.company_name,
      city: testUserData.city,
      country: testUserData.country,
      status: 'active'
    };

    const { data: agentRecord, error: agentError } = await adminSupabase
      .from('agents')
      .insert(agentData)
      .select()
      .single();

    if (agentError) {
      console.error('❌ Agent creation failed:', agentError);
    } else {
      console.log('✅ Agent created successfully:', {
        id: agentRecord.id,
        name: agentRecord.name,
        email: agentRecord.email,
        status: agentRecord.status
      });
    }

    // Step 6: Verify final state
    console.log('\n🔍 Step 6: Verifying final state...');
    
    // Check profile again
    const { data: finalProfile, error: finalProfileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (finalProfileError) {
      console.error('❌ Final profile check failed:', finalProfileError);
    } else {
      console.log('✅ Final profile state:', {
        id: finalProfile.id,
        name: finalProfile.name,
        phone: finalProfile.phone,
        company: finalProfile.company,
        role: finalProfile.role
      });
    }

    // Check agent record
    const { data: finalAgent, error: finalAgentError } = await adminSupabase
      .from('agents')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (finalAgentError) {
      console.error('❌ Final agent check failed:', finalAgentError);
    } else {
      console.log('✅ Final agent state:', {
        id: finalAgent.id,
        name: finalAgent.name,
        email: finalAgent.email,
        status: finalAgent.status
      });
    }

    console.log('\n🎉 Admin signup flow test completed successfully!');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  } finally {
    // Cleanup: Delete test user
    if (testUserId) {
      console.log('\n🧹 Cleaning up test user...');
      
      // Delete agent record first
      await adminSupabase.from('agents').delete().eq('user_id', testUserId);
      
      // Delete profile record
      await adminSupabase.from('profiles').delete().eq('id', testUserId);
      
      // Delete user
      const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(testUserId);
      if (deleteError) {
        console.error('❌ Failed to delete test user:', deleteError);
      } else {
        console.log('✅ Test user cleaned up successfully');
      }
    }
  }
}

testAdminSignupFlow().catch(console.error);