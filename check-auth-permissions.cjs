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

async function checkAuthPermissions() {
  console.log('🔍 Checking auth schema permissions and access...\n');

  try {
    // Check what schemas are available
    console.log('📋 Checking available schemas...');
    const schemaQuery = `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('auth', 'public')
      ORDER BY schema_name
    `;

    const { data: schemaResult, error: schemaError } = await adminClient.rpc('exec_sql', {
      sql: schemaQuery
    });

    if (schemaError) {
      console.log(`❌ Schema query error: ${schemaError.message}`);
    } else {
      console.log('✅ Available schemas:');
      console.log(JSON.stringify(schemaResult, null, 2));
    }

    // Check what tables are in the auth schema
    console.log('\n📋 Checking auth schema tables...');
    const authTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'auth'
      ORDER BY table_name
    `;

    const { data: authTablesResult, error: authTablesError } = await adminClient.rpc('exec_sql', {
      sql: authTablesQuery
    });

    if (authTablesError) {
      console.log(`❌ Auth tables query error: ${authTablesError.message}`);
    } else {
      console.log('✅ Auth schema tables:');
      console.log(JSON.stringify(authTablesResult, null, 2));
    }

    // Check permissions on auth.users table
    console.log('\n📋 Checking permissions on auth.users...');
    const permissionsQuery = `
      SELECT 
        grantee,
        privilege_type,
        is_grantable
      FROM information_schema.table_privileges 
      WHERE table_schema = 'auth' 
      AND table_name = 'users'
      ORDER BY grantee, privilege_type
    `;

    const { data: permissionsResult, error: permissionsError } = await adminClient.rpc('exec_sql', {
      sql: permissionsQuery
    });

    if (permissionsError) {
      console.log(`❌ Permissions query error: ${permissionsError.message}`);
    } else {
      console.log('✅ Auth.users permissions:');
      console.log(JSON.stringify(permissionsResult, null, 2));
    }

    // Check current user/role
    console.log('\n📋 Checking current user and role...');
    const currentUserQuery = `
      SELECT 
        current_user,
        current_role,
        session_user
    `;

    const { data: currentUserResult, error: currentUserError } = await adminClient.rpc('exec_sql', {
      sql: currentUserQuery
    });

    if (currentUserError) {
      console.log(`❌ Current user query error: ${currentUserError.message}`);
    } else {
      console.log('✅ Current user info:');
      console.log(JSON.stringify(currentUserResult, null, 2));
    }

    // Try to grant explicit permissions
    console.log('\n🔧 Attempting to grant permissions...');
    const grantQuery = `
      GRANT SELECT ON auth.users TO public;
      GRANT SELECT ON auth.users TO postgres;
      GRANT SELECT ON auth.users TO service_role;
    `;

    const { error: grantError } = await adminClient.rpc('exec_sql', {
      sql: grantQuery
    });

    if (grantError) {
      console.log(`❌ Grant error: ${grantError.message}`);
    } else {
      console.log('✅ Permissions granted');
    }

    // Create test user and try again
    const testEmail = `auth-permissions-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testUserData = {
      name: 'Auth Permissions User',
      phone: '+1234567890',
      company_name: 'Auth Company',
      role: 'manager'
    };

    console.log('\n📝 Creating test user...');
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      user_metadata: testUserData,
      email_confirm: true
    });

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    const testUserId = authData.user.id;
    console.log(`✅ Test user created with ID: ${testUserId}`);

    // Try different approaches to access the data
    console.log('\n🔧 Testing different access approaches...');

    // Approach 1: Direct select with explicit schema
    const directQuery = `
      SELECT 
        id,
        email,
        raw_user_meta_data,
        raw_user_meta_data->>'name' as name_extracted
      FROM auth.users 
      WHERE id = '${testUserId}'
    `;

    const { data: directResult, error: directError } = await adminClient.rpc('exec_sql', {
      sql: directQuery
    });

    if (directError) {
      console.log(`❌ Direct query error: ${directError.message}`);
    } else {
      console.log('✅ Direct query result:');
      console.log(JSON.stringify(directResult, null, 2));
    }

    // Approach 2: Using a function with SECURITY INVOKER
    const invokerFunctionSql = `
      CREATE OR REPLACE FUNCTION public.test_invoker_access(user_id uuid)
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY INVOKER
      AS $$
      DECLARE
        result jsonb;
      BEGIN
        SELECT jsonb_build_object(
          'id', u.id,
          'email', u.email,
          'raw_user_meta_data', u.raw_user_meta_data,
          'name_extracted', u.raw_user_meta_data->>'name'
        ) INTO result
        FROM auth.users u
        WHERE u.id = user_id;
        
        RETURN result;
      END;
      $$;
    `;

    const { error: invokerError } = await adminClient.rpc('exec_sql', {
      sql: invokerFunctionSql
    });

    if (invokerError) {
      console.log(`❌ Invoker function error: ${invokerError.message}`);
    } else {
      console.log('✅ Invoker function created');
      
      const { data: invokerResult, error: invokerCallError } = await adminClient.rpc('test_invoker_access', {
        user_id: testUserId
      });

      if (invokerCallError) {
        console.log(`❌ Invoker call error: ${invokerCallError.message}`);
      } else {
        console.log('✅ Invoker function result:');
        console.log(JSON.stringify(invokerResult, null, 2));
      }
    }

    // Cleanup
    await adminClient.auth.admin.deleteUser(testUserId);
    console.log('\n✅ Test user deleted');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkAuthPermissions().catch(console.error);