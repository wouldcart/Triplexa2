require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAgentsLoading() {
  try {
    console.log('🧪 Testing agents loading after RLS recursion fix...');
    
    // Test 1: Direct agents query (what AgentManagementService.getAgents() does)
    console.log('📋 Test 1: Direct agents table query...');
    const { data: agentsData, error: agentsError } = await supabase
      .from('agents')
      .select('id,status,created_at,updated_at,created_by,source_type,source_details,agency_name')
      .order('created_at', { ascending: false });
    
    if (agentsError) {
      console.log('❌ Agents query failed:', agentsError.message);
      if (agentsError.message.includes('infinite recursion')) {
        console.log('🚨 RLS infinite recursion still present!');
      }
    } else {
      console.log(`✅ Agents query successful, found ${agentsData?.length || 0} agents`);
      if (agentsData && agentsData.length > 0) {
        console.log('📄 Sample agent:', JSON.stringify(agentsData[0], null, 2));
      }
    }
    
    // Test 2: Test auth.getUser() (should work)
    console.log('📋 Test 2: Auth user check...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.log('❌ Auth user check failed:', userError.message);
    } else {
      console.log(`✅ Auth user check successful, user ID: ${user?.id || 'anonymous'}`);
    }
    
    // Test 3: Profiles query (should still fail but won't block agents loading)
    console.log('📋 Test 3: Profiles table query (expected to fail)...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id,role')
      .limit(1);
    
    if (profilesError) {
      console.log('⚠️ Profiles query failed (expected):', profilesError.message);
      if (profilesError.message.includes('infinite recursion')) {
        console.log('ℹ️ RLS infinite recursion confirmed on profiles table');
      }
    } else {
      console.log('✅ Profiles query unexpectedly succeeded');
    }
    
    console.log('🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testAgentsLoading();