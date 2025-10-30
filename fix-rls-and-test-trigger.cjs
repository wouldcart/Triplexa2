const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Fixing RLS and testing trigger...\n');

async function fixRLSAndTestTrigger() {
  try {
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📋 Step 1: Completely disabling RLS on profiles table...');
    
    // Disable RLS completely to avoid any conflicts
    const { error: disableRLSError } = await adminSupabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;'
    });

    if (disableRLSError) {
      console.error('❌ Failed to disable RLS:', disableRLSError);
    } else {
      console.log('✅ RLS disabled on profiles table');
    }

    console.log('\n📋 Step 2: Checking current trigger function...');
    
    // Check if our enhanced function exists
    const { data: functionData, error: functionError } = await adminSupabase.rpc('exec_sql', {
      sql: `
        SELECT routine_name, routine_definition 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'handle_new_user';
      `
    });

    if (functionError) {
      console.error('❌ Failed to check function:', functionError);
    } else {
      console.log('✅ Function exists:', functionData?.length > 0 ? 'Yes' : 'No');
    }

    console.log('\n📋 Step 3: Testing trigger with a simple approach...');
    
    // Create a test user with metadata using a simpler approach
    const testEmail = `simple-test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    // First, let's try creating a user without metadata to see if the basic trigger works
    console.log('Creating test user without metadata first...');

    const { data: basicUserData, error: basicUserError } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword
    });

    if (basicUserError) {
      console.error('❌ Failed to create basic test user:', basicUserError);
      return;
    }

    console.log('✅ Basic test user created with ID:', basicUserData.user.id);

    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if a profile was created
    const { data: basicProfileData, error: basicProfileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', basicUserData.user.id)
      .single();

    if (basicProfileError) {
      console.error('❌ Failed to fetch basic profile:', basicProfileError);
    } else {
      console.log('✅ Basic profile created:', JSON.stringify(basicProfileData, null, 2));
    }

    // Clean up basic test user
    await adminSupabase.auth.admin.deleteUser(basicUserData.user.id);
    console.log('✅ Basic test user cleaned up');

    console.log('\n📋 Step 4: Testing with metadata...');
    
    const testMetadata = {
      name: 'Metadata Test User',
      role: 'manager',
      department: 'Engineering',
      phone: '+1234567890',
      position: 'Senior Developer',
      employee_id: 'META001',
      company_name: 'Metadata Test Company'
    };

    console.log('Creating test user with metadata:', JSON.stringify(testMetadata, null, 2));

    const { data: metaUserData, error: metaUserError } = await adminSupabase.auth.admin.createUser({
      email: `meta-test-${Date.now()}@example.com`,
      password: testPassword,
      user_metadata: testMetadata
    });

    if (metaUserError) {
      console.error('❌ Failed to create metadata test user:', metaUserError);
      return;
    }

    console.log('✅ Metadata test user created with ID:', metaUserData.user.id);

    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check the created profile
    const { data: metaProfileData, error: metaProfileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', metaUserData.user.id)
      .single();

    if (metaProfileError) {
      console.error('❌ Failed to fetch metadata profile:', metaProfileError);
    } else {
      console.log('✅ Metadata profile created:', JSON.stringify(metaProfileData, null, 2));
      
      // Check if metadata was extracted correctly
      const metadataExtracted = 
        metaProfileData.name === testMetadata.name &&
        metaProfileData.phone === testMetadata.phone &&
        metaProfileData.company_name === testMetadata.company_name;

      if (metadataExtracted) {
        console.log('🎉 SUCCESS: Metadata extraction working correctly!');
      } else {
        console.log('❌ FAILED: Metadata extraction incomplete');
        console.log(`Expected name: ${testMetadata.name}, Got: ${metaProfileData.name}`);
        console.log(`Expected phone: ${testMetadata.phone}, Got: ${metaProfileData.phone}`);
        console.log(`Expected company: ${testMetadata.company_name}, Got: ${metaProfileData.company_name}`);
      }
    }

    // Clean up metadata test user
    await adminSupabase.auth.admin.deleteUser(metaUserData.user.id);
    console.log('✅ Metadata test user cleaned up');

    console.log('\n📋 Step 5: Testing the get_or_create_profile_for_current_user function...');
    
    // Test the RPC function
    const { data: rpcData, error: rpcError } = await adminSupabase.rpc('get_or_create_profile_for_current_user');

    if (rpcError) {
      console.error('❌ RPC function failed:', rpcError);
    } else {
      console.log('✅ RPC function works:', rpcData);
    }

    console.log('\n🎉 RLS fix and trigger test completed!');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

fixRLSAndTestTrigger();