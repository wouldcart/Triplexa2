import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function createExecSqlFunction() {
  try {
    console.log('🔧 Creating exec_sql function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `;
    
    // Use direct SQL execution via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.pgrst.object+json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: createFunctionSQL
    });
    
    if (response.ok) {
      console.log('✅ exec_sql function created successfully');
      return true;
    } else {
      console.log('⚠️  Could not create exec_sql function via REST API');
      return false;
    }
  } catch (error) {
    console.error('❌ Error creating exec_sql function:', error);
    return false;
  }
}

async function applyMigration() {
  try {
    console.log('🔄 Applying get_current_user_role function migration...');
    
    // First, try to create the exec_sql function
    await createExecSqlFunction();
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250127130000_create_get_current_user_role_function.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error applying migration:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Test the function
    console.log('🧪 Testing get_current_user_role function...');
    const { data: testResult, error: testError } = await supabase.rpc('get_current_user_role');
    
    if (testError) {
      console.error('❌ Error testing function:', testError);
    } else {
      console.log('✅ Function test result:', testResult);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

applyMigration();