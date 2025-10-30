const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzofytokwszfwiupsdvi.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNTM0MTEsImV4cCI6MjA3MzkyOTQxMX0.FnTL4m0EmxzlNSRfCD12Gc1_PUpOI4rHvaRemr46CiQ';

const client = createClient(supabaseUrl, anonKey);

async function testAuthAfterFix() {
  console.log('🧪 Testing Authentication After Fix...\n');

  try {
    // 1. Test agent login
    console.log('1. Testing agent login...');
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: 'agent_company@tripoex.com',
      password: 'agent123'
    });

    if (authError) {
      console.error('❌ Agent login failed:', authError.message);
      return;
    }

    console.log('✅ Agent login successful');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);

    // 2. Test the missing RPC function
    console.log('\n2. Testing get_or_create_profile_for_current_user...');
    const { data: profileData, error: profileError } = await client
      .rpc('get_or_create_profile_for_current_user');

    if (profileError) {
      console.error('❌ RPC function failed:', profileError.message);
      console.error('   Error code:', profileError.code);
      console.error('   This is the cause of the authentication failure!');
      
      console.log('\n📝 SOLUTION REQUIRED:');
      console.log('   1. Open Supabase Dashboard');
      console.log('   2. Go to SQL Editor');
      console.log('   3. Copy and paste the SQL from create-profile-function.sql');
      console.log('   4. Execute the SQL to create the missing function');
      console.log('   5. Test authentication again');
      
    } else {
      console.log('✅ RPC function successful');
      console.log('   Profile:', {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        role: profileData.role
      });
    }

    // 3. Test role function
    console.log('\n3. Testing get_current_user_role...');
    const { data: roleData, error: roleError } = await client.rpc('get_current_user_role');
    
    if (roleError) {
      console.error('❌ Role function failed:', roleError.message);
    } else {
      console.log('✅ Role function successful:', roleData);
    }

    // 4. Test direct profile access (should fail due to RLS)
    console.log('\n4. Testing direct profile access...');
    const { data: directProfile, error: directError } = await client
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (directError) {
      console.log('⚠️  Direct profile access failed (expected due to RLS):', directError.message);
    } else {
      console.log('✅ Direct profile access successful:', directProfile.name);
    }

    await client.auth.signOut();

    console.log('\n📊 DIAGNOSIS:');
    if (profileError) {
      console.log('   🔴 AUTHENTICATION WILL FAIL');
      console.log('   📝 Missing RPC function is the root cause');
      console.log('   🛠️  Manual SQL execution required');
    } else {
      console.log('   🟢 AUTHENTICATION SHOULD WORK');
      console.log('   ✅ All required functions are available');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAuthAfterFix();