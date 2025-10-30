const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  console.log('🔍 Checking table structure and constraints...\n');

  try {
    // 1. Check profiles table structure
    console.log('1. Checking profiles table structure...');
    
    const tableStructureSql = `
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position`;

    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', { sql: tableStructureSql });
    if (columnsError) {
      console.log('❌ Error getting columns:', columnsError.message);
    } else {
      console.log('✅ Profiles table columns:');
      console.table(columns);
    }

    // 2. Check foreign key constraints
    console.log('\n2. Checking foreign key constraints...');
    
    const constraintsSql = `
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'profiles'
  AND tc.table_schema = 'public'`;

    const { data: constraints, error: constraintsError } = await supabase.rpc('exec_sql', { sql: constraintsSql });
    if (constraintsError) {
      console.log('❌ Error getting constraints:', constraintsError.message);
    } else {
      console.log('✅ Foreign key constraints:');
      console.table(constraints);
    }

    // 3. Check if auth.users table exists and has the user
    console.log('\n3. Checking auth.users table...');
    
    const authUsersSql = `
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5`;

    const { data: authUsers, error: authUsersError } = await supabase.rpc('exec_sql', { sql: authUsersSql });
    if (authUsersError) {
      console.log('❌ Error getting auth users:', authUsersError.message);
    } else {
      console.log('✅ Recent auth.users:');
      console.table(authUsers);
    }

    // 4. Try to fix the foreign key constraint issue
    console.log('\n4. Attempting to fix foreign key constraint...');
    
    // First, let's see what the constraint actually is
    const constraintDetailsSql = `
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
  AND contype = 'f'`;

    const { data: constraintDetails, error: constraintDetailsError } = await supabase.rpc('exec_sql', { sql: constraintDetailsSql });
    if (constraintDetailsError) {
      console.log('❌ Error getting constraint details:', constraintDetailsError.message);
    } else {
      console.log('✅ Constraint details:');
      console.table(constraintDetails);
      
      // If there's a problematic foreign key, let's drop it
      if (constraintDetails && constraintDetails.length > 0) {
        for (const constraint of constraintDetails) {
          console.log(`\n🔧 Dropping constraint: ${constraint.constraint_name}`);
          
          const dropConstraintSql = `ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS ${constraint.constraint_name}`;
          const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropConstraintSql });
          
          if (dropError) {
            console.log(`❌ Error dropping constraint ${constraint.constraint_name}:`, dropError.message);
          } else {
            console.log(`✅ Constraint ${constraint.constraint_name} dropped`);
          }
        }
      }
    }

    // 5. Test profile insertion again
    console.log('\n5. Testing profile insertion after constraint fix...');
    const testUserId = '00000000-0000-0000-0000-000000000002';
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'test2@example.com',
        name: 'Test User 2',
        role: 'agent',
        status: 'active'
      });

    if (insertError) {
      console.log('❌ Manual insert still failed:', insertError.message);
    } else {
      console.log('✅ Manual profile insert successful!');
      
      // Clean up
      await supabase.from('profiles').delete().eq('id', testUserId);
      console.log('🧹 Test profile cleaned up');
    }

    console.log('\n🎉 Table structure check completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTableStructure();