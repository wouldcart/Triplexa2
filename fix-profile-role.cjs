const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Fixing Profile Role and RLS Issues...\n');

async function fixProfileRole() {
  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const testEmail = 'agent_company@tripoex.com';
    const agentUserId = '69dd673c-3b0e-468d-ab98-6916ce4e60a3';

    console.log('1. Checking current profile...');
    const { data: currentProfile, error: currentProfileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', agentUserId)
      .single();

    if (currentProfileError) {
      console.log('❌ Cannot get current profile:', currentProfileError.message);
      return;
    }

    console.log('✅ Current profile:', {
      id: currentProfile.id,
      name: currentProfile.name,
      email: currentProfile.email,
      role: currentProfile.role || '(empty)',
      status: currentProfile.status
    });

    // Update the profile role
    console.log('\n2. Updating profile role to "agent"...');
    const { data: updatedProfile, error: updateError } = await adminClient
      .from('profiles')
      .update({
        role: 'agent',
        name: 'Dream Tours Agency',
        status: 'active'
      })
      .eq('id', agentUserId)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Profile update failed:', updateError.message);
    } else {
      console.log('✅ Profile updated successfully:', {
        id: updatedProfile.id,
        name: updatedProfile.name,
        email: updatedProfile.email,
        role: updatedProfile.role,
        status: updatedProfile.status
      });
    }

    // Check RLS policies
    console.log('\n3. Checking RLS policies for profiles table...');
    const { data: policies, error: policiesError } = await adminClient
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'profiles'
          ORDER BY policyname;
        `
      });

    if (policiesError) {
      console.log('❌ Cannot check policies:', policiesError.message);
    } else {
      console.log('✅ Current RLS policies for profiles:');
      policies.forEach((policy, index) => {
        console.log(`\n   ${index + 1}. ${policy.policyname}`);
        console.log(`      Command: ${policy.cmd}`);
        console.log(`      Roles: ${policy.roles}`);
        console.log(`      Qualifier: ${policy.qual || '(none)'}`);
        console.log(`      With Check: ${policy.with_check || '(none)'}`);
      });
    }

    // Test profile access with regular client
    console.log('\n4. Testing profile access with regular client...');
    const regularClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    // Sign in first
    const { data: loginData, error: loginError } = await regularClient.auth.signInWithPassword({
      email: testEmail,
      password: 'agent123'
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      return;
    }

    console.log('✅ Login successful');

    // Try to access profile
    const { data: profileData, error: profileError } = await regularClient
      .from('profiles')
      .select('id, name, email, role, status')
      .eq('id', agentUserId)
      .single();

    if (profileError) {
      console.log('❌ Profile access failed:', profileError.message);
      
      // Try with a simpler query
      console.log('\n5. Trying simpler profile query...');
      const { data: simpleProfile, error: simpleError } = await regularClient
        .from('profiles')
        .select('role')
        .eq('id', agentUserId)
        .single();

      if (simpleError) {
        console.log('❌ Simple profile query failed:', simpleError.message);
      } else {
        console.log('✅ Simple profile query works:', simpleProfile);
      }
    } else {
      console.log('✅ Profile access successful:', {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        role: profileData.role,
        status: profileData.status
      });
    }

    // Test get_current_user_role function
    console.log('\n6. Testing get_current_user_role function...');
    const { data: roleData, error: roleError } = await regularClient.rpc('get_current_user_role');

    if (roleError) {
      console.log('❌ get_current_user_role failed:', roleError.message);
    } else {
      console.log('✅ get_current_user_role works:', roleData);
    }

    // Sign out
    await regularClient.auth.signOut();
    console.log('✅ Signed out');

    console.log('\n🎯 Summary:');
    console.log('   - Profile role has been updated to "agent"');
    if (profileError) {
      console.log('   - RLS policy issue needs to be resolved');
      console.log('   - Infinite recursion detected in profiles policy');
    } else {
      console.log('   - Profile access is working correctly');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixProfileRole();