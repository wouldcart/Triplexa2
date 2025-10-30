const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqjqfqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxZnFqcWpxanFqcWpxanFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ1NzI2NCwiZXhwIjoyMDUzMDMzMjY0fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exec_sql(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql: sql });
  if (error) {
    console.error('SQL Error:', error);
    throw error;
  }
  return data;
}

async function applyCorrectMigration() {
  console.log('🔧 Applying correct migration for metadata extraction...');

  try {
    // 1. Drop existing function and trigger
    console.log('\n1. Dropping existing function and trigger...');
    
    await exec_sql(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`);
    await exec_sql(`DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE`);
    await exec_sql(`DROP FUNCTION IF EXISTS public.get_or_create_profile_for_current_user() CASCADE`);
    console.log('✅ Existing functions and triggers dropped');

    // 2. Create the correct handle_new_user function from the migration
    console.log('\n2. Creating handle_new_user function...');
    
    const handleNewUserSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        user_name TEXT;
        user_role TEXT;
        user_phone TEXT;
        user_company_name TEXT;
        user_department TEXT;
        user_position TEXT;
        user_employee_id TEXT;
        user_avatar TEXT;
        user_preferred_language TEXT;
        user_country TEXT;
        user_city TEXT;
        user_must_change_password BOOLEAN;
      BEGIN
        -- Extract metadata with fallbacks (prioritize raw_user_meta_data)
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
          NULLIF(NEW.user_metadata->>'department', '')
        );
        
        user_position := COALESCE(
          NULLIF(NEW.raw_user_meta_data->>'position', ''),
          NULLIF(NEW.user_metadata->>'position', '')
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
          NULLIF(NEW.user_metadata->>'preferred_language', ''),
          'en'
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

        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log error but don't fail the user creation
          RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
          RETURN NEW;
      END;
      $$`;

    await exec_sql(handleNewUserSQL);
    console.log('✅ handle_new_user function created');

    // 3. Create the trigger
    console.log('\n3. Creating trigger...');
    
    await exec_sql(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()
    `);
    console.log('✅ Trigger created');

    // 4. Create the correct get_or_create_profile_for_current_user function
    console.log('\n4. Creating get_or_create_profile_for_current_user function...');
    
    const getOrCreateSQL = `
      CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user() 
      RETURNS public.profiles 
      LANGUAGE plpgsql 
      SECURITY DEFINER 
      SET search_path = public 
      AS $$ 
      DECLARE 
        v_profile public.profiles; 
        v_uid uuid := auth.uid(); 
        v_email text;
        v_user_metadata jsonb;
        v_raw_user_metadata jsonb;
        v_name text;
        v_phone text;
        v_company_name text;
        v_role text;
        v_department text;
        v_position text;
      BEGIN 
        -- Return null if no authenticated user 
        IF v_uid IS NULL THEN 
          RETURN NULL; 
        END IF; 

        -- Fetch existing profile without RLS restrictions (SECURITY DEFINER) 
        SELECT p.* INTO v_profile 
        FROM public.profiles p 
        WHERE p.id = v_uid; 

        -- If profile exists, return it 
        IF v_profile IS NOT NULL THEN 
          RETURN v_profile; 
        END IF; 

        -- Get user data from auth.users (requires SECURITY DEFINER) 
        SELECT u.email, u.user_metadata, u.raw_user_meta_data INTO v_email, v_user_metadata, v_raw_user_metadata
        FROM auth.users u 
        WHERE u.id = v_uid; 

        -- Extract metadata with fallbacks (prioritize raw_user_meta_data over user_metadata)
        v_name := COALESCE(
          NULLIF(v_raw_user_metadata->>'name', ''),
          NULLIF(v_user_metadata->>'name', ''),
          split_part(v_email, '@', 1)
        );
        
        v_phone := COALESCE(
          NULLIF(v_raw_user_metadata->>'phone', ''),
          NULLIF(v_user_metadata->>'phone', '')
        );
        
        v_company_name := COALESCE(
          NULLIF(v_raw_user_metadata->>'company_name', ''),
          NULLIF(v_user_metadata->>'company_name', '')
        );
        
        v_role := COALESCE(
          NULLIF(v_raw_user_metadata->>'role', ''),
          NULLIF(v_user_metadata->>'role', ''),
          'agent'
        );
        
        v_department := COALESCE(
          NULLIF(v_raw_user_metadata->>'department', ''),
          NULLIF(v_user_metadata->>'department', '')
        );
        
        v_position := COALESCE(
          NULLIF(v_raw_user_metadata->>'position', ''),
          NULLIF(v_user_metadata->>'position', '')
        );

        -- Create profile with extracted metadata
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
          v_uid,
          v_email,
          v_name,
          v_role,
          v_phone,
          v_company_name,
          v_department,
          v_position,
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
          updated_at = NOW()
        RETURNING * INTO v_profile;

        RETURN v_profile;
      END; 
      $$`;

    await exec_sql(getOrCreateSQL);
    console.log('✅ get_or_create_profile_for_current_user function created');

    // 5. Grant permissions
    console.log('\n5. Granting permissions...');
    
    await exec_sql(`GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated, anon`);
    console.log('✅ Permissions granted');

    // 6. Verify the functions
    console.log('\n6. Verifying functions...');
    
    const functionCheck = await exec_sql(`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname IN ('handle_new_user', 'get_or_create_profile_for_current_user')
    `);
    
    console.log('📊 Functions found:', functionCheck.length);
    functionCheck.forEach(func => {
      console.log(`📊 Function ${func.proname}:`);
      console.log(`  - Uses raw_user_meta_data: ${func.prosrc.includes('raw_user_meta_data')}`);
      console.log(`  - Uses user_metadata: ${func.prosrc.includes('user_metadata')}`);
    });

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  }

  console.log('\n🎉 Correct migration applied successfully!');
}

applyCorrectMigration();