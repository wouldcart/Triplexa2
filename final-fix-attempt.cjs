require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalFixAttempt() {
  console.log('🔧 Final attempt to fix the metadata extraction...\n');

  try {
    // First, let's check the current function definition
    console.log('1. Checking current function definition...');
    const { data: currentDef, error: currentDefError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT pg_get_functiondef(oid) as definition
          FROM pg_proc 
          WHERE proname = 'handle_new_user';
        `
      });

    if (currentDefError) {
      console.error('❌ Error checking current definition:', currentDefError);
    } else {
      console.log('📋 Current function definition:');
      console.log(currentDef?.[0]?.definition || 'No definition found');
    }

    // Drop everything and recreate with a completely new approach
    console.log('\n2. Dropping all related functions and triggers...');
    
    const dropCommands = [
      'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;',
      'DROP FUNCTION IF EXISTS handle_new_user() CASCADE;',
      'DROP FUNCTION IF EXISTS get_or_create_profile_for_current_user() CASCADE;'
    ];

    for (const cmd of dropCommands) {
      const { error } = await supabase.rpc('exec_sql', { sql: cmd });
      if (error) {
        console.error(`❌ Error executing: ${cmd}`, error);
      } else {
        console.log(`✅ Executed: ${cmd}`);
      }
    }

    // Wait for cache to clear
    console.log('\n⏳ Waiting for cache to clear...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Create the new handle_new_user function with explicit raw_user_meta_data access
    console.log('\n3. Creating new handle_new_user function...');
    const newHandleUserFunction = `
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $$
      DECLARE
        user_metadata JSONB;
        extracted_name TEXT;
        extracted_phone TEXT;
        extracted_company TEXT;
        extracted_role TEXT;
        extracted_department TEXT;
        extracted_position TEXT;
      BEGIN
        -- Get the raw_user_meta_data from the NEW record
        user_metadata := NEW.raw_user_meta_data;
        
        -- Extract fields with proper null handling
        extracted_name := COALESCE(NULLIF(user_metadata->>'name', ''), NULL);
        extracted_phone := COALESCE(NULLIF(user_metadata->>'phone', ''), NULL);
        extracted_company := COALESCE(NULLIF(user_metadata->>'company_name', ''), NULL);
        extracted_role := COALESCE(NULLIF(user_metadata->>'role', ''), 'employee');
        extracted_department := COALESCE(NULLIF(user_metadata->>'department', ''), NULL);
        extracted_position := COALESCE(NULLIF(user_metadata->>'position', ''), NULL);
        
        -- Insert the profile with extracted metadata
        INSERT INTO public.profiles (
          id, 
          name, 
          email, 
          phone, 
          company_name, 
          role, 
          department, 
          position,
          created_at, 
          updated_at
        ) VALUES (
          NEW.id,
          extracted_name,
          NEW.email,
          extracted_phone,
          extracted_company,
          extracted_role,
          extracted_department,
          extracted_position,
          NOW(),
          NOW()
        );
        
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log the error but don't fail the user creation
          RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error: funcError } = await supabase.rpc('exec_sql', { sql: newHandleUserFunction });
    if (funcError) {
      console.error('❌ Error creating function:', funcError);
      return;
    }
    console.log('✅ handle_new_user function created');

    // Create the trigger
    console.log('\n4. Creating trigger...');
    const triggerSQL = `
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL });
    if (triggerError) {
      console.error('❌ Error creating trigger:', triggerError);
      return;
    }
    console.log('✅ Trigger created');

    // Create the get_or_create_profile_for_current_user function
    console.log('\n5. Creating get_or_create_profile_for_current_user function...');
    const profileFunction = `
      CREATE OR REPLACE FUNCTION get_or_create_profile_for_current_user()
      RETURNS profiles AS $$
      DECLARE
        user_id UUID;
        user_email TEXT;
        user_metadata JSONB;
        profile_record profiles;
      BEGIN
        -- Get current user ID
        user_id := auth.uid();
        
        IF user_id IS NULL THEN
          RAISE EXCEPTION 'Not authenticated';
        END IF;
        
        -- Try to get existing profile
        SELECT * INTO profile_record FROM profiles WHERE id = user_id;
        
        IF FOUND THEN
          RETURN profile_record;
        END IF;
        
        -- Get user data from auth.users
        SELECT email, raw_user_meta_data INTO user_email, user_metadata
        FROM auth.users WHERE id = user_id;
        
        -- Create new profile with metadata
        INSERT INTO profiles (
          id, 
          name, 
          email, 
          phone, 
          company_name, 
          role, 
          department, 
          position,
          created_at, 
          updated_at
        ) VALUES (
          user_id,
          COALESCE(NULLIF(user_metadata->>'name', ''), NULL),
          user_email,
          COALESCE(NULLIF(user_metadata->>'phone', ''), NULL),
          COALESCE(NULLIF(user_metadata->>'company_name', ''), NULL),
          COALESCE(NULLIF(user_metadata->>'role', ''), 'employee'),
          COALESCE(NULLIF(user_metadata->>'department', ''), NULL),
          COALESCE(NULLIF(user_metadata->>'position', ''), NULL),
          NOW(),
          NOW()
        ) RETURNING * INTO profile_record;
        
        RETURN profile_record;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error: profileFuncError } = await supabase.rpc('exec_sql', { sql: profileFunction });
    if (profileFuncError) {
      console.error('❌ Error creating profile function:', profileFuncError);
      return;
    }
    console.log('✅ get_or_create_profile_for_current_user function created');

    // Grant permissions
    console.log('\n6. Granting permissions...');
    const permissions = [
      'GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated, anon;',
      'GRANT EXECUTE ON FUNCTION get_or_create_profile_for_current_user() TO authenticated, anon;',
      'GRANT SELECT ON auth.users TO authenticated, anon;'
    ];

    for (const perm of permissions) {
      const { error } = await supabase.rpc('exec_sql', { sql: perm });
      if (error) {
        console.error(`❌ Error granting permission: ${perm}`, error);
      } else {
        console.log(`✅ Granted: ${perm}`);
      }
    }

    // Verify the new function definition
    console.log('\n7. Verifying new function definition...');
    const { data: newDef, error: newDefError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT pg_get_functiondef(oid) as definition
          FROM pg_proc 
          WHERE proname = 'handle_new_user';
        `
      });

    if (newDefError) {
      console.error('❌ Error checking new definition:', newDefError);
    } else {
      console.log('📋 New function definition:');
      const definition = newDef?.[0]?.definition || 'No definition found';
      console.log(definition);
      
      if (definition.includes('raw_user_meta_data')) {
        console.log('✅ SUCCESS: Function now uses raw_user_meta_data!');
      } else {
        console.log('❌ FAILURE: Function still does not use raw_user_meta_data');
      }
    }

    console.log('\n🎉 Final fix attempt completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

finalFixAttempt();