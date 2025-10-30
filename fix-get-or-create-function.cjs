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

async function fixGetOrCreateFunction() {
  console.log('🔧 Fixing get_or_create_profile_for_current_user function...');

  try {
    // 1. Check current function
    console.log('\n1. Checking current function...');
    
    const currentFunction = await exec_sql(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'get_or_create_profile_for_current_user'
    `);
    
    console.log('📊 Current function:', currentFunction);

    // 2. Drop and recreate the function with correct column name
    console.log('\n2. Dropping and recreating function...');
    
    await exec_sql(`DROP FUNCTION IF EXISTS get_or_create_profile_for_current_user()`);
    console.log('✅ Function dropped');

    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_or_create_profile_for_current_user()
      RETURNS TABLE(
        id uuid,
        name text,
        email text,
        role text,
        department text,
        phone text,
        status text,
        position text,
        employee_id text,
        created_at timestamptz,
        updated_at timestamptz,
        company_name text,
        avatar text,
        preferred_language text,
        country text,
        city text,
        must_change_password boolean
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        user_id uuid;
        profile_exists boolean;
      BEGIN
        -- Get the current user's ID
        user_id := auth.uid();
        
        IF user_id IS NULL THEN
          RAISE EXCEPTION 'User not authenticated';
        END IF;
        
        -- Check if profile exists
        SELECT EXISTS(SELECT 1 FROM profiles WHERE profiles.id = user_id) INTO profile_exists;
        
        -- If profile doesn't exist, create it with metadata from auth.users
        IF NOT profile_exists THEN
          INSERT INTO profiles (
            id, 
            name, 
            email, 
            role, 
            department, 
            phone, 
            company_name, 
            position
          )
          SELECT 
            u.id,
            COALESCE(u.raw_user_meta_data->>'name', ''),
            u.email,
            COALESCE(u.raw_user_meta_data->>'role', ''),
            COALESCE(u.raw_user_meta_data->>'department', ''),
            COALESCE(u.raw_user_meta_data->>'phone', ''),
            COALESCE(u.raw_user_meta_data->>'company_name', ''),
            COALESCE(u.raw_user_meta_data->>'position', '')
          FROM auth.users u
          WHERE u.id = user_id;
        END IF;
        
        -- Return the profile
        RETURN QUERY
        SELECT 
          p.id,
          p.name,
          p.email,
          p.role,
          p.department,
          p.phone,
          p.status,
          p.position,
          p.employee_id,
          p.created_at,
          p.updated_at,
          p.company_name,
          p.avatar,
          p.preferred_language,
          p.country,
          p.city,
          p.must_change_password
        FROM profiles p
        WHERE p.id = user_id;
      END;
      $$`;

    await exec_sql(createFunctionSQL);
    console.log('✅ Function created with correct metadata extraction');

    // 3. Grant permissions
    console.log('\n3. Granting permissions...');
    
    await exec_sql(`GRANT EXECUTE ON FUNCTION get_or_create_profile_for_current_user() TO authenticated`);
    console.log('✅ Permissions granted');

    // 4. Verify the new function
    console.log('\n4. Verifying new function...');
    
    const newFunction = await exec_sql(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'get_or_create_profile_for_current_user'
    `);
    
    console.log('📊 New function definition:');
    if (newFunction && newFunction.length > 0) {
      const definition = newFunction[0].prosrc;
      if (definition.includes('raw_user_meta_data')) {
        console.log('✅ Function uses raw_user_meta_data correctly');
      } else {
        console.log('❌ Function still has issues');
      }
    } else {
      console.log('❌ Function not found');
    }

  } catch (error) {
    console.error('❌ Error fixing function:', error);
    throw error;
  }

  console.log('\n🎉 get_or_create function fix completed!');
}

fixGetOrCreateFunction();