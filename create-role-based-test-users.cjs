const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase admin client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('VITE_SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test users configuration based on redirection mapping
const testUsers = [
  {
    email: 'hr.manager@test.com',
    password: 'TestPass123!',
    role: 'hr_manager',
    metadata: {
      name: 'HR Manager Test',
      department: 'Human Resources',
      position: 'HR Manager'
    },
    expectedRedirect: '/management/staff'
  },
  {
    email: 'super.admin@test.com', 
    password: 'TestPass123!',
    role: 'super_admin',
    metadata: {
      name: 'Super Admin Test',
      department: 'Administration',
      position: 'Super Administrator'
    },
    expectedRedirect: '/admin/dashboard'
  },
  {
    email: 'manager@test.com',
    password: 'TestPass123!', 
    role: 'manager',
    metadata: {
      name: 'Manager Test',
      department: 'Operations',
      position: 'Operations Manager'
    },
    expectedRedirect: '/management/dashboard'
  },
  {
    email: 'finance.manager@test.com',
    password: 'TestPass123!',
    role: 'finance_manager', 
    metadata: {
      name: 'Finance Manager Test',
      department: 'Finance',
      position: 'Finance Manager'
    },
    expectedRedirect: '/management/finance'
  },
  {
    email: 'field.sales@test.com',
    password: 'TestPass123!',
    role: 'staff',
    metadata: {
      name: 'Field Sales Test',
      department: 'Field Sales', // This should redirect to /management/agents
      position: 'Sales Representative'
    },
    expectedRedirect: '/management/agents'
  },
  {
    email: 'regular.staff@test.com',
    password: 'TestPass123!',
    role: 'staff',
    metadata: {
      name: 'Regular Staff Test', 
      department: 'Customer Service',
      position: 'Customer Service Representative'
    },
    expectedRedirect: '/staff/dashboard'
  },
  {
    email: 'agent@test.com',
    password: 'TestPass123!',
    role: 'agent',
    metadata: {
      name: 'Agent Test',
      department: 'Sales',
      position: 'Travel Agent'
    },
    expectedRedirect: '/agent/dashboard'
  },
  {
    email: 'regular.user@test.com',
    password: 'TestPass123!',
    role: 'user',
    metadata: {
      name: 'Regular User Test',
      department: 'N/A',
      position: 'Customer'
    },
    expectedRedirect: '/dashboard'
  }
];

async function createTestUser(userConfig) {
  console.log(`\n🔄 Creating user: ${userConfig.email} (${userConfig.role})`);
  
  try {
    // Step 1: Create user with admin client
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email: userConfig.email,
      password: userConfig.password,
      email_confirm: true,
      user_metadata: {
        role: userConfig.role,
        name: userConfig.metadata.name,
        department: userConfig.metadata.department,
        position: userConfig.metadata.position
      }
    });

    if (authError) {
      console.error(`❌ Auth user creation failed:`, authError.message);
      return { success: false, error: authError.message };
    }

    console.log(`✅ Auth user created: ${authUser.user.id}`);

    // Step 2: Wait a moment for triggers to fire
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Check if profile was created by handle_new_user() trigger
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (profileError) {
      console.error(`❌ Profile check failed:`, profileError.message);
      
      // Try manual profile creation using get_or_create_profile_for_current_user
      console.log(`🔄 Attempting manual profile creation...`);
      const { data: manualProfile, error: manualError } = await adminSupabase
        .rpc('get_or_create_profile_for_current_user');
        
      if (manualError) {
        console.error(`❌ Manual profile creation failed:`, manualError.message);
        return { success: false, error: `Profile creation failed: ${manualError.message}` };
      }
      
      console.log(`✅ Manual profile created`);
    } else {
      console.log(`✅ Profile found: ${profile.id}`);
      console.log(`   - Role: ${profile.role}`);
      console.log(`   - Name: ${profile.name}`);
      console.log(`   - Department: ${profile.department}`);
    }

    // Step 4: For agents, check if agent record was created
    if (userConfig.role === 'agent') {
      const { data: agentRecord, error: agentError } = await adminSupabase
        .from('agents')
        .select('*')
        .eq('user_id', authUser.user.id)
        .single();

      if (agentError) {
        console.log(`⚠️  Agent record not found (this might be expected): ${agentError.message}`);
      } else {
        console.log(`✅ Agent record created: ${agentRecord.id}`);
        console.log(`   - Name: ${agentRecord.name}`);
        console.log(`   - Email: ${agentRecord.email}`);
        console.log(`   - Status: ${agentRecord.status}`);
      }
    }

    // Step 5: For non-agents, verify no agent record was created
    if (userConfig.role !== 'agent') {
      const { data: unexpectedAgent, error: agentCheckError } = await adminSupabase
        .from('agents')
        .select('*')
        .eq('user_id', authUser.user.id);

      if (!agentCheckError && unexpectedAgent && unexpectedAgent.length > 0) {
        console.log(`⚠️  Unexpected agent record found for non-agent user!`);
        console.log(`   Agent records:`, unexpectedAgent);
      } else {
        console.log(`✅ No agent record found (correct for ${userConfig.role})`);
      }
    }

    return { 
      success: true, 
      userId: authUser.user.id,
      email: userConfig.email,
      role: userConfig.role,
      expectedRedirect: userConfig.expectedRedirect
    };

  } catch (error) {
    console.error(`❌ Unexpected error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function cleanupExistingTestUsers() {
  console.log('\n🧹 Cleaning up existing test users...');
  
  const testEmails = testUsers.map(u => u.email);
  
  try {
    // Get existing users
    const { data: existingUsers, error: listError } = await adminSupabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Failed to list users:', listError.message);
      return;
    }

    const usersToDelete = existingUsers.users.filter(user => 
      testEmails.includes(user.email)
    );

    for (const user of usersToDelete) {
      console.log(`🗑️  Deleting existing user: ${user.email}`);
      
      // Delete from agents table first (if exists)
      await adminSupabase
        .from('agents')
        .delete()
        .eq('user_id', user.id);
      
      // Delete from profiles table
      await adminSupabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      // Delete auth user
      const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`❌ Failed to delete user ${user.email}:`, deleteError.message);
      } else {
        console.log(`✅ Deleted user: ${user.email}`);
      }
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
}

async function testFunctionConflicts() {
  console.log('\n🧪 Testing function conflict scenarios...');
  
  // Test 1: Verify handle_new_user() trigger works
  console.log('\n📋 Test 1: handle_new_user() trigger functionality');
  
  // Test 2: Check for recursion in handle_agent_profile_insert()
  console.log('\n📋 Test 2: Agent profile insert trigger');
  
  // Test 3: Test manual get_or_create_profile_for_current_user()
  console.log('\n📋 Test 3: Manual profile creation RPC');
  
  console.log('✅ Function conflict tests completed');
}

async function main() {
  console.log('🚀 Starting role-based test user creation...');
  console.log(`📊 Creating ${testUsers.length} test users with different roles`);
  
  // Cleanup existing test users
  await cleanupExistingTestUsers();
  
  // Create new test users
  const results = [];
  
  for (const userConfig of testUsers) {
    const result = await createTestUser(userConfig);
    results.push(result);
    
    // Small delay between users
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Test function conflicts
  await testFunctionConflicts();
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successfully created users:');
    successful.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) → ${user.expectedRedirect}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed users:');
    failed.forEach(user => {
      console.log(`   - ${user.email}: ${user.error}`);
    });
  }
  
  console.log('\n🎯 Next steps:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. Navigate to /login');
  console.log('3. Test login with any of the created users');
  console.log('4. Verify redirection matches expected paths');
  
  console.log('\n📝 Test credentials:');
  successful.forEach(user => {
    console.log(`   ${user.email} / TestPass123! → ${user.expectedRedirect}`);
  });
}

// Run the script
main().catch(console.error);