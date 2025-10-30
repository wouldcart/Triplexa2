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

async function debugUpdateIssue() {
  try {
    console.log('🔍 Debugging UPDATE issue...\n');

    // 1. Create test user
    const testEmail = `test-update-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const metadata = {
      name: 'John Doe',
      phone: '+1234567890',
      company_name: 'Test Company',
      role: 'Manager',
      department: 'Engineering',
      position: 'Senior Developer'
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

    // 2. Check if profile exists
    console.log('\n2. Checking if profile exists...');
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.log('❌ Profile does not exist:', profileError.message);
    } else {
      console.log('✅ Profile exists:', existingProfile);
    }

    // 3. Test individual UPDATE operations
    console.log('\n3. Testing individual UPDATE operations...');
    
    // Test simple update first
    const { data: simpleUpdate, error: simpleError } = await supabase
      .rpc('exec_sql', { 
        sql: `UPDATE profiles SET name = 'Test Name' WHERE id = '${authData.user.id}'`
      });

    if (simpleError) {
      console.log('❌ Simple update failed:', simpleError);
    } else {
      console.log('✅ Simple update succeeded');
    }

    // Check result
    const { data: afterSimple } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', authData.user.id)
      .single();
    console.log('Profile name after simple update:', afterSimple?.name);

    // 4. Test extraction in separate query
    console.log('\n4. Testing metadata extraction...');
    const { data: extractionTest, error: extractionError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT raw_user_meta_data->>'name' as extracted_name FROM auth.users WHERE id = '${authData.user.id}'`
      });

    if (extractionError) {
      console.log('❌ Extraction test failed:', extractionError);
    } else {
      console.log('✅ Extraction test result:', extractionTest);
    }

    // 5. Test subquery update
    console.log('\n5. Testing subquery update...');
    const { data: subqueryUpdate, error: subqueryError } = await supabase
      .rpc('exec_sql', { 
        sql: `UPDATE profiles SET phone = (SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = '${authData.user.id}') WHERE id = '${authData.user.id}'`
      });

    if (subqueryError) {
      console.log('❌ Subquery update failed:', subqueryError);
    } else {
      console.log('✅ Subquery update succeeded');
    }

    // Check result
    const { data: afterSubquery } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', authData.user.id)
      .single();
    console.log('Profile phone after subquery update:', afterSubquery?.phone);

    // 6. Final profile check
    console.log('\n6. Final profile state...');
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    console.log('📊 Final profile:', finalProfile);

    // 7. Cleanup
    console.log('\n7. Cleaning up...');
    try {
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.log('✅ User deleted');
    } catch (deleteError) {
      console.log('❌ Error deleting user:', deleteError.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugUpdateIssue();