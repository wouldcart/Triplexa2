const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateExistingUser() {
  console.log('🔧 Updating existing user for testing...');
  
  // Use test@example.com which has an active profile
  const targetUserId = '518bb457-94f8-43d9-9dcc-4c7238a716aa';
  const targetEmail = 'test@example.com';
  const newPassword = 'TestPassword123!';
  
  try {
    console.log(`📝 Updating password for user: ${targetEmail}`);
    
    // Update user password
    const { data: updateData, error: updateError } = await adminSupabase.auth.admin.updateUserById(
      targetUserId,
      {
        password: newPassword,
        email_confirm: true
      }
    );
    
    if (updateError) {
      console.error('❌ Password update error:', updateError);
      return;
    }
    
    console.log('✅ Password updated successfully for:', updateData.user.email);
    
    // Verify the profile exists and is active
    console.log('\n🔍 Verifying profile...');
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();
    
    if (profileError) {
      console.error('❌ Profile verification error:', profileError);
    } else {
      console.log('✅ Profile verified:', {
        id: profileData.id,
        email: profileData.email,
        status: profileData.status,
        role: profileData.role
      });
    }
    
    // Verify agent record exists
    console.log('\n🔍 Verifying agent record...');
    const { data: agentData, error: agentError } = await adminSupabase
      .from('agents')
      .select('*')
      .eq('user_id', targetUserId)
      .single();
    
    if (agentError) {
      console.error('❌ Agent verification error:', agentError);
    } else {
      console.log('✅ Agent record verified:', {
        id: agentData.id,
        user_id: agentData.user_id,
        email: agentData.email,
        status: agentData.status
      });
    }
    
    console.log('\n🎉 Test user ready!');
    console.log(`📧 Email: ${targetEmail}`);
    console.log(`🔑 Password: ${newPassword}`);
    console.log(`🆔 User ID: ${targetUserId}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

updateExistingUser();