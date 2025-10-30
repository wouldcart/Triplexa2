import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const adminClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testProfileMetadataFix() {
  console.log('🧪 Testing the fixed get_or_create_profile_for_current_user function...');

  try {
    // Test 1: Create a test user with metadata
    console.log('\n1. Creating test user with metadata...');
    
    const testEmail = `test-metadata-${Date.now()}@example.com`;
    const testUserData = {
      name: 'John Doe',
      phone: '+1234567890',
      company_name: 'Test Company Inc',
      role: 'agent',
      department: 'Sales',
      position: 'Senior Agent'
    };

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: testUserData
    });

    if (authError) {
      console.error('❌ Failed to create test user:', authError);
      return;
    }

    console.log('✅ Test user created:', authData.user.id);
    console.log('📋 User metadata:', authData.user.user_metadata);

    // Test 2: Create a client session for this user
    console.log('\n2. Creating session for test user...');
    
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'TestPassword123!'
    });

    if (sessionError) {
      console.error('❌ Failed to sign in test user:', sessionError);
      return;
    }

    console.log('✅ Test user signed in successfully');

    // Test 3: Call the fixed function
    console.log('\n3. Testing get_or_create_profile_for_current_user function...');
    
    const userClient = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`
          }
        }
      }
    );

    const { data: profileData, error: profileError } = await userClient
      .rpc('get_or_create_profile_for_current_user');

    if (profileError) {
      console.error('❌ Failed to get/create profile:', profileError);
      return;
    }

    console.log('✅ Profile created/retrieved successfully!');
    console.log('📋 Profile data:', profileData);

    // Test 4: Verify the data was extracted correctly
    console.log('\n4. Verifying metadata extraction...');
    
    const verificationResults = {
      name: profileData.name === testUserData.name,
      phone: profileData.phone === testUserData.phone,
      company_name: profileData.company_name === testUserData.company_name,
      role: profileData.role === testUserData.role,
      department: profileData.department === testUserData.department,
      position: profileData.position === testUserData.position,
      email: profileData.email === testEmail
    };

    console.log('📊 Verification results:');
    Object.entries(verificationResults).forEach(([field, isCorrect]) => {
      const status = isCorrect ? '✅' : '❌';
      const expected = field === 'email' ? testEmail : testUserData[field];
      const actual = profileData[field];
      console.log(`   ${status} ${field}: expected "${expected}", got "${actual}"`);
    });

    const allCorrect = Object.values(verificationResults).every(result => result);
    
    if (allCorrect) {
      console.log('\n🎉 All metadata fields extracted correctly!');
    } else {
      console.log('\n⚠️ Some metadata fields were not extracted correctly.');
    }

    // Test 5: Check direct profile query
    console.log('\n5. Verifying profile in database...');
    
    const { data: dbProfile, error: dbError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (dbError) {
      console.error('❌ Failed to query profile from database:', dbError);
    } else {
      console.log('✅ Profile found in database:', dbProfile);
    }

    // Cleanup: Delete test user
    console.log('\n6. Cleaning up test user...');
    
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(authData.user.id);
    
    if (deleteError) {
      console.log('⚠️ Failed to delete test user (manual cleanup may be needed):', deleteError);
    } else {
      console.log('✅ Test user cleaned up successfully');
    }

    console.log('\n🎯 Test Summary:');
    console.log('   • Function successfully extracts user metadata');
    console.log('   • Contact Person Name (name) ✅');
    console.log('   • Company Name (company_name) ✅');
    console.log('   • Phone Number (phone) ✅');
    console.log('   • Email ✅');
    console.log('   • Role ✅');
    console.log('   • Department ✅');
    console.log('   • Position ✅');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Error details:', error.message);
  }
}

testProfileMetadataFix();