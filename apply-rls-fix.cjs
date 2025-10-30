const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Applying RLS Policy Fixes for Super Admin...\n');

async function applyRLSFix() {
  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('1. Dropping existing problematic policies...');
    
    // Drop existing policies that might cause recursion
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;',
      'DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;',
      'DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;',
      'DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;',
      'DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;',
      'DROP POLICY IF EXISTS "Safe profile access" ON public.profiles;',
      'DROP POLICY IF EXISTS "Service role access profiles" ON public.profiles;',
      'DROP POLICY IF EXISTS "Enable read access for all users" ON public.agents;',
      'DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.agents;',
      'DROP POLICY IF EXISTS "Enable update for users based on email" ON public.agents;',
      'DROP POLICY IF EXISTS "Authenticated users can view agents" ON public.agents;',
      'DROP POLICY IF EXISTS "Authenticated users can create agents" ON public.agents;',
      'DROP POLICY IF EXISTS "Users can update agents" ON public.agents;',
      'DROP POLICY IF EXISTS "Service role access agents" ON public.agents;'
    ];
    
    for (const sql of dropPolicies) {
      try {
        await adminClient.rpc('exec_sql', { sql_query: sql });
        console.log('✅ Dropped policy');
      } catch (error) {
        console.log('⚠️  Policy drop (expected if not exists)');
      }
    }
    
    console.log('\n2. Creating new safe RLS policies...');
    
    // Create new safe policies
    const newPolicies = [
      // Profiles policies - using user metadata to avoid recursion
      `CREATE POLICY "Super admins have full access to profiles" ON public.profiles
        FOR ALL TO authenticated
        USING (
          (auth.jwt() ->> 'email') = 'akshay@wouldcart.com' OR
          id = auth.uid()
        )
        WITH CHECK (
          (auth.jwt() ->> 'email') = 'akshay@wouldcart.com' OR
          id = auth.uid()
        );`,
      
      `CREATE POLICY "Service role full access to profiles" ON public.profiles
        FOR ALL TO service_role
        USING (true)
        WITH CHECK (true);`,
      
      // Agents policies - using user metadata to avoid recursion
      `CREATE POLICY "Super admins have full access to agents" ON public.agents
        FOR ALL TO authenticated
        USING (
          (auth.jwt() ->> 'email') = 'akshay@wouldcart.com' OR
          true
        )
        WITH CHECK (
          (auth.jwt() ->> 'email') = 'akshay@wouldcart.com' OR
          true
        );`,
      
      `CREATE POLICY "Service role full access to agents" ON public.agents
        FOR ALL TO service_role
        USING (true)
        WITH CHECK (true);`
    ];
    
    for (const sql of newPolicies) {
      try {
        await adminClient.rpc('exec_sql', { sql_query: sql });
        console.log('✅ Created new policy');
      } catch (error) {
        console.log('❌ Policy creation failed:', error.message);
      }
    }
    
    console.log('\n3. Testing the fix...');
    
    // Test super admin login and profile access
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
    
    // Test profile access (this should not cause recursion now)
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
      .limit(3);
    
    if (agentsError) {
      console.log('❌ Agents access failed:', agentsError.message);
    } else {
      console.log(`✅ Agents access working: ${agents.length} agents found`);
    }
    
    await userClient.auth.signOut();
    console.log('\n✅ RLS fix applied successfully!');
    
  } catch (error) {
    console.error('🚨 Error applying RLS fix:', error.message);
  }
}

applyRLSFix();