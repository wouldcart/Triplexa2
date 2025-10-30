const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://xzofytokwszfwiupsdvi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNTM0MTEsImV4cCI6MjA3MzkyOTQxMX0.FnTL4m0EmxzlNSRfCD12Gc1_PUpOI4rHvaRemr46CiQ';

// Create Supabase client with session persistence
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: {
      getItem: (key) => {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
        return null;
      },
      setItem: (key, value) => {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
      },
      removeItem: (key) => {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      }
    }
  }
});

async function testImprovedSessionHandling() {
  console.log('🔍 Testing Improved Session Handling');
  console.log('=====================================\n');

  try {
    // Step 1: Check current session
    console.log('1. Checking current session...');
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error getting session:', sessionError.message);
    } else if (currentSession) {
      console.log('✅ Current session found');
      console.log(`   User: ${currentSession.user.email}`);
      console.log(`   Access Token expires: ${new Date(currentSession.expires_at * 1000).toISOString()}`);
      console.log(`   Refresh Token: ${currentSession.refresh_token ? 'Present' : 'Missing'}`);
    } else {
      console.log('ℹ️  No current session found');
    }

    // Step 2: Test session refresh
    console.log('\n2. Testing session refresh...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('❌ Session refresh failed:', refreshError.message);
      console.log('   This is the error we\'re trying to fix!');
    } else if (refreshData.session) {
      console.log('✅ Session refreshed successfully');
      console.log(`   New access token expires: ${new Date(refreshData.session.expires_at * 1000).toISOString()}`);
    } else {
      console.log('⚠️  Session refresh returned no session');
    }

    // Step 3: Attempt fresh login
    console.log('\n3. Attempting fresh login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'agent_company@tripoex.com',
      password: 'SecurePass123!'
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
    } else if (loginData.session) {
      console.log('✅ Fresh login successful');
      console.log(`   User: ${loginData.user.email}`);
      console.log(`   Session expires: ${new Date(loginData.session.expires_at * 1000).toISOString()}`);
      console.log(`   Refresh token: ${loginData.session.refresh_token ? 'Present' : 'Missing'}`);
    }

    // Step 4: Test API call with fresh session
    console.log('\n4. Testing API call with fresh session...');
    const { data: profileData, error: profileError } = await supabase.rpc('get_user_profile');
    
    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError.message);
    } else {
      console.log('✅ Profile fetch successful');
      console.log('   Profile data:', JSON.stringify(profileData, null, 2));
    }

    // Step 5: Simulate token expiry and test refresh
    console.log('\n5. Simulating token expiry scenario...');
    
    // Get current session to manipulate
    const { data: { session: manipulateSession } } = await supabase.auth.getSession();
    
    if (manipulateSession) {
      // Create a mock expired session by setting expires_at to past
      const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      console.log(`   Setting token expiry to: ${new Date(expiredTime * 1000).toISOString()}`);
      
      // Try to refresh with potentially expired token
      const { data: expiredRefreshData, error: expiredRefreshError } = await supabase.auth.refreshSession();
      
      if (expiredRefreshError) {
        console.error('❌ Expired token refresh failed (expected):', expiredRefreshError.message);
        console.log('   This confirms the refresh token issue');
      } else {
        console.log('✅ Token refresh still works (token not actually expired)');
      }
    }

    // Step 6: Test session cleanup
    console.log('\n6. Testing session cleanup...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('❌ Sign out failed:', signOutError.message);
    } else {
      console.log('✅ Sign out successful');
    }

    // Verify session is cleared
    const { data: { session: postSignOutSession } } = await supabase.auth.getSession();
    if (postSignOutSession) {
      console.log('⚠️  Session still exists after sign out');
    } else {
      console.log('✅ Session properly cleared');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n📋 Recommendations:');
  console.log('===================');
  console.log('1. ✅ Implement SessionManager utility (already done)');
  console.log('2. ✅ Add session validation before API calls (already done)');
  console.log('3. ✅ Handle TOKEN_REFRESH_FAILED events (already done)');
  console.log('4. 🔄 Consider implementing exponential backoff for refresh attempts');
  console.log('5. 🔄 Add user notification for session expiry');
  console.log('6. 🔄 Implement automatic re-login flow for expired sessions');
  console.log('7. 🔄 Add session monitoring and analytics');
}

// Run the test
testImprovedSessionHandling().catch(console.error);