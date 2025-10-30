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

async function fixFunctionIssue() {
  console.log('🔧 Fixing the function issue...');

  try {
    // 1. Drop existing functions and triggers
    console.log('\n1. Dropping existing functions and triggers...');
    
    await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        DROP FUNCTION IF EXISTS handle_new_user();
        DROP FUNCTION IF EXISTS update_profile_with_metadata(uuid);
      `
    });
    console.log('✅ Dropped existing functions and triggers');

    // 2. Create a simpler, working function
    console.log('\n2. Creating a simpler update function...');
    
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_profile_with_metadata(user_id uuid)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          user_metadata jsonb;
          profile_exists boolean;
        BEGIN
          -- Get user metadata
          SELECT raw_user_meta_data INTO user_metadata
          FROM auth.users
          WHERE id = user_id;
          
          -- Check if profile exists
          SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id) INTO profile_exists;
          
          -- Insert or update profile
          IF profile_exists THEN
            UPDATE profiles SET
              name = COALESCE(user_metadata->>'name', name),
              phone = COALESCE(user_metadata->>'phone', phone),
              company_name = COALESCE(user_metadata->>'company_name', company_name),
              role = COALESCE(user_metadata->>'role', role),
              department = COALESCE(user_metadata->>'department', department),
              position = COALESCE(user_metadata->>'position', position),
              updated_at = now()
            WHERE id = user_id;
          ELSE
            INSERT INTO profiles (
              id, name, phone, company_name, role, department, position,
              created_at, updated_at
            ) VALUES (
              user_id,
              user_metadata->>'name',
              user_metadata->>'phone',
              user_metadata->>'company_name',
              user_metadata->>'role',
              user_metadata->>'department',
              user_metadata->>'position',
              now(),
              now()
            );
          END IF;
        END;
        $$;
      `
    });
    console.log('✅ Created update_profile_with_metadata function');

    // 3. Create the trigger function
    console.log('\n3. Creating trigger function...');
    
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION handle_new_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          -- Call the update function
          PERFORM update_profile_with_metadata(NEW.id);
          RETURN NEW;
        END;
        $$;
      `
    });
    console.log('✅ Created handle_new_user function');

    // 4. Create the trigger
    console.log('\n4. Creating trigger...');
    
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION handle_new_user();
      `
    });
    console.log('✅ Created trigger');

    // 5. Update get_or_create_profile_for_current_user function
    console.log('\n5. Updating get_or_create_profile_for_current_user function...');
    
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_or_create_profile_for_current_user()
        RETURNS profiles
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          current_user_id uuid;
          user_profile profiles;
        BEGIN
          -- Get current user ID
          current_user_id := auth.uid();
          
          IF current_user_id IS NULL THEN
            RAISE EXCEPTION 'Not authenticated';
          END IF;
          
          -- Try to get existing profile
          SELECT * INTO user_profile
          FROM profiles
          WHERE id = current_user_id;
          
          -- If profile doesn't exist, create it
          IF NOT FOUND THEN
            -- Call our update function to create/update the profile
            PERFORM update_profile_with_metadata(current_user_id);
            
            -- Get the profile again
            SELECT * INTO user_profile
            FROM profiles
            WHERE id = current_user_id;
          END IF;
          
          RETURN user_profile;
        END;
        $$;
      `
    });
    console.log('✅ Updated get_or_create_profile_for_current_user function');

    // 6. Grant permissions
    console.log('\n6. Granting permissions...');
    
    await supabase.rpc('exec_sql', {
      sql: `
        GRANT EXECUTE ON FUNCTION update_profile_with_metadata(uuid) TO authenticated, anon, service_role;
        GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated, anon, service_role;
        GRANT EXECUTE ON FUNCTION get_or_create_profile_for_current_user() TO authenticated, anon, service_role;
      `
    });
    console.log('✅ Granted permissions');

    console.log('\n🎉 Function issue fix completed!');

  } catch (error) {
    console.error('❌ Error fixing function issue:', error);
  }
}

fixFunctionIssue();