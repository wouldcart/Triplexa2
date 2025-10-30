require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function exec_sql(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql: sql });
  if (error) {
    console.error('SQL Error:', error);
    throw error;
  }
  return data;
}

async function forceReplaceGetOrCreate() {
  console.log('🔧 Force replacing get_or_create_profile_for_current_user function...');

  try {
    // 1. Drop ALL versions of the function
    console.log('\n1. Dropping ALL versions of the function...');
    
    try {
      await exec_sql(`DROP FUNCTION IF EXISTS get_or_create_profile_for_current_user() CASCADE`);
      console.log('✅ Function dropped (no args)');
    } catch (e) {
      console.log('⚠️ No function with no args to drop');
    }

    try {
      await exec_sql(`DROP FUNCTION IF EXISTS get_or_create_profile_for_current_user(text) CASCADE`);
      console.log('✅ Function dropped (text arg)');
    } catch (e) {
      console.log('⚠️ No function with text arg to drop');
    }

    try {
      await exec_sql(`DROP FUNCTION IF EXISTS get_or_create_profile_for_current_user(uuid) CASCADE`);
      console.log('✅ Function dropped (uuid arg)');
    } catch (e) {
      console.log('⚠️ No function with uuid arg to drop');
    }

    // 2. Check if any functions still exist
    console.log('\n2. Checking remaining functions...');
    
    const remainingFunctions = await exec_sql(`
      SELECT proname, oid, proargnames, proargtypes::regtype[]
      FROM pg_proc 
      WHERE proname = 'get_or_create_profile_for_current_user'
    `);
    
    console.log('📊 Remaining functions:', remainingFunctions);

    // 3. If any remain, drop them by OID
    if (remainingFunctions && remainingFunctions.length > 0) {
      console.log('\n3. Dropping remaining functions by OID...');
      
      for (const func of remainingFunctions) {
        try {
          await exec_sql(`DROP FUNCTION pg_catalog.pg_get_function_identity_arguments(${func.oid})`);
          console.log(`✅ Dropped function with OID ${func.oid}`);
        } catch (e) {
          console.log(`⚠️ Could not drop function with OID ${func.oid}:`, e.message);
        }
      }
    }

    // 4. Create the new function with a completely new name first
    console.log('\n4. Creating new function with temporary name...');
    
    const tempFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_or_create_profile_for_current_user_v2()
      RETURNS profiles
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_uid uuid;
        v_email text;
        v_user_metadata jsonb;
        v_name text;
        v_phone text;
        v_company_name text;
        v_role text;
        v_department text;
        v_position text;
        v_profile profiles;
      BEGIN
        -- Get the current user's ID
        v_uid := auth.uid();
        
        IF v_uid IS NULL THEN
          RAISE EXCEPTION 'User not authenticated';
        END IF;
        
        -- Check if profile exists
        SELECT * INTO v_profile FROM profiles WHERE id = v_uid;
        
        -- If profile doesn't exist, create it with metadata from auth.users
        IF v_profile.id IS NULL THEN
          -- Get user data from auth.users
          SELECT email, raw_user_meta_data INTO v_email, v_user_metadata
          FROM auth.users 
          WHERE id = v_uid;
          
          -- Extract metadata fields
          v_name := COALESCE(v_user_metadata->>'name', '');
          v_phone := COALESCE(v_user_metadata->>'phone', '');
          v_company_name := COALESCE(v_user_metadata->>'company_name', '');
          v_role := COALESCE(v_user_metadata->>'role', '');
          v_department := COALESCE(v_user_metadata->>'department', '');
          v_position := COALESCE(v_user_metadata->>'position', '');
          
          -- Create profile
          INSERT INTO profiles (
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
          ) VALUES (
            v_uid,
            v_email,
            v_name,
            v_phone,
            v_company_name,
            v_role,
            v_department,
            v_position,
            'active',
            NOW(),
            NOW()
          ) RETURNING * INTO v_profile;
        END IF;
        
        RETURN v_profile;
      END;
      $$`;

    await exec_sql(tempFunctionSQL);
    console.log('✅ Temporary function created');

    // 5. Grant permissions to temporary function
    console.log('\n5. Granting permissions to temporary function...');
    
    await exec_sql(`GRANT EXECUTE ON FUNCTION get_or_create_profile_for_current_user_v2() TO authenticated`);
    console.log('✅ Permissions granted to temporary function');

    // 6. Test the temporary function
    console.log('\n6. Testing temporary function...');
    
    try {
      const testResult = await supabase.rpc('get_or_create_profile_for_current_user_v2');
      console.log('✅ Temporary function test result:', testResult);
    } catch (error) {
      console.log('❌ Temporary function test error:', error);
    }

    // 7. Now create the final function with the original name
    console.log('\n7. Creating final function with original name...');
    
    const finalFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_or_create_profile_for_current_user()
      RETURNS profiles
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_uid uuid;
        v_email text;
        v_user_metadata jsonb;
        v_name text;
        v_phone text;
        v_company_name text;
        v_role text;
        v_department text;
        v_position text;
        v_profile profiles;
      BEGIN
        -- Get the current user's ID
        v_uid := auth.uid();
        
        IF v_uid IS NULL THEN
          RAISE EXCEPTION 'User not authenticated';
        END IF;
        
        -- Check if profile exists
        SELECT * INTO v_profile FROM profiles WHERE id = v_uid;
        
        -- If profile doesn't exist, create it with metadata from auth.users
        IF v_profile.id IS NULL THEN
          -- Get user data from auth.users
          SELECT email, raw_user_meta_data INTO v_email, v_user_metadata
          FROM auth.users 
          WHERE id = v_uid;
          
          -- Extract metadata fields
          v_name := COALESCE(v_user_metadata->>'name', '');
          v_phone := COALESCE(v_user_metadata->>'phone', '');
          v_company_name := COALESCE(v_user_metadata->>'company_name', '');
          v_role := COALESCE(v_user_metadata->>'role', '');
          v_department := COALESCE(v_user_metadata->>'department', '');
          v_position := COALESCE(v_user_metadata->>'position', '');
          
          -- Create profile
          INSERT INTO profiles (
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
          ) VALUES (
            v_uid,
            v_email,
            v_name,
            v_phone,
            v_company_name,
            v_role,
            v_department,
            v_position,
            'active',
            NOW(),
            NOW()
          ) RETURNING * INTO v_profile;
        END IF;
        
        RETURN v_profile;
      END;
      $$`;

    await exec_sql(finalFunctionSQL);
    console.log('✅ Final function created');

    // 8. Grant permissions to final function
    console.log('\n8. Granting permissions to final function...');
    
    await exec_sql(`GRANT EXECUTE ON FUNCTION get_or_create_profile_for_current_user() TO authenticated`);
    console.log('✅ Permissions granted to final function');

    // 9. Drop the temporary function
    console.log('\n9. Dropping temporary function...');
    
    await exec_sql(`DROP FUNCTION IF EXISTS get_or_create_profile_for_current_user_v2()`);
    console.log('✅ Temporary function dropped');

    // 10. Verify the final function
    console.log('\n10. Verifying final function...');
    
    const finalFunction = await exec_sql(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'get_or_create_profile_for_current_user'
    `);
    
    if (finalFunction && finalFunction.length > 0) {
      const definition = finalFunction[0].prosrc;
      if (definition.includes('raw_user_meta_data')) {
        console.log('✅ Final function uses raw_user_meta_data correctly');
      } else {
        console.log('❌ Final function still has issues');
        console.log('Function definition:', definition.substring(0, 500) + '...');
      }
    } else {
      console.log('❌ Final function not found');
    }

  } catch (error) {
    console.error('❌ Error force replacing function:', error);
    throw error;
  }

  console.log('\n🎉 Force replace get_or_create function completed!');
}

forceReplaceGetOrCreate();