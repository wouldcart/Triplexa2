require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAuthUsersDirectly() {
  console.log('🔍 Checking auth.users data directly...\n');

  const testEmail = `check-auth-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testUserData = {
    name: 'Check Auth User',
    role: 'agent',
    department: 'Sales',
    phone: '+1234567890',
    position: 'Senior Agent',
    employee_id: 'CHECK001',
    company_name: 'Check Travel Agency',
    city: 'Los Angeles',
    country: 'United States',
    must_change_password: false
  };

  let testUserId = null;

  try {
    // Step 1: Create user with metadata
    console.log('📝 Step 1: Creating user with metadata...');
    console.log('Input metadata:', JSON.stringify(testUserData, null, 2));

    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: testUserData
    });

    if (userError) {
      console.error('❌ User creation failed:', userError);
      return;
    }

    testUserId = userData.user.id;
    console.log('✅ User created with ID:', testUserId);
    console.log('✅ User object from creation:', JSON.stringify(userData.user, null, 2));

    // Step 2: Get user data using admin API
    console.log('\n📋 Step 2: Getting user data via admin API...');
    const { data: adminUserData, error: adminUserError } = await adminSupabase.auth.admin.getUserById(testUserId);

    if (adminUserError) {
      console.error('❌ Failed to get user via admin API:', adminUserError);
    } else {
      console.log('✅ Admin API user data:', JSON.stringify(adminUserData.user, null, 2));
    }

    // Step 3: Check profile creation
    console.log('\n📋 Step 3: Checking profile creation...');
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (profileError) {
      console.error('❌ Profile check failed:', profileError);
    } else {
      console.log('✅ Profile data:', JSON.stringify(profileData, null, 2));
    }

    // Step 4: Try to manually update profile using the metadata we know exists
    console.log('\n📋 Step 4: Manually updating profile with known metadata...');
    
    const userMetadata = userData.user.user_metadata || {};
    console.log('Available user_metadata:', JSON.stringify(userMetadata, null, 2));

    const { data: updateData, error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        name: userMetadata.name || 'Unknown',
        phone: userMetadata.phone || '',
        company: userMetadata.company_name || '',
        role: userMetadata.role || 'agent',
        department: userMetadata.department || 'General',
        position: userMetadata.position || 'Agent',
        updated_at: new Date().toISOString()
      })
      .eq('id', testUserId);

    if (updateError) {
      console.error('❌ Manual profile update failed:', updateError);
    } else {
      console.log('✅ Manual profile update successful');
    }

    // Step 5: Check updated profile
    console.log('\n📋 Step 5: Checking updated profile...');
    const { data: updatedProfileData, error: updatedProfileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (updatedProfileError) {
      console.error('❌ Updated profile check failed:', updatedProfileError);
    } else {
      console.log('✅ Updated profile data:', JSON.stringify(updatedProfileData, null, 2));
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  } finally {
    // Cleanup
    if (testUserId) {
      console.log('\n🧹 Cleaning up test user...');
      await adminSupabase.from('profiles').delete().eq('id', testUserId);
      await adminSupabase.auth.admin.deleteUser(testUserId);
      console.log('✅ Test user cleaned up');
    }
  }
}

checkAuthUsersDirectly().catch(console.error);