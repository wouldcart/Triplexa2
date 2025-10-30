const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Super Admin Agent Management Access...\n');

async function testSuperAdminAgentAccess() {
  try {
    // Test with admin client (service role)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('1. Testing Admin Client Agent Access:');
    
    // Test agents table access
    const { data: agents, error: agentsError } = await adminClient
      .from('agents')
      .select('id, status, created_at, agency_name')
      .limit(5);
    
    if (agentsError) {
      console.log('❌ Admin agents query failed:', agentsError.message);
    } else {
      console.log(`✅ Admin found ${agents?.length || 0} agents`);
      if (agents && agents.length > 0) {
        console.log('   Sample agent:', agents[0]);
      }
    }
    
    // Test profiles table access
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('id, name, email, role')
      .eq('role', 'super_admin')
      .limit(3);
    
    if (profilesError) {
      console.log('❌ Admin profiles query failed:', profilesError.message);
    } else {
      console.log(`✅ Admin found ${profiles?.length || 0} super admin profiles`);
      if (profiles && profiles.length > 0) {
        console.log('   Sample super admin:', profiles[0]);
      }
    }
    
    console.log('\n2. Testing Super Admin User Authentication:');
    
    // Test super admin login
    const superAdminEmail = 'akshay@wouldcart.com';
    const superAdminPassword = 'Akki#6342';
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
      email: superAdminEmail,
      password: superAdminPassword
    });
    
    if (authError) {
      console.log('❌ Super admin login failed:', authError.message);
      return;
    }
    
    console.log('✅ Super admin login successful');
    console.log('   User ID:', authData.user?.id);
    console.log('   Email:', authData.user?.email);
    
    // Test authenticated user's profile
    const { data: userProfile, error: profileError } = await userClient
      .from('profiles')
      .select('id, name, email, role, department')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ User profile query failed:', profileError.message);
    } else {
      console.log('✅ User profile retrieved:');
      console.log('   Name:', userProfile.name);
      console.log('   Role:', userProfile.role);
      console.log('   Department:', userProfile.department);
    }
    
    console.log('\n3. Testing Super Admin Agent Management Access:');
    
    // Test if super admin can access agents
    const { data: userAgents, error: userAgentsError } = await userClient
      .from('agents')
      .select('id, status, created_at, agency_name')
      .limit(5);
    
    if (userAgentsError) {
      console.log('❌ Super admin agents query failed:', userAgentsError.message);
      console.log('   This indicates RLS is blocking super admin access');
    } else {
      console.log(`✅ Super admin can access ${userAgents?.length || 0} agents`);
    }
    
    // Test RLS policies by checking if super admin can see all agents
    const { data: allUserAgents, error: allAgentsError } = await userClient
      .from('agents')
      .select('id, status, agency_name');
    
    if (allAgentsError) {
      console.log('❌ Super admin cannot access all agents:', allAgentsError.message);
    } else {
      console.log(`✅ Super admin can access ${allUserAgents?.length || 0} total agents`);
    }
    
    console.log('\n4. Testing Agent Creation Access:');
    
    // Test if super admin can create agents
    const testAgentData = {
      status: 'inactive',
      agency_name: 'Test Agency for Super Admin',
      source_type: 'admin_created'
    };
    
    const { data: newAgent, error: createError } = await userClient
      .from('agents')
      .insert([testAgentData])
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Super admin cannot create agents:', createError.message);
    } else {
      console.log('✅ Super admin can create agents');
      console.log('   Created agent ID:', newAgent.id);
      
      // Clean up test agent
      await userClient.from('agents').delete().eq('id', newAgent.id);
      console.log('   Test agent cleaned up');
    }
    
    // Sign out
    await userClient.auth.signOut();
    console.log('\n✅ Test completed - Super admin signed out');
    
  } catch (error) {
    console.error('🚨 Test failed with error:', error.message);
  }
}

testSuperAdminAgentAccess();