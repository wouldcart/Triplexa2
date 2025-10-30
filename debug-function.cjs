require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugFunction() {
  try {
    console.log('🔍 Debugging function and table structure...\n');

    // 1. Check table structure
    console.log('1. Checking profiles table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');

    if (tableError) {
      console.log('❌ Error getting table info:', tableError);
    } else {
      console.log('✅ Table columns:');
      tableInfo.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }

    // 2. Check constraints
    console.log('\n2. Checking table constraints...');
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');

    if (constraintError) {
      console.log('❌ Error getting constraints:', constraintError);
    } else {
      console.log('✅ Table constraints:');
      if (constraints.length === 0) {
        console.log('   No constraints found');
      } else {
        constraints.forEach(constraint => {
          console.log(`   ${constraint.constraint_name}: ${constraint.constraint_type}`);
        });
      }
    }

    // 3. Check key column usage
    console.log('\n3. Checking key column usage...');
    const { data: keyUsage, error: keyError } = await supabase
      .from('information_schema.key_column_usage')
      .select('constraint_name, column_name')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');

    if (keyError) {
      console.log('❌ Error getting key usage:', keyError);
    } else {
      console.log('✅ Key column usage:');
      if (keyUsage.length === 0) {
        console.log('   No key columns found');
      } else {
        keyUsage.forEach(key => {
          console.log(`   ${key.constraint_name}: ${key.column_name}`);
        });
      }
    }

    // 4. Get function definition
    console.log('\n4. Getting function definition...');
    const { data: funcDef, error: funcError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT pg_get_functiondef(oid) as definition
        FROM pg_proc 
        WHERE proname = 'get_or_create_profile_for_current_user'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
      `
    });

    if (funcError) {
      console.log('❌ Error getting function definition:', funcError);
    } else {
      console.log('✅ Function definition:');
      if (funcDef && funcDef.length > 0) {
        console.log(funcDef[0].definition);
      } else {
        console.log('   Function not found');
      }
    }

    // 5. Try a simple insert to test constraints
    console.log('\n5. Testing simple insert...');
    const testId = '00000000-0000-0000-0000-000000000001';
    
    try {
      const { data: insertResult, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: testId,
          email: 'test@example.com',
          name: 'Test User'
        })
        .select();

      if (insertError) {
        console.log('❌ Insert error:', insertError);
      } else {
        console.log('✅ Insert successful:', insertResult);
        
        // Clean up
        await supabase.from('profiles').delete().eq('id', testId);
        console.log('✅ Test record cleaned up');
      }
    } catch (err) {
      console.log('❌ Insert exception:', err);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function main() {
  console.log('🚀 Starting function debugging...\n');
  
  try {
    await debugFunction();
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
  
  console.log('\n✨ All done!');
}

main();