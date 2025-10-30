import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const adminClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function debugRPCConflict() {
  console.log('🔍 Debugging RPC function conflict...');

  try {
    // First, login to get an authenticated session
    console.log('\n1. Logging in...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test123456'
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      return;
    }

    console.log('✅ Login successful:', loginData.user?.email);
    console.log('   User ID:', loginData.user?.id);

    // Check if profile already exists
    console.log('\n2. Checking existing profile...');
    const { data: existingProfile, error: profileCheckError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', loginData.user.id)
      .single();

    if (profileCheckError) {
      if (profileCheckError.code === 'PGRST116') {
        console.log('📝 No existing profile found');
      } else {
        console.log('❌ Profile check error:', profileCheckError.message);
      }
    } else {
      console.log('👤 Existing profile found:', {
        id: existingProfile.id,
        email: existingProfile.email,
        name: existingProfile.name,
        role: existingProfile.role
      });
    }

    // Now try the RPC function
    console.log('\n3. Testing RPC function...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_or_create_profile_for_current_user');

    if (rpcError) {
      console.log('❌ RPC Error:', rpcError.message);
      console.log('   Error code:', rpcError.code);
      console.log('   Error details:', rpcError.details);
      console.log('   Error hint:', rpcError.hint);
      
      // Check if it's a constraint violation
      if (rpcError.code === '23505') {
        console.log('🔍 This is a unique constraint violation');
        console.log('   Likely cause: Profile already exists with this ID');
      }
      
      if (rpcError.code === '23503') {
        console.log('🔍 This is a foreign key constraint violation');
        console.log('   Likely cause: Referenced table/column issue');
      }
    } else {
      console.log('✅ RPC Success:', {
        id: rpcData?.id,
        email: rpcData?.email,
        name: rpcData?.name,
        role: rpcData?.role
      });
    }

    // Check the profiles table structure
    console.log('\n4. Checking profiles table structure...');
    const { data: tableInfo, error: tableError } = await adminClient
      .from('profiles')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Table structure check failed:', tableError.message);
    } else {
      console.log('📋 Profiles table accessible');
      if (tableInfo && tableInfo.length > 0) {
        console.log('   Sample columns:', Object.keys(tableInfo[0]));
      }
    }

    // Sign out
    await supabase.auth.signOut();

    console.log('\n💡 Analysis:');
    if (rpcError) {
      if (rpcError.code === '23505') {
        console.log('   - The function is trying to create a profile that already exists');
        console.log('   - Need to fix the function logic to handle existing profiles');
      } else if (rpcError.message.includes('409')) {
        console.log('   - HTTP 409 Conflict suggests a database constraint issue');
        console.log('   - Check for unique constraints or foreign key violations');
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugRPCConflict();