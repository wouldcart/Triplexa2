require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simulate the exact AgentManagementService.getAgents() logic
async function simulateGetAgents() {
  try {
    console.log('🧪 Simulating AgentManagementService.getAgents() call...');
    
    // Step 1: Create the agents query (exactly as in the service)
    let agentQuery = supabase
      .from('agents')
      .select('id,status,created_at,updated_at,created_by,source_type,source_details,agency_name')
      .order('created_at', { ascending: false });

    // Step 2: Attempt to get current user (this should work)
    let currentUserId;
    let currentRole;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id;
      console.log(`📋 Current user ID: ${currentUserId || 'anonymous'}`);
      
      // Step 3: The profiles query is now commented out, so this should be skipped
      console.log('📋 Profiles query is disabled (preventing RLS recursion)');
      
    } catch (authError) {
      console.log('⚠️ Auth error (expected for anonymous):', authError.message);
    }

    // Step 4: Execute the agents query
    console.log('📋 Executing agents query...');
    const { data: agentsCore, error: agentsError } = await agentQuery;

    if (agentsError) {
      console.log('❌ Agents query failed:', agentsError.message);
      if (agentsError.message.includes('infinite recursion')) {
        console.log('🚨 RLS infinite recursion still present in agents query!');
        return false;
      }
    } else {
      console.log(`✅ Agents query successful, found ${agentsCore?.length || 0} agents`);
      
      if (agentsCore && agentsCore.length > 0) {
        console.log('📄 Sample agent data:');
        console.log(JSON.stringify(agentsCore[0], null, 2));
      }
      
      // Step 5: Simulate the profile merging logic (this would normally join with profiles)
      console.log('📋 Profile merging would happen here (currently disabled due to RLS)');
      
      return true;
    }
    
  } catch (error) {
    console.error('❌ Simulation error:', error.message);
    return false;
  }
}

async function runTest() {
  console.log('🚀 Starting AgentManagementService.getAgents() simulation test...');
  
  const success = await simulateGetAgents();
  
  if (success) {
    console.log('🎉 SUCCESS: AgentManagementService.getAgents() simulation completed without RLS recursion!');
    console.log('✅ The infinite recursion error should now be resolved in the application.');
  } else {
    console.log('❌ FAILED: RLS recursion issue still exists.');
  }
}

runTest();