const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzofytokwszfwiupsdvi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNTM0MTEsImV4cCI6MjA3MzkyOTQxMX0.FnTL4m0EmxzlNSRfCD12Gc1_PUpOI4rHvaRemr46CiQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBrowserAuthFlow() {
  console.log('🔍 Testing Browser Authentication Flow...\n');

  try {
    // Test 1: Supabase Auth sign in
    console.log('1. Testing Supabase Auth sign in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'agent_company@tripoex.com',
      password: 'agent123'
    });

    if (authError) {
      console.error('❌ Supabase Auth failed:', authError.message);
      return;
    }

    console.log('✅ Supabase Auth successful');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);

    // Test 2: Try the RPC function that the app uses
    console.log('\n2. Testing get_or_create_profile_for_current_user RPC...');
    const { data: profileData, error: profileError } = await supabase
      .rpc('get_or_create_profile_for_current_user');

    if (profileError) {
      console.error('❌ RPC function failed:', profileError.message);
      console.error('   Error code:', profileError.code);
      console.error('   Details:', profileError.details);
      console.error('   Hint:', profileError.hint);
    } else {
      console.log('✅ RPC function successful');
      console.log('   Profile data:', JSON.stringify(profileData, null, 2));
    }

    // Test 3: Try direct profile access
    console.log('\n3. Testing direct profile access...');
    const { data: directProfile, error: directError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (directError) {
      console.error('❌ Direct profile access failed:', directError.message);
    } else {
      console.log('✅ Direct profile access successful');
      console.log('   Profile:', JSON.stringify(directProfile, null, 2));
    }

    // Test 4: Try get_current_user_role
    console.log('\n4. Testing get_current_user_role...');
    const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');

    if (roleError) {
      console.error('❌ Role function failed:', roleError.message);
    } else {
      console.log('✅ Role function successful:', roleData);
    }

    // Test 5: Check available RPC functions
    console.log('\n5. Checking available RPC functions...');
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname')
      .like('proname', '%profile%')
      .limit(10);

    if (functionsError) {
      console.log('⚠️  Could not list functions:', functionsError.message);
    } else {
      console.log('Available profile-related functions:');
      functions.forEach(func => console.log('  -', func.proname));
    }

    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testBrowserAuthFlow();