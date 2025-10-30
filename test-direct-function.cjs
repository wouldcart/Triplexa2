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

async function testDirectFunction() {
  console.log('🔍 Testing direct function access to metadata...\n');

  try {
    // Create a function that can be called directly to test metadata access
    console.log('🔧 Creating test function...');
    const testFunctionSql = `
      CREATE OR REPLACE FUNCTION public.test_metadata_access(user_id uuid)
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        user_record record;
        result jsonb;
      BEGIN
        -- Try to get the user record from auth.users
        SELECT * INTO user_record FROM auth.users WHERE id = user_id;
        
        IF NOT FOUND THEN
          RETURN jsonb_build_object('error', 'User not found');
        END IF;
        
        -- Build result with all available data
        result := jsonb_build_object(
          'id', user_record.id,
          'email', user_record.email,
          'raw_user_meta_data', user_record.raw_user_meta_data,
          'raw_app_meta_data', user_record.raw_app_meta_data,
          'name_extracted', user_record.raw_user_meta_data->>'name',
          'role_extracted', user_record.raw_user_meta_data->>'role',
          'phone_extracted', user_record.raw_user_meta_data->>'phone',
          'company_name_extracted', user_record.raw_user_meta_data->>'company_name'
        );
        
        RETURN result;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN jsonb_build_object('error', SQLERRM);
      END;
      $$;
    `;

    const { error: functionError } = await adminClient.rpc('exec_sql', {
      sql: testFunctionSql
    });

    if (functionError) {
      console.log(`❌ Function creation error: ${functionError.message}`);
      return;
    } else {
      console.log('✅ Test function created');
    }

    // Create test user
    const testEmail = `direct-function-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testUserData = {
      name: 'Direct Function User',
      phone: '+1234567890',
      company_name: 'Direct Company',
      role: 'manager',
      department: 'Engineering',
      position: 'Senior Developer'
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

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Call our test function
    console.log('\n🔧 Calling test function...');
    const { data: functionResult, error: functionCallError } = await adminClient.rpc('test_metadata_access', {
      user_id: testUserId
    });

    if (functionCallError) {
      console.log(`❌ Function call error: ${functionCallError.message}`);
    } else {
      console.log('✅ Function result:');
      console.log(JSON.stringify(functionResult, null, 2));
    }

    // Also try to create a profile manually using the same approach
    console.log('\n🔧 Creating profile manually...');
    const manualProfileSql = `
      INSERT INTO public.profiles (
        id, 
        email, 
        name,
        role,
        phone,
        company_name,
        department,
        position,
        status,
        created_at,
        updated_at
      )
      SELECT 
        u.id,
        u.email,
        u.raw_user_meta_data->>'name',
        u.raw_user_meta_data->>'role',
        u.raw_user_meta_data->>'phone',
        u.raw_user_meta_data->>'company_name',
        u.raw_user_meta_data->>'department',
        u.raw_user_meta_data->>'position',
        'active',
        NOW(),
        NOW()
      FROM auth.users u
      WHERE u.id = '${testUserId}'
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone,
        company_name = EXCLUDED.company_name,
        department = EXCLUDED.department,
        position = EXCLUDED.position,
        updated_at = NOW()
    `;

    const { error: manualError } = await adminClient.rpc('exec_sql', {
      sql: manualProfileSql
    });

    if (manualError) {
      console.log(`❌ Manual profile creation error: ${manualError.message}`);
    } else {
      console.log('✅ Manual profile creation successful');
      
      // Check the created profile
      const { data: profileData, error: profileError } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single();

      if (profileError) {
        console.log(`❌ Profile query error: ${profileError.message}`);
      } else {
        console.log('\n✅ Manually created profile:');
        console.log(JSON.stringify(profileData, null, 2));
      }
    }

    // Cleanup
    await adminClient.auth.admin.deleteUser(testUserId);
    console.log('\n✅ Test user deleted');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDirectFunction().catch(console.error);