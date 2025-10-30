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

async function findProfileCreator() {
  console.log('🔍 Finding what creates profiles with null values...\n');

  try {
    // Step 1: Check RLS policies on profiles table
    console.log('📋 Step 1: Checking RLS policies on profiles table...');
    
    const rlsPoliciesSql = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE tablename = 'profiles';
    `;

    const { data: rlsData, error: rlsError } = await adminSupabase.rpc('exec_sql', {
      sql: rlsPoliciesSql
    });

    if (rlsError) {
      console.error('❌ RLS policies check failed:', rlsError);
    } else {
      console.log('✅ RLS policies on profiles:', JSON.stringify(rlsData, null, 2));
    }

    // Step 2: Check if there are any other triggers
    console.log('\n📋 Step 2: Checking for any triggers that might create profiles...');
    
    // Let's try a different approach - check the actual database logs
    // First, let's see if we can find any functions that insert into profiles
    const profileInsertFunctionsSql = `
      SELECT 
        routine_name,
        routine_definition
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      AND routine_definition ILIKE '%INSERT INTO%profiles%'
      OR routine_definition ILIKE '%INSERT INTO public.profiles%';
    `;

    const { data: insertFunctionsData, error: insertFunctionsError } = await adminSupabase.rpc('exec_sql', {
      sql: profileInsertFunctionsSql
    });

    if (insertFunctionsError) {
      console.error('❌ Insert functions check failed:', insertFunctionsError);
    } else {
      console.log('✅ Functions that insert into profiles:', JSON.stringify(insertFunctionsData, null, 2));
    }

    // Step 3: Check if there's a default value or constraint causing this
    console.log('\n📋 Step 3: Checking profiles table constraints and defaults...');
    
    const constraintsSql = `
      SELECT 
        column_name,
        column_default,
        is_nullable,
        data_type
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    const { data: constraintsData, error: constraintsError } = await adminSupabase.rpc('exec_sql', {
      sql: constraintsSql
    });

    if (constraintsError) {
      console.error('❌ Constraints check failed:', constraintsError);
    } else {
      console.log('✅ Profiles table structure:', JSON.stringify(constraintsData, null, 2));
    }

    // Step 4: Let's try to modify our trigger to UPDATE instead of INSERT
    console.log('\n📋 Step 4: Creating UPDATE-based trigger...');
    
    const updateTriggerSql = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        -- Try to insert first, if it fails, update
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
        )
        ON CONFLICT (id) DO UPDATE SET
          name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1)),
          role = COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'agent'),
          phone = NULLIF(NEW.raw_user_meta_data->>'phone', ''),
          company_name = NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
          department = COALESCE(NULLIF(NEW.raw_user_meta_data->>'department', ''), 'General'),
          position = COALESCE(NULLIF(NEW.raw_user_meta_data->>'position', ''), 'Agent'),
          status = 'active',
          updated_at = NOW();

        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- If insert fails, try update
          UPDATE public.profiles SET
            name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1)),
            role = COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'agent'),
            phone = NULLIF(NEW.raw_user_meta_data->>'phone', ''),
            company_name = NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
            department = COALESCE(NULLIF(NEW.raw_user_meta_data->>'department', ''), 'General'),
            position = COALESCE(NULLIF(NEW.raw_user_meta_data->>'position', ''), 'Agent'),
            status = 'active',
            updated_at = NOW()
          WHERE id = NEW.id;
          
          RETURN NEW;
      END;
      $$;
    `;

    const { error: updateTriggerError } = await adminSupabase.rpc('exec_sql', {
      sql: updateTriggerSql
    });

    if (updateTriggerError) {
      console.error('❌ Update trigger creation failed:', updateTriggerError);
    } else {
      console.log('✅ Update-based trigger function created');
    }

    // Step 5: Test the new trigger
    console.log('\n📋 Step 5: Testing the update-based trigger...');
    
    const testEmail = `update-trigger-test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testUserData = {
      name: 'Update Trigger Test User',
      role: 'manager',
      department: 'Engineering',
      phone: '+1234567890',
      position: 'Senior Developer',
      employee_id: 'UPDATE001',
      company_name: 'Update Test Company',
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

    // Wait for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check the profile
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (profileError) {
      console.error('❌ Profile check failed:', profileError);
    } else {
      console.log('✅ Profile after update trigger:', JSON.stringify(profileData, null, 2));
      
      // Check if metadata was extracted correctly
      if (profileData.name === testUserData.name) {
        console.log('🎉 SUCCESS: Name extracted correctly!');
      } else {
        console.log('❌ FAILED: Name not extracted correctly');
        console.log(`Expected: ${testUserData.name}, Got: ${profileData.name}`);
      }
      
      if (profileData.phone === testUserData.phone) {
        console.log('🎉 SUCCESS: Phone extracted correctly!');
      } else {
        console.log('❌ FAILED: Phone not extracted correctly');
        console.log(`Expected: ${testUserData.phone}, Got: ${profileData.phone}`);
      }
      
      if (profileData.company_name === testUserData.company_name) {
        console.log('🎉 SUCCESS: Company name extracted correctly!');
      } else {
        console.log('❌ FAILED: Company name not extracted correctly');
        console.log(`Expected: ${testUserData.company_name}, Got: ${profileData.company_name}`);
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

findProfileCreator().catch(console.error);