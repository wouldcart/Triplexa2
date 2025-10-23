import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSql(sql) {
  try {
    const { data, error } = await adminSupabase.rpc('exec_sql', {
      sql_query: sql
    });
    
    if (error) {
      console.log(`❌ SQL execution failed: ${error.message}`);
      return false;
    }
    
    console.log('✅ SQL executed successfully');
    return true;
  } catch (error) {
    console.log(`❌ SQL execution error: ${error.message}`);
    return false;
  }
}

async function applyMigrations() {
  console.log('🚀 Applying agent-related migrations...');
  
  // First, try to enable pgcrypto directly
  console.log('\n1. Enabling pgcrypto extension...');
  await executeSql('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
  
  // Apply the agent credentials RPC migration
  console.log('\n2. Applying agent credentials RPC...');
  const agentCredentialsPath = './supabase/migrations/20251010_add_agent_credentials_rpc.sql';
  
  if (fs.existsSync(agentCredentialsPath)) {
    const sql = fs.readFileSync(agentCredentialsPath, 'utf8');
    console.log('📄 Found agent credentials migration file');
    await executeSql(sql);
  } else {
    console.log('❌ Agent credentials migration file not found');
  }
  
  // Apply the set agent credentials RPC migration
  console.log('\n3. Applying set agent credentials RPC...');
  const setCredentialsPath = './supabase/migrations/20251010_add_set_agent_credentials_rpc.sql';
  
  if (fs.existsSync(setCredentialsPath)) {
    const sql = fs.readFileSync(setCredentialsPath, 'utf8');
    console.log('📄 Found set agent credentials migration file');
    await executeSql(sql);
  } else {
    console.log('❌ Set agent credentials migration file not found');
  }
  
  // Apply the authenticate managed agent RPC migration
  console.log('\n4. Applying authenticate managed agent RPC...');
  const authAgentPath = './supabase/migrations/20251010_add_authenticate_managed_agent_rpc.sql';
  
  if (fs.existsSync(authAgentPath)) {
    const sql = fs.readFileSync(authAgentPath, 'utf8');
    console.log('📄 Found authenticate managed agent migration file');
    await executeSql(sql);
  } else {
    console.log('❌ Authenticate managed agent migration file not found');
  }
  
  // Test if gen_salt is now working
  console.log('\n5. Testing gen_salt function...');
  const testResult = await executeSql("SELECT gen_salt('bf') as test_salt;");
  
  if (testResult) {
    console.log('🎉 gen_salt function is working!');
    return true;
  } else {
    console.log('❌ gen_salt function still not working');
    
    // Try alternative approach - create the function manually if needed
    console.log('\n6. Trying alternative pgcrypto setup...');
    
    // Check if we can create a simple test function
    const testFunctionSql = `
      CREATE OR REPLACE FUNCTION test_pgcrypto()
      RETURNS text
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN gen_salt('bf');
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR: ' || SQLERRM;
      END;
      $$;
    `;
    
    await executeSql(testFunctionSql);
    
    // Test the function
    const testFunctionResult = await executeSql("SELECT test_pgcrypto();");
    
    return false;
  }
}

applyMigrations()
  .then(success => {
    if (success) {
      console.log('\n🎉 All migrations applied successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Migrations applied but pgcrypto may still have issues');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });