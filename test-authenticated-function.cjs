require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create regular client for user operations
const supabaseUser = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthenticatedFunction() {
  console.log('🧪 Testing get_or_create_profile_for_current_user() with authentication...\n');

  try {
    // 1. Get existing profiles and their corresponding auth users
    console.log('1. Finding existing profiles with auth users...');
    
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, role, phone, company_name')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`✅ Found ${profiles.length} profiles`);
    
    // 2. Try to find a user we can authenticate as
    console.log('\n2. Looking for users in auth.users...');
    
    // Get users using admin API
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    console.log(`✅ Found ${authUsers.users.length} auth users`);
    
    if (authUsers.users.length === 0) {
      console.log('❌ No auth users found to test with');
      return;
    }

    // Find a user that has a profile
    let testUser = null;
    let testProfile = null;
    
    for (const user of authUsers.users) {
      const profile = profiles.find(p => p.id === user.id);
      if (profile) {
        testUser = user;
        testProfile = profile;
        break;
      }
    }

    if (!testUser) {
      console.log('❌ No user found with matching profile');
      return;
    }

    console.log('✅ Found test user with profile:');
    console.log('   User ID:', testUser.id);
    console.log('   Email:', testUser.email);
    console.log('   Profile Name:', testProfile.name);
    console.log('   Profile Role:', testProfile.role);

    // 3. Create a temporary password for the user and confirm email
    console.log('\n3. Setting up user for authentication...');
    
    const tempPassword = 'TempPassword123!';
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      testUser.id,
      { 
        password: tempPassword,
        email_confirm: true
      }
    );

    if (updateError) {
      console.error('❌ Error setting user password:', updateError);
      return;
    }

    console.log('✅ Temporary password set and email confirmed for user');

    // 4. Sign in as the user
    console.log('\n4. Signing in as test user...');
    
    const { data: signInData, error: signInError } = await supabaseUser.auth.signInWithPassword({
      email: testUser.email,
      password: tempPassword
    });

    if (signInError) {
      console.error('❌ Error signing in:', signInError);
      return;
    }

    console.log('✅ Successfully signed in');
    console.log('   Session user ID:', signInData.user.id);

    // 5. Test the function with authenticated user
    console.log('\n5. Testing function with authenticated user...');
    
    const { data: functionResult, error: functionError } = await supabaseUser
      .rpc('get_or_create_profile_for_current_user');

    if (functionError) {
      console.error('❌ Error calling function:', functionError);
    } else {
      console.log('✅ Function called successfully!');
      console.log('   Result:');
      console.log('     ID:', functionResult?.id);
      console.log('     Email:', functionResult?.email);
      console.log('     Name:', functionResult?.name);
      console.log('     Role:', functionResult?.role);
      console.log('     Department:', functionResult?.department);
      console.log('     Status:', functionResult?.status);
      console.log('     Position:', functionResult?.position);
      console.log('     Phone:', functionResult?.phone);
      console.log('     Company:', functionResult?.company_name);
    }

    // 6. Test function behavior with missing profile data
    console.log('\n6. Testing profile enrichment...');
    
    // Clear some profile fields to test enrichment
    const { error: clearError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        name: null, 
        role: null, 
        department: null,
        status: null,
        position: null
      })
      .eq('id', testUser.id);

    if (clearError) {
      console.error('❌ Error clearing profile fields:', clearError);
    } else {
      console.log('✅ Cleared some profile fields');
      
      // Call function again to see if it enriches the profile
      const { data: enrichResult, error: enrichError } = await supabaseUser
        .rpc('get_or_create_profile_for_current_user');

      if (enrichError) {
        console.error('❌ Error calling function for enrichment:', enrichError);
      } else {
        console.log('✅ Function enrichment test:');
        console.log('     Name (should be enriched):', enrichResult?.name);
        console.log('     Role (should be enriched):', enrichResult?.role);
        console.log('     Department (should be enriched):', enrichResult?.department);
        console.log('     Status (should be enriched):', enrichResult?.status);
        console.log('     Position (should be enriched):', enrichResult?.position);
      }
    }

    // 7. Sign out
    console.log('\n7. Signing out...');
    await supabaseUser.auth.signOut();
    console.log('✅ Signed out successfully');

    console.log('\n🎉 Authenticated function testing completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function main() {
  console.log('🚀 Starting authenticated profile function testing...\n');
  
  await testAuthenticatedFunction();
  
  console.log('\n✨ All done!');
}

main().catch(console.error);