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

async function fixProfileTriggerFinal() {
  console.log('🔧 Fixing profile trigger to extract metadata correctly...\n');

  try {
    // Step 1: Drop ALL existing triggers and functions
    console.log('📋 Step 1: Dropping all existing triggers and functions...');
    
    const dropAllSql = `
      -- Drop all existing triggers on auth.users
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      
      -- Drop all existing functions
      DROP FUNCTION IF EXISTS public.handle_new_user();
      DROP FUNCTION IF EXISTS handle_new_user();
    `;

    const { error: dropError } = await adminSupabase.rpc('exec_sql', {
      sql: dropAllSql
    });

    if (dropError) {
      console.error('❌ Drop failed:', dropError);
      return;
    } else {
      console.log('✅ All existing triggers and functions dropped');
    }

    // Step 2: Create the enhanced trigger function
    console.log('\n📋 Step 2: Creating enhanced trigger function...');
    
    const enhancedTriggerSql = `
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
          employee_id,
          status,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
          COALESCE(NEW.raw_user_meta_data->>'role', 'agent'),
          NEW.raw_user_meta_data->>'phone',
          NEW.raw_user_meta_data->>'company_name',
          COALESCE(NEW.raw_user_meta_data->>'department', 'Agents'),
          COALESCE(NEW.raw_user_meta_data->>'position', 'External Agent'),
          NEW.raw_user_meta_data->>'employee_id',
          'active',
          NOW(),
          NOW()
        );
        
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log error but don't fail the user creation
          RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
          RETURN NEW;
      END;
      $$;
    `;

    const { error: functionError } = await adminSupabase.rpc('exec_sql', {
      sql: enhancedTriggerSql
    });

    if (functionError) {
      console.error('❌ Enhanced function creation failed:', functionError);
      return;
    } else {
      console.log('✅ Enhanced trigger function created');
    }

    // Step 3: Create the trigger
    console.log('\n📋 Step 3: Creating the trigger...');
    
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
      console.log('✅ Enhanced trigger created');
    }

    // Step 4: Fix the RPC function
    console.log('\n📋 Step 4: Creating fixed RPC function...');
    
    const fixedRpcSql = `
      CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user()
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        user_profile json;
        current_user_id uuid;
        user_metadata jsonb;
      BEGIN
        -- Get current user ID
        current_user_id := auth.uid();
        
        IF current_user_id IS NULL THEN
          RAISE EXCEPTION 'User not authenticated';
        END IF;

        -- Try to get existing profile
        SELECT row_to_json(p.*) INTO user_profile
        FROM profiles p
        WHERE p.id = current_user_id;

        -- If profile doesn't exist, create it
        IF user_profile IS NULL THEN
          -- Get user metadata from auth.users
          SELECT raw_user_meta_data INTO user_metadata
          FROM auth.users
          WHERE id = current_user_id;

          -- Insert new profile with metadata
          INSERT INTO public.profiles (
            id, 
            email,
            name, 
            phone, 
            company_name, 
            role, 
            department, 
            position,
            status,
            created_at,
            updated_at
          )
          SELECT 
            current_user_id,
            u.email,
            COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
            u.raw_user_meta_data->>'phone',
            u.raw_user_meta_data->>'company_name',
            COALESCE(u.raw_user_meta_data->>'role', 'agent'),
            COALESCE(u.raw_user_meta_data->>'department', 'Agents'),
            COALESCE(u.raw_user_meta_data->>'position', 'External Agent'),
            'active',
            NOW(),
            NOW()
          FROM auth.users u
          WHERE u.id = current_user_id;

          -- Get the newly created profile
          SELECT row_to_json(p.*) INTO user_profile
          FROM profiles p
          WHERE p.id = current_user_id;
        END IF;

        RETURN user_profile;
      END;
      $$;
    `;

    const { error: rpcError } = await adminSupabase.rpc('exec_sql', {
      sql: fixedRpcSql
    });

    if (rpcError) {
      console.error('❌ RPC function creation failed:', rpcError);
      return;
    } else {
      console.log('✅ Fixed RPC function created');
    }

    // Step 5: Test the fixed trigger
    console.log('\n📋 Step 5: Testing the fixed trigger...');
    
    const testEmail = `fixed-trigger-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testUserData = {
      name: 'Fixed Trigger User',
      role: 'manager',
      department: 'Engineering',
      phone: '+1234567890',
      position: 'Senior Developer',
      employee_id: 'FIXED001',
      company_name: 'Fixed Test Company',
      city: 'San Francisco',
      country: 'United States'
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

    // Check profile after creation
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
      const success = profileData.name === testUserData.name &&
                     profileData.phone === testUserData.phone &&
                     profileData.company_name === testUserData.company_name;
      
      if (success) {
        console.log('🎉 SUCCESS: Trigger extracted metadata correctly!');
      } else {
        console.log('❌ FAILED: Metadata extraction incomplete');
        console.log(`Expected name: ${testUserData.name}, Got: ${profileData.name}`);
        console.log(`Expected phone: ${testUserData.phone}, Got: ${profileData.phone}`);
        console.log(`Expected company: ${testUserData.company_name}, Got: ${profileData.company_name}`);
      }
    }

    // Step 6: Test the RPC function
    console.log('\n📋 Step 6: Testing the RPC function...');
    
    const { data: rpcResult, error: rpcTestError } = await adminSupabase.rpc('get_or_create_profile_for_current_user');
    
    if (rpcTestError) {
      console.log('❌ RPC test failed (expected for service role):', rpcTestError.message);
    } else {
      console.log('✅ RPC function works:', rpcResult);
    }

    // Cleanup
    await adminSupabase.from('profiles').delete().eq('id', testUserId);
    await adminSupabase.auth.admin.deleteUser(testUserId);
    console.log('✅ Test user cleaned up');

    console.log('\n🎉 Profile trigger fix completed successfully!');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

fixProfileTriggerFinal().catch(console.error);