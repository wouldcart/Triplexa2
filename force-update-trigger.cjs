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

async function forceUpdateTrigger() {
  console.log('🔧 Force updating trigger function...');

  try {
    // 1. Drop everything completely
    console.log('\n1. Completely dropping trigger and function...');
    
    await exec_sql(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE`);
    await exec_sql(`DROP FUNCTION IF EXISTS handle_new_user() CASCADE`);
    await exec_sql(`DROP FUNCTION IF EXISTS handle_new_user_debug() CASCADE`);
    
    console.log('✅ Completely dropped all triggers and functions');

    // 2. Create the correct trigger function with metadata extraction
    console.log('\n2. Creating correct trigger function with metadata extraction...');
    
    const correctTriggerSQL = `
      CREATE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
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
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          COALESCE(NEW.raw_user_meta_data->>'phone', ''),
          COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
          COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
          COALESCE(NEW.raw_user_meta_data->>'department', ''),
          COALESCE(NEW.raw_user_meta_data->>'position', ''),
          NOW(),
          NOW()
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER
    `;
    
    await exec_sql(correctTriggerSQL);
    console.log('✅ Created correct trigger function');

    // 3. Create the trigger
    console.log('\n3. Creating trigger...');
    
    await exec_sql(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user()
    `);
    
    console.log('✅ Created trigger');

    // 4. Grant permissions
    console.log('\n4. Granting permissions...');
    
    await exec_sql(`GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated, anon, service_role`);
    
    console.log('✅ Granted permissions');

    // 5. Verify the function definition
    console.log('\n5. Verifying function definition...');
    
    const functionDef = await exec_sql(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE proname = 'handle_new_user'
    `);
    
    console.log('📊 New function definition:');
    if (functionDef && functionDef.length > 0) {
      console.log(functionDef[0].definition);
    } else {
      console.log('❌ No function found');
    }

  } catch (error) {
    console.error('❌ Error force updating trigger:', error);
    throw error;
  }

  console.log('\n🎉 Force update completed!');
}

forceUpdateTrigger();