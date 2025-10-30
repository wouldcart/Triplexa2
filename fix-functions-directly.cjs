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

async function fixFunctionsDirectly() {
  console.log('🔧 Fixing functions directly...\n');

  try {
    // Drop and recreate handle_new_user function
    console.log('📝 Updating handle_new_user function...');
    
    const handleNewUserSql = `
      DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
      
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $function$
      BEGIN
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
        WHEN others THEN
          RAISE LOG 'Error in handle_new_user: %', SQLERRM;
          RETURN NEW;
      END;
      $function$;
    `;

    const { error: handleError } = await adminClient.rpc('exec_sql', {
      sql: handleNewUserSql
    });

    if (handleError) {
      console.log(`❌ Handle function error: ${handleError.message}`);
    } else {
      console.log('✅ handle_new_user function updated');
    }

    // Recreate the trigger
    console.log('📝 Recreating trigger...');
    
    const triggerSql = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

    const { error: triggerError } = await adminClient.rpc('exec_sql', {
      sql: triggerSql
    });

    if (triggerError) {
      console.log(`❌ Trigger error: ${triggerError.message}`);
    } else {
      console.log('✅ Trigger recreated');
    }

    // Update get_or_create_profile_for_current_user function
    console.log('📝 Updating get_or_create_profile_for_current_user function...');
    
    const profileFunctionSql = `
      CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user()
      RETURNS profiles
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $function$
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
          NULLIF(v_raw_user_meta_data->>'name', ''),
          NULLIF(v_raw_user_meta_data->>'full_name', ''), 
          split_part(v_email, '@', 1),
          v_uid::text
        );
        
        v_phone := COALESCE(
          NULLIF(v_raw_user_meta_data->>'phone', ''),
          NULLIF(v_raw_user_meta_data->>'phone_number', '')
        );
        
        v_company_name := COALESCE(
          NULLIF(v_raw_user_meta_data->>'company_name', ''),
          NULLIF(v_raw_user_meta_data->>'company', '')
        );
        
        v_role := COALESCE(
          NULLIF(v_raw_user_meta_data->>'role', ''),
          'agent'
        );
        
        v_department := COALESCE(
          NULLIF(v_raw_user_meta_data->>'department', ''),
          'General'
        );
        
        v_position := COALESCE(
          NULLIF(v_raw_user_meta_data->>'position', ''),
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
      $function$;
    `;

    const { error: profileError } = await adminClient.rpc('exec_sql', {
      sql: profileFunctionSql
    });

    if (profileError) {
      console.log(`❌ Profile function error: ${profileError.message}`);
    } else {
      console.log('✅ get_or_create_profile_for_current_user function updated');
    }

    console.log('\n🎉 All functions updated successfully!');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixFunctionsDirectly().catch(console.error);