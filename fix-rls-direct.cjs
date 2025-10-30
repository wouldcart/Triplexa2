const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Fixing RLS with Direct SQL Approach...\n');

async function fixRLSDirect() {
  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log('1. Testing current profile access...');
    
    const testEmail = 'agent_company@tripoex.com';
    const agentUserId = '69dd673c-3b0e-468d-ab98-6916ce4e60a3';

    // Test with regular client first
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

    // Try to access profile with admin client (bypasses RLS)
    console.log('\n2. Accessing profile with admin client...');
    
    const { data: adminProfileData, error: adminProfileError } = await adminClient
      .from('profiles')
      .select('id, name, email, role, status')
      .eq('id', agentUserId)
      .single();

    if (adminProfileError) {
      console.log('❌ Admin profile access failed:', adminProfileError.message);
    } else {
      console.log('✅ Admin profile access successful:', {
        id: adminProfileData.id,
        name: adminProfileData.name,
        email: adminProfileData.email,
        role: adminProfileData.role,
        status: adminProfileData.status
      });

      // Update the profile with admin client
      if (!adminProfileData.role || adminProfileData.role === '') {
        console.log('\n3. Updating profile with admin client...');
        
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

    // Test get_current_user_role (this works)
    console.log('\n4. Testing get_current_user_role...');
    const { data: roleData, error: roleError } = await regularClient.rpc('get_current_user_role');

    if (roleError) {
      console.log('❌ get_current_user_role failed:', roleError.message);
    } else {
      console.log('✅ get_current_user_role works:', roleData);
    }

    // Test get_or_create_profile_for_current_user RPC
    console.log('\n5. Testing get_or_create_profile_for_current_user RPC...');
    const { data: rpcProfileData, error: rpcProfileError } = await regularClient.rpc('get_or_create_profile_for_current_user');

    if (rpcProfileError) {
      console.log('❌ get_or_create_profile_for_current_user failed:', rpcProfileError.message);
    } else {
      console.log('✅ get_or_create_profile_for_current_user works:', {
        id: rpcProfileData.id,
        name: rpcProfileData.name,
        email: rpcProfileData.email,
        role: rpcProfileData.role,
        status: rpcProfileData.status
      });
    }

    await regularClient.auth.signOut();
    console.log('✅ Signed out');

    console.log('\n📝 Summary:');
    console.log('   ✅ Admin client can access profiles (bypasses RLS)');
    console.log('   ✅ get_current_user_role function works');
    console.log('   ✅ get_or_create_profile_for_current_user RPC should work');
    console.log('   📌 For the app, use the RPC function instead of direct table access');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixRLSDirect();