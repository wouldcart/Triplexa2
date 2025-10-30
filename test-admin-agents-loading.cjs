require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminAgentsLoading() {
  try {
    console.log('🧪 Testing agents loading with admin client (should bypass RLS)...');
    
    // Test 1: Load agents with admin client
    console.log('📋 Test 1: Admin agents query...');
    const { data: agentsData, error: agentsError } = await adminSupabase
      .from('agents')
      .select('id,status,created_at,updated_at,created_by,source_type,source_details,agency_name')
      .order('created_at', { ascending: false });
    
    if (agentsError) {
      console.log('❌ Admin agents query failed:', agentsError.message);
    } else {
      console.log(`✅ Admin agents query successful, found ${agentsData?.length || 0} agents`);
      if (agentsData && agentsData.length > 0) {
        console.log('📄 Sample agent:', JSON.stringify(agentsData[0], null, 2));
      }
    }
    
    // Test 2: Load profiles with admin client
    console.log('📋 Test 2: Admin profiles query...');
    const { data: profilesData, error: profilesError } = await adminSupabase
      .from('profiles')
      .select('id,name,email,role')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Admin profiles query failed:', profilesError.message);
      if (profilesError.message.includes('infinite recursion')) {
        console.log('🚨 RLS infinite recursion still affects admin client!');
      }
    } else {
      console.log(`✅ Admin profiles query successful, found ${profilesData?.length || 0} profiles`);
      if (profilesData && profilesData.length > 0) {
        console.log('📄 Sample profile:', JSON.stringify(profilesData[0], null, 2));
      }
    }
    
    // Test 3: Test the exact query pattern from AgentManagementService
    console.log('📋 Test 3: Simulating full agent-profile join...');
    if (agentsData && agentsData.length > 0 && profilesData && profilesData.length > 0) {
      // Simulate the merging logic
      const mergedAgents = agentsData.map(agent => {
        const profile = profilesData.find(p => p.id === agent.id);
        return {
          ...agent,
          name: profile?.name || 'Unknown',
          email: profile?.email || 'unknown@example.com',
          role: profile?.role || 'agent'
        };
      });
      
      console.log(`✅ Successfully merged ${mergedAgents.length} agents with profile data`);
      console.log('📄 Sample merged agent:', JSON.stringify(mergedAgents[0], null, 2));
    } else {
      console.log('ℹ️ No data to merge (empty agents or profiles)');
    }
    
    console.log('🎉 Admin test completed!');
    
  } catch (error) {
    console.error('❌ Admin test error:', error.message);
  }
}

testAdminAgentsLoading();