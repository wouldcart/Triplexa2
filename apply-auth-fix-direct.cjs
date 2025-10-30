const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyAuthFix() {
  console.log('🔧 Applying auth fix to database...\n');

  try {
    // Step 1: Clean up existing triggers and functions
    console.log('1. Cleaning up existing triggers and functions...');
    
    const cleanupSql = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      DROP FUNCTION IF EXISTS public.handle_new_user();
    `;
    
    const { error: cleanupError } = await supabase.rpc('exec_sql', { sql: cleanupSql });
    if (cleanupError) {
      console.log('⚠️ Cleanup warning:', cleanupError.message);
    } else {
      console.log('✅ Cleanup completed');
    }

    // Step 2: Create the handle_new_user function
    console.log('\n2. Creating handle_new_user function...');
    
    const functionSql = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        user_name text;
        user_role text;
        user_phone text;
        user_company_name text;
        user_department text;
        user_position text;
        user_employee_id text;
        user_avatar text;
        user_preferred_language text;
        user_country text;
        user_city text;
        user_must_change_password boolean;
      BEGIN
        -- Extract metadata with fallbacks (prioritize raw_user_meta_data over user_metadata)
        user_name := COALESCE(
          NULLIF(NEW.raw_user_meta_data->>'name', ''),
          NULLIF(NEW.user_metadata->>'name', ''),
          split_part(NEW.email, '@', 1)
        );
        
        user_role := COALESCE(
          NULLIF(NEW.raw_user_meta_data->>'role', ''),
          NULLIF(NEW.user_metadata->>'role', ''),
          'agent'
        );
        
        user_phone := COALESCE(
          NULLIF(NEW.raw_user_meta_data->>'phone', ''),
          NULLIF(NEW.user_metadata->>'phone', '')
        );
        
        user_company_name := COALESCE(
          NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
          NULLIF(NEW.user_metadata->>'company_name', '')
        );
        
        user_department := COALESCE(
          NULLIF(NEW.raw_user_meta_data->>'department', ''),
          NULLIF(NEW.user_metadata->>'department', ''),
          'General'
        );
        
        user_position := COALESCE(
          NULLIF(NEW.raw_user_meta_data->>'position', ''),
          NULLIF(NEW.user_metadata->>'position', ''),
          'Agent'
        );
        
        user_employee_id := COALESCE(
          NULLIF(NEW.raw_user_meta_data->>'employee_id', ''),
          NULLIF(NEW.user_metadata->>'employee_id', '')
        );
        
        user_avatar := COALESCE(
          NULLIF(NEW.raw_user_meta_data->>'avatar', ''),
          NULLIF(NEW.user_metadata->>'avatar', '')
        );
        
        user_preferred_language := COALESCE(
          NULLIF(NEW.raw_user_meta_data->>'preferred_language', ''),
          NULLIF(NEW.user_metadata->>'preferred_language', '')
        );
        
        user_country := COALESCE(
          NULLIF(NEW.raw_user_meta_data->>'country', ''),
          NULLIF(NEW.user_metadata->>'country', '')
        );
        
        user_city := COALESCE(
          NULLIF(NEW.raw_user_meta_data->>'city', ''),
          NULLIF(NEW.user_metadata->>'city', '')
        );
        
        user_must_change_password := COALESCE(
          (NEW.raw_user_meta_data->>'must_change_password')::boolean,
          (NEW.user_metadata->>'must_change_password')::boolean,
          false
        );

        -- Insert profile with extracted metadata
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
          user_name,
          user_role,
          user_phone,
          user_company_name,
          user_department,
          user_position,
          user_employee_id,
          user_avatar,
          user_preferred_language,
          user_country,
          user_city,
          user_must_change_password,
          'active',
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = COALESCE(EXCLUDED.name, profiles.name),
          role = COALESCE(EXCLUDED.role, profiles.role),
          phone = COALESCE(EXCLUDED.phone, profiles.phone),
          company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
          department = COALESCE(EXCLUDED.department, profiles.department),
          position = COALESCE(EXCLUDED.position, profiles.position),
          employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
          avatar = COALESCE(EXCLUDED.avatar, profiles.avatar),
          preferred_language = COALESCE(EXCLUDED.preferred_language, profiles.preferred_language),
          country = COALESCE(EXCLUDED.country, profiles.country),
          city = COALESCE(EXCLUDED.city, profiles.city),
          must_change_password = COALESCE(EXCLUDED.must_change_password, profiles.must_change_password),
          updated_at = NOW();

        -- Also create an agent record if role is 'agent'
        IF user_role = 'agent' THEN
          INSERT INTO public.agents (
            id,
            name,
            email,
            role,
            department,
            status,
            created_at,
            updated_at
          ) VALUES (
            NEW.id,
            user_name,
            NEW.email,
            user_role,
            user_department,
            'active',
            NOW(),
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            name = COALESCE(EXCLUDED.name, agents.name),
            email = EXCLUDED.email,
            role = COALESCE(EXCLUDED.role, agents.role),
            department = COALESCE(EXCLUDED.department, agents.department),
            updated_at = NOW();
        END IF;

        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log error but don't fail the user creation
          RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
          RETURN NEW;
      END;
      $$;
    `;

    const { error: functionError } = await supabase.rpc('exec_sql', { sql: functionSql });
    if (functionError) {
      console.log('❌ Function creation failed:', functionError.message);
      return;
    } else {
      console.log('✅ Function created successfully');
    }

    // Step 3: Create the trigger
    console.log('\n3. Creating trigger...');
    
    const triggerSql = `
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSql });
    if (triggerError) {
      console.log('❌ Trigger creation failed:', triggerError.message);
      return;
    } else {
      console.log('✅ Trigger created successfully');
    }

    // Step 4: Grant permissions
    console.log('\n4. Granting permissions...');
    
    const permissionsSql = `
      GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
      GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
      GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
      
      GRANT SELECT ON auth.users TO postgres;
      GRANT SELECT ON auth.users TO service_role;
      
      GRANT INSERT, UPDATE ON public.profiles TO postgres;
      GRANT INSERT, UPDATE ON public.profiles TO service_role;
      GRANT INSERT, UPDATE ON public.agents TO postgres;
      GRANT INSERT, UPDATE ON public.agents TO service_role;
    `;

    const { error: permissionsError } = await supabase.rpc('exec_sql', { sql: permissionsSql });
    if (permissionsError) {
      console.log('⚠️ Permissions warning:', permissionsError.message);
    } else {
      console.log('✅ Permissions granted');
    }

    // Step 5: Fix RLS policies
    console.log('\n5. Setting up RLS policies...');
    
    const rlsSql = `
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
      CREATE POLICY "Users can view own profile" ON public.profiles
        FOR SELECT USING (auth.uid() = id);

      DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
      CREATE POLICY "Users can update own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);

      DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
      CREATE POLICY "Service role can manage all profiles" ON public.profiles
        FOR ALL USING (auth.role() = 'service_role');

      DROP POLICY IF EXISTS "Users can view own agent record" ON public.agents;
      CREATE POLICY "Users can view own agent record" ON public.agents
        FOR SELECT USING (auth.uid() = id);

      DROP POLICY IF EXISTS "Users can update own agent record" ON public.agents;
      CREATE POLICY "Users can update own agent record" ON public.agents
        FOR UPDATE USING (auth.uid() = id);

      DROP POLICY IF EXISTS "Service role can manage all agents" ON public.agents;
      CREATE POLICY "Service role can manage all agents" ON public.agents
        FOR ALL USING (auth.role() = 'service_role');
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSql });
    if (rlsError) {
      console.log('⚠️ RLS setup warning:', rlsError.message);
    } else {
      console.log('✅ RLS policies configured');
    }

    // Step 6: Verify the setup
    console.log('\n6. Verifying setup...');
    
    const verificationSql = `
      SELECT 
        (SELECT COUNT(*) FROM pg_proc WHERE proname = 'handle_new_user') as function_exists,
        (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created') as trigger_exists;
    `;

    const { data: verification, error: verificationError } = await supabase.rpc('exec_sql', { sql: verificationSql });
    if (verificationError) {
      console.log('❌ Verification failed:', verificationError.message);
    } else if (verification && verification.length > 0) {
      const result = verification[0];
      console.log(`✅ Function exists: ${result.function_exists > 0 ? 'Yes' : 'No'}`);
      console.log(`✅ Trigger exists: ${result.trigger_exists > 0 ? 'Yes' : 'No'}`);
    }

    console.log('\n🎉 Auth fix application completed!');
    console.log('\nNext steps:');
    console.log('1. Test signup with: node test-signup-after-manual-fix.cjs');
    console.log('2. Check that profiles are created automatically');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

applyAuthFix();