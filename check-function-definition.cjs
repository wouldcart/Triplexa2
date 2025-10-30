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

async function checkFunctionDefinition() {
  console.log('🔍 Checking function definition...');

  try {
    // 1. Check all functions with similar names
    console.log('\n1. Checking all functions...');
    
    const allFunctions = await exec_sql(`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname LIKE '%get_or_create%'
    `);
    
    console.log('📊 All get_or_create functions:', allFunctions);

    // 2. Check the specific function
    console.log('\n2. Checking specific function...');
    
    const specificFunction = await exec_sql(`
      SELECT 
        proname,
        prosrc,
        proargnames,
        proargtypes::regtype[]
      FROM pg_proc 
      WHERE proname = 'get_or_create_profile_for_current_user'
    `);
    
    console.log('📊 Specific function details:', specificFunction);

    // 3. Check if there are multiple versions
    console.log('\n3. Checking for multiple versions...');
    
    const multipleVersions = await exec_sql(`
      SELECT 
        proname,
        oid,
        proargnames,
        proargtypes::regtype[],
        prosrc
      FROM pg_proc 
      WHERE proname = 'get_or_create_profile_for_current_user'
      ORDER BY oid
    `);
    
    console.log('📊 Multiple versions:', multipleVersions);

    // 4. Try to call the function to see the actual error
    console.log('\n4. Testing function call...');
    
    try {
      const testResult = await supabase.rpc('get_or_create_profile_for_current_user');
      console.log('✅ Function call result:', testResult);
    } catch (error) {
      console.log('❌ Function call error:', error);
    }

  } catch (error) {
    console.error('❌ Error checking function:', error);
    throw error;
  }

  console.log('\n🎉 Function check completed!');
}

checkFunctionDefinition();