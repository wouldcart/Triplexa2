require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseAnonKey || !supabaseServiceKey) {
  console.log('❌ Supabase keys not found in environment');
  process.exit(1);
}

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthFlow() {
  try {
    console.log('🧪 Testing complete authentication and profile access flow...');
    
    // Test 1: Check if we can access public data without authentication
    console.log('📋 Test 1: Public data access (no auth required)...');
    const { data: publicAgents, error: publicError } = await supabaseAnon
      .from('agents')
      .select('id,status,created_at')
      .limit(1);
    
    if (publicError) {
      console.log('❌ Public agents access failed:', publicError.message);
    } else {
      console.log('✅ Public agents access successful');
    }
    
    // Test 2: Check profiles table access with admin client
    console.log('📋 Test 2: Profiles access with admin client...');
    const { data: adminProfiles, error: adminProfilesError } = await supabaseAdmin
      .from('profiles')
      .select('id,name,email,role')
      .limit(3);
    
    if (adminProfilesError) {
      console.log('❌ Admin profiles access failed:', adminProfilesError.message);
    } else {
      console.log('✅ Admin profiles access successful, found', adminProfiles?.length || 0, 'profiles');
      if (adminProfiles && adminProfiles.length > 0) {
        console.log('📄 Sample profile roles:', adminProfiles.map(p => ({ id: p.id, role: p.role })));
      }
    }
    
    // Test 3: Check if RLS policies are working (should restrict anon access to profiles)
    console.log('📋 Test 3: RLS policy test (anon client accessing profiles)...');
    const { data: anonProfiles, error: anonProfilesError } = await supabaseAnon
      .from('profiles')
      .select('id,name,email')
      .limit(1);
    
    if (anonProfilesError) {
      console.log('⚠️ Anon profiles access restricted (this is expected):', anonProfilesError.message);
    } else {
      console.log('✅ Anon profiles access allowed, found', anonProfiles?.length || 0, 'profiles');
    }
    
    // Test 4: Test agent management service equivalent queries
    console.log('📋 Test 4: AgentManagementService equivalent queries...');
    
    // Test getAgents equivalent
    const { data: serviceAgents, error: serviceAgentsError } = await supabaseAdmin
      .from('agents')
      .select('id,status,created_at,updated_at,created_by,source_type,source_details,agency_name')
      .limit(5);
    
    if (serviceAgentsError) {
      console.log('❌ Service agents query failed:', serviceAgentsError.message);
    } else {
      console.log('✅ Service agents query successful, found', serviceAgents?.length || 0, 'agents');
    }
    
    // Test getAgentById equivalent
    if (serviceAgents && serviceAgents.length > 0) {
      const testAgentId = serviceAgents[0].id;
      console.log('📋 Test 5: getAgentById equivalent for agent:', testAgentId);
      
      const { data: singleAgent, error: singleAgentError } = await supabaseAdmin
        .from('agents')
        .select('id,status,created_at,updated_at,created_by,source_type,source_details,agency_name,name,email')
        .eq('id', testAgentId)
        .maybeSingle();
      
      if (singleAgentError) {
        console.log('❌ Single agent query failed:', singleAgentError.message);
      } else {
        console.log('✅ Single agent query successful');
        console.log('📄 Agent data:', JSON.stringify(singleAgent, null, 2));
      }
    }
    
    // Test 6: Check staff members access
    console.log('📋 Test 6: Staff members access...');
    const { data: staffMembers, error: staffError } = await supabaseAdmin
      .from('profiles')
      .select('id,name,email,role,department,phone')
      .in('role', ['admin', 'staff'])
      .limit(3);
    
    if (staffError) {
      console.log('❌ Staff members query failed:', staffError.message);
    } else {
      console.log('✅ Staff members query successful, found', staffMembers?.length || 0, 'staff');
    }
    
    console.log('🎉 Authentication and profile access flow test completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

testAuthFlow();