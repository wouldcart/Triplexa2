require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function recreateAllFunctions() {
  console.log('🔧 Recreating all missing functions and triggers...\n');

  try {
    // Step 1: Create handle_new_user function
    console.log('📝 1. Creating handle_new_user function...');
    const handleNewUserSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        INSERT INTO public.profiles (
          id, 
          name, 
          phone, 
          company, 
          role,
          created_at,
          updated_at
        )
        VALUES (
          NEW.id,
          COALESCE((NEW.raw_user_meta_data->>'name')::text, ''),
          COALESCE((NEW.raw_user_meta_data->>'phone')::text, ''),
          COALESCE((NEW.raw_user_meta_data->>'company_name')::text, ''),
          COALESCE((NEW.raw_user_meta_data->>'role')::text, 'agent'),
          NOW(),
          NOW()
        );
        RETURN NEW;
      END;
      $$;
    `;

    const { error: handleNewUserError } = await adminSupabase.rpc('exec_sql', {
      sql: handleNewUserSQL
    });

    if (handleNewUserError) {
      console.error('❌ Failed to create handle_new_user function:', handleNewUserError);
    } else {
      console.log('✅ handle_new_user function created successfully');
    }

    // Step 2: Create trigger
    console.log('\n📝 2. Creating on_auth_user_created trigger...');
    const triggerSQL = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

    const { error: triggerError } = await adminSupabase.rpc('exec_sql', {
      sql: triggerSQL
    });

    if (triggerError) {
      console.error('❌ Failed to create trigger:', triggerError);
    } else {
      console.log('✅ on_auth_user_created trigger created successfully');
    }

    // Step 3: Create get_or_create_profile_for_current_user function
    console.log('\n📝 3. Creating get_or_create_profile_for_current_user function...');
    const getRpcSQL = `
      CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user()
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        user_profile json;
        current_user_id uuid;
        user_metadata json;
      BEGIN
        -- Get current user ID
        current_user_id := auth.uid();
        
        IF current_user_id IS NULL THEN
          RAISE EXCEPTION 'User not authenticated';
        END IF;

        -- Try to get existing profile
        SELECT row_to_json(p.*) INTO user_profile
        FROM profiles p
        WHERE p.id = current_user_id;

        -- If profile doesn't exist, create it
        IF user_profile IS NULL THEN
          -- Get user metadata from auth.users
          SELECT raw_user_meta_data INTO user_metadata
          FROM auth.users
          WHERE id = current_user_id;

          -- Insert new profile with metadata
          INSERT INTO public.profiles (
            id, 
            name, 
            phone, 
            company, 
            role,
            created_at,
            updated_at
          )
          VALUES (
            current_user_id,
            COALESCE((user_metadata->>'name')::text, ''),
            COALESCE((user_metadata->>'phone')::text, ''),
            COALESCE((user_metadata->>'company_name')::text, ''),
            COALESCE((user_metadata->>'role')::text, 'agent'),
            NOW(),
            NOW()
          );

          -- Get the newly created profile
          SELECT row_to_json(p.*) INTO user_profile
          FROM profiles p
          WHERE p.id = current_user_id;
        END IF;

        RETURN user_profile;
      END;
      $$;
    `;

    const { error: getRpcError } = await adminSupabase.rpc('exec_sql', {
      sql: getRpcSQL
    });

    if (getRpcError) {
      console.error('❌ Failed to create get_or_create_profile_for_current_user function:', getRpcError);
    } else {
      console.log('✅ get_or_create_profile_for_current_user function created successfully');
    }

    // Step 4: Check if company_name column exists in agents table
    console.log('\n📝 4. Checking agents table schema...');
    const { data: agentsColumns, error: agentsError } = await adminSupabase.rpc('exec_sql', {
      sql: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents' 
        AND column_name = 'company_name';
      `
    });

    if (agentsError) {
      console.error('❌ Failed to check agents table:', agentsError);
    } else {
      console.log('Agents columns check result:', agentsColumns);
      
      // Add company_name column if it doesn't exist
      if (!agentsColumns || agentsColumns.length === 0) {
        console.log('\n📝 5. Adding company_name column to agents table...');
        const { error: addColumnError } = await adminSupabase.rpc('exec_sql', {
          sql: 'ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS company_name TEXT;'
        });

        if (addColumnError) {
          console.error('❌ Failed to add company_name column:', addColumnError);
        } else {
          console.log('✅ company_name column added to agents table');
        }
      } else {
        console.log('✅ company_name column already exists in agents table');
      }
    }

    console.log('\n🎉 All functions and triggers recreated successfully!');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

recreateAllFunctions().catch(console.error);