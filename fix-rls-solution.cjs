require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLSSolution() {
  try {
    console.log('🔧 Fixing RLS solution for metadata extraction...\n');

    // 1. Drop existing functions and triggers
    console.log('1. Dropping existing functions and triggers...');
    
    const dropCommands = [
      'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users',
      'DROP FUNCTION IF EXISTS handle_new_user()',
      'DROP FUNCTION IF EXISTS get_or_create_profile_for_current_user()'
    ];

    for (const cmd of dropCommands) {
      const { error } = await supabase.rpc('exec_sql', { sql: cmd });
      if (error) {
        console.log(`❌ Error with "${cmd}":`, error.message);
      } else {
        console.log(`✅ Executed: ${cmd}`);
      }
    }

    // 2. Create a SECURITY DEFINER function that bypasses RLS
    console.log('\n2. Creating SECURITY DEFINER function for profile updates...');
    
    const createSecurityDefinerFunction = `
      CREATE OR REPLACE FUNCTION update_profile_with_metadata(user_id UUID, metadata JSONB)
      RETURNS VOID
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        -- This function runs with the privileges of the function owner (postgres)
        -- and bypasses RLS policies
        UPDATE profiles 
        SET 
          name = COALESCE(metadata->>'name', name),
          phone = COALESCE(metadata->>'phone', phone),
          company_name = COALESCE(metadata->>'company_name', company_name),
          role = COALESCE(metadata->>'role', 'employee'),
          department = COALESCE(metadata->>'department', department),
          position = COALESCE(metadata->>'position', position),
          updated_at = NOW()
        WHERE id = user_id;
        
        -- If no profile exists, create one
        IF NOT FOUND THEN
          INSERT INTO profiles (
            id, 
            email, 
            name, 
            phone, 
            company_name, 
            role, 
            department, 
            position,
            created_at,
            updated_at
          ) VALUES (
            user_id,
            (SELECT email FROM auth.users WHERE id = user_id),
            metadata->>'name',
            metadata->>'phone',
            metadata->>'company_name',
            COALESCE(metadata->>'role', 'employee'),
            metadata->>'department',
            metadata->>'position',
            NOW(),
            NOW()
          );
        END IF;
      END;
      $$`;

    const { error: securityError } = await supabase.rpc('exec_sql', { sql: createSecurityDefinerFunction });
    if (securityError) {
      console.log('❌ Error creating security definer function:', securityError);
      return;
    }
    console.log('✅ Security definer function created');

    // 3. Create the new handle_new_user function
    console.log('\n3. Creating new handle_new_user function...');
    
    const createHandleNewUser = `
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        -- Extract metadata and call the security definer function
        PERFORM update_profile_with_metadata(NEW.id, NEW.raw_user_meta_data);
        RETURN NEW;
      END;
      $$`;

    const { error: handleError } = await supabase.rpc('exec_sql', { sql: createHandleNewUser });
    if (handleError) {
      console.log('❌ Error creating handle_new_user function:', handleError);
      return;
    }
    console.log('✅ handle_new_user function created');

    // 4. Create the trigger
    console.log('\n4. Creating trigger...');
    
    const createTrigger = `
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user()`;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: createTrigger });
    if (triggerError) {
      console.log('❌ Error creating trigger:', triggerError);
      return;
    }
    console.log('✅ Trigger created');

    // 5. Create updated get_or_create_profile_for_current_user function
    console.log('\n5. Creating updated get_or_create_profile_for_current_user function...');
    
    const createGetOrCreateProfile = `
      CREATE OR REPLACE FUNCTION get_or_create_profile_for_current_user()
      RETURNS profiles
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        user_profile profiles;
        current_user_id UUID;
        user_metadata JSONB;
      BEGIN
        -- Get current user ID
        current_user_id := auth.uid();
        
        IF current_user_id IS NULL THEN
          RAISE EXCEPTION 'User not authenticated';
        END IF;
        
        -- Try to get existing profile
        SELECT * INTO user_profile FROM profiles WHERE id = current_user_id;
        
        -- If profile doesn't exist, create it
        IF NOT FOUND THEN
          -- Get user metadata
          SELECT raw_user_meta_data INTO user_metadata 
          FROM auth.users 
          WHERE id = current_user_id;
          
          -- Use the security definer function to create profile
          PERFORM update_profile_with_metadata(current_user_id, user_metadata);
          
          -- Get the newly created profile
          SELECT * INTO user_profile FROM profiles WHERE id = current_user_id;
        END IF;
        
        RETURN user_profile;
      END;
      $$`;

    const { error: getOrCreateError } = await supabase.rpc('exec_sql', { sql: createGetOrCreateProfile });
    if (getOrCreateError) {
      console.log('❌ Error creating get_or_create_profile_for_current_user function:', getOrCreateError);
      return;
    }
    console.log('✅ get_or_create_profile_for_current_user function created');

    // 6. Grant necessary permissions
    console.log('\n6. Granting permissions...');
    
    const grantCommands = [
      'GRANT EXECUTE ON FUNCTION update_profile_with_metadata(UUID, JSONB) TO authenticated',
      'GRANT EXECUTE ON FUNCTION update_profile_with_metadata(UUID, JSONB) TO anon',
      'GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated',
      'GRANT EXECUTE ON FUNCTION handle_new_user() TO anon',
      'GRANT EXECUTE ON FUNCTION get_or_create_profile_for_current_user() TO authenticated',
      'GRANT EXECUTE ON FUNCTION get_or_create_profile_for_current_user() TO anon'
    ];

    for (const cmd of grantCommands) {
      const { error } = await supabase.rpc('exec_sql', { sql: cmd });
      if (error) {
        console.log(`❌ Error with "${cmd}":`, error.message);
      } else {
        console.log(`✅ Executed: ${cmd}`);
      }
    }

    console.log('\n✅ RLS solution implemented successfully!');
    console.log('\n🧪 Ready to test the new implementation...');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixRLSSolution();