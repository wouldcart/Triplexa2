require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Create both admin and regular clients
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const regularClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testMetadataExtractionFlow() {
  console.log('🧪 Testing Complete Metadata Extraction Flow\n');
  
  const testEmail = `metadata-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testMetadata = {
    name: 'John Test Agent',
    role: 'agent',
    phone: '+1-555-0123',
    company_name: 'Test Travel Agency',
    department: 'Agents',
    position: 'External Agent',
    city: 'New York',
    country: 'USA',
    business_type: 'Travel Agency',
    specialization: 'Luxury Travel'
  };

  try {
    // Step 1: Test user creation with metadata using admin client (bypasses email confirmation)
    console.log('1️⃣ Creating user with metadata using admin client...');
    const { data: signupData, error: signupError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: testMetadata
    });

    if (signupError) {
      console.log('   ❌ User creation failed:', signupError.message);
      return;
    }

    console.log('   ✅ User creation successful');
    console.log('   👤 User ID:', signupData.user?.id);
    console.log('   📧 Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No');

    const userId = signupData.user?.id;
    if (!userId) {
      console.log('   ❌ No user ID returned');
      return;
    }

    // Step 1b: Also test regular signup to see the difference
    console.log('\n1️⃣b Testing regular signup with raw_user_meta_data...');
    const testEmail2 = `metadata-test2-${Date.now()}@example.com`;
    
    // Create user with raw_user_meta_data by using admin.createUser with different approach
    const { data: rawUserData, error: rawUserError } = await adminClient.auth.admin.createUser({
      email: testEmail2,
      password: testPassword,
      email_confirm: true,
      // This simulates what happens when using regular signUp - data goes to raw_user_meta_data
      raw_user_meta_data: testMetadata
    });

    if (rawUserError) {
      console.log('   ❌ Raw user creation failed:', rawUserError.message);
    } else {
      console.log('   ✅ Raw user creation successful');
      console.log('   👤 Raw User ID:', rawUserData.user?.id);
    }

    // Step 2: Check raw_user_meta_data in auth.users table
    console.log('\n2️⃣ Checking raw_user_meta_data in auth.users...');
    const { data: authUser, error: authUserError } = await adminClient
      .from('auth.users')
      .select('id, email, raw_user_meta_data, user_metadata')
      .eq('id', userId)
      .single();

    if (authUserError) {
      console.log('   ❌ Failed to fetch auth user:', authUserError.message);
    } else {
      console.log('   ✅ Auth user found');
      console.log('   📝 raw_user_meta_data:', JSON.stringify(authUser.raw_user_meta_data, null, 2));
      console.log('   📝 user_metadata:', JSON.stringify(authUser.user_metadata, null, 2));
    }

    // Step 3: Wait a moment for trigger to process
    console.log('\n3️⃣ Waiting for trigger to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Check if profile was created by trigger
    console.log('\n4️⃣ Checking if profile was created by trigger...');
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.log('   ❌ Profile not found:', profileError.message);
    } else {
      console.log('   ✅ Profile created by trigger');
      console.log('   📝 Profile data:');
      console.log('      Name:', profile.name);
      console.log('      Phone:', profile.phone);
      console.log('      Company:', profile.company_name);
      console.log('      Role:', profile.role);
      console.log('      Department:', profile.department);
      console.log('      City:', profile.city);
      console.log('      Country:', profile.country);
    }

    // Step 5: Test get_or_create_profile_for_current_user function directly
    console.log('\n5️⃣ Testing get_or_create_profile_for_current_user function...');
    
    // First, sign in to get a session
    const { data: signinData, error: signinError } = await regularClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signinError) {
      console.log('   ❌ Signin failed:', signinError.message);
    } else {
      console.log('   ✅ Signin successful');
      
      // Now test the RPC function
      const { data: rpcResult, error: rpcError } = await regularClient
        .rpc('get_or_create_profile_for_current_user');

      if (rpcError) {
        console.log('   ❌ RPC function failed:', rpcError.message);
      } else {
        console.log('   ✅ RPC function successful');
        console.log('   📝 RPC result:');
        console.log('      Name:', rpcResult.name);
        console.log('      Phone:', rpcResult.phone);
        console.log('      Company:', rpcResult.company_name);
        console.log('      Role:', rpcResult.role);
        console.log('      Department:', rpcResult.department);
        console.log('      City:', rpcResult.city);
        console.log('      Country:', rpcResult.country);
      }
    }

    // Step 6: Test metadata extraction priority (raw_user_meta_data vs user_metadata)
    console.log('\n6️⃣ Testing metadata extraction priority...');
    
    // Update user_metadata to have different values
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        name: 'Updated Name from user_metadata',
        company_name: 'Updated Company from user_metadata',
        phone: '+1-999-9999'
      }
    });

    if (updateError) {
      console.log('   ❌ Failed to update user_metadata:', updateError.message);
    } else {
      console.log('   ✅ Updated user_metadata with different values');
      
      // Test the function again to see which metadata takes priority
      const { data: priorityResult, error: priorityError } = await regularClient
        .rpc('get_or_create_profile_for_current_user');

      if (priorityError) {
        console.log('   ❌ Priority test failed:', priorityError.message);
      } else {
        console.log('   ✅ Priority test successful');
        console.log('   📝 Which metadata was used:');
        console.log('      Name:', priorityResult.name, '(should prioritize raw_user_meta_data)');
        console.log('      Company:', priorityResult.company_name, '(should prioritize raw_user_meta_data)');
        console.log('      Phone:', priorityResult.phone, '(should prioritize raw_user_meta_data)');
      }
    }

    // Step 7: Test with the raw_user_meta_data user as well
    console.log('\n7️⃣ Testing raw_user_meta_data user...');
    const rawUserId = rawUserData?.user?.id;
    if (rawUserId) {
      // Check raw_user_meta_data for second user
      const { data: rawAuthUser, error: rawAuthUserError } = await adminClient
        .from('auth.users')
        .select('id, email, raw_user_meta_data, user_metadata')
        .eq('id', rawUserId)
        .single();

      if (rawAuthUserError) {
        console.log('   ❌ Failed to fetch raw auth user:', rawAuthUserError.message);
      } else {
        console.log('   ✅ Raw auth user found');
        console.log('   📝 raw_user_meta_data:', JSON.stringify(rawAuthUser.raw_user_meta_data, null, 2));
        console.log('   📝 user_metadata:', JSON.stringify(rawAuthUser.user_metadata, null, 2));
      }

      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check profile creation for raw user
      const { data: rawProfile, error: rawProfileError } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', rawUserId)
        .single();

      if (rawProfileError) {
        console.log('   ❌ Raw user profile not found:', rawProfileError.message);
      } else {
        console.log('   ✅ Raw user profile created by trigger');
        console.log('   📝 Raw user profile data:');
        console.log('      Name:', rawProfile.name);
        console.log('      Phone:', rawProfile.phone);
        console.log('      Company:', rawProfile.company_name);
      }
    }

    // Step 8: Cleanup
    console.log('\n8️⃣ Cleaning up test data...');
    await adminClient.auth.admin.deleteUser(userId);
    console.log('   ✅ Test user 1 deleted');
    
    if (rawUserId) {
      await adminClient.auth.admin.deleteUser(rawUserId);
      console.log('   ✅ Test user 2 deleted');
    }

    console.log('\n🎉 Metadata extraction flow test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testMetadataExtractionFlow().catch(console.error);