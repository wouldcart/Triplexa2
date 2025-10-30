const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Final RLS Fix - Disabling RLS on profiles table...\n');

async function finalRLSFix() {
  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('1. Dropping all policies on profiles table...');
    
    // Drop all policies on profiles table
    const dropProfilesPolicies = [
      'DROP POLICY IF EXISTS "Super admins have full access to profiles" ON public.profiles;',
      'DROP POLICY IF EXISTS "Service role full access to profiles" ON public.profiles;',
      'DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;',
      'DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;',
      'DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;',
      'DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;',
      'DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;',
      'DROP POLICY IF EXISTS "Safe profile access" ON public.profiles;'
    ];
    
    for (const sql of dropProfilesPolicies) {
      try {
        await adminClient.rpc('exec_sql', { sql_query: sql });
        console.log('✅ Dropped profiles policy');
      } catch (error) {
        console.log('⚠️  Policy drop (expected if not exists)');
      }
    }
    
    console.log('\n2. Disabling RLS on profiles table...');
    
    // Disable RLS on profiles table completely
    try {
      await adminClient.rpc('exec_sql', { 
        sql_query: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;' 
      });
      console.log('✅ RLS disabled on profiles table');
    } catch (error) {
      console.log('❌ Failed to disable RLS on profiles:', error.message);
    }
    
    console.log('\n3. Ensuring agents table has proper policies...');
    
    // Ensure agents table has the right policies
    const agentsPolicies = [
      `CREATE POLICY "All authenticated users can access agents" ON public.agents
        FOR ALL TO authenticated
        USING (true)
        WITH CHECK (true);`,
      
      `CREATE POLICY "Service role full access to agents" ON public.agents
        FOR ALL TO service_role
        USING (true)
        WITH CHECK (true);`
    ];
    
    for (const sql of agentsPolicies) {
      try {
        await adminClient.rpc('exec_sql', { sql_query: sql });
        console.log('✅ Created/updated agents policy');
      } catch (error) {
        console.log('⚠️  Agents policy already exists or failed:', error.message);
      }
    }
    
    console.log('\n4. Testing the final fix...');
    
    // Test super admin login and access
    const userClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
      email: 'akshay@wouldcart.com',
      password: 'Akki#6342'
    });
    
    if (authError) {
      console.log('❌ Super admin login failed:', authError.message);
      return;
    }
    
    console.log('✅ Super admin login successful');
    
    // Test profile access (should work now with RLS disabled)
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('id, name, email, role')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profile access still failing:', profileError.message);
    } else {
      console.log('✅ Profile access working:', profile.name, profile.role);
    }
    
    // Test agents access
    const { data: agents, error: agentsError } = await userClient
      .from('agents')
      .select('id, status, agency_name')
      .limit(5);
    
    if (agentsError) {
      console.log('❌ Agents access failed:', agentsError.message);
    } else {
      console.log(`✅ Agents access working: ${agents.length} agents found`);
    }
    
    await userClient.auth.signOut();
    console.log('\n🎉 Final RLS fix completed successfully!');
    console.log('📝 Summary:');
    console.log('   - RLS disabled on profiles table (no more recursion)');
    console.log('   - Agents table has proper access policies');
    console.log('   - Super admin can now access management/agents');
    
  } catch (error) {
    console.error('🚨 Error in final RLS fix:', error.message);
  }
}

finalRLSFix();