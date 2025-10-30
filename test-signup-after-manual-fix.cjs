require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSignupAfterManualFix() {
  console.log('🧪 Testing signup after manual SQL fix...\n');

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Verify function and trigger exist
    console.log('1. VERIFYING FUNCTION AND TRIGGER:');
    
    try {
      const { data: functionCheck } = await supabase.rpc('exec_sql', {
        sql: "SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';"
      });
      console.log('   📋 Function exists:', functionCheck && functionCheck.length > 0);
    } catch (e) {
      console.log('   ⚠️  Cannot verify function via exec_sql');
    }

    try {
      const { data: triggerCheck } = await supabase.rpc('exec_sql', {
        sql: "SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';"
      });
      console.log('   📋 Trigger exists:', triggerCheck && triggerCheck.length > 0);
    } catch (e) {
      console.log('   ⚠️  Cannot verify trigger via exec_sql');
    }

    // 2. Test signup with different scenarios
    console.log('\n2. TESTING SIGNUP SCENARIOS:');
    
    const testCases = [
      {
        name: 'Basic Agent Signup',
        email: `basic-agent-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        metadata: {
          name: 'Basic Agent',
          role: 'agent',
          department: 'Sales'
        }
      },
      {
        name: 'Admin Signup',
        email: `admin-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        metadata: {
          name: 'Test Admin',
          role: 'admin',
          department: 'Management'
        }
      },
      {
        name: 'Minimal Signup',
        email: `minimal-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        metadata: {}
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n   Testing: ${testCase.name}`);
      console.log(`   Email: ${testCase.email}`);
      
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: testCase.email,
        password: testCase.password,
        options: {
          data: testCase.metadata
        }
      });

      if (signupError) {
        console.log(`   ❌ Signup failed: ${signupError.message}`);
        console.log(`   📋 Error code: ${signupError.status}`);
      } else {
        console.log(`   ✅ Signup successful!`);
        console.log(`   📋 User ID: ${signupData.user?.id}`);
        
        // Check if profile was created
        if (signupData.user?.id) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signupData.user.id)
            .single();
          
          if (profileError) {
            console.log(`   ❌ Profile not found: ${profileError.message}`);
          } else {
            console.log(`   ✅ Profile created successfully`);
            console.log(`   📋 Profile data:`, {
              name: profile.name,
              role: profile.role,
              department: profile.department,
              status: profile.status
            });
          }

          // Check if agent record was created (for agent role)
          if (testCase.metadata.role === 'agent' || !testCase.metadata.role) {
            const { data: agent, error: agentError } = await supabase
              .from('agents')
              .select('*')
              .eq('id', signupData.user.id)
              .single();
            
            if (agentError) {
              console.log(`   ❌ Agent record not found: ${agentError.message}`);
            } else {
              console.log(`   ✅ Agent record created successfully`);
              console.log(`   📋 Agent data:`, {
                name: agent.name,
                role: agent.role,
                department: agent.department,
                status: agent.status
              });
            }
          }

          // Clean up test user
          await supabase.auth.admin.deleteUser(signupData.user.id);
          console.log(`   🧹 Test user cleaned up`);
        }
      }
    }

    // 3. Test login with existing user
    console.log('\n3. TESTING LOGIN WITH EXISTING USER:');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'TestPassword123!'
    });

    if (loginError) {
      console.log('   ❌ Login failed:', loginError.message);
    } else {
      console.log('   ✅ Login successful');
      console.log('   📋 User ID:', loginData.user?.id);
      
      // Sign out
      await supabase.auth.signOut();
      console.log('   🔓 Signed out successfully');
    }

    console.log('\n🎉 Signup testing completed!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. If signup is still failing, apply the manual-auth-fix.sql file in Supabase Dashboard');
    console.log('2. Go to Supabase Dashboard > SQL Editor');
    console.log('3. Copy and paste the contents of manual-auth-fix.sql');
    console.log('4. Execute the SQL statements');
    console.log('5. Run this test script again to verify the fix');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSignupAfterManualFix().catch(console.error);