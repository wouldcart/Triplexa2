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

async function simpleTriggerTest() {
  console.log('🔧 Testing simple trigger approach...\n');

  try {
    // Step 1: Create a very simple trigger that just logs
    console.log('📋 Step 1: Creating simple logging trigger...');
    
    const simpleTriggerSql = `
      -- Drop existing trigger and function
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      DROP FUNCTION IF EXISTS public.handle_new_user();

      -- Create simple function that just updates existing profile
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        -- Wait a moment to ensure profile exists
        PERFORM pg_sleep(0.1);
        
        -- Update the profile that was already created
        UPDATE public.profiles SET
          name = COALESCE(NEW.raw_user_meta_data->>'name', 'Trigger Worked'),
          phone = NEW.raw_user_meta_data->>'phone',
          company_name = NEW.raw_user_meta_data->>'company_name',
          role = COALESCE(NEW.raw_user_meta_data->>'role', 'agent'),
          department = NEW.raw_user_meta_data->>'department',
          position = NEW.raw_user_meta_data->>'position',
          status = 'active',
          updated_at = NOW()
        WHERE id = NEW.id;

        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Ignore errors for now
          RETURN NEW;
      END;
      $$;

      -- Create trigger
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

    const { error: triggerError } = await adminSupabase.rpc('exec_sql', {
      sql: simpleTriggerSql
    });

    if (triggerError) {
      console.error('❌ Simple trigger creation failed:', triggerError);
      return;
    } else {
      console.log('✅ Simple trigger created');
    }

    // Step 2: Test the trigger
    console.log('\n📋 Step 2: Testing the simple trigger...');
    
    const testEmail = `simple-trigger-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testUserData = {
      name: 'Simple Trigger User',
      role: 'manager',
      department: 'Engineering',
      phone: '+1234567890',
      position: 'Senior Developer',
      employee_id: 'SIMPLE001',
      company_name: 'Simple Test Company',
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

    // Check profile immediately
    const { data: immediateProfile, error: immediateError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    console.log('Profile immediately after creation:', JSON.stringify(immediateProfile, null, 2));

    // Wait for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check the profile again
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (profileError) {
      console.error('❌ Profile check failed:', profileError);
    } else {
      console.log('✅ Profile after trigger execution:', JSON.stringify(profileData, null, 2));
      
      // Check if trigger worked
      if (profileData.name === 'Trigger Worked' || profileData.name === testUserData.name) {
        console.log('🎉 SUCCESS: Trigger executed and updated profile!');
      } else {
        console.log('❌ FAILED: Trigger did not execute');
      }
    }

    // Step 3: Try manual update to see if it works
    console.log('\n📋 Step 3: Testing manual profile update...');
    
    const { data: manualUpdateData, error: manualUpdateError } = await adminSupabase
      .from('profiles')
      .update({
        name: 'Manual Update Test',
        phone: testUserData.phone,
        company_name: testUserData.company_name,
        role: testUserData.role,
        department: testUserData.department,
        position: testUserData.position,
        updated_at: new Date().toISOString()
      })
      .eq('id', testUserId);

    if (manualUpdateError) {
      console.error('❌ Manual update failed:', manualUpdateError);
    } else {
      console.log('✅ Manual update successful');
      
      // Check the manually updated profile
      const { data: manualProfileData, error: manualProfileError } = await adminSupabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single();

      if (manualProfileError) {
        console.error('❌ Manual profile check failed:', manualProfileError);
      } else {
        console.log('✅ Manually updated profile:', JSON.stringify(manualProfileData, null, 2));
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

simpleTriggerTest().catch(console.error);