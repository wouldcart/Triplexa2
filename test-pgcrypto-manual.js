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

async function testPgcryptoManual() {
  console.log('🔍 Testing pgcrypto manually...');
  
  try {
    // Test 1: Create a simple test function that uses crypt
    console.log('\n1. Creating test function with crypt...');
    const testFunctionSQL = `
      CREATE OR REPLACE FUNCTION test_crypt_function(test_password text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- Enable pgcrypto if not already enabled
        CREATE EXTENSION IF NOT EXISTS pgcrypto;
        
        -- Test crypt function
        RETURN crypt(test_password, gen_salt('bf'));
      END;
      $$;
    `;

    // We'll try to create this function using a direct approach
    console.log('   Creating test function...');
    
    // Test 2: Try to call our existing authenticate function with debug
    console.log('\n2. Testing authenticate_managed_agent with non-existent user...');
    const { data: authData, error: authError } = await adminSupabase
      .rpc('authenticate_managed_agent', {
        p_username: 'nonexistent_user_test',
        p_password: 'any_password'
      });
    
    if (authError) {
      console.log('   ❌ authenticate_managed_agent error:', authError.message);
      console.log('   Error details:', authError);
    } else {
      console.log('   ✅ authenticate_managed_agent result:', authData);
    }

    // Test 3: Create a real agent and test authentication
    console.log('\n3. Creating real test agent for authentication...');
    
    // First create a test user
    const testEmail = 'pgcrypto-test@example.com';
    const testPassword = 'TestPassword123!';
    const testUsername = 'pgcryptotest';
    
    // Create auth user
    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (userError) {
      console.log('   ⚠️  User creation failed:', userError.message);
    } else {
      console.log('   ✅ Test user created:', userData.user.id);
      
      const testUserId = userData.user.id;
      
      // Create profile
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .upsert({
          id: testUserId,
          name: 'PgCrypto Test User',
          email: testEmail,
          phone: '+1234567890',
          company_name: 'Test Company',
          role: 'agent'
        });

      if (profileError) {
        console.log('   ⚠️  Profile creation failed:', profileError.message);
      } else {
        console.log('   ✅ Profile created');
        
        // Create agent
        const { error: agentError } = await adminSupabase
          .from('agents')
          .insert({
            id: testUserId,
            status: 'active',
            commission_value: 0.10,
            commission_type: 'percentage',
            type: 'individual'
          });

        if (agentError) {
          console.log('   ⚠️  Agent creation failed:', agentError.message);
        } else {
          console.log('   ✅ Agent created');
          
          // Set credentials
          const { data: credData, error: credError } = await adminSupabase
            .rpc('set_agent_credentials', {
              p_id: testUserId,
              p_username: testUsername,
              p_password: testPassword,
              p_is_temporary: false
            });

          if (credError) {
            console.log('   ❌ Credentials setting failed:', credError.message);
          } else {
            console.log('   ✅ Credentials set:', credData);
            
            // Now test authentication
            console.log('\n4. Testing authentication with real credentials...');
            const { data: realAuthData, error: realAuthError } = await adminSupabase
              .rpc('authenticate_managed_agent', {
                p_username: testUsername,
                p_password: testPassword
              });

            if (realAuthError) {
              console.log('   ❌ Real authentication failed:', realAuthError.message);
              console.log('   Error details:', realAuthError);
            } else {
              console.log('   ✅ Real authentication successful:', realAuthData);
            }
          }
        }
      }
      
      // Cleanup
      console.log('\n5. Cleaning up test data...');
      await adminSupabase.from('agent_credentials').delete().eq('agent_id', testUserId);
      await adminSupabase.from('agents').delete().eq('id', testUserId);
      await adminSupabase.from('profiles').delete().eq('id', testUserId);
      await adminSupabase.auth.admin.deleteUser(testUserId);
      console.log('   ✅ Cleanup completed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
  
  return true;
}

testPgcryptoManual()
  .then(success => {
    if (success) {
      console.log('\n✅ pgcrypto manual test completed');
    } else {
      console.log('\n❌ pgcrypto manual test failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });