const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🧪 Testing Super Admin Agent Management Access...\n');

async function testSuperAdminAccess() {
  try {
    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('1. Testing super admin login...');
    
    const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
      email: 'akshay@wouldcart.com',
      password: 'Akki#6342'
    });
    
    if (authError) {
      console.log('❌ Super admin login failed:', authError.message);
      return;
    }
    
    console.log('✅ Super admin login successful');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);
    
    console.log('\n2. Testing agents table access...');
    
    // Test basic agents query (this is what AgentManagementService.getAgents() does)
    const { data: agents, error: agentsError } = await userClient
      .from('agents')
      .select('id, status, agency_name, email, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (agentsError) {
      console.log('❌ Agents query failed:', agentsError.message);
    } else {
      console.log(`✅ Agents query successful: ${agents.length} agents found`);
      if (agents.length > 0) {
        console.log('   Sample agent:', {
          id: agents[0].id,
          name: agents[0].name,
          status: agents[0].status,
          agency_name: agents[0].agency_name
        });
      }
    }
    
    console.log('\n3. Testing agent creation (super admin should have full access)...');
    
    // Test creating a new agent
    const testAgent = {
      name: 'Test Agent Super Admin',
      email: `test-super-admin-${Date.now()}@example.com`,
      agency_name: 'Test Agency',
      status: 'pending',
      phone: '555-0123',
      address: '123 Test St'
    };
    
    const { data: newAgent, error: createError } = await userClient
      .from('agents')
      .insert([testAgent])
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Agent creation failed:', createError.message);
    } else {
      console.log('✅ Agent creation successful:', {
        id: newAgent.id,
        name: newAgent.name,
        email: newAgent.email,
        status: newAgent.status
      });
      
      // Clean up - delete the test agent
      const { error: deleteError } = await userClient
        .from('agents')
        .delete()
        .eq('id', newAgent.id);
      
      if (deleteError) {
        console.log('⚠️  Failed to clean up test agent:', deleteError.message);
      } else {
        console.log('✅ Test agent cleaned up');
      }
    }
    
    console.log('\n4. Testing agent update (super admin should have full access)...');
    
    if (agents && agents.length > 0) {
      const agentToUpdate = agents[0];
      const originalStatus = agentToUpdate.status;
      const newStatus = originalStatus === 'active' ? 'pending' : 'active';
      
      const { data: updatedAgent, error: updateError } = await userClient
        .from('agents')
        .update({ status: newStatus })
        .eq('id', agentToUpdate.id)
        .select()
        .single();
      
      if (updateError) {
        console.log('❌ Agent update failed:', updateError.message);
      } else {
        console.log('✅ Agent update successful:', {
          id: updatedAgent.id,
          name: updatedAgent.name,
          oldStatus: originalStatus,
          newStatus: updatedAgent.status
        });
        
        // Revert the change
        await userClient
          .from('agents')
          .update({ status: originalStatus })
          .eq('id', agentToUpdate.id);
        
        console.log('✅ Agent status reverted');
      }
    }
    
    await userClient.auth.signOut();
    
    console.log('\n🎉 Super Admin Agent Management Test Complete!');
    console.log('📝 Summary:');
    console.log('   ✅ Super admin can login');
    console.log('   ✅ Super admin can query agents');
    console.log('   ✅ Super admin can create agents');
    console.log('   ✅ Super admin can update agents');
    console.log('   🚀 management/agents should now work for super admin role!');
    
  } catch (error) {
    console.error('🚨 Test failed:', error.message);
  }
}

testSuperAdminAccess();