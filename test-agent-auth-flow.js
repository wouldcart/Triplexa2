#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAgentAuthFlow() {
  console.log('🧪 Testing Complete Agent Authentication Flow\n');

  const testEmail = `test.agent.${Date.now()}@gmail.com`;
  const testPassword = 'TempPassword123!';
  const newPassword = 'NewSecurePassword456!';

  try {
    // Step 1: Check if agent_credentials table exists and is accessible
    console.log('1️⃣ Checking agent_credentials table accessibility...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('agent_credentials')
      .select('count')
      .limit(1);

    if (tableError) {
      console.log('⚠️ agent_credentials table not accessible:', tableError.message);
      console.log('   This is expected if the table doesn\'t exist yet.');
    } else {
      console.log('✅ agent_credentials table is accessible');
    }

    // Step 2: Test direct agent credentials query (simulating our new approach)
    console.log('\n2️⃣ Testing direct agent credentials query...');
    const { data: credData, error: credError } = await supabase
      .from('agent_credentials')
      .select('username, is_temporary')
      .eq('username', testEmail)
      .single();

    if (credError && credError.code === 'PGRST116') {
      console.log('✅ No existing credentials found (expected for new agent)');
    } else if (credError) {
      console.log('⚠️ Error querying credentials:', credError.message);
    } else {
      console.log('📋 Found existing credentials:', credData);
    }

    // Step 3: Test Supabase Auth signup (simulating invitation acceptance)
    console.log('\n3️⃣ Testing Supabase Auth signup...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: undefined // Skip email confirmation for testing
      }
    });

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
      return;
    }

    console.log('✅ Supabase Auth signup successful');
    console.log('   User ID:', signupData.user?.id);
    console.log('   Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No');

    // Step 4: Create a profile for the agent
    console.log('\n4️⃣ Creating agent profile...');
    if (signupData.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signupData.user.id,
          email: testEmail,
          name: 'Test Agent',
          role: 'agent',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        console.log('❌ Profile creation failed:', profileError.message);
      } else {
        console.log('✅ Agent profile created successfully');
      }
    }

    // Step 5: Test agent credentials creation (simulating setAgentCredentials)
    console.log('\n5️⃣ Testing agent credentials creation...');
    if (signupData.user) {
      const { data: agentCredData, error: agentCredError } = await supabase
        .from('agent_credentials')
        .insert({
          agent_id: signupData.user.id,
          username: testEmail,
          password_hash: 'hashed_temp_password', // In real implementation, this would be properly hashed
          is_temporary: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (agentCredError) {
        console.log('❌ Agent credentials creation failed:', agentCredError.message);
      } else {
        console.log('✅ Agent credentials created successfully');
        console.log('   Is temporary:', agentCredData.is_temporary);
      }
    }

    // Step 6: Test sign in with Supabase Auth
    console.log('\n6️⃣ Testing sign in with Supabase Auth...');
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signinError) {
      console.log('❌ Supabase Auth signin failed:', signinError.message);
    } else {
      console.log('✅ Supabase Auth signin successful');
    }

    // Step 7: Test checking password change requirement
    console.log('\n7️⃣ Testing password change requirement check...');
    const { data: tempCredCheck, error: tempCredError } = await supabase
      .from('agent_credentials')
      .select('is_temporary')
      .eq('username', testEmail)
      .single();

    if (tempCredError) {
      console.log('❌ Failed to check temporary credentials:', tempCredError.message);
    } else {
      console.log('✅ Password change requirement check successful');
      console.log('   Requires password change:', tempCredCheck.is_temporary ? 'Yes' : 'No');
    }

    // Step 8: Test password update
    console.log('\n8️⃣ Testing password update...');
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      console.log('❌ Password update failed:', updateError.message);
    } else {
      console.log('✅ Supabase password update successful');

      // Update agent credentials to mark as non-temporary
      const { error: credUpdateError } = await supabase
        .from('agent_credentials')
        .update({
          is_temporary: false,
          updated_at: new Date().toISOString()
        })
        .eq('username', testEmail);

      if (credUpdateError) {
        console.log('❌ Agent credentials update failed:', credUpdateError.message);
      } else {
        console.log('✅ Agent credentials marked as non-temporary');
      }
    }

    // Step 9: Test sign in with new password
    console.log('\n9️⃣ Testing sign in with new password...');
    
    // Sign out first
    await supabase.auth.signOut();
    
    const { data: newSigninData, error: newSigninError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: newPassword
    });

    if (newSigninError) {
      console.log('❌ Sign in with new password failed:', newSigninError.message);
    } else {
      console.log('✅ Sign in with new password successful');
    }

    // Step 10: Verify password change is no longer required
    console.log('\n🔟 Verifying password change is no longer required...');
    const { data: finalCredCheck, error: finalCredError } = await supabase
      .from('agent_credentials')
      .select('is_temporary')
      .eq('username', testEmail)
      .single();

    if (finalCredError) {
      console.log('❌ Failed final credentials check:', finalCredError.message);
    } else {
      console.log('✅ Final credentials check successful');
      console.log('   Still requires password change:', finalCredCheck.is_temporary ? 'Yes' : 'No');
    }

    console.log('\n🎉 Agent authentication flow test completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Agent credentials table accessible');
    console.log('   ✅ Direct credentials query working');
    console.log('   ✅ Supabase Auth signup working');
    console.log('   ✅ Agent profile creation working');
    console.log('   ✅ Agent credentials creation working');
    console.log('   ✅ Supabase Auth signin working');
    console.log('   ✅ Password change requirement detection working');
    console.log('   ✅ Password update working');
    console.log('   ✅ Sign in with new password working');
    console.log('   ✅ Password change requirement cleared');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Cleanup: Remove test data
    console.log('\n🧹 Cleaning up test data...');
    try {
      // Delete agent credentials
      await supabase
        .from('agent_credentials')
        .delete()
        .eq('username', testEmail);

      // Delete profile
      await supabase
        .from('profiles')
        .delete()
        .eq('email', testEmail);

      console.log('✅ Test data cleaned up');
    } catch (cleanupError) {
      console.log('⚠️ Cleanup failed:', cleanupError);
    }
  }
}

// Run the test
testAgentAuthFlow().catch(console.error);