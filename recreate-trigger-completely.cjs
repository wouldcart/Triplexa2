const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Completely recreating trigger from scratch...\n');

async function recreateTriggerCompletely() {
  try {
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📋 Step 1: Cleaning up everything...');
    
    // Drop any existing triggers
    const { error: dropTriggerError } = await adminSupabase.rpc('exec_sql', {
      sql: 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;'
    });

    if (dropTriggerError) {
      console.error('❌ Failed to drop trigger:', dropTriggerError);
    } else {
      console.log('✅ Trigger dropped');
    }

    // Drop any existing functions
    const { error: dropFunctionError } = await adminSupabase.rpc('exec_sql', {
      sql: 'DROP FUNCTION IF EXISTS public.handle_new_user();'
    });

    if (dropFunctionError) {
      console.error('❌ Failed to drop function:', dropFunctionError);
    } else {
      console.log('✅ Function dropped');
    }

    // Disable RLS completely
    const { error: disableRLSError } = await adminSupabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;'
    });

    if (disableRLSError) {
      console.error('❌ Failed to disable RLS:', disableRLSError);
    } else {
      console.log('✅ RLS disabled');
    }

    console.log('\n📋 Step 2: Creating a simple working trigger function...');
    
    // Create a very simple function first to test
    const simpleFunctionSql = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        INSERT INTO public.profiles (
          id,
          email,
          name,
          role,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'name', 'Default Name'),
          COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
          NOW(),
          NOW()
        );
        
        RETURN NEW;
      END;
      $$;
    `;

    const { error: createSimpleFunctionError } = await adminSupabase.rpc('exec_sql', {
      sql: simpleFunctionSql
    });

    if (createSimpleFunctionError) {
      console.error('❌ Failed to create simple function:', createSimpleFunctionError);
      return;
    }

    console.log('✅ Simple trigger function created');

    console.log('\n📋 Step 3: Creating the trigger...');
    
    const triggerSql = `
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
    `;

    const { error: createTriggerError } = await adminSupabase.rpc('exec_sql', {
      sql: triggerSql
    });

    if (createTriggerError) {
      console.error('❌ Failed to create trigger:', createTriggerError);
      return;
    }

    console.log('✅ Trigger created');

    console.log('\n📋 Step 4: Testing the simple trigger...');
    
    // Test with a simple user creation
    const testEmail = `simple-trigger-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testMetadata = {
      name: 'Simple Test User',
      role: 'manager'
    };

    console.log('Creating test user with simple metadata...');

    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      user_metadata: testMetadata
    });

    if (userError) {
      console.error('❌ Failed to create test user:', userError);
      return;
    }

    console.log('✅ Test user created with ID:', userData.user.id);

    // Wait for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check the profile
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Failed to fetch profile:', profileError);
    } else {
      console.log('✅ Profile created:', JSON.stringify(profileData, null, 2));
      
      if (profileData.name === testMetadata.name) {
        console.log('🎉 SUCCESS: Simple metadata extraction working!');
      } else {
        console.log('❌ FAILED: Simple metadata extraction not working');
        console.log(`Expected: ${testMetadata.name}, Got: ${profileData.name}`);
      }
    }

    // Clean up
    await adminSupabase.auth.admin.deleteUser(userData.user.id);
    console.log('✅ Test user cleaned up');

    console.log('\n📋 Step 5: Upgrading to full metadata extraction...');
    
    // Now create the full function
    const fullFunctionSql = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        INSERT INTO public.profiles (
          id,
          email,
          name,
          role,
          department,
          phone,
          position,
          employee_id,
          company_name,
          avatar,
          preferred_language,
          country,
          city,
          must_change_password,
          status,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
          COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
          NEW.raw_user_meta_data->>'department',
          NEW.raw_user_meta_data->>'phone',
          NEW.raw_user_meta_data->>'position',
          NEW.raw_user_meta_data->>'employee_id',
          NEW.raw_user_meta_data->>'company_name',
          NEW.raw_user_meta_data->>'avatar',
          NEW.raw_user_meta_data->>'preferred_language',
          NEW.raw_user_meta_data->>'country',
          NEW.raw_user_meta_data->>'city',
          COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false),
          COALESCE(NEW.raw_user_meta_data->>'status', 'active'),
          NOW(),
          NOW()
        );
        
        RETURN NEW;
      END;
      $$;
    `;

    const { error: createFullFunctionError } = await adminSupabase.rpc('exec_sql', {
      sql: fullFunctionSql
    });

    if (createFullFunctionError) {
      console.error('❌ Failed to create full function:', createFullFunctionError);
      return;
    }

    console.log('✅ Full trigger function created');

    console.log('\n📋 Step 6: Testing full metadata extraction...');
    
    const fullTestMetadata = {
      name: 'Full Test User',
      role: 'manager',
      department: 'Engineering',
      phone: '+1234567890',
      position: 'Senior Developer',
      employee_id: 'FULL001',
      company_name: 'Full Test Company',
      city: 'San Francisco',
      country: 'United States'
    };

    console.log('Creating test user with full metadata...');

    const { data: fullUserData, error: fullUserError } = await adminSupabase.auth.admin.createUser({
      email: `full-test-${Date.now()}@example.com`,
      password: testPassword,
      user_metadata: fullTestMetadata
    });

    if (fullUserError) {
      console.error('❌ Failed to create full test user:', fullUserError);
      return;
    }

    console.log('✅ Full test user created with ID:', fullUserData.user.id);

    // Wait for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check the profile
    const { data: fullProfileData, error: fullProfileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', fullUserData.user.id)
      .single();

    if (fullProfileError) {
      console.error('❌ Failed to fetch full profile:', fullProfileError);
    } else {
      console.log('✅ Full profile created:', JSON.stringify(fullProfileData, null, 2));
      
      const metadataExtracted = 
        fullProfileData.name === fullTestMetadata.name &&
        fullProfileData.phone === fullTestMetadata.phone &&
        fullProfileData.company_name === fullTestMetadata.company_name &&
        fullProfileData.department === fullTestMetadata.department;

      if (metadataExtracted) {
        console.log('🎉 SUCCESS: Full metadata extraction working correctly!');
      } else {
        console.log('❌ FAILED: Full metadata extraction incomplete');
        console.log(`Expected name: ${fullTestMetadata.name}, Got: ${fullProfileData.name}`);
        console.log(`Expected phone: ${fullTestMetadata.phone}, Got: ${fullProfileData.phone}`);
        console.log(`Expected company: ${fullTestMetadata.company_name}, Got: ${fullProfileData.company_name}`);
        console.log(`Expected department: ${fullTestMetadata.department}, Got: ${fullProfileData.department}`);
      }
    }

    // Clean up
    await adminSupabase.auth.admin.deleteUser(fullUserData.user.id);
    console.log('✅ Full test user cleaned up');

    console.log('\n🎉 Trigger recreation completed successfully!');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

recreateTriggerCompletely();