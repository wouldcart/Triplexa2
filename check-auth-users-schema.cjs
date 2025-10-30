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

async function checkAuthUsersSchema() {
  console.log('🔍 Checking auth.users table schema...\n');

  try {
    // Check the schema of auth.users table
    const schemaQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'auth' 
      AND table_name = 'users'
      ORDER BY ordinal_position;
    `;

    const { data: schemaResult, error: schemaError } = await adminClient.rpc('exec_sql', {
      sql: schemaQuery
    });

    if (schemaError) {
      console.log(`❌ Schema query error: ${schemaError.message}`);
    } else {
      console.log('✅ auth.users table schema:');
      console.log(JSON.stringify(schemaResult, null, 2));
    }

    // Also check if there are any metadata-related columns
    const metadataQuery = `
      SELECT 
        column_name,
        data_type
      FROM information_schema.columns 
      WHERE table_schema = 'auth' 
      AND table_name = 'users'
      AND (column_name ILIKE '%metadata%' OR column_name ILIKE '%meta%')
      ORDER BY column_name;
    `;

    const { data: metadataResult, error: metadataError } = await adminClient.rpc('exec_sql', {
      sql: metadataQuery
    });

    if (metadataError) {
      console.log(`❌ Metadata query error: ${metadataError.message}`);
    } else {
      console.log('\n✅ Metadata-related columns:');
      console.log(JSON.stringify(metadataResult, null, 2));
    }

    // Create a test user and see what we can actually access
    console.log('\n🧪 Creating test user to see accessible data...');
    
    const testEmail = `schema-test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testUserData = {
      name: 'Schema Test User',
      company_name: 'Test Company'
    };

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

    // Try to select all available columns
    const dataQuery = `
      SELECT *
      FROM auth.users 
      WHERE id = '${testUserId}'
    `;

    const { data: dataResult, error: dataError } = await adminClient.rpc('exec_sql', {
      sql: dataQuery
    });

    if (dataError) {
      console.log(`❌ Data query error: ${dataError.message}`);
    } else {
      console.log('\n✅ Actual user data from auth.users:');
      console.log(JSON.stringify(dataResult, null, 2));
    }

    // Cleanup
    await adminClient.auth.admin.deleteUser(testUserId);
    console.log('✅ Test user deleted');

  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }

  console.log('\n📋 Schema Analysis Summary:');
  console.log('- Identified actual column names in auth.users table');
  console.log('- Found metadata-related columns');
  console.log('- Tested actual data access patterns');
}

checkAuthUsersSchema().catch(console.error);