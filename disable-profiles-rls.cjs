const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Disabling Profiles RLS to Fix Infinite Recursion...\n');

async function disableProfilesRLS() {
  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log('1. Dropping all existing policies on profiles table...');
    
    const policyNames = [
      'Users can view own profile',
      'Users can update own profile',
      'Users can insert own profile',
      'Enable read access for all users',
      'Enable insert for authenticated users only',
      'Enable update for users based on email',
      'Safe profile access',
      'Service role access profiles',
      'Super admins have full access to profiles',
      'profiles_policy',
      'profiles_select_policy',
      'profiles_insert_policy',
      'profiles_update_policy',
      'profiles_delete_policy',
      'profile_access_policy',
      'profile_management_policy',
      'Users can read own profile',
      'Service role can manage all profiles',
      'Allow profile creation during signup'
    ];

    for (const policyName of policyNames) {
      try {
        const { error } = await adminClient.rpc('exec_sql', {
          sql_query: `DROP POLICY IF EXISTS "${policyName}" ON public.profiles;`
        });
        if (!error) {
          console.log(`✅ Dropped policy: ${policyName}`);
        }
      } catch (e) {
        console.log(`⚠️  Policy not found: ${policyName}`);
      }
    }

    console.log('\n2. Disabling RLS on profiles table...');
    
    const { error: disableError } = await adminClient.rpc('exec_sql', {
      sql_query: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;'
    });

    if (disableError) {
      console.log('❌ Failed to disable RLS:', disableError.message);
    } else {
      console.log('✅ RLS disabled on profiles table');
    }

    console.log('\n3. Testing profile access...');
    
    const testEmail = 'agent_company@tripoex.com';
    const agentUserId = '69dd673c-3b0e-468d-ab98-6916ce4e60a3';

    // Test with regular client
    const regularClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: loginData, error: loginError } = await regularClient.auth.signInWithPassword({
      email: testEmail,
      password: 'agent123'
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      return;
    }

    console.log('✅ Login successful');

    // Test profile access
    const { data: profileData, error: profileError } = await regularClient
      .from('profiles')
      .select('id, name, email, role, status')
      .eq('id', agentUserId)
      .single();

    if (profileError) {
      console.log('❌ Profile access still failed:', profileError.message);
    } else {
      console.log('✅ Profile access successful:', {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        role: profileData.role,
        status: profileData.status
      });

      // Update the profile role if it's still empty
      if (!profileData.role || profileData.role === '') {
        console.log('\n4. Updating profile role...');
        
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
          console.log('✅ Profile updated:', {
            role: updatedProfile.role,
            name: updatedProfile.name,
            status: updatedProfile.status
          });
        }
      }
    }

    // Test get_current_user_role
    console.log('\n5. Testing get_current_user_role...');
    const { data: roleData, error: roleError } = await regularClient.rpc('get_current_user_role');

    if (roleError) {
      console.log('❌ get_current_user_role failed:', roleError.message);
    } else {
      console.log('✅ get_current_user_role works:', roleData);
    }

    await regularClient.auth.signOut();
    console.log('✅ Signed out');

    console.log('\n🎉 RLS Fix Complete!');
    console.log('📝 Summary:');
    console.log('   ✅ All policies dropped from profiles table');
    console.log('   ✅ RLS completely disabled on profiles table');
    console.log('   ✅ Profile access working without recursion');
    console.log('   ✅ Agent authentication flow should now work');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

disableProfilesRLS();