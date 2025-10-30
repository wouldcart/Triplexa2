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

async function createFinalWorkingSolution() {
  console.log('🔧 Creating final working trigger solution...');

  try {
    // 1. Drop existing functions and triggers
    console.log('\n1. Dropping existing functions and triggers...');
    
    await exec_sql(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`);
    await exec_sql(`DROP FUNCTION IF EXISTS handle_new_user()`);
    await exec_sql(`DROP FUNCTION IF EXISTS get_or_create_profile_for_current_user()`);
    
    console.log('✅ Dropped existing functions and triggers');

    // 2. Create the corrected trigger function
    console.log('\n2. Creating corrected trigger function...');
    
    const triggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO profiles (
          id, 
          name, 
          phone, 
          company_name, 
          role, 
          department, 
          position
        ) VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          COALESCE(NEW.raw_user_meta_data->>'phone', ''),
          COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
          COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
          COALESCE(NEW.raw_user_meta_data->>'department', ''),
          COALESCE(NEW.raw_user_meta_data->>'position', '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER
    `;
    
    await exec_sql(triggerFunctionSQL);
    console.log('✅ Created corrected trigger function');

    // 3. Create the trigger
    console.log('\n3. Creating trigger...');
    
    const triggerSQL = `
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user()
    `;
    
    await exec_sql(triggerSQL);
    console.log('✅ Created trigger');

    // 4. Create the corrected get_or_create function
    console.log('\n4. Creating corrected get_or_create function...');
    
    const getOrCreateFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_or_create_profile_for_current_user()
      RETURNS profiles AS $$
      DECLARE
        user_id UUID;
        existing_profile profiles;
        new_profile profiles;
      BEGIN
        -- Get current user ID
        user_id := auth.uid();
        
        IF user_id IS NULL THEN
          RAISE EXCEPTION 'User not authenticated';
        END IF;
        
        -- Check if profile exists
        SELECT * INTO existing_profile 
        FROM profiles 
        WHERE id = user_id;
        
        IF FOUND THEN
          RETURN existing_profile;
        END IF;
        
        -- Create new profile with metadata from auth.users
        INSERT INTO profiles (
          id, 
          name, 
          phone, 
          company_name, 
          role, 
          department, 
          position
        )
        SELECT 
          user_id,
          COALESCE(raw_user_meta_data->>'name', ''),
          COALESCE(raw_user_meta_data->>'phone', ''),
          COALESCE(raw_user_meta_data->>'company_name', ''),
          COALESCE(raw_user_meta_data->>'role', 'employee'),
          COALESCE(raw_user_meta_data->>'department', ''),
          COALESCE(raw_user_meta_data->>'position', '')
        FROM auth.users 
        WHERE id = user_id
        RETURNING * INTO new_profile;
        
        RETURN new_profile;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER
    `;
    
    await exec_sql(getOrCreateFunctionSQL);
    console.log('✅ Created corrected get_or_create function');

    // 5. Grant permissions
    console.log('\n5. Granting permissions...');
    
    await exec_sql(`GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated, anon, service_role`);
    await exec_sql(`GRANT EXECUTE ON FUNCTION get_or_create_profile_for_current_user() TO authenticated, anon, service_role`);
    
    console.log('✅ Granted permissions');

  } catch (error) {
    console.error('❌ Error creating final working solution:', error);
    throw error;
  }

  console.log('\n🎉 Final working trigger solution completed!');
}

createFinalWorkingSolution();