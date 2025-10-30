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

async function investigateProfileCreation() {
  console.log('🔍 Investigating profile creation mechanism...\n');

  try {
    // Step 1: Check if there are any RLS policies that auto-create profiles
    console.log('📋 Step 1: Checking for RLS policies...');
    
    const { data: rlsData, error: rlsError } = await adminSupabase
      .from('profiles')
      .select('*')
      .limit(1);

    console.log('RLS check result:', rlsError ? rlsError : 'RLS accessible');

    // Step 2: Check if there's a default value or constraint creating profiles
    console.log('\n📋 Step 2: Checking profiles table for auto-creation mechanisms...');
    
    // Let's try to see what happens when we create a user without any profile creation
    const testEmail = `investigate-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    console.log('Creating user without any profile handling...');
    
    // First, let's drop our trigger to see what happens
    const dropTriggerSql = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      DROP FUNCTION IF EXISTS public.handle_new_user();
    `;

    await adminSupabase.rpc('exec_sql', { sql: dropTriggerSql });
    console.log('✅ Dropped our trigger');

    // Create user
    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Investigation User',
        role: 'test',
        company_name: 'Test Company'
      }
    });

    if (userError) {
      console.error('❌ User creation failed:', userError);
      return;
    }

    const testUserId = userData.user.id;
    console.log('✅ User created with ID:', testUserId);

    // Check if profile was created automatically
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (profileError) {
      console.log('❌ No profile found:', profileError.message);
    } else {
      console.log('🔍 Profile was created automatically:', JSON.stringify(profileData, null, 2));
    }

    // Step 3: Check what's in the auth.users table
    console.log('\n📋 Step 3: Checking auth.users data...');
    
    const { data: authUserData, error: authError } = await adminSupabase.auth.admin.getUserById(testUserId);
    
    if (authError) {
      console.error('❌ Auth user check failed:', authError);
    } else {
      console.log('✅ Auth user data:', JSON.stringify(authUserData.user, null, 2));
    }

    // Step 4: Check if there are any other triggers on auth.users
    console.log('\n📋 Step 4: Checking for other triggers...');
    
    // Try to query pg_trigger directly using a different approach
    const checkTriggersQuery = `
      SELECT 
        t.tgname as trigger_name,
        p.proname as function_name,
        t.tgenabled as enabled
      FROM pg_trigger t
      JOIN pg_proc p ON t.tgfoid = p.oid
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'auth' AND c.relname = 'users'
    `;

    const { data: triggersData, error: triggersError } = await adminSupabase.rpc('exec_sql', {
      sql: checkTriggersQuery
    });

    if (triggersError) {
      console.log('❌ Triggers check failed:', triggersError);
    } else {
      console.log('✅ Triggers on auth.users:', triggersData);
    }

    // Step 5: Let's try creating a working trigger with a different approach
    console.log('\n📋 Step 5: Creating a working trigger...');
    
    const workingTriggerSql = `
      -- Create function that inserts or updates profile
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- Insert or update profile
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
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          COALESCE(NEW.raw_user_meta_data->>'role', 'agent'),
          NEW.raw_user_meta_data->>'phone',
          NEW.raw_user_meta_data->>'company_name',
          NEW.raw_user_meta_data->>'department',
          NEW.raw_user_meta_data->>'position',
          'active',
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = COALESCE(NEW.raw_user_meta_data->>'name', profiles.name),
          role = COALESCE(NEW.raw_user_meta_data->>'role', profiles.role),
          phone = COALESCE(NEW.raw_user_meta_data->>'phone', profiles.phone),
          company_name = COALESCE(NEW.raw_user_meta_data->>'company_name', profiles.company_name),
          department = COALESCE(NEW.raw_user_meta_data->>'department', profiles.department),
          position = COALESCE(NEW.raw_user_meta_data->>'position', profiles.position),
          status = 'active',
          updated_at = NOW();

        RETURN NEW;
      END;
      $$;

      -- Create trigger
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

    const { error: workingTriggerError } = await adminSupabase.rpc('exec_sql', {
      sql: workingTriggerSql
    });

    if (workingTriggerError) {
      console.error('❌ Working trigger creation failed:', workingTriggerError);
    } else {
      console.log('✅ Working trigger created');
    }

    // Test the working trigger
    console.log('\n📋 Step 6: Testing the working trigger...');
    
    const testEmail2 = `working-trigger-${Date.now()}@example.com`;
    const testUserData2 = {
      name: 'Working Trigger User',
      role: 'manager',
      department: 'Engineering',
      phone: '+1234567890',
      position: 'Senior Developer',
      company_name: 'Working Test Company'
    };

    const { data: userData2, error: userError2 } = await adminSupabase.auth.admin.createUser({
      email: testEmail2,
      password: testPassword,
      email_confirm: true,
      user_metadata: testUserData2
    });

    if (userError2) {
      console.error('❌ Test user 2 creation failed:', userError2);
    } else {
      const testUserId2 = userData2.user.id;
      console.log('✅ Test user 2 created with ID:', testUserId2);

      // Check profile
      const { data: profileData2, error: profileError2 } = await adminSupabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId2)
        .single();

      if (profileError2) {
        console.error('❌ Profile 2 check failed:', profileError2);
      } else {
        console.log('✅ Profile 2 after trigger:', JSON.stringify(profileData2, null, 2));
        
        if (profileData2.name === testUserData2.name) {
          console.log('🎉 SUCCESS: Working trigger extracted metadata correctly!');
        } else {
          console.log('❌ FAILED: Working trigger did not extract metadata');
        }
      }

      // Cleanup
      await adminSupabase.from('profiles').delete().eq('id', testUserId2);
      await adminSupabase.auth.admin.deleteUser(testUserId2);
      console.log('✅ Test user 2 cleaned up');
    }

    // Cleanup first test user
    if (profileData) {
      await adminSupabase.from('profiles').delete().eq('id', testUserId);
    }
    await adminSupabase.auth.admin.deleteUser(testUserId);
    console.log('✅ Test user 1 cleaned up');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

investigateProfileCreation().catch(console.error);