require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema and constraints...\n');
  
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Check profiles table structure
    console.log('1. CHECKING PROFILES TABLE STRUCTURE:');
    const { data: profilesColumns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .order('ordinal_position');
    
    if (columnsError) {
      console.log('   ❌ Columns check error:', columnsError.message);
    } else {
      console.log('   📋 Profiles table columns:');
      profilesColumns.forEach(col => {
        console.log(`     - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // 2. Check foreign key constraints
    console.log('\n2. CHECKING FOREIGN KEY CONSTRAINTS:');
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .eq('constraint_type', 'FOREIGN KEY');
    
    if (constraintsError) {
      console.log('   ❌ Constraints check error:', constraintsError.message);
    } else {
      console.log('   📋 Foreign key constraints:', constraints);
    }

    // 3. Check if we can access auth.users table
    console.log('\n3. CHECKING AUTH.USERS ACCESS:');
    try {
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email')
        .limit(1);
      
      if (authError) {
        console.log('   ❌ Cannot access auth.users:', authError.message);
      } else {
        console.log('   ✅ Can access auth.users');
      }
    } catch (e) {
      console.log('   ❌ Auth users access error:', e.message);
    }

    // 4. Try to create a user in auth.users first, then profile
    console.log('\n4. TESTING STEP-BY-STEP USER CREATION:');
    
    // First, try to create a user with admin client
    const testEmail = `step-test-${Date.now()}@example.com`;
    console.log('   Step 1: Creating auth user...');
    
    const { data: authUser, error: authUserError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true
    });

    if (authUserError) {
      console.log('   ❌ Auth user creation failed:', authUserError.message);
    } else {
      console.log('   ✅ Auth user created:', authUser.user?.id);
      
      // Now try to create profile
      console.log('   Step 2: Creating profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: testEmail,
          name: 'Step Test User',
          role: 'agent'
        })
        .select();
      
      if (profileError) {
        console.log('   ❌ Profile creation failed:', profileError.message);
      } else {
        console.log('   ✅ Profile created successfully:', profile);
      }

      // Clean up
      await supabase.auth.admin.deleteUser(authUser.user.id);
      console.log('   🧹 Test user cleaned up');
    }

    // 5. Check if RLS is enabled and what policies exist
    console.log('\n5. CHECKING RLS POLICIES:');
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('policyname, tablename, permissive, roles, cmd, qual')
        .eq('tablename', 'profiles');
      
      if (policiesError) {
        console.log('   ❌ Policies check error:', policiesError.message);
      } else {
        console.log('   📋 RLS policies on profiles:', policies);
      }
    } catch (e) {
      console.log('   ⚠️  Cannot check policies:', e.message);
    }

    // 6. Check if there are any functions that might be interfering
    console.log('\n6. CHECKING ALL FUNCTIONS:');
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname, prosrc')
      .like('proname', '%user%')
      .limit(10);
    
    if (functionsError) {
      console.log('   ❌ Functions check error:', functionsError.message);
    } else {
      console.log('   📋 User-related functions:', functions.map(f => f.proname));
    }

    // 7. Try using a different approach - direct SQL
    console.log('\n7. TESTING DIRECT SQL APPROACH:');
    try {
      const directSQL = `
        DO $$
        DECLARE
          new_user_id UUID;
        BEGIN
          -- This simulates what should happen during signup
          new_user_id := gen_random_uuid();
          
          -- Try to insert into profiles directly
          INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
          VALUES (new_user_id, 'direct-sql-test@example.com', 'Direct SQL Test', 'agent', NOW(), NOW());
          
          -- Clean up
          DELETE FROM public.profiles WHERE id = new_user_id;
          
          RAISE NOTICE 'Direct SQL test successful';
        END $$;
      `;
      
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql: directSQL });
      if (sqlError) {
        console.log('   ❌ Direct SQL error:', sqlError.message);
      } else {
        console.log('   ✅ Direct SQL test successful');
      }
    } catch (e) {
      console.log('   ❌ Direct SQL exception:', e.message);
    }

  } catch (error) {
    console.error('❌ Schema check error:', error.message);
  }
}

checkDatabaseSchema().catch(console.error);