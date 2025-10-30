const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzofytokwszfwiupsdvi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNTM0MTEsImV4cCI6MjA3MzkyOTQxMX0.FnTL4m0EmxzlNSRfCD12Gc1_PUpOI4rHvaRemr46CiQ';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM1MzQxMSwiZXhwIjoyMDczOTI5NDExfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testFrontendSignupFlow() {
  console.log('🧪 Testing Frontend Agent Signup Flow');
  console.log('=====================================\n');

  const testEmail = `frontend-test-${Date.now()}@example.com`;
  const testPassword = 'FrontendTest#123';
  
  // Simulate the exact form data from AgentSignup component
  const formData = {
    name: 'Frontend Test Agent',
    email: testEmail,
    phone: '+1-555-0199',
    company_name: 'Frontend Test Company',
    business_type: 'Travel Agency',
    specialization: 'Leisure Travel',
    address: '123 Test Street',
    city: 'Test City',
    country: 'United States',
    password: testPassword,
    confirm_password: testPassword,
  };

  console.log('📝 Test Data:');
  console.log(`   Email: ${formData.email}`);
  console.log(`   Name: ${formData.name}`);
  console.log(`   Company: ${formData.company_name}`);
  console.log(`   Phone: ${formData.phone}`);
  console.log(`   City: ${formData.city}`);
  console.log(`   Country: ${formData.country}`);

  try {
    // Step 1: Test AuthService.signUp equivalent
    console.log('\n1️⃣ Testing AuthService.signUp equivalent...');
    
    // This simulates the exact call made by AuthService.signUp
    const { data: authResponse, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
          role: 'agent',
          department: 'Agents',
          phone: formData.phone,
          position: 'External Agent',
          business_address: formData.address,
          city: formData.city,
          country: formData.country,
          business_type: formData.business_type,
          specialization: formData.specialization,
          company_name: formData.company_name,
          source_type: 'organic',
          source_details: 'direct_signup',
        },
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
      }
    });

    if (authError) {
      console.log(`   ❌ Auth signup failed: ${authError.message}`);
      
      // Check if it's the email confirmation issue
      if (authError.message.includes('confirmation') || authError.message.includes('email')) {
        console.log('   📧 Email confirmation issue detected');
        console.log('   💡 This is expected if email confirmation is enabled');
        console.log('   🔧 To test without email confirmation, disable it in Supabase dashboard');
      }
      return;
    }

    console.log('   ✅ Auth signup successful');
    console.log(`   👤 User ID: ${authResponse.user?.id}`);
    console.log(`   📧 Email confirmed: ${authResponse.user?.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   📝 User metadata:`, JSON.stringify(authResponse.user?.user_metadata, null, 2));

    const userId = authResponse.user?.id;
    if (!userId) {
      console.log('   ❌ No user ID returned from auth signup');
      return;
    }

    // Step 2: Check if trigger created profile
    console.log('\n2️⃣ Checking if trigger created profile...');
    
    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.log(`   ❌ Profile not found: ${profileError.message}`);
    } else {
      console.log('   ✅ Profile created by trigger');
      console.log(`   📝 Profile data:`, {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        company_name: profileData.company_name,
        role: profileData.role,
        city: profileData.city,
        country: profileData.country
      });
    }

    // Step 3: Test AgentManagementService.signupAgent equivalent
    console.log('\n3️⃣ Testing AgentManagementService.signupAgent equivalent...');
    
    // Simulate the exact data passed to signupAgent
    const signupRequest = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company_name: formData.company_name,
      password: formData.password,
      source_type: 'organic',
      source_details: 'direct_signup'
    };

    const additionalAgentData = {
      business_address: formData.address,
      city: formData.city,
      country: formData.country,
      type: formData.business_type,
      specializations: [formData.specialization]
    };

    const finalSignupData = {
      ...signupRequest,
      ...additionalAgentData
    };

    console.log(`   🔍 Final signup data company_name: "${finalSignupData.company_name}"`);

    // Test admin client path (should work if email confirmation is disabled)
    console.log('\n   🔧 Testing Admin Client Path...');
    
    // Profile upsert
    const { data: profileUpsert, error: profileUpsertError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: userId,
        name: finalSignupData.name,
        email: finalSignupData.email,
        phone: finalSignupData.phone,
        company_name: finalSignupData.company_name,
        role: 'agent',
        city: finalSignupData.city,
        country: finalSignupData.country,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (profileUpsertError) {
      console.log(`   ❌ Profile upsert failed: ${profileUpsertError.message}`);
    } else {
      console.log('   ✅ Profile upsert successful');
    }

    // Agent insert
    const { data: agentInsert, error: agentInsertError } = await adminSupabase
      .from('agents')
      .upsert({
        id: userId,
        user_id: userId,
        agency_name: finalSignupData.company_name,
        business_phone: finalSignupData.phone,
        business_address: finalSignupData.business_address,
        specializations: Array.isArray(finalSignupData.specializations)
          ? finalSignupData.specializations
          : (finalSignupData.specializations ? [finalSignupData.specializations] : []),
        status: 'inactive', // Default status
        created_by: userId,
        source_type: finalSignupData.source_type || 'organic',
        source_details: finalSignupData.source_details || 'direct_signup'
      }, { onConflict: 'id' });

    if (agentInsertError) {
      console.log(`   ❌ Agent insert failed: ${agentInsertError.message}`);
    } else {
      console.log('   ✅ Agent insert successful');
    }

    // Step 4: Test the RPC function (if it works)
    console.log('\n4️⃣ Testing get_or_create_profile_for_current_user RPC...');
    
    // First sign in the user to get a session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password
    });

    if (signInError) {
      console.log(`   ❌ Sign in failed: ${signInError.message}`);
    } else {
      console.log('   ✅ Sign in successful');
      
      // Now test the RPC function
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_or_create_profile_for_current_user');

      if (rpcError) {
        console.log(`   ❌ RPC function failed: ${rpcError.message}`);
      } else {
        console.log('   ✅ RPC function successful');
        console.log(`   📝 RPC result:`, rpcData);
      }
    }

    // Step 5: Verify final state
    console.log('\n5️⃣ Verifying final state...');
    
    const { data: finalProfile, error: finalProfileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (finalProfileError) {
      console.log(`   ❌ Final profile check failed: ${finalProfileError.message}`);
    } else {
      console.log('   ✅ Final profile state:');
      console.log(`      Name: ${finalProfile.name}`);
      console.log(`      Email: ${finalProfile.email}`);
      console.log(`      Phone: ${finalProfile.phone}`);
      console.log(`      Company: ${finalProfile.company_name}`);
      console.log(`      Role: ${finalProfile.role}`);
      console.log(`      City: ${finalProfile.city}`);
      console.log(`      Country: ${finalProfile.country}`);
    }

    const { data: finalAgent, error: finalAgentError } = await adminSupabase
      .from('agents')
      .select('*')
      .eq('id', userId)
      .single();

    if (finalAgentError) {
      console.log(`   ❌ Final agent check failed: ${finalAgentError.message}`);
    } else {
      console.log('   ✅ Final agent state:');
      console.log(`      Agency Name: ${finalAgent.agency_name}`);
      console.log(`      Business Phone: ${finalAgent.business_phone}`);
      console.log(`      Business Address: ${finalAgent.business_address}`);
      console.log(`      Specializations: ${JSON.stringify(finalAgent.specializations)}`);
      console.log(`      Status: ${finalAgent.status}`);
      console.log(`      Source Type: ${finalAgent.source_type}`);
      console.log(`      Source Details: ${finalAgent.source_details}`);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test user...');
    
    // Delete from auth.users using admin client
    const { error: deleteAuthError } = await adminSupabase.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.log(`   ⚠️ Failed to delete auth user: ${deleteAuthError.message}`);
    } else {
      console.log('   ✅ Auth user deleted');
    }

    // Delete from profiles and agents tables
    await adminSupabase.from('profiles').delete().eq('id', userId);
    await adminSupabase.from('agents').delete().eq('id', userId);
    console.log('   ✅ Profile and agent records deleted');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testFrontendSignupFlow().then(() => {
  console.log('\n✅ Frontend signup flow test completed');
}).catch(error => {
  console.error('❌ Test execution failed:', error);
});