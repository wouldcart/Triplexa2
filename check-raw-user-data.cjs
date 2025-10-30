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

async function checkRawUserData() {
  console.log('🔍 Checking raw user data...\n');

  try {
    // Create test user
    const testEmail = `raw-data-test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testUserData = {
      name: 'Raw Data Test User',
      phone: '+1234567890',
      company_name: 'Raw Data Company',
      role: 'manager',
      department: 'Engineering',
      position: 'Senior Developer'
    };

    console.log('📝 Creating test user with metadata...');
    console.log('Test metadata:', JSON.stringify(testUserData, null, 2));

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

    // Query the auth.users table directly to see what's stored
    console.log('\n🔍 Querying auth.users table directly...');
    const directQuery = `
      SELECT 
        id,
        email,
        raw_user_meta_data,
        raw_app_meta_data
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

    // Also get via admin API
    console.log('\n🔍 Getting user via admin API...');
    const { data: adminUserData, error: adminUserError } = await adminClient.auth.admin.getUserById(testUserId);

    if (adminUserError) {
      console.log(`❌ Admin API error: ${adminUserError.message}`);
    } else {
      console.log('✅ Admin API result:');
      console.log('User metadata:', JSON.stringify(adminUserData.user.user_metadata, null, 2));
      console.log('App metadata:', JSON.stringify(adminUserData.user.app_metadata, null, 2));
    }

    // Test a simple trigger function that just logs what it receives
    console.log('\n🔧 Creating simple test trigger...');
    const testTriggerSql = `
      CREATE OR REPLACE FUNCTION public.test_metadata_trigger()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        -- Insert a test record to see what we get
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
        ) VALUES (
          NEW.id,
          NEW.email,
          NEW.raw_user_meta_data->>'name',
          NEW.raw_user_meta_data->>'role',
          NEW.raw_user_meta_data->>'phone',
          NEW.raw_user_meta_data->>'company_name',
          NEW.raw_user_meta_data->>'department',
          NEW.raw_user_meta_data->>'position',
          'active',
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          phone = EXCLUDED.phone,
          company_name = EXCLUDED.company_name,
          department = EXCLUDED.department,
          position = EXCLUDED.position,
          updated_at = NOW();

        RETURN NEW;
      END;
      $$;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.test_metadata_trigger();
    `;

    const { error: testTriggerError } = await adminClient.rpc('exec_sql', {
      sql: testTriggerSql
    });

    if (testTriggerError) {
      console.log(`❌ Test trigger error: ${testTriggerError.message}`);
    } else {
      console.log('✅ Test trigger created');
    }

    // Create another test user to test the new trigger
    const testEmail2 = `raw-data-test2-${Date.now()}@example.com`;
    console.log('\n📝 Creating second test user...');

    const { data: authData2, error: authError2 } = await adminClient.auth.admin.createUser({
      email: testEmail2,
      password: testPassword,
      user_metadata: testUserData,
      email_confirm: true
    });

    if (authError2) {
      console.log(`❌ Failed to create second user: ${authError2.message}`);
    } else {
      const testUserId2 = authData2.user.id;
      console.log(`✅ Second test user created with ID: ${testUserId2}`);

      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check the profile
      const { data: profileData2, error: profileError2 } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', testUserId2)
        .single();

      if (profileError2) {
        console.log(`❌ Profile query error: ${profileError2.message}`);
      } else {
        console.log('\n✅ Profile created by test trigger:');
        console.log(JSON.stringify(profileData2, null, 2));
      }

      // Cleanup second user
      await adminClient.auth.admin.deleteUser(testUserId2);
    }

    // Cleanup first user
    await adminClient.auth.admin.deleteUser(testUserId);
    console.log('\n✅ Test users deleted');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkRawUserData().catch(console.error);