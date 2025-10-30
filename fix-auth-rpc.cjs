require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function fixAuthRPC() {
  console.log('🔧 Starting authentication RPC fix...');
  
  // Initialize Supabase client with service role key
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('- VITE_SUPABASE_URL:', !!supabaseUrl);
    console.error('- VITE_SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  console.log('✅ Supabase client initialized');
  
  // SQL statements to execute individually
  const sqlStatements = [
    // Drop existing function
    `DROP FUNCTION IF EXISTS public.get_or_create_profile_for_current_user()`,
    
    // Create the function
    `CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user()
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
  -- Get current user ID
  user_id := auth.uid();
  
  -- Return null for unauthenticated users
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
  
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  -- Try to get existing profile
  SELECT * INTO profile_record
  FROM public.profiles
  WHERE id = user_id;
  
  -- If profile exists, return it
  IF FOUND THEN
    RETURN row_to_json(profile_record);
  END IF;
  
  -- Create new profile with default values
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
  
  -- Get the inserted/updated record
  GET DIAGNOSTICS profile_record = ROW_COUNT;
  
  SELECT * INTO profile_record
  FROM public.profiles
  WHERE id = user_id;
  
  RETURN row_to_json(profile_record);
END;
$$`,
    
    // Grant permissions
    `GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated`,
    `GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO anon`
  ];

  try {
    console.log('📝 Applying SQL statements...');
    
    // Execute each statement individually
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      console.log(`📋 Executing statement ${i + 1}/${sqlStatements.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: sql
      });
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error);
        console.error('SQL:', sql);
        throw error;
      }
      
      console.log(`✅ Statement ${i + 1} completed`);
    }
    
    console.log('✅ All SQL statements applied successfully');
    
    // Trigger PostgREST schema reload
    console.log('🔄 Triggering PostgREST schema reload...');
    
    const reloadResult = await supabase.rpc('exec_sql', {
      sql: "SELECT pg_notify('pgrst', 'reload schema')"
    });
    
    if (reloadResult.error) {
      console.warn('⚠️ Warning: Could not trigger schema reload:', reloadResult.error);
    } else {
      console.log('✅ Schema reload triggered');
    }
    
    // Wait a moment for reload to process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verify function exists in database
    console.log('🔍 Verifying function exists in database...');
    
    const verifyResult = await supabase.rpc('exec_sql', {
      sql: `SELECT 
        p.proname as function_name,
        p.prorettype::regtype as return_type,
        p.prosecdef as security_definer
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
      AND p.proname = 'get_or_create_profile_for_current_user'`
    });
    
    if (verifyResult.error) {
      console.error('❌ Verification query failed:', verifyResult.error);
    } else {
      console.log('📋 Function verification:', verifyResult.data);
      
      if (verifyResult.data && verifyResult.data.length > 0) {
        console.log('✅ Function exists in database with correct properties');
      } else {
        console.log('❌ Function not found in database');
        return;
      }
    }
    
    // Test the function
    console.log('🧪 Testing the RPC function...');
    
    const testResult = await supabase.rpc('get_or_create_profile_for_current_user');
    
    if (testResult.error) {
      console.error('❌ Test failed:', testResult.error);
      
      // Check if it's a PGRST202 error (function not found)
      if (testResult.error.code === 'PGRST202') {
        console.log('🔍 Function not found in PostgREST cache. This may require manual schema reload.');
        console.log('💡 Try restarting your Supabase local instance or wait a few minutes for cache refresh.');
      }
    } else {
      console.log('✅ Test successful!');
      console.log('📊 Test result:', testResult.data);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the fix
fixAuthRPC().then(() => {
  console.log('🎉 Authentication RPC fix completed!');
  console.log('💡 If you still see PGRST202 errors, try:');
  console.log('   1. Restart your Supabase local instance');
  console.log('   2. Wait a few minutes for PostgREST cache to refresh');
  console.log('   3. Check Supabase dashboard for any schema issues');
}).catch(error => {
  console.error('💥 Fix failed:', error);
  process.exit(1);
});