import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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

async function executeSQL(description, sql) {
  console.log(`\n🔧 ${description}...`);
  
  try {
    // Use the Supabase client's rpc method to execute SQL
    const { data, error } = await adminSupabase.rpc('exec_sql', {
      sql_query: sql
    });
    
    if (error) {
      console.log(`❌ ${description} failed:`, error.message);
      return false;
    } else {
      console.log(`✅ ${description} completed successfully`);
      return true;
    }
  } catch (error) {
    console.log(`❌ ${description} error:`, error.message);
    return false;
  }
}

async function testDirectSQL() {
  console.log('🚀 Testing direct SQL execution...');
  
  // First, let's try to create the exec_sql function if it doesn't exist
  console.log('\n🔧 Attempting to create exec_sql function...');
  
  try {
    // Use direct SQL execution via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.pgrst.object+json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        query: `
          CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
          RETURNS json
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            result json;
          BEGIN
            EXECUTE sql_query;
            RETURN '{"success": true}'::json;
          EXCEPTION
            WHEN OTHERS THEN
              RETURN json_build_object('error', SQLERRM);
          END;
          $$;
        `
      })
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response:', responseText);
    
  } catch (error) {
    console.log('❌ Direct SQL execution failed:', error.message);
  }
  
  // Now try using the Supabase client to test basic functionality
  console.log('\n🧪 Testing basic Supabase client functionality...');
  
  try {
    // Test a simple query first
    const { data, error } = await adminSupabase
      .from('agents')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Basic query failed:', error.message);
    } else {
      console.log('✅ Basic query successful, found', data?.length || 0, 'agents');
    }
  } catch (error) {
    console.log('❌ Basic query error:', error.message);
  }
  
  // Try to check if pgcrypto is available
  console.log('\n🔍 Checking pgcrypto availability...');
  
  try {
    const { data, error } = await adminSupabase.rpc('exec_sql', {
      sql_query: "SELECT gen_salt('bf') as test_salt;"
    });
    
    if (error) {
      console.log('❌ pgcrypto test failed:', error.message);
      
      // Try to enable pgcrypto
      console.log('\n🔧 Attempting to enable pgcrypto...');
      const { data: enableData, error: enableError } = await adminSupabase.rpc('exec_sql', {
        sql_query: "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
      });
      
      if (enableError) {
        console.log('❌ Failed to enable pgcrypto:', enableError.message);
      } else {
        console.log('✅ pgcrypto enabled successfully');
      }
    } else {
      console.log('✅ pgcrypto is available:', data);
    }
  } catch (error) {
    console.log('❌ pgcrypto check error:', error.message);
  }
}

testDirectSQL()
  .then(() => {
    console.log('\n🎉 Direct SQL test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Direct SQL test failed:', error);
    process.exit(1);
  });