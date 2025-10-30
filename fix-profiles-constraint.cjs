require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixProfilesConstraint() {
  console.log('🔧 Checking and fixing profiles table constraints...\n');

  try {
    // 1. Check current table structure
    console.log('1. Checking profiles table structure...');
    
    const { data: tableInfo, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;`
    });

    if (tableError) {
      console.error('❌ Error checking table structure:', tableError);
      return;
    }

    console.log('✅ Profiles table columns:');
    if (tableInfo && Array.isArray(tableInfo)) {
      tableInfo.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('   Table info format:', typeof tableInfo, tableInfo);
    }

    // 2. Check existing constraints
    console.log('\n2. Checking existing constraints...');
    
    const { data: constraints, error: constraintError } = await supabase.rpc('exec_sql', {
      sql: `
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'profiles'
ORDER BY tc.constraint_type, tc.constraint_name;`
    });

    if (constraintError) {
      console.error('❌ Error checking constraints:', constraintError);
      return;
    }

    console.log('✅ Existing constraints:');
    if (constraints && Array.isArray(constraints)) {
      if (constraints.length === 0) {
        console.log('   No constraints found');
      } else {
        constraints.forEach(constraint => {
          console.log(`   ${constraint.constraint_name}: ${constraint.constraint_type} on ${constraint.column_name}`);
        });
      }
    } else {
      console.log('   Constraints format:', typeof constraints, constraints);
    }

    // 3. Check if id column has primary key or unique constraint
    const hasIdConstraint = constraints && Array.isArray(constraints) && constraints.some(c => 
      c.column_name === 'id' && (c.constraint_type === 'PRIMARY KEY' || c.constraint_type === 'UNIQUE')
    );

    if (hasIdConstraint) {
      console.log('\n✅ ID column already has a unique constraint');
    } else {
      console.log('\n⚠️ ID column missing unique constraint - adding primary key...');
      
      const { error: pkError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);`
      });

      if (pkError) {
        console.error('❌ Error adding primary key:', pkError);
        
        // Try adding unique constraint instead
        console.log('   Trying unique constraint instead...');
        const { error: uniqueError } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_unique UNIQUE (id);`
        });

        if (uniqueError) {
          console.error('❌ Error adding unique constraint:', uniqueError);
          return;
        } else {
          console.log('✅ Unique constraint added successfully');
        }
      } else {
        console.log('✅ Primary key added successfully');
      }
    }

    // 4. Update the function to handle the constraint properly
    console.log('\n4. Updating function to handle constraints properly...');
    
    const updatedFunctionSQL = `
CREATE OR REPLACE FUNCTION public.get_or_create_profile_for_current_user() 
 RETURNS public.profiles 
 LANGUAGE plpgsql 
 SECURITY DEFINER 
 SET search_path = public 
 AS $$ 
 DECLARE 
   v_profile public.profiles; 
   v_uid uuid := auth.uid(); 
   v_email text; 
   v_name text; 
 BEGIN 
   -- Return null if no authenticated user 
   IF v_uid IS NULL THEN 
     RETURN NULL; 
   END IF; 
 
   -- Try to get email from auth.users (requires SECURITY DEFINER) 
   SELECT u.email INTO v_email 
   FROM auth.users u 
   WHERE u.id = v_uid; 
 
   v_name := COALESCE(split_part(v_email, '@', 1), v_uid::text); 
 
   -- Insert minimal row or enrich existing row. If row exists, only fill empty/null fields. 
   INSERT INTO public.profiles ( 
     id, email, name, role, department, status, position, created_at, updated_at 
   ) VALUES ( 
     v_uid, 
     COALESCE(v_email, v_uid::text || '@local'), 
     v_name, 
     'agent', 
     'General', 
     'active', 
     'Agent', 
     NOW(), 
     NOW() 
   ) 
   ON CONFLICT (id) DO UPDATE SET 
     email = CASE WHEN public.profiles.email IS NULL OR public.profiles.email = '' THEN EXCLUDED.email ELSE public.profiles.email END, 
     name = CASE WHEN public.profiles.name IS NULL OR public.profiles.name = '' THEN EXCLUDED.name ELSE public.profiles.name END, 
     role = CASE WHEN public.profiles.role IS NULL OR public.profiles.role = '' THEN EXCLUDED.role ELSE public.profiles.role END, 
     department = CASE WHEN public.profiles.department IS NULL OR public.profiles.department = '' THEN EXCLUDED.department ELSE public.profiles.department END, 
     status = CASE WHEN public.profiles.status IS NULL OR public.profiles.status = '' THEN EXCLUDED.status ELSE public.profiles.status END, 
     position = CASE WHEN public.profiles.position IS NULL OR public.profiles.position = '' THEN EXCLUDED.position ELSE public.profiles.position END, 
     updated_at = NOW() 
   RETURNING * INTO v_profile; 
 
   RETURN v_profile; 
 END; 
 $$;`;

    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: updatedFunctionSQL
    });

    if (functionError) {
      console.error('❌ Error updating function:', functionError);
      return;
    }

    console.log('✅ Function updated successfully');

    // 5. Test the function again
    console.log('\n5. Testing the updated function...');
    
    const { data: testResult, error: testError } = await supabase
      .rpc('get_or_create_profile_for_current_user');

    if (testError) {
      console.error('❌ Error testing function:', testError);
    } else {
      console.log('✅ Function test successful (unauthenticated)');
      console.log('   Result should be null:', testResult);
    }

    console.log('\n🎉 Profiles table constraint fix completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function main() {
  console.log('🚀 Starting profiles constraint fix...\n');
  
  await fixProfilesConstraint();
  
  console.log('\n✨ All done!');
}

main().catch(console.error);