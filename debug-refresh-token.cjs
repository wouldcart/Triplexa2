const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xzofytokwszfwiupsdvi.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNTM0MTEsImV4cCI6MjA3MzkyOTQxMX0.FnTL4m0EmxzlNSRfCD12Gc1_PUpOI4rHvaRemr46CiQ';

const client = createClient(supabaseUrl, anonKey);

async function debugRefreshToken() {
  console.log('🔍 Debugging Refresh Token Issue...\n');

  try {
    // 1. Check current session
    console.log('1. Checking current session...');
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
    } else if (sessionData.session) {
      console.log('✅ Active session found');
      console.log('   User ID:', sessionData.session.user.id);
      console.log('   Email:', sessionData.session.user.email);
      console.log('   Expires at:', new Date(sessionData.session.expires_at * 1000));
      console.log('   Has refresh token:', !!sessionData.session.refresh_token);
    } else {
      console.log('⚠️  No active session');
    }

    // 2. Try to refresh the session
    console.log('\n2. Attempting to refresh session...');
    const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
    
    if (refreshError) {
      console.error('❌ Refresh failed:', refreshError.message);
      console.error('   Error code:', refreshError.status);
      
      if (refreshError.message.includes('Refresh Token Not Found')) {
        console.log('\n📝 SOLUTION:');
        console.log('   1. Clear browser storage (localStorage, sessionStorage)');
        console.log('   2. Sign out completely');
        console.log('   3. Sign in again with fresh credentials');
        console.log('   4. Check if session persistence is configured correctly');
      }
    } else {
      console.log('✅ Refresh successful');
      console.log('   New session expires at:', new Date(refreshData.session.expires_at * 1000));
    }

    // 3. Test fresh login
    console.log('\n3. Testing fresh login...');
    
    // First sign out completely
    await client.auth.signOut();
    console.log('   Signed out completely');
    
    // Try fresh login
    const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
      email: 'agent_company@tripoex.com',
      password: 'agent123'
    });

    if (loginError) {
      console.error('❌ Fresh login failed:', loginError.message);
    } else {
      console.log('✅ Fresh login successful');
      console.log('   User ID:', loginData.user.id);
      console.log('   Session expires at:', new Date(loginData.session.expires_at * 1000));
      
      // Test the RPC function with fresh session
      console.log('\n4. Testing RPC with fresh session...');
      const { data: rpcData, error: rpcError } = await client
        .rpc('get_or_create_profile_for_current_user');

      if (rpcError) {
        console.error('❌ RPC failed:', rpcError.message);
      } else {
        console.log('✅ RPC successful with fresh session');
        console.log('   Profile:', {
          id: rpcData.id,
          email: rpcData.email,
          role: rpcData.role || 'empty'
        });
      }
    }

    // Clean up
    await client.auth.signOut();

    console.log('\n📊 RECOMMENDATIONS:');
    console.log('   1. Clear all browser storage for the app');
    console.log('   2. Ensure users sign in with fresh credentials');
    console.log('   3. Check session persistence settings in AuthContext');
    console.log('   4. Consider implementing automatic token refresh handling');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugRefreshToken();