require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugTriggerWithLogging() {
  console.log('🔍 Creating trigger with extensive logging to debug execution...\n');

  try {
    // Drop existing trigger and function
    console.log('1. Dropping existing trigger and function...');
    const dropCommands = [
      'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;',
      'DROP FUNCTION IF EXISTS handle_new_user() CASCADE;'
    ];

    for (const cmd of dropCommands) {
      const { error } = await supabase.rpc('exec_sql', { sql: cmd });
      if (error) {
        console.error(`❌ Error executing: ${cmd}`, error);
      } else {
        console.log(`✅ Executed: ${cmd}`);
      }
    }

    // Create a logging table for debugging
    console.log('\n2. Creating debug logging table...');
    const createLogTable = `
      CREATE TABLE IF NOT EXISTS debug_logs (
        id SERIAL PRIMARY KEY,
        message TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    const { error: logTableError } = await supabase.rpc('exec_sql', { sql: createLogTable });
    if (logTableError) {
      console.error('❌ Error creating log table:', logTableError);
    } else {
      console.log('✅ Debug log table created');
    }

    // Create a new handle_new_user function with extensive logging
    console.log('\n3. Creating handle_new_user function with logging...');
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
        debug_info JSONB;
      BEGIN
        -- Log that the trigger was called
        INSERT INTO debug_logs (message, data) VALUES (
          'Trigger called', 
          jsonb_build_object(
            'user_id', NEW.id,
            'email', NEW.email,
            'raw_user_meta_data', NEW.raw_user_meta_data,
            'user_metadata', NEW.user_metadata
          )
        );
        
        -- Get the raw_user_meta_data from the NEW record
        user_metadata := NEW.raw_user_meta_data;
        
        -- Log the metadata
        INSERT INTO debug_logs (message, data) VALUES (
          'Extracted metadata', 
          jsonb_build_object('metadata', user_metadata)
        );
        
        -- Extract fields with proper null handling
        extracted_name := COALESCE(NULLIF(user_metadata->>'name', ''), NULL);
        extracted_phone := COALESCE(NULLIF(user_metadata->>'phone', ''), NULL);
        extracted_company := COALESCE(NULLIF(user_metadata->>'company_name', ''), NULL);
        extracted_role := COALESCE(NULLIF(user_metadata->>'role', ''), 'employee');
        extracted_department := COALESCE(NULLIF(user_metadata->>'department', ''), NULL);
        extracted_position := COALESCE(NULLIF(user_metadata->>'position', ''), NULL);
        
        -- Log extracted values
        INSERT INTO debug_logs (message, data) VALUES (
          'Extracted values', 
          jsonb_build_object(
            'name', extracted_name,
            'phone', extracted_phone,
            'company', extracted_company,
            'role', extracted_role,
            'department', extracted_department,
            'position', extracted_position
          )
        );
        
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
        
        -- Log successful profile creation
        INSERT INTO debug_logs (message, data) VALUES (
          'Profile created successfully', 
          jsonb_build_object('user_id', NEW.id)
        );
        
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log the error
          INSERT INTO debug_logs (message, data) VALUES (
            'Error in handle_new_user', 
            jsonb_build_object('error', SQLERRM, 'user_id', NEW.id)
          );
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
    console.log('✅ handle_new_user function with logging created');

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

    // Grant permissions
    console.log('\n5. Granting permissions...');
    const permissions = [
      'GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated, anon;',
      'GRANT INSERT ON debug_logs TO authenticated, anon;'
    ];

    for (const perm of permissions) {
      const { error } = await supabase.rpc('exec_sql', { sql: perm });
      if (error) {
        console.error(`❌ Error granting permission: ${perm}`, error);
      } else {
        console.log(`✅ Granted: ${perm}`);
      }
    }

    console.log('\n🎉 Debug trigger setup completed!');
    console.log('📝 Now create a test user and check the debug_logs table for execution details.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugTriggerWithLogging();