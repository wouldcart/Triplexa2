import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testEmail = 'test-agent-realistic@example.com';
const testPassword = 'TestPassword123!';
const testUsername = 'testagent123';

async function cleanup() {
  console.log('🧹 Cleaning up existing test data...');
  
  try {
    // Find existing user with test email
    const { data: users } = await adminSupabase.auth.admin.listUsers();
    const existingUser = users.users.find(user => user.email === testEmail);
    
    if (existingUser) {
      console.log(`   Found existing user: ${existingUser.id}`);
      
      // Delete agent credentials
      await adminSupabase
        .from('agent_credentials')
        .delete()
        .eq('id', existingUser.id);
      
      // Delete agent
      await adminSupabase
        .from('agents')
        .delete()
        .eq('id', existingUser.id);
      
      // Delete profile
      await adminSupabase
        .from('profiles')
        .delete()
        .eq('id', existingUser.id);
      
      // Delete auth user
      await adminSupabase.auth.admin.deleteUser(existingUser.id);
      
      console.log('   ✅ Cleanup completed');
    } else {
      console.log('   No existing user found');
    }
  } catch (error) {
    console.log('   ⚠️ Cleanup error (continuing anyway):', error.message);
  }
}

async function testRealisticAgentFlow() {
  console.log('🚀 Testing Realistic Agent Creation and Authentication Flow');
  console.log('============================================================');

  let testAgentId = null;

  try {
    // Step 1: Cleanup
    await cleanup();

    // Step 2: Create auth user
    console.log('\n1. Creating auth user...');
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (authError) {
      throw new Error(`Auth user creation failed: ${authError.message}`);
    }

    testAgentId = authUser.user.id;
    console.log(`   ✅ Auth user created: ${testAgentId}`);

    // Step 3: Handle profile (check if exists, update or create)
    console.log('\n2. Creating/updating profile...');
    const { data: existingProfile } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('id', testAgentId)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .update({
          name: 'Test Agent',
          email: testEmail,
          phone: '+1234567890',
          company_name: 'Test Company',
          role: 'agent'
        })
        .eq('id', testAgentId);

      if (profileError) {
        throw new Error(`Profile update failed: ${profileError.message}`);
      }
      console.log('   ✅ Profile updated');
    } else {
      // Create new profile
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .insert({
          id: testAgentId,
          name: 'Test Agent',
          email: testEmail,
          phone: '+1234567890',
          company_name: 'Test Company',
          role: 'agent'
        });

      if (profileError) {
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }
      console.log('   ✅ Profile created');
    }

    // Step 4: Create agent
    console.log('\n3. Creating agent...');
    const { error: agentError } = await adminSupabase
      .from('agents')
      .insert({
        id: testAgentId,
        status: 'active',
        commission_value: 0.10,
        commission_type: 'percentage',
        type: 'individual'
      });

    if (agentError) {
      throw new Error(`Agent creation failed: ${agentError.message}`);
    }
    console.log('   ✅ Agent created');

    // Step 5: Set agent credentials using correct parameter names
    console.log('\n4. Setting agent credentials...');
    const { data: credentialsData, error: credentialsError } = await adminSupabase
      .rpc('set_agent_credentials', {
        p_id: testAgentId,
        p_username: testUsername,
        p_password: testPassword,
        p_is_temporary: false
      });

    if (credentialsError) {
      throw new Error(`Credentials setting failed: ${credentialsError.message}`);
    }
    console.log('   ✅ Agent credentials set:', credentialsData);

    // Step 6: Test authentication using correct parameter names
    console.log('\n5. Testing agent authentication...');
    const { data: authData, error: authTestError } = await adminSupabase
      .rpc('authenticate_managed_agent', {
        p_username: testUsername,
        p_password: testPassword
      });

    if (authTestError) {
      throw new Error(`Authentication test failed: ${authTestError.message}`);
    }
    console.log('   ✅ Agent authentication successful:', authData);

    // Step 7: Test password update
    console.log('\n6. Testing password update...');
    const newPassword = 'NewPassword456!';
    const { data: updateData, error: updateError } = await adminSupabase
      .rpc('set_agent_credentials', {
        p_id: testAgentId,
        p_username: testUsername,
        p_password: newPassword,
        p_is_temporary: false
      });

    if (updateError) {
      throw new Error(`Password update failed: ${updateError.message}`);
    }
    console.log('   ✅ Password updated:', updateData);

    // Step 8: Test authentication with new password
    console.log('\n7. Testing authentication with new password...');
    const { data: newAuthData, error: newAuthError } = await adminSupabase
      .rpc('authenticate_managed_agent', {
        p_username: testUsername,
        p_password: newPassword
      });

    if (newAuthError) {
      throw new Error(`New password authentication failed: ${newAuthError.message}`);
    }
    console.log('   ✅ New password authentication successful:', newAuthData);

    // Step 9: Test agent approval using correct parameter name
    console.log('\n8. Testing agent approval...');
    const { data: approvalData, error: approvalError } = await adminSupabase
      .rpc('approve_agent', {
        p_id: testAgentId
      });

    if (approvalError) {
      throw new Error(`Agent approval failed: ${approvalError.message}`);
    }
    console.log('   ✅ Agent approved:', approvalData);

    // Step 10: Verify agent status
    console.log('\n9. Verifying agent status...');
    const { data: agentStatus, error: statusError } = await adminSupabase
      .from('agents')
      .select('status')
      .eq('id', testAgentId)
      .single();

    if (statusError) {
      throw new Error(`Status check failed: ${statusError.message}`);
    }
    console.log(`   ✅ Agent status: ${agentStatus.status}`);

    console.log('\n🎉 All tests passed! Agent creation and authentication flow works correctly.');
    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  } finally {
    // Cleanup
    if (testAgentId) {
      console.log('\n🧹 Final cleanup...');
      try {
        await adminSupabase.from('agent_credentials').delete().eq('id', testAgentId);
        await adminSupabase.from('agents').delete().eq('id', testAgentId);
        await adminSupabase.from('profiles').delete().eq('id', testAgentId);
        await adminSupabase.auth.admin.deleteUser(testAgentId);
        console.log('   ✅ Cleanup completed');
      } catch (cleanupError) {
        console.log('   ⚠️ Cleanup error:', cleanupError.message);
      }
    }
  }
}

// Run the test
testRealisticAgentFlow()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });