const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createTestUser() {
  console.log('🔧 Creating test user for login testing...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  const testEmail = 'testuser@example.com';
  const testPassword = 'TestPassword123!';
  
  try {
    // First, check if user already exists
    console.log('🔍 Checking if test user already exists...');
    const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(user => user.email === testEmail);
    
    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.id);
      
      // Try to update the password
      console.log('🔄 Updating password for existing user...');
      const { data: updateData, error: updateError } = await adminSupabase.auth.admin.updateUserById(
        existingUser.id,
        { password: testPassword }
      );
      
      if (updateError) {
        console.error('❌ Error updating password:', updateError);
      } else {
        console.log('✅ Password updated successfully');
      }
      
      return existingUser.id;
    }
    
    // Create new user
    console.log('👤 Creating new test user...');
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Test User',
        role: 'agent'
      }
    });
    
    if (authError) {
      console.error('❌ Error creating user:', JSON.stringify(authError, null, 2));
      return null;
    }
    
    console.log('✅ User created successfully:', authData.user.id);
    
    // Create profile record
    console.log('📝 Creating profile record...');
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: 'Test User',
        email: testEmail,
        role: 'agent',
        status: 'active',
        company_name: 'Test Company',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
    } else {
      console.log('✅ Profile created successfully');
    }
    
    // Create agent record
    console.log('🏢 Creating agent record...');
    const { data: agentData, error: agentError } = await adminSupabase
      .from('agents')
      .insert({
        id: `agent_${Date.now()}`,
        user_id: authData.user.id,
        name: 'Test User',
        email: testEmail,
        agency_name: 'Test Company',
        status: 'active',
        commission_structure: {
          type: 'percentage',
          value: 10,
          currency: 'USD'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (agentError) {
      console.error('❌ Error creating agent record:', agentError);
    } else {
      console.log('✅ Agent record created successfully');
    }
    
    console.log('\n🎉 Test user setup complete!');
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);
    console.log(`🆔 User ID: ${authData.user.id}`);
    
    return authData.user.id;
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    return null;
  }
}

createTestUser();