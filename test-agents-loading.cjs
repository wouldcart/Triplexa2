require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.log('❌ VITE_SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAgentsLoading() {
  try {
    console.log('🧪 Testing agents loading functionality...');
    
    // Test 1: Check if agents table exists and can be queried
    console.log('📋 Test 1: Querying agents table with existing columns...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id,status,created_at,updated_at,created_by,source_type,source_details,agency_name,name,email')
      .limit(5);
    
    if (agentsError) {
      console.log('❌ Agents query failed:', agentsError.message);
    } else {
      console.log('✅ Agents query successful, found', agents?.length || 0, 'agents');
      if (agents && agents.length > 0) {
        console.log('📄 Sample agent:', JSON.stringify(agents[0], null, 2));
      }
    }
    
    // Test 2: Check profiles table access
    console.log('📋 Test 2: Querying profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id,name,email,phone,company_name,country,city,created_at,updated_at')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Profiles query failed:', profilesError.message);
    } else {
      console.log('✅ Profiles query successful, found', profiles?.length || 0, 'profiles');
      if (profiles && profiles.length > 0) {
        console.log('📄 Sample profile:', JSON.stringify(profiles[0], null, 2));
      }
    }
    
    // Test 3: Test the specific query that was failing
    console.log('📋 Test 3: Testing AgentManagementService.getAgents() equivalent...');
    const { data: agentsSimple, error: agentsSimpleError } = await supabase
      .from('agents')
      .select('id,status,created_at,updated_at,created_by,source_type,source_details,agency_name');
    
    if (agentsSimpleError) {
      console.log('❌ Simple agents query failed:', agentsSimpleError.message);
    } else {
      console.log('✅ Simple agents query successful, found', agentsSimple?.length || 0, 'agents');
    }
    
    console.log('🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

testAgentsLoading();