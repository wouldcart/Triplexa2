const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyMigrationDirectly() {
  console.log('🔄 Applying migration using PostgREST API directly...');
  
  // The complete SQL from the migration file
  const migrationSQL = `
-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the working handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile with metadata extraction using the working approach
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
    city,
    country,
    status,
    must_change_password,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'agent'),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'department', ''), 'General'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'position', ''), 'Agent'),
    NULLIF(NEW.raw_user_meta_data->>'employee_id', ''),
    NULLIF(NEW.raw_user_meta_data->>'city', ''),
    NULLIF(NEW.raw_user_meta_data->>'country', ''),
    'active',
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false),
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
    city = COALESCE(EXCLUDED.city, profiles.city),
    country = COALESCE(EXCLUDED.country, profiles.country),
    must_change_password = COALESCE(EXCLUDED.must_change_password, profiles.must_change_password),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update the get_or_create_profile_for_current_user function with working approach
CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
  user_email text;
  user_metadata jsonb;
  profile_record record;
  result jsonb;
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Get user data from auth.users using the working approach
  SELECT 
    email,
    raw_user_meta_data
  INTO user_email, user_metadata
  FROM auth.users 
  WHERE id = user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User not found in auth.users');
  END IF;

  -- Try to get existing profile
  SELECT * INTO profile_record FROM public.profiles WHERE id = user_id;

  IF NOT FOUND THEN
    -- Create new profile with metadata extraction
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
      city,
      country,
      status,
      must_change_password,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      user_email,
      COALESCE(NULLIF(user_metadata->>'name', ''), split_part(user_email, '@', 1)),
      COALESCE(NULLIF(user_metadata->>'role', ''), 'agent'),
      NULLIF(user_metadata->>'phone', ''),
      NULLIF(user_metadata->>'company_name', ''),
      COALESCE(NULLIF(user_metadata->>'department', ''), 'General'),
      COALESCE(NULLIF(user_metadata->>'position', ''), 'Agent'),
      NULLIF(user_metadata->>'employee_id', ''),
      NULLIF(user_metadata->>'city', ''),
      NULLIF(user_metadata->>'country', ''),
      'active',
      COALESCE((user_metadata->>'must_change_password')::boolean, false),
      NOW(),
      NOW()
    )
    RETURNING * INTO profile_record;
  END IF;

  -- Return the profile as JSON
  result := to_jsonb(profile_record);
  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_profile_for_current_user() TO service_role;

-- Ensure auth.users access permissions
GRANT SELECT ON auth.users TO postgres;
GRANT SELECT ON auth.users TO service_role;
`;

  try {
    // Use the PostgREST query endpoint directly
    const response = await fetch(`${supabaseUrl}/rest/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sql',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: migrationSQL
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PostgREST query failed:', response.status, errorText);
      return false;
    }

    const result = await response.text();
    console.log('✅ Migration applied successfully via PostgREST');
    console.log('Response:', result);
    return true;

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    return false;
  }
}

async function verifyFunction() {
  console.log('🔍 Verifying function exists...');
  
  try {
    // Check if function exists in information_schema
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          routine_name,
          routine_type,
          data_type
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'get_or_create_profile_for_current_user'
      `
    });

    if (error) {
      console.error('❌ Error checking function:', error);
      return false;
    }

    if (data && data.length > 0) {
      console.log('✅ Function found in database:', data);
      return true;
    } else {
      console.log('❌ Function not found in database');
      return false;
    }

  } catch (error) {
    console.error('❌ Error verifying function:', error);
    return false;
  }
}

async function testFunction() {
  console.log('🧪 Testing function call...');
  
  try {
    const { data, error } = await supabase.rpc('get_or_create_profile_for_current_user');

    if (error) {
      console.error('❌ Function call failed:', error);
      return false;
    }

    console.log('✅ Function call successful:', data);
    return true;

  } catch (error) {
    console.error('❌ Error testing function:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting migration application...');
  
  const migrationSuccess = await applyMigrationDirectly();
  if (!migrationSuccess) {
    console.log('❌ Migration failed, exiting');
    process.exit(1);
  }

  // Wait a moment for the schema to update
  await new Promise(resolve => setTimeout(resolve, 2000));

  const functionExists = await verifyFunction();
  if (!functionExists) {
    console.log('❌ Function verification failed');
    process.exit(1);
  }

  const functionWorks = await testFunction();
  if (!functionWorks) {
    console.log('❌ Function test failed');
    process.exit(1);
  }

  console.log('🎉 Migration completed successfully!');
}

main().catch(console.error);