const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzofytokwszfwiupsdvi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNTM0MTEsImV4cCI6MjA3MzkyOTQxMX0.FnTL4m0EmxzlNSRfCD12Gc1_PUpOI4rHvaRemr46CiQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugAuthFailure() {
  console.log('🔍 Debugging Authentication Failure...\n');

  try {
    // Test 1: Check Supabase connection
    console.log('1. Testing Supabase connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.log('⚠️  Supabase connection issue:', healthError.message);
    } else {
      console.log('✅ Supabase connection working');
    }

    // Test 2: Try agent login
    console.log('\n2. Testing agent login...');
    const { data: agentAuth, error: agentError } = await supabase.auth.signInWithPassword({
      email: 'agent_company@tripoex.com',
      password: 'agent123'
    });

    if (agentError) {
      console.error('❌ Agent login failed:', agentError.message);
      console.error('   Error code:', agentError.status);
      console.error('   Full error:', JSON.stringify(agentError, null, 2));
    } else {
      console.log('✅ Agent login successful');
      console.log('   User ID:', agentAuth.user.id);
      console.log('   Email confirmed:', agentAuth.user.email_confirmed_at ? 'Yes' : 'No');
      
      // Test role function
      const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');
      if (roleError) {
        console.log('⚠️  Role check failed:', roleError.message);
      } else {
        console.log('✅ User role:', roleData);
      }
      
      await supabase.auth.signOut();
    }

    // Test 3: Try other test accounts
    console.log('\n3. Testing other accounts...');
    
    const testAccounts = [
      { email: 'super_admin@tripoex.com', password: 'admin123', role: 'super_admin' },
      { email: 'manager@tripoex.com', password: 'manager123', role: 'manager' },
      { email: 'staff@tripoex.com', password: 'staff123', role: 'staff' }
    ];

    for (const account of testAccounts) {
      console.log(`\n   Testing ${account.role} account...`);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password
      });

      if (authError) {
        console.log(`   ❌ ${account.role} login failed:`, authError.message);
      } else {
        console.log(`   ✅ ${account.role} login successful`);
        await supabase.auth.signOut();
      }
    }

    // Test 4: Check auth users table
    console.log('\n4. Checking auth users...');
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM1MzQxMSwiZXhwIjoyMDczOTI5NDExfQ.DtdmBPTmaaMtXk8s_ZKTuXv9b9EHHQoNaepUUFj89rU';
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers();
    
    if (usersError) {
      console.log('⚠️  Could not fetch users:', usersError.message);
    } else {
      console.log('✅ Found', users.users.length, 'users in auth.users');
      
      const agentUser = users.users.find(u => u.email === 'agent_company@tripoex.com');
      if (agentUser) {
        console.log('   Agent user found:');
        console.log('     - ID:', agentUser.id);
        console.log('     - Email confirmed:', agentUser.email_confirmed_at ? 'Yes' : 'No');
        console.log('     - Created:', agentUser.created_at);
        console.log('     - Last sign in:', agentUser.last_sign_in_at || 'Never');
      } else {
        console.log('   ❌ Agent user not found in auth.users');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugAuthFailure();