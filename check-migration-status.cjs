const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqjqfqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxZnFqcWpxanFqcWpxanFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ1NzI2NCwiZXhwIjoyMDUzMDMzMjY0fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exec_sql(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql: sql });
  if (error) {
    console.error('SQL Error:', error);
    throw error;
  }
  return data;
}

async function checkMigrationStatus() {
  console.log('🔍 Checking migration status...');

  try {
    // 1. Check if the migration table exists and what migrations have been applied
    console.log('\n1. Checking applied migrations...');
    
    const migrations = await exec_sql(`
      SELECT version, name, executed_at 
      FROM supabase_migrations.schema_migrations 
      ORDER BY executed_at DESC 
      LIMIT 10
    `);
    
    console.log('📊 Recent migrations:', migrations);

    // 2. Check the current function definition
    console.log('\n2. Checking current function definition...');
    
    const currentFunction = await exec_sql(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'get_or_create_profile_for_current_user'
    `);
    
    if (currentFunction && currentFunction.length > 0) {
      const definition = currentFunction[0].prosrc;
      console.log('📊 Function uses user_metadata:', definition.includes('user_metadata'));
      console.log('📊 Function uses raw_user_meta_data:', definition.includes('raw_user_meta_data'));
      
      // Show a snippet of the function
      const lines = definition.split('\n');
      console.log('📊 Function snippet (first 10 lines):');
      lines.slice(0, 10).forEach((line, i) => {
        console.log(`  ${i + 1}: ${line}`);
      });
    } else {
      console.log('❌ Function not found');
    }

    // 3. Check if the specific migration we're interested in has been applied
    console.log('\n3. Checking specific migration...');
    
    const specificMigration = await exec_sql(`
      SELECT * 
      FROM supabase_migrations.schema_migrations 
      WHERE version = '20251028_fix_user_metadata_extraction'
    `);
    
    console.log('📊 Migration 20251028_fix_user_metadata_extraction applied:', specificMigration.length > 0);

  } catch (error) {
    console.error('❌ Error checking migration status:', error);
    throw error;
  }

  console.log('\n🎉 Migration status check completed!');
}

checkMigrationStatus();