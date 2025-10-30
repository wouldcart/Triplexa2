require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixTriggerCompletely() {
  console.log('🔧 Fixing trigger completely...\n');

  try {
    // Step 1: Drop existing trigger and function
    console.log('📋 Step 1: Dropping existing trigger and function...');
    
    const dropTriggerSql = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      DROP FUNCTION IF EXISTS public.handle_new_user();
    `;

    const { error: dropError } = await adminSupabase.rpc('exec_sql', {
      sql: dropTriggerSql
    });

    if (dropError) {
      console.error('❌ Drop failed:', dropError);
    } else {
      console.log('✅ Existing trigger and function dropped');
    }

    // Step 2: Create new function with correct metadata access
    console.log('\n📋 Step 2: Creating new trigger function...');
    
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        -- Insert profile with metadata extraction
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
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1)),
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'agent'),
          NULLIF(NEW.raw_user_meta_data->>'phone', ''),
          NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'department', ''), 'General'),
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'position', ''), 'Agent'),
          'active',
          NOW(),
          NOW()
        );

        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log error but don't fail the user creation
          RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
          RETURN NEW;
      END;
      $$;
    `;

    const { error: functionError } = await adminSupabase.rpc('exec_sql', {
      sql: createFunctionSql
    });

    if (functionError) {
      console.error('❌ Function creation failed:', functionError);
      return;
    } else {
      console.log('✅ New trigger function created');
    }

    // Step 3: Create trigger
    console.log('\n📋 Step 3: Creating trigger...');
    
    const createTriggerSql = `
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

    const { error: triggerError } = await adminSupabase.rpc('exec_sql', {
      sql: createTriggerSql
    });

    if (triggerError) {
      console.error('❌ Trigger creation failed:', triggerError);
      return;
    } else {
      console.log('✅ Trigger created');
    }

    // Step 4: Test the trigger
    console.log('\n📋 Step 4: Testing the trigger...');
    
    const testEmail = `trigger-test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testUserData = {
      name: 'Trigger Test User',
      role: 'manager',
      department: 'Engineering',
      phone: '+1234567890',
      position: 'Senior Developer',
      employee_id: 'TRIG001',
      company_name: 'Trigger Test Company',
      city: 'San Francisco',
      country: 'United States',
      must_change_password: false
    };

    console.log('Creating test user with metadata:', JSON.stringify(testUserData, null, 2));

    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: testUserData
    });

    if (userError) {
      console.error('❌ Test user creation failed:', userError);
      return;
    }

    const testUserId = userData.user.id;
    console.log('✅ Test user created with ID:', testUserId);

    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check the profile
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (profileError) {
      console.error('❌ Profile check failed:', profileError);
    } else {
      console.log('✅ Profile created by trigger:', JSON.stringify(profileData, null, 2));
      
      // Check if metadata was extracted correctly
      if (profileData.name === testUserData.name) {
        console.log('🎉 SUCCESS: Name extracted correctly!');
      } else {
        console.log('❌ FAILED: Name not extracted correctly');
      }
      
      if (profileData.phone === testUserData.phone) {
        console.log('🎉 SUCCESS: Phone extracted correctly!');
      } else {
        console.log('❌ FAILED: Phone not extracted correctly');
      }
      
      if (profileData.company_name === testUserData.company_name) {
        console.log('🎉 SUCCESS: Company name extracted correctly!');
      } else {
        console.log('❌ FAILED: Company name not extracted correctly');
      }
    }

    // Cleanup
    await adminSupabase.from('profiles').delete().eq('id', testUserId);
    await adminSupabase.auth.admin.deleteUser(testUserId);
    console.log('✅ Test user cleaned up');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

fixTriggerCompletely().catch(console.error);