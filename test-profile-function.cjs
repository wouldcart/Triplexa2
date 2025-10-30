require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testProfileFunction() {
  console.log('🧪 Testing get_or_create_profile_for_current_user() function...\n');

  try {
    // 1. Check if function exists using direct SQL query
    console.log('1. Checking if function exists...');
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname, prosecdef')
      .eq('proname', 'get_or_create_profile_for_current_user');

    if (funcError) {
      console.log('Note: Could not query pg_proc directly:', funcError.message);
    } else if (functions && functions.length > 0) {
      console.log('✅ Function exists in database');
      console.log('   Security Definer:', functions[0].prosecdef);
    } else {
      console.log('❌ Function not found in pg_proc');
    }

    // 2. Check existing profiles
    console.log('\n2. Checking existing profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name, role, phone, company_name')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log(`✅ Found ${profiles.length} existing profiles`);
      if (profiles.length > 0) {
        console.log('   Sample profile:');
        const sample = profiles[0];
        console.log('     ID:', sample.id);
        console.log('     Email:', sample.email);
        console.log('     Name:', sample.name);
        console.log('     Role:', sample.role);
        console.log('     Phone:', sample.phone);
        console.log('     Company:', sample.company_name);
      }
    }

    // 3. Try to call the function without authentication (should return null)
    console.log('\n3. Testing function without authentication...');
    try {
      const { data: result, error: callError } = await supabase
        .rpc('get_or_create_profile_for_current_user');

      if (callError) {
        console.log('❌ Error calling function:', callError.message);
      } else {
        console.log('✅ Function called successfully');
        console.log('   Result (should be null):', result);
      }
    } catch (error) {
      console.log('❌ Exception calling function:', error.message);
    }

    // 4. Check if we can access auth.users (this requires service role)
    console.log('\n4. Checking auth.users access...');
    try {
      const { data: users, error: usersError } = await supabase
        .from('auth.users')
        .select('id, email')
        .limit(1);

      if (usersError) {
        console.log('Note: Cannot access auth.users directly:', usersError.message);
      } else {
        console.log('✅ Can access auth.users');
        console.log(`   Found ${users.length} users`);
      }
    } catch (error) {
      console.log('Note: Exception accessing auth.users:', error.message);
    }

    // 5. Test the function structure by examining its definition
    console.log('\n5. Examining function definition...');
    try {
      const { data: funcDef, error: defError } = await supabase.rpc('exec_sql', {
        sql: `
SELECT 
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'get_or_create_profile_for_current_user';`
      });

      if (defError) {
        console.log('Note: Could not get function definition:', defError.message);
      } else if (funcDef && funcDef.length > 0) {
        console.log('✅ Function definition retrieved');
        console.log('   Definition length:', funcDef[0].definition.length, 'characters');
        // Show first few lines
        const lines = funcDef[0].definition.split('\n').slice(0, 5);
        console.log('   First few lines:');
        lines.forEach(line => console.log('     ', line));
      } else {
        console.log('❌ No function definition found');
      }
    } catch (error) {
      console.log('Note: Exception getting function definition:', error.message);
    }

    console.log('\n🎉 Function testing completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function main() {
  console.log('🚀 Starting profile function testing...\n');
  
  await testProfileFunction();
  
  console.log('\n✨ All done!');
}

main().catch(console.error);