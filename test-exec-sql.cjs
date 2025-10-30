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

async function testExecSql() {
  console.log('🧪 Testing exec_sql function...');

  try {
    // Test 1: Simple SELECT without semicolon
    console.log('\n1. Testing simple SELECT without semicolon...');
    const { data: test1, error: error1 } = await supabase.rpc('exec_sql', {
      sql: `SELECT 1 as test`
    });
    
    if (error1) {
      console.error('❌ Test 1 error:', error1);
    } else {
      console.log('✅ Test 1 result:', test1);
    }

    // Test 2: Check if we can access auth.users
    console.log('\n2. Testing auth.users access...');
    const { data: test2, error: error2 } = await supabase.rpc('exec_sql', {
      sql: `SELECT COUNT(*) as user_count FROM auth.users`
    });
    
    if (error2) {
      console.error('❌ Test 2 error:', error2);
    } else {
      console.log('✅ Test 2 result:', test2);
    }

    // Test 3: Create a test user and try to access its metadata
    console.log('\n3. Creating test user and accessing metadata...');
    
    const { data: testUser, error: testUserError } = await supabase.auth.admin.createUser({
      email: `exec-sql-test-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_metadata: {
        name: 'Exec SQL Test',
        phone: '+1234567890',
        company_name: 'Exec Corp'
      }
    });

    if (testUserError) {
      console.error('❌ Error creating test user:', testUserError);
      return;
    }

    console.log('✅ Test user created:', testUser.user.id);

    // Test 4: Access the user's metadata
    console.log('\n4. Testing metadata access...');
    const { data: test4, error: error4 } = await supabase.rpc('exec_sql', {
      sql: `SELECT id, email, raw_user_meta_data FROM auth.users WHERE id = '${testUser.user.id}'`
    });
    
    if (error4) {
      console.error('❌ Test 4 error:', error4);
    } else {
      console.log('✅ Test 4 result:', test4);
    }

    // Test 5: Try to extract specific fields
    console.log('\n5. Testing field extraction...');
    const { data: test5, error: error5 } = await supabase.rpc('exec_sql', {
      sql: `SELECT 
        id,
        raw_user_meta_data->>'name' as name,
        raw_user_meta_data->>'phone' as phone,
        raw_user_meta_data->>'company_name' as company_name
      FROM auth.users 
      WHERE id = '${testUser.user.id}'`
    });
    
    if (error5) {
      console.error('❌ Test 5 error:', error5);
    } else {
      console.log('✅ Test 5 result:', test5);
    }

    // Clean up
    try {
      await supabase.auth.admin.deleteUser(testUser.user.id);
      console.log('\n✅ Test user deleted');
    } catch (error) {
      console.log('\n⚠️ Could not delete test user:', error.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testExecSql();