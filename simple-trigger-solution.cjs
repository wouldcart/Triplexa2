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

async function createSimpleTriggerSolution() {
  console.log('🔧 Creating simple trigger solution...');

  try {
    // 1. Drop existing functions and triggers
    console.log('\n1. Dropping existing functions and triggers...');
    
    await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        DROP FUNCTION IF EXISTS handle_new_user();
        DROP FUNCTION IF EXISTS update_profile_with_metadata(uuid);
        DROP FUNCTION IF EXISTS debug_metadata_extraction(uuid);
        DROP FUNCTION IF EXISTS update_profile_with_metadata_debug(uuid);
      `
    });
    console.log('✅ Dropped existing functions and triggers');

    // 2. Create a simple trigger function that does everything inline
    console.log('\n2. Creating simple trigger function...');
    
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION handle_new_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          -- Insert profile with metadata directly
          INSERT INTO profiles (
            id, 
            name, 
            phone, 
            company_name, 
            role, 
            department, 
            position,
            created_at, 
            updated_at
          ) VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'phone',
            NEW.raw_user_meta_data->>'company_name',
            NEW.raw_user_meta_data->>'role',
            NEW.raw_user_meta_data->>'department',
            NEW.raw_user_meta_data->>'position',
            now(),
            now()
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            company_name = EXCLUDED.company_name,
            role = EXCLUDED.role,
            department = EXCLUDED.department,
            position = EXCLUDED.position,
            updated_at = now();
          
          RETURN NEW;
        END;
        $$;
      `
    });
    console.log('✅ Created simple trigger function');

    // 3. Create the trigger
    console.log('\n3. Creating trigger...');
    
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION handle_new_user();
      `
    });
    console.log('✅ Created trigger');

    // 4. Create a simple get_or_create function
    console.log('\n4. Creating simple get_or_create function...');
    
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
          user_metadata jsonb;
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
            -- Get user metadata
            SELECT raw_user_meta_data INTO user_metadata
            FROM auth.users
            WHERE id = current_user_id;
            
            -- Insert profile with metadata
            INSERT INTO profiles (
              id, 
              name, 
              phone, 
              company_name, 
              role, 
              department, 
              position,
              created_at, 
              updated_at
            ) VALUES (
              current_user_id,
              user_metadata->>'name',
              user_metadata->>'phone',
              user_metadata->>'company_name',
              user_metadata->>'role',
              user_metadata->>'department',
              user_metadata->>'position',
              now(),
              now()
            )
            RETURNING * INTO user_profile;
          END IF;
          
          RETURN user_profile;
        END;
        $$;
      `
    });
    console.log('✅ Created simple get_or_create function');

    // 5. Grant permissions
    console.log('\n5. Granting permissions...');
    
    await supabase.rpc('exec_sql', {
      sql: `
        GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated, anon, service_role;
        GRANT EXECUTE ON FUNCTION get_or_create_profile_for_current_user() TO authenticated, anon, service_role;
      `
    });
    console.log('✅ Granted permissions');

    console.log('\n🎉 Simple trigger solution completed!');

  } catch (error) {
    console.error('❌ Error creating simple trigger solution:', error);
  }
}

createSimpleTriggerSolution();