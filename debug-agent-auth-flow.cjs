const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Debugging Agent Authentication Flow...\n');

async function debugAgentAuthFlow() {
  try {
    // Create both client and admin instances
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log('1. Testing agent login...');
    
    // Try to login with the agent credentials
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'fadakos605@filipx.com',
      password: 'agent123'
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      
      // Check if the user exists in auth.users
      console.log('\n2. Checking if user exists in auth.users...');
      const { data: users, error: usersError } = await adminClient.rpc('exec_sql', {
        sql_query: `
          SELECT id, email, email_confirmed_at, created_at, raw_user_meta_data
          FROM auth.users 
          WHERE email = 'fadakos605@filipx.com';
        `
      });
      
      if (!usersError && users && users.length > 0) {
        console.log('✅ User exists in auth.users:', {
          id: users[0].id,
          email: users[0].email,
          confirmed: !!users[0].email_confirmed_at,
          metadata: users[0].raw_user_meta_data
        });
      } else {
        console.log('❌ User not found in auth.users');
      }
      return;
    }

    console.log('✅ Login successful!');
    console.log('   User ID:', loginData.user?.id);
    console.log('   Email:', loginData.user?.email);
    console.log('   Email confirmed:', !!loginData.user?.email_confirmed_at);

    console.log('\n3. Testing get_or_create_profile_for_current_user RPC...');
    
    // Test the RPC function that AuthService.getCurrentSession() uses
    const { data: profileData, error: profileError } = await supabase.rpc('get_or_create_profile_for_current_user');

    if (profileError) {
      console.log('❌ RPC function failed:', profileError.message);
      console.log('   Error code:', profileError.code);
      console.log('   Error details:', profileError.details);
    } else {
      console.log('✅ RPC function successful!');
      console.log('   Profile data:', {
        id: profileData?.id,
        email: profileData?.email,
        name: profileData?.name,
        role: profileData?.role,
        department: profileData?.department,
        status: profileData?.status
      });
    }

    console.log('\n4. Direct profile table query...');
    
    // Also try direct profile query
    const { data: directProfile, error: directError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', loginData.user.id)
      .single();

    if (directError) {
      console.log('❌ Direct profile query failed:', directError.message);
    } else {
      console.log('✅ Direct profile query successful!');
      console.log('   Profile:', {
        id: directProfile.id,
        email: directProfile.email,
        name: directProfile.name,
        role: directProfile.role,
        department: directProfile.department
      });
    }

    console.log('\n5. Testing AuthService.getCurrentSession() simulation...');
    
    // Simulate what AuthService.getCurrentSession() does
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session check failed:', sessionError.message);
    } else if (!session?.user) {
      console.log('❌ No active session found');
    } else {
      console.log('✅ Session active for:', session.user.email);
      
      // This is exactly what AuthService.getCurrentSession() does
      const { data: sessionProfileData, error: sessionProfileError } = await supabase.rpc('get_or_create_profile_for_current_user');
      
      if (sessionProfileError) {
        console.log('❌ Session profile RPC failed:', sessionProfileError.message);
      } else {
        console.log('✅ Session profile RPC successful!');
        console.log('   Session profile role:', sessionProfileData?.role);
        
        // Test the role-based redirect logic
        const userRole = sessionProfileData?.role;
        let redirectPath = '/';
        
        if (userRole === 'agent') {
          redirectPath = '/dashboards/agent';
        } else if (userRole === 'super_admin') {
          redirectPath = '/dashboards/super-admin';
        } else if (userRole === 'manager') {
          redirectPath = '/dashboards/manager';
        } else if (userRole === 'hr_manager') {
          redirectPath = '/dashboards/hr-manager';
        } else if (userRole === 'staff') {
          redirectPath = '/dashboards/staff';
        }
        
        console.log('   Expected redirect path:', redirectPath);
      }
    }

    console.log('\n6. Testing get_current_user_role function...');
    
    // Test the get_current_user_role function
    const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');
    
    if (roleError) {
      console.log('❌ get_current_user_role failed:', roleError.message);
    } else {
      console.log('✅ get_current_user_role successful!');
      console.log('   Current user role:', roleData);
    }

    // Sign out
    console.log('\n7. Signing out...');
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

debugAgentAuthFlow();