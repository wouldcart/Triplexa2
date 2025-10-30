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

async function testTriggerPermissions() {
  console.log('🔍 Testing trigger permissions and context...\n');

  try {
    // Create a trigger that logs everything it can see
    console.log('🔧 Creating comprehensive debug trigger...');
    const debugTriggerSql = `
      CREATE OR REPLACE FUNCTION public.debug_metadata_trigger()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        metadata_text text;
        name_value text;
        role_value text;
        phone_value text;
      BEGIN
        -- Try to convert the metadata to text for logging
        BEGIN
          metadata_text := NEW.raw_user_meta_data::text;
        EXCEPTION
          WHEN OTHERS THEN
            metadata_text := 'ERROR: ' || SQLERRM;
        END;

        -- Try to extract individual values
        BEGIN
          name_value := NEW.raw_user_meta_data->>'name';
        EXCEPTION
          WHEN OTHERS THEN
            name_value := 'ERROR: ' || SQLERRM;
        END;

        BEGIN
          role_value := NEW.raw_user_meta_data->>'role';
        EXCEPTION
          WHEN OTHERS THEN
            role_value := 'ERROR: ' || SQLERRM;
        END;

        BEGIN
          phone_value := NEW.raw_user_meta_data->>'phone';
        EXCEPTION
          WHEN OTHERS THEN
            phone_value := 'ERROR: ' || SQLERRM;
        END;

        -- Insert debug info into profiles table
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
          COALESCE(name_value, 'NULL_NAME'),
          COALESCE(role_value, 'NULL_ROLE'),
          COALESCE(phone_value, 'NULL_PHONE'),
          'DEBUG: ' || COALESCE(metadata_text, 'NULL_METADATA'),
          'name_extracted: ' || COALESCE(name_value, 'NULL'),
          'role_extracted: ' || COALESCE(role_value, 'NULL'),
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
      EXCEPTION
        WHEN OTHERS THEN
          -- If all else fails, insert error info
          INSERT INTO public.profiles (
            id, 
            email, 
            name,
            role,
            company_name,
            status,
            created_at,
            updated_at
          ) VALUES (
            NEW.id,
            NEW.email,
            'TRIGGER_ERROR',
            'TRIGGER_ERROR',
            'ERROR: ' || SQLERRM,
            'error',
            NOW(),
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            company_name = EXCLUDED.company_name,
            updated_at = NOW();
          RETURN NEW;
      END;
      $$;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.debug_metadata_trigger();
    `;

    const { error: debugTriggerError } = await adminClient.rpc('exec_sql', {
      sql: debugTriggerSql
    });

    if (debugTriggerError) {
      console.log(`❌ Debug trigger error: ${debugTriggerError.message}`);
      return;
    } else {
      console.log('✅ Debug trigger created');
    }

    // Create test user
    const testEmail = `debug-permissions-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testUserData = {
      name: 'Debug Permissions User',
      phone: '+1234567890',
      company_name: 'Debug Company',
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

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check the profile to see what the trigger captured
    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (profileError) {
      console.log(`❌ Profile query error: ${profileError.message}`);
    } else {
      console.log('\n✅ Debug profile created by trigger:');
      console.log(JSON.stringify(profileData, null, 2));
      
      console.log('\n📋 Debug Analysis:');
      console.log(`- Name extracted: ${profileData.name}`);
      console.log(`- Role extracted: ${profileData.role}`);
      console.log(`- Phone extracted: ${profileData.phone}`);
      console.log(`- Metadata debug: ${profileData.company_name}`);
      console.log(`- Department debug: ${profileData.department}`);
      console.log(`- Position debug: ${profileData.position}`);
    }

    // Cleanup
    await adminClient.auth.admin.deleteUser(testUserId);
    console.log('\n✅ Test user deleted');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTriggerPermissions().catch(console.error);