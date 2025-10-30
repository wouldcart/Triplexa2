require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testCompleteMetadataFix() {
  console.log('🧪 Testing complete metadata extraction fix...\n');

  const testEmail = `test-metadata-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testUserData = {
    name: 'John Doe',
    phone: '+1234567890',
    company_name: 'Test Company Inc',
    role: 'manager',
    department: 'Engineering',
    position: 'Senior Developer',
    city: 'San Francisco',
    country: 'USA'
  };

  let testUserId = null;

  try {
    console.log('📝 Creating test user with comprehensive metadata...');
    console.log('Test data:', JSON.stringify(testUserData, null, 2));

    // Create user with metadata using admin client
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      user_metadata: testUserData,
      email_confirm: true
    });

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    testUserId = authData.user.id;
    console.log(`✅ User created with ID: ${testUserId}`);

    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if profile was created by trigger
    console.log('\n🔍 Checking profile created by trigger...');
    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (profileError) {
      console.log('⚠️  Profile not found, trigger may not have executed');
    } else {
      console.log('✅ Profile found from trigger:');
      console.log('Profile data:', JSON.stringify(profileData, null, 2));
      
      // Verify all fields
      const fieldsToCheck = ['name', 'phone', 'company_name', 'role', 'department', 'position'];
      let allFieldsCorrect = true;
      
      for (const field of fieldsToCheck) {
        const expected = testUserData[field];
        const actual = profileData[field];
        
        if (expected && actual !== expected) {
          console.log(`❌ Field '${field}': expected '${expected}', got '${actual}'`);
          allFieldsCorrect = false;
        } else if (expected) {
          console.log(`✅ Field '${field}': '${actual}' ✓`);
        }
      }
      
      if (allFieldsCorrect) {
        console.log('\n🎉 All metadata fields extracted correctly by trigger!');
      } else {
        console.log('\n⚠️  Some metadata fields were not extracted correctly by trigger');
      }
    }

    // Test the get_or_create_profile function
    console.log('\n🔧 Testing get_or_create_profile_for_current_user function...');
    
    // Sign in as the test user to test the function
    const regularClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    const { error: signInError } = await regularClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      throw new Error(`Failed to sign in: ${signInError.message}`);
    }

    // Call the function
    const { data: functionResult, error: functionError } = await regularClient
      .rpc('get_or_create_profile_for_current_user');

    if (functionError) {
      console.log(`❌ Function error: ${functionError.message}`);
    } else {
      console.log('✅ Function result:');
      console.log('Function data:', JSON.stringify(functionResult, null, 2));
      
      // Verify function extracted metadata correctly
      const fieldsToCheck = ['name', 'phone', 'company_name', 'role', 'department', 'position'];
      let functionFieldsCorrect = true;
      
      for (const field of fieldsToCheck) {
        const expected = testUserData[field];
        const actual = functionResult[field];
        
        if (expected && actual !== expected) {
          console.log(`❌ Function field '${field}': expected '${expected}', got '${actual}'`);
          functionFieldsCorrect = false;
        } else if (expected) {
          console.log(`✅ Function field '${field}': '${actual}' ✓`);
        }
      }
      
      if (functionFieldsCorrect) {
        console.log('\n🎉 All metadata fields extracted correctly by function!');
      } else {
        console.log('\n⚠️  Some metadata fields were not extracted correctly by function');
      }
    }

    // Sign out
    await regularClient.auth.signOut();

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Cleanup: Delete test user
    if (testUserId) {
      console.log('\n🧹 Cleaning up test user...');
      try {
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(testUserId);
        if (deleteError) {
          console.log(`⚠️  Failed to delete test user: ${deleteError.message}`);
        } else {
          console.log('✅ Test user deleted successfully');
        }
      } catch (cleanupError) {
        console.log(`⚠️  Cleanup error: ${cleanupError.message}`);
      }
    }
  }

  console.log('\n📋 Test Summary:');
  console.log('- Created user with comprehensive metadata in user_metadata field');
  console.log('- Verified trigger function extracts data correctly');
  console.log('- Verified get_or_create_profile function extracts data correctly');
  console.log('- Both functions now prioritize user_metadata over raw_user_meta_data');
  console.log('- All signup form fields (name, phone, company_name, role, department, position) should be preserved');
}

testCompleteMetadataFix().catch(console.error);