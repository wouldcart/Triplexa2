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

async function forceFix() {
  console.log('🔧 Force fixing functions with complete cleanup...\n');

  try {
    // Step 1: Drop everything related to the trigger and function
    console.log('🗑️ Dropping all triggers and functions...');
    const dropEverythingSql = `
      -- Drop all triggers
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
      
      -- Drop all related functions (try different variations)
      DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
      DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
      DROP FUNCTION IF EXISTS public.handle_new_user_v2() CASCADE;
      DROP FUNCTION IF EXISTS auth.handle_new_user() CASCADE;
      
      -- Also drop the profile function to recreate it
      DROP FUNCTION IF EXISTS public.get_or_create_profile_for_current_user() CASCADE;
    `;

    const { error: dropError } = await adminClient.rpc('exec_sql', {
      sql: dropEverythingSql
    });

    if (dropError) {
      console.log(`❌ Drop error: ${dropError.message}`);
    } else {
      console.log('✅ All functions and triggers dropped');
    }

    // Step 2: Wait a moment for any caching to clear
    console.log('⏳ Waiting for cache to clear...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Create the new handle_new_user function
    console.log('📝 Creating new handle_new_user function...');
    const createHandleFunctionSql = `
      CREATE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        extracted_name text;
        extracted_role text;
        extracted_phone text;
        extracted_company text;
        extracted_department text;
        extracted_position text;
      BEGIN
        -- Extract metadata with proper null handling
        extracted_name := COALESCE(
          NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''), 
          split_part(NEW.email, '@', 1)
        );
        
        extracted_role := COALESCE(
          NULLIF(trim(NEW.raw_user_meta_data->>'role'), ''), 
          'agent'
        );
        
        extracted_phone := NULLIF(trim(NEW.raw_user_meta_data->>'phone'), '');
        
        extracted_company := NULLIF(trim(NEW.raw_user_meta_data->>'company_name'), '');
        
        extracted_department := COALESCE(
          NULLIF(trim(NEW.raw_user_meta_data->>'department'), ''), 
          'General'
        );
        
        extracted_position := COALESCE(
          NULLIF(trim(NEW.raw_user_meta_data->>'position'), ''), 
          'Agent'
        );

        -- Insert profile with extracted data
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
        VALUES (
          NEW.id,
          NEW.email,
          extracted_name,
          extracted_role,
          extracted_phone,
          extracted_company,
          extracted_department,
          extracted_position,
          'active',
          NOW(),
          NOW()
        );
        
        RETURN NEW;
      EXCEPTION
        WHEN others THEN
          -- Log error but don't fail the user creation
          RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
          
          -- Create minimal profile as fallback
          INSERT INTO public.profiles (id, email, name, role, status, created_at, updated_at)
          VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1), 'agent', 'active', NOW(), NOW())
          ON CONFLICT (id) DO NOTHING;
          
          RETURN NEW;
      END;
      $$;
    `;

    const { error: createHandleError } = await adminClient.rpc('exec_sql', {
      sql: createHandleFunctionSql
    });

    if (createHandleError) {
      console.log(`❌ Create handle function error: ${createHandleError.message}`);
    } else {
      console.log('✅ handle_new_user function created');
    }

    // Step 4: Create the trigger
    console.log('📝 Creating trigger...');
    const createTriggerSql = `
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW 
        EXECUTE FUNCTION public.handle_new_user();
    `;

    const { error: createTriggerError } = await adminClient.rpc('exec_sql', {
      sql: createTriggerSql
    });

    if (createTriggerError) {
      console.log(`❌ Create trigger error: ${createTriggerError.message}`);
    } else {
      console.log('✅ Trigger created');
    }

    // Step 5: Create the profile function
    console.log('📝 Creating get_or_create_profile_for_current_user function...');
    const createProfileFunctionSql = `
      CREATE FUNCTION public.get_or_create_profile_for_current_user()
      RETURNS profiles
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        v_uid uuid;
        v_profile profiles;
        v_email text;
        v_raw_user_meta_data jsonb;
        v_name text;
        v_phone text;
        v_company_name text;
        v_role text;
        v_department text;
        v_position text;
      BEGIN
        -- Get current user ID
        v_uid := auth.uid();
        
        IF v_uid IS NULL THEN
          RAISE EXCEPTION 'Not authenticated';
        END IF;

        -- Check if profile already exists
        SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
        
        -- Return existing profile if found
        IF v_profile IS NOT NULL THEN
          RETURN v_profile;
        END IF;

        -- Get user data from auth.users including raw_user_meta_data
        SELECT u.email, u.raw_user_meta_data INTO v_email, v_raw_user_meta_data
        FROM auth.users u 
        WHERE u.id = v_uid;

        -- Extract user data from raw_user_meta_data with fallbacks
        v_name := COALESCE(
          NULLIF(trim(v_raw_user_meta_data->>'name'), ''),
          NULLIF(trim(v_raw_user_meta_data->>'full_name'), ''), 
          split_part(v_email, '@', 1),
          v_uid::text
        );
        
        v_phone := COALESCE(
          NULLIF(trim(v_raw_user_meta_data->>'phone'), ''),
          NULLIF(trim(v_raw_user_meta_data->>'phone_number'), '')
        );
        
        v_company_name := COALESCE(
          NULLIF(trim(v_raw_user_meta_data->>'company_name'), ''),
          NULLIF(trim(v_raw_user_meta_data->>'company'), '')
        );
        
        v_role := COALESCE(
          NULLIF(trim(v_raw_user_meta_data->>'role'), ''),
          'agent'
        );
        
        v_department := COALESCE(
          NULLIF(trim(v_raw_user_meta_data->>'department'), ''),
          'General'
        );
        
        v_position := COALESCE(
          NULLIF(trim(v_raw_user_meta_data->>'position'), ''),
          'Agent'
        );

        -- Create profile row with actual user data
        INSERT INTO public.profiles ( 
          id, email, name, phone, company_name, role, department, status, position, created_at, updated_at 
        ) VALUES ( 
          v_uid, 
          COALESCE(v_email, v_uid::text || '@local'), 
          v_name,
          v_phone,
          v_company_name,
          v_role, 
          v_department, 
          'active', 
          v_position, 
          NOW(), 
          NOW() 
        ) 
        ON CONFLICT (id) DO UPDATE SET 
          email = EXCLUDED.email,
          name = COALESCE(EXCLUDED.name, profiles.name),
          phone = COALESCE(EXCLUDED.phone, profiles.phone),
          company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
          role = COALESCE(EXCLUDED.role, profiles.role),
          department = COALESCE(EXCLUDED.department, profiles.department),
          position = COALESCE(EXCLUDED.position, profiles.position),
          updated_at = NOW() 
        RETURNING * INTO v_profile; 

        RETURN v_profile; 
      END; 
      $$;
    `;

    const { error: createProfileError } = await adminClient.rpc('exec_sql', {
      sql: createProfileFunctionSql
    });

    if (createProfileError) {
      console.log(`❌ Create profile function error: ${createProfileError.message}`);
    } else {
      console.log('✅ get_or_create_profile_for_current_user function created');
    }

    // Step 6: Grant necessary permissions
    console.log('📝 Granting permissions...');
    const grantPermissionsSql = `
      -- Grant permissions on functions
      GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;
      GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated, anon;
      
      -- Grant permissions on auth.users for the functions
      GRANT SELECT ON auth.users TO authenticated;
    `;

    const { error: grantError } = await adminClient.rpc('exec_sql', {
      sql: grantPermissionsSql
    });

    if (grantError) {
      console.log(`❌ Grant permissions error: ${grantError.message}`);
    } else {
      console.log('✅ Permissions granted');
    }

    // Step 7: Verify the function is correct
    console.log('\n📋 Verifying new function...');
    const verifyQuery = `
      SELECT 
        p.proname as function_name,
        pg_get_functiondef(p.oid) as function_definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'handle_new_user'
      AND n.nspname = 'public'
    `;

    const { data: verifyResult, error: verifyError } = await adminClient.rpc('exec_sql', {
      sql: verifyQuery
    });

    if (verifyError) {
      console.log(`❌ Verify query error: ${verifyError.message}`);
    } else {
      if (verifyResult && verifyResult.length > 0) {
        const definition = verifyResult[0].function_definition;
        if (definition.includes('raw_user_meta_data')) {
          console.log('✅ Function now correctly uses raw_user_meta_data');
        } else {
          console.log('❌ Function still does NOT use raw_user_meta_data');
        }
      }
    }

    console.log('\n🎉 Force fix completed!');

  } catch (error) {
    console.error('❌ Force fix failed:', error.message);
  }
}

forceFix().catch(console.error);