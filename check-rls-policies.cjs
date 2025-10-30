require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkRLSPolicies() {
  try {
    console.log('🔍 Checking RLS policies and permissions...\n');

    // 1. Check if RLS is enabled on profiles table
    console.log('1. Checking RLS status on profiles table...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles'`
      });

    if (rlsError) {
      console.log('❌ Error checking RLS status:', rlsError);
    } else {
      console.log('📋 RLS status:', rlsStatus);
    }

    // 2. Check RLS policies on profiles table
    console.log('\n2. Checking RLS policies on profiles table...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'profiles'`
      });

    if (policiesError) {
      console.log('❌ Error checking policies:', policiesError);
    } else {
      console.log('📋 RLS policies:', policies);
    }

    // 3. Check current user/role
    console.log('\n3. Checking current user and role...');
    const { data: currentUser, error: userError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT current_user, current_role, session_user`
      });

    if (userError) {
      console.log('❌ Error checking current user:', userError);
    } else {
      console.log('📋 Current user info:', currentUser);
    }

    // 4. Check permissions on profiles table
    console.log('\n4. Checking permissions on profiles table...');
    const { data: permissions, error: permError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT grantee, privilege_type FROM information_schema.table_privileges WHERE table_name = 'profiles'`
      });

    if (permError) {
      console.log('❌ Error checking permissions:', permError);
    } else {
      console.log('📋 Table permissions:', permissions);
    }

    // 5. Test direct update with service role
    console.log('\n5. Testing direct update with service role...');
    
    // Create a test user first
    const testEmail = `test-rls-${Date.now()}@example.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      user_metadata: { name: 'Test User' }
    });

    if (authError) {
      console.log('❌ Error creating test user:', authError);
      return;
    }

    console.log('✅ Test user created:', authData.user.id);

    // Try direct update using Supabase client (not exec_sql)
    const { data: directUpdate, error: directError } = await supabase
      .from('profiles')
      .update({ name: 'Direct Update Test' })
      .eq('id', authData.user.id);

    if (directError) {
      console.log('❌ Direct update failed:', directError);
    } else {
      console.log('✅ Direct update succeeded:', directUpdate);
    }

    // Check the result
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', authData.user.id)
      .single();
    
    console.log('📊 Profile after direct update:', updatedProfile);

    // Cleanup
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.log('✅ Test user deleted');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkRLSPolicies();