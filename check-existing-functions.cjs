require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkExistingFunctions() {
  console.log('🔍 Checking existing profile functions...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Get detailed info about upsert_profile_from_staff
    console.log('📋 Checking upsert_profile_from_staff function...');
    const functionInfo = await supabase.rpc('exec_sql', {
      sql: `SELECT 
        p.proname,
        p.prorettype::regtype as return_type,
        p.prosecdef,
        p.proargnames,
        p.proargtypes::regtype[] as arg_types,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
      AND p.proname = 'upsert_profile_from_staff'`
    });
    
    console.log('🔍 upsert_profile_from_staff details:', functionInfo.data);
    
    // Try calling upsert_profile_from_staff to see what it does
    console.log('🧪 Testing upsert_profile_from_staff...');
    const testResult = await supabase.rpc('upsert_profile_from_staff');
    
    if (testResult.error) {
      console.error('❌ upsert_profile_from_staff failed:', testResult.error);
    } else {
      console.log('✅ upsert_profile_from_staff result:', testResult.data);
    }
    
    // Check if there are any errors in the PostgreSQL logs by trying to create our function again
    console.log('🔧 Attempting to create function again with error checking...');
    
    const createResult = await supabase.rpc('exec_sql', {
      sql: `CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  user_id uuid;
  user_email text;
  profile_record record;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN json_build_object(
      'id', null,
      'name', null,
      'email', null,
      'role', null,
      'created_at', null,
      'updated_at', null
    );
  END IF;
  
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  SELECT * INTO profile_record FROM public.profiles WHERE id = user_id;
  
  IF FOUND THEN
    RETURN row_to_json(profile_record);
  END IF;
  
  INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
  VALUES (
    user_id,
    COALESCE(user_email, 'Unknown User'),
    COALESCE(user_email, ''),
    'agent',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW(),
    email = CASE 
      WHEN profiles.email = '' OR profiles.email IS NULL 
      THEN COALESCE(user_email, profiles.email)
      ELSE profiles.email
    END
  RETURNING *;
  
  GET DIAGNOSTICS profile_record = ROW_COUNT;
  SELECT * INTO profile_record FROM public.profiles WHERE id = user_id;
  
  RETURN row_to_json(profile_record);
END;
$$`
    });
    
    if (createResult.error) {
      console.error('❌ Function creation failed:', createResult.error);
    } else {
      console.log('✅ Function creation result:', createResult.data);
      
      // Now check if it exists
      const checkResult = await supabase.rpc('exec_sql', {
        sql: `SELECT proname FROM pg_proc p
              JOIN pg_namespace n ON p.pronamespace = n.oid
              WHERE n.nspname = 'public' 
              AND p.proname = 'get_or_create_profile_for_current_user'`
      });
      
      console.log('🔍 Function exists check:', checkResult.data);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkExistingFunctions();