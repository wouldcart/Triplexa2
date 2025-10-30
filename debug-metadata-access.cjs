require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function exec_sql(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql: sql });
  if (error) {
    console.error('SQL Error:', error);
    throw error;
  }
  return data;
}

async function debugMetadataAccess() {
  console.log('🔍 Debugging metadata access...');

  try {
    // 1. Create a test user with metadata
    console.log('\n1. Creating test user with metadata...');
    
    const testMetadata = {
      name: 'Debug Test User',
      phone: '+1234567890',
      company_name: 'Debug Corp',
      role: 'Manager',
      department: 'Engineering',
      position: 'Senior Manager'
    };

    const { data: testUser, error: userError } = await supabase.auth.admin.createUser({
      email: `debug-metadata-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: testMetadata
    });

    if (userError) {
      console.error('❌ Error creating user:', userError);
      return;
    }

    console.log('✅ Test user created:', testUser.user.id);

    // 2. Check what's in auth.users
    console.log('\n2. Checking auth.users table...');
    
    const authUsersData = await exec_sql(`
      SELECT id, email, raw_user_meta_data, user_metadata
      FROM auth.users 
      WHERE id = '${testUser.user.id}'
    `);
    
    console.log('📊 Auth users data:', JSON.stringify(authUsersData, null, 2));

    // 3. Try different ways to access metadata
    console.log('\n3. Testing different metadata access methods...');
    
    // Method 1: raw_user_meta_data
    const rawMetaData = await exec_sql(`
      SELECT raw_user_meta_data
      FROM auth.users 
      WHERE id = '${testUser.user.id}'
    `);
    console.log('📊 Raw meta data:', JSON.stringify(rawMetaData, null, 2));

    // Method 2: user_metadata
    const userMetaData = await exec_sql(`
      SELECT user_metadata
      FROM auth.users 
      WHERE id = '${testUser.user.id}'
    `);
    console.log('📊 User metadata:', JSON.stringify(userMetaData, null, 2));

    // Method 3: Extract specific fields from raw_user_meta_data
    const extractedFields = await exec_sql(`
      SELECT 
        raw_user_meta_data->>'name' as name,
        raw_user_meta_data->>'phone' as phone,
        raw_user_meta_data->>'company_name' as company_name,
        raw_user_meta_data->>'role' as role,
        raw_user_meta_data->>'department' as department,
        raw_user_meta_data->>'position' as position
      FROM auth.users 
      WHERE id = '${testUser.user.id}'
    `);
    console.log('📊 Extracted fields from raw_user_meta_data:', JSON.stringify(extractedFields, null, 2));

    // Method 4: Extract specific fields from user_metadata
    const extractedFromUserMeta = await exec_sql(`
      SELECT 
        user_metadata->>'name' as name,
        user_metadata->>'phone' as phone,
        user_metadata->>'company_name' as company_name,
        user_metadata->>'role' as role,
        user_metadata->>'department' as department,
        user_metadata->>'position' as position
      FROM auth.users 
      WHERE id = '${testUser.user.id}'
    `);
    console.log('📊 Extracted fields from user_metadata:', JSON.stringify(extractedFromUserMeta, null, 2));

    // 4. Check what the trigger function is actually seeing
    console.log('\n4. Checking trigger function logs...');
    
    // Wait for trigger to process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check profile created by trigger
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.user.id)
      .single();

    console.log('\n📊 Profile created by trigger:');
    if (profileError) {
      console.error('❌ Profile error:', profileError);
    } else {
      console.log('✅ Profile:', JSON.stringify(profile, null, 2));
    }

    // 5. Test manual profile creation with correct metadata source
    console.log('\n5. Testing manual profile creation...');
    
    // Delete existing profile first
    await supabase
      .from('profiles')
      .delete()
      .eq('id', testUser.user.id);

    // Create profile manually using the correct metadata source
    const manualInsert = await exec_sql(`
      INSERT INTO profiles (id, name, phone, company_name, role, department, position)
      SELECT 
        '${testUser.user.id}',
        COALESCE(raw_user_meta_data->>'name', user_metadata->>'name'),
        COALESCE(raw_user_meta_data->>'phone', user_metadata->>'phone'),
        COALESCE(raw_user_meta_data->>'company_name', user_metadata->>'company_name'),
        COALESCE(raw_user_meta_data->>'role', user_metadata->>'role', 'employee'),
        COALESCE(raw_user_meta_data->>'department', user_metadata->>'department'),
        COALESCE(raw_user_meta_data->>'position', user_metadata->>'position')
      FROM auth.users 
      WHERE id = '${testUser.user.id}'
    `);
    
    console.log('✅ Manual insert result:', JSON.stringify(manualInsert, null, 2));

    // Check the manually created profile
    const { data: manualProfile, error: manualProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.user.id)
      .single();

    console.log('\n📊 Manually created profile:');
    if (manualProfileError) {
      console.error('❌ Manual profile error:', manualProfileError);
    } else {
      console.log('✅ Manual profile:', JSON.stringify(manualProfile, null, 2));
      
      // Check if manual creation worked
      if (manualProfile.name === testMetadata.name) {
        console.log('🎉 MANUAL METADATA EXTRACTION SUCCESSFUL!');
        console.log('✅ The issue is in the trigger function, not the metadata access');
      } else {
        console.log('⚠️ Manual metadata extraction also failed');
        console.log('❌ The issue might be in how metadata is stored');
      }
    }

    // 6. Clean up
    console.log('\n6. Cleaning up...');
    await supabase.auth.admin.deleteUser(testUser.user.id);
    console.log('✅ Test user deleted');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n🎉 Metadata access debugging completed!');
}

debugMetadataAccess();