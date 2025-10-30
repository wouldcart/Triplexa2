const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Fixing Agent Account...\n');

async function fixAgentAccount() {
  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const testEmail = 'agent_company@tripoex.com';
    const testPassword = 'agent123';

    console.log('1. Finding the agent user...');
    
    // Get the user by email using admin client
    const { data: users, error: getUserError } = await adminClient.auth.admin.listUsers();
    
    if (getUserError) {
      console.log('❌ Cannot list users:', getUserError.message);
      return;
    }

    const agentUser = users.users.find(user => user.email === testEmail);
    
    if (!agentUser) {
      console.log('❌ Agent user not found');
      return;
    }

    console.log('✅ Found agent user:', agentUser.id);
    console.log('   Email confirmed:', !!agentUser.email_confirmed_at);

    // Confirm email if not confirmed
    if (!agentUser.email_confirmed_at) {
      console.log('\n2. Confirming email...');
      const { error: confirmError } = await adminClient.auth.admin.updateUserById(
        agentUser.id,
        { email_confirm: true }
      );

      if (confirmError) {
        console.log('❌ Email confirmation failed:', confirmError.message);
      } else {
        console.log('✅ Email confirmed successfully');
      }
    }

    // Create profile
    console.log('\n3. Creating profile...');
    const { data: existingProfile, error: checkProfileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', agentUser.id)
      .single();

    if (checkProfileError && checkProfileError.code !== 'PGRST116') {
      console.log('❌ Error checking existing profile:', checkProfileError.message);
    } else if (existingProfile) {
      console.log('✅ Profile already exists:', {
        id: existingProfile.id,
        name: existingProfile.name,
        email: existingProfile.email,
        role: existingProfile.role
      });
    } else {
      console.log('   Creating new profile...');
      const { data: newProfile, error: createProfileError } = await adminClient
        .from('profiles')
        .insert({
          id: agentUser.id,
          name: 'Dream Tours Agency',
          email: testEmail,
          phone: '+1-555-0040',
          company_name: 'Dream Tours Agency',
          role: 'agent',
          status: 'active',
          department: 'External',
          position: 'Travel Agent',
          work_location: 'Remote',
          employee_id: 'AGT001',
          join_date: '2023-05-01',
          reporting_manager: 'John Manager',
          skills: ['Travel Planning', 'Customer Service', 'Destination Knowledge'],
          certifications: ['IATA', 'Travel Agent Certification'],
          permissions: ['bookings.view', 'bookings.create', 'queries.view', 'queries.create'],
          language_access: true,
          preferred_language: 'en'
        })
        .select()
        .single();

      if (createProfileError) {
        console.log('❌ Profile creation failed:', createProfileError.message);
      } else {
        console.log('✅ Profile created successfully:', {
          id: newProfile.id,
          name: newProfile.name,
          email: newProfile.email,
          role: newProfile.role
        });
      }
    }

    // Create agent record
    console.log('\n4. Creating agent record...');
    const { data: existingAgent, error: checkAgentError } = await adminClient
      .from('agents')
      .select('*')
      .eq('id', agentUser.id)
      .single();

    if (checkAgentError && checkAgentError.code !== 'PGRST116') {
      console.log('❌ Error checking existing agent:', checkAgentError.message);
    } else if (existingAgent) {
      console.log('✅ Agent record already exists:', {
        id: existingAgent.id,
        status: existingAgent.status,
        type: existingAgent.type
      });
    } else {
      console.log('   Creating new agent record...');
      const { data: newAgent, error: createAgentError } = await adminClient
        .from('agents')
        .insert({
          id: agentUser.id,
          email: testEmail,
          name: 'Dream Tours Agency',
          status: 'active',
          commission_value: 0.10,
          commission_type: 'percentage',
          type: 'company',
          phone: '+1-555-0040',
          company_name: 'Dream Tours Agency',
          address: '123 Travel Street, Tourism City, TC 12345',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createAgentError) {
        console.log('❌ Agent creation failed:', createAgentError.message);
      } else {
        console.log('✅ Agent record created successfully:', {
          id: newAgent.id,
          name: newAgent.name,
          status: newAgent.status,
          type: newAgent.type
        });
      }
    }

    console.log('\n5. Testing login now...');
    const regularClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: loginData, error: loginError } = await regularClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.log('❌ Login still failed:', loginError.message);
    } else {
      console.log('✅ Login successful!');
      console.log('   User ID:', loginData.user?.id);
      console.log('   Email:', loginData.user?.email);

      // Test profile retrieval
      console.log('\n6. Testing profile retrieval...');
      const { data: profileData, error: profileError } = await regularClient
        .from('profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single();

      if (profileError) {
        console.log('❌ Profile retrieval failed:', profileError.message);
      } else {
        console.log('✅ Profile retrieved successfully:', {
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          role: profileData.role
        });

        // Test redirect logic
        console.log('\n7. Testing redirect logic...');
        if (profileData.role === 'agent') {
          console.log('✅ Should redirect to: /dashboards/agent');
          console.log('🎉 Agent authentication flow is now working!');
        } else {
          console.log(`❌ Unexpected role: ${profileData.role}`);
        }
      }

      // Sign out
      await regularClient.auth.signOut();
      console.log('✅ Signed out successfully');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixAgentAccount();