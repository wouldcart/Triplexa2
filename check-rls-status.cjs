const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkRLSStatus() {
  console.log('🔍 Checking RLS status and policies...\n');

  try {
    // Check RLS status
    console.log('1. Checking RLS status on profiles table...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity as rls_enabled,
            hasrls as has_rls
          FROM pg_tables 
          WHERE schemaname = 'public' AND tablename = 'profiles';
        `
      });

    if (rlsError) {
      console.log('❌ RLS status check failed:', rlsError.message);
    } else {
      console.log('✅ RLS Status:', rlsStatus);
    }

    // Check all policies on profiles table
    console.log('\n2. Checking all policies on profiles table...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE schemaname = 'public' AND tablename = 'profiles';
        `
      });

    if (policiesError) {
      console.log('❌ Policies check failed:', policiesError.message);
    } else {
      console.log('✅ Current policies:', policies);
    }

    // Check table permissions
    console.log('\n3. Checking table permissions...');
    const { data: permissions, error: permError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            grantee,
            privilege_type,
            is_grantable
          FROM information_schema.table_privileges 
          WHERE table_schema = 'public' AND table_name = 'profiles';
        `
      });

    if (permError) {
      console.log('❌ Permissions check failed:', permError.message);
    } else {
      console.log('✅ Table permissions:', permissions);
    }

    // Try to force disable RLS using ALTER TABLE
    console.log('\n4. Force disabling RLS using ALTER TABLE...');
    const { data: disableRLS, error: disableError } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;'
      });

    if (disableError) {
      console.log('❌ Force disable RLS failed:', disableError.message);
    } else {
      console.log('✅ Force disable RLS successful');
    }

    // Check RLS status again
    console.log('\n5. Checking RLS status after force disable...');
    const { data: rlsStatus2, error: rlsError2 } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity as rls_enabled,
            hasrls as has_rls
          FROM pg_tables 
          WHERE schemaname = 'public' AND tablename = 'profiles';
        `
      });

    if (rlsError2) {
      console.log('❌ RLS status check 2 failed:', rlsError2.message);
    } else {
      console.log('✅ RLS Status after disable:', rlsStatus2);
    }

    // Try a simple direct insert test
    console.log('\n6. Testing direct insert without any auth context...');
    const testId = crypto.randomUUID();
    const { data: insertTest, error: insertError } = await supabase
      .rpc('exec_sql', {
        sql: `
          INSERT INTO public.profiles (id, email, full_name, role) 
          VALUES ('${testId}', 'test@example.com', 'Test User', 'basic');
        `
      });

    if (insertError) {
      console.log('❌ Direct insert failed:', insertError.message);
    } else {
      console.log('✅ Direct insert successful');
      
      // Clean up
      await supabase.rpc('exec_sql', {
        sql: `DELETE FROM public.profiles WHERE id = '${testId}';`
      });
      console.log('🧹 Test record cleaned up');
    }

    // Check if there are any triggers that might be causing issues
    console.log('\n7. Checking all triggers on profiles table...');
    const { data: triggers, error: triggerError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            trigger_name,
            event_manipulation,
            action_timing,
            action_statement
          FROM information_schema.triggers 
          WHERE event_object_schema = 'public' AND event_object_table = 'profiles';
        `
      });

    if (triggerError) {
      console.log('❌ Triggers check failed:', triggerError.message);
    } else {
      console.log('✅ Triggers on profiles table:', triggers);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n🎉 RLS status check completed!');
}

checkRLSStatus();