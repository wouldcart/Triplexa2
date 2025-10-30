require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixRLS() {
  try {
    console.log('🔍 Checking current RLS policies on profiles table...');
    
    // Check current policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles');
    
    if (policiesError) {
      console.log('❌ Error checking policies:', policiesError.message);
    } else {
      console.log('📋 Current policies:', policies?.length || 0);
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`  - ${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
        });
      }
    }
    
    // Check if RLS is enabled
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('tablename', 'profiles');
    
    if (tablesError) {
      console.log('❌ Error checking table info:', tablesError.message);
    } else {
      console.log('📋 Table info:', tables);
    }
    
    console.log('🔧 Attempting to apply RLS fix using direct SQL execution...');
    
    // Try to execute the RLS fix using a different approach
    const rlsFixStatements = [
      "ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;",
      "DROP POLICY IF EXISTS \"Users can view own profile\" ON public.profiles;",
      "DROP POLICY IF EXISTS \"Users can update own profile\" ON public.profiles;", 
      "DROP POLICY IF EXISTS \"Users can insert own profile\" ON public.profiles;",
      "DROP POLICY IF EXISTS \"Enable read access for all users\" ON public.profiles;",
      "DROP POLICY IF EXISTS \"Enable insert for authenticated users only\" ON public.profiles;",
      "DROP POLICY IF EXISTS \"Enable update for users based on email\" ON public.profiles;",
      "CREATE POLICY \"profiles_select_policy\" ON public.profiles FOR SELECT USING (true);",
      "CREATE POLICY \"profiles_insert_policy\" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);",
      "CREATE POLICY \"profiles_update_policy\" ON public.profiles FOR UPDATE USING (auth.uid() = id);",
      "ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;"
    ];
    
    console.log('ℹ️ RLS fix statements prepared. Manual execution may be required.');
    console.log('📄 SQL statements to execute:');
    rlsFixStatements.forEach((stmt, i) => {
      console.log(`${i + 1}. ${stmt}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAndFixRLS();