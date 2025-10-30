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

async function debugAuthUsersMetadata() {
  console.log('🔍 Debugging auth.users metadata access...\n');

  const testEmail = `debug-metadata-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testUserData = {
    name: 'Debug User',
    phone: '+1234567890',
    company_name: 'Debug Company',
    role: 'manager',
    department: 'Engineering',
    position: 'Senior Developer'
  };

  let testUserId = null;

  try {
    console.log('📝 Creating test user with metadata...');
    console.log('Metadata to store:', JSON.stringify(testUserData, null, 2));

    // Create user with metadata
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

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try to query auth.users directly using SQL
    console.log('\n🔍 Querying auth.users table directly...');
    
    const sqlQuery = `
      SELECT 
        id,
        email,
        user_metadata,
        raw_user_meta_data,
        created_at
      FROM auth.users 
      WHERE id = '${testUserId}'
    `;

    const { data: sqlResult, error: sqlError } = await adminClient.rpc('exec_sql', {
      sql: sqlQuery
    });

    if (sqlError) {
      console.log(`❌ SQL query error: ${sqlError.message}`);
    } else {
      console.log('✅ Direct SQL query result:');
      console.log(JSON.stringify(sqlResult, null, 2));
    }

    // Try alternative approach - get user via admin API
    console.log('\n🔍 Getting user via admin API...');
    const { data: adminUserData, error: adminUserError } = await adminClient.auth.admin.getUserById(testUserId);

    if (adminUserError) {
      console.log(`❌ Admin API error: ${adminUserError.message}`);
    } else {
      console.log('✅ Admin API user data:');
      console.log('User metadata:', JSON.stringify(adminUserData.user.user_metadata, null, 2));
      console.log('Raw user metadata:', JSON.stringify(adminUserData.user.raw_user_meta_data, null, 2));
    }

    // Test our function with explicit user ID
    console.log('\n🔧 Testing function access to metadata...');
    
    const testFunctionSql = `
      DO $$
      DECLARE
        v_user_metadata jsonb;
        v_raw_user_metadata jsonb;
        v_email text;
      BEGIN
        -- Try to access auth.users from function context
        SELECT u.email, u.user_metadata, u.raw_user_meta_data 
        INTO v_email, v_user_metadata, v_raw_user_metadata
        FROM auth.users u 
        WHERE u.id = '${testUserId}';
        
        RAISE NOTICE 'Email: %', v_email;
        RAISE NOTICE 'User metadata: %', v_user_metadata;
        RAISE NOTICE 'Raw user metadata: %', v_raw_user_metadata;
        
        -- Test extraction
        RAISE NOTICE 'Name from user_metadata: %', v_user_metadata->>'name';
        RAISE NOTICE 'Name from raw_user_meta_data: %', v_raw_user_metadata->>'name';
      END $$;
    `;

    const { data: functionTestResult, error: functionTestError } = await adminClient.rpc('exec_sql', {
      sql: testFunctionSql
    });

    if (functionTestError) {
      console.log(`❌ Function test error: ${functionTestError.message}`);
    } else {
      console.log('✅ Function test completed - check database logs for NOTICE messages');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    // Cleanup
    if (testUserId) {
      console.log('\n🧹 Cleaning up test user...');
      try {
        await adminClient.auth.admin.deleteUser(testUserId);
        console.log('✅ Test user deleted');
      } catch (cleanupError) {
        console.log(`⚠️  Cleanup error: ${cleanupError.message}`);
      }
    }
  }

  console.log('\n📋 Debug Summary:');
  console.log('- Checked direct SQL access to auth.users');
  console.log('- Verified admin API access to user metadata');
  console.log('- Tested function-level access to auth.users');
  console.log('- This should help identify where the metadata access is failing');
}

debugAuthUsersMetadata().catch(console.error);