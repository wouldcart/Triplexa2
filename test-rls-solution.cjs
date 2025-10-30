require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testRLSSolution() {
  try {
    console.log('🧪 Testing RLS solution for metadata extraction...\n');

    // 1. Create test user with comprehensive metadata
    const testEmail = `test-rls-solution-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const metadata = {
      name: 'Jane Smith',
      phone: '+1987654321',
      company_name: 'Acme Corporation',
      role: 'Senior Manager',
      department: 'Marketing',
      position: 'Director of Marketing'
    };

    console.log('1. Creating test user with metadata:', metadata);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      user_metadata: metadata
    });

    if (authError) {
      console.error('❌ Error creating user:', authError);
      return;
    }

    console.log('✅ User created with ID:', authData.user.id);

    // 2. Wait a moment for trigger to execute
    console.log('\n2. Waiting for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Check if profile was created with metadata
    console.log('\n3. Checking profile created by trigger...');
    const { data: triggerProfile, error: triggerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (triggerError) {
      console.log('❌ Error fetching trigger-created profile:', triggerError);
    } else {
      console.log('📊 Profile created by trigger:');
      console.log(`  - ID: ${triggerProfile.id}`);
      console.log(`  - Name: ${triggerProfile.name}`);
      console.log(`  - Phone: ${triggerProfile.phone}`);
      console.log(`  - Company: ${triggerProfile.company_name}`);
      console.log(`  - Role: ${triggerProfile.role}`);
      console.log(`  - Department: ${triggerProfile.department}`);
      console.log(`  - Position: ${triggerProfile.position}`);
      
      // Check if metadata was extracted successfully
      const metadataExtracted = triggerProfile.name === metadata.name &&
                               triggerProfile.phone === metadata.phone &&
                               triggerProfile.company_name === metadata.company_name &&
                               triggerProfile.role === metadata.role &&
                               triggerProfile.department === metadata.department &&
                               triggerProfile.position === metadata.position;
      
      if (metadataExtracted) {
        console.log('✅ SUCCESS: All metadata extracted correctly!');
      } else {
        console.log('❌ FAILURE: Metadata extraction incomplete');
      }
    }

    // 4. Test get_or_create_profile_for_current_user function
    console.log('\n4. Testing get_or_create_profile_for_current_user function...');
    
    // Delete the profile first to test creation
    await supabase
      .from('profiles')
      .delete()
      .eq('id', authData.user.id);
    
    console.log('✅ Profile deleted for testing');

    // Test the function
    const { data: functionResult, error: functionError } = await supabase
      .rpc('get_or_create_profile_for_current_user');

    if (functionError) {
      console.log('❌ Error with get_or_create_profile_for_current_user:', functionError);
    } else {
      console.log('📊 Profile from get_or_create function:');
      console.log(`  - ID: ${functionResult.id}`);
      console.log(`  - Name: ${functionResult.name}`);
      console.log(`  - Phone: ${functionResult.phone}`);
      console.log(`  - Company: ${functionResult.company_name}`);
      console.log(`  - Role: ${functionResult.role}`);
      console.log(`  - Department: ${functionResult.department}`);
      console.log(`  - Position: ${functionResult.position}`);
      
      // Check if metadata was extracted successfully
      const functionMetadataExtracted = functionResult.name === metadata.name &&
                                       functionResult.phone === metadata.phone &&
                                       functionResult.company_name === metadata.company_name &&
                                       functionResult.role === metadata.role &&
                                       functionResult.department === metadata.department &&
                                       functionResult.position === metadata.position;
      
      if (functionMetadataExtracted) {
        console.log('✅ SUCCESS: get_or_create function works correctly!');
      } else {
        console.log('❌ FAILURE: get_or_create function metadata extraction incomplete');
      }
    }

    // 5. Test with a second user to ensure trigger still works
    console.log('\n5. Testing with second user...');
    const testEmail2 = `test-rls-solution-2-${Date.now()}@example.com`;
    const metadata2 = {
      name: 'Bob Johnson',
      phone: '+1555123456',
      company_name: 'Tech Startup Inc',
      role: 'Developer',
      department: 'Engineering',
      position: 'Full Stack Developer'
    };

    const { data: authData2, error: authError2 } = await supabase.auth.admin.createUser({
      email: testEmail2,
      password: testPassword,
      user_metadata: metadata2
    });

    if (authError2) {
      console.log('❌ Error creating second user:', authError2);
    } else {
      console.log('✅ Second user created:', authData2.user.id);
      
      // Wait and check
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: profile2 } = await supabase
        .from('profiles')
        .select('name, phone, company_name, role, department, position')
        .eq('id', authData2.user.id)
        .single();
      
      console.log('📊 Second user profile:', profile2);
      
      const metadata2Extracted = profile2.name === metadata2.name &&
                                 profile2.phone === metadata2.phone &&
                                 profile2.company_name === metadata2.company_name;
      
      if (metadata2Extracted) {
        console.log('✅ SUCCESS: Second user metadata extracted correctly!');
      } else {
        console.log('❌ FAILURE: Second user metadata extraction failed');
      }
    }

    // 6. Cleanup
    console.log('\n6. Cleaning up...');
    try {
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.log('✅ First test user deleted');
    } catch (deleteError) {
      console.log('❌ Error deleting first user:', deleteError.message);
    }

    if (authData2) {
      try {
        await supabase.auth.admin.deleteUser(authData2.user.id);
        console.log('✅ Second test user deleted');
      } catch (deleteError) {
        console.log('❌ Error deleting second user:', deleteError.message);
      }
    }

    console.log('\n🎉 RLS solution testing completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testRLSSolution();