import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAvailableRPCs() {
  console.log('🔍 Checking available RPC functions...\n');

  try {
    // Query the information_schema to get available functions
    const { data, error } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type, routine_schema')
      .eq('routine_schema', 'public')
      .eq('routine_type', 'FUNCTION');

    if (error) {
      console.error('❌ Error querying functions:', error.message);
      return;
    }

    console.log('📋 Available RPC functions:');
    if (data && data.length > 0) {
      data.forEach((func, index) => {
        console.log(`  ${index + 1}. ${func.routine_name} (${func.routine_type})`);
      });
    } else {
      console.log('  No RPC functions found');
    }

    // Test some known functions
    console.log('\n🧪 Testing known functions...');
    
    // Test authenticate_agent (we know this exists from the search results)
    try {
      const { data: authData, error: authError } = await supabase.rpc('authenticate_agent', {
        p_username: 'test@example.com',
        p_password: 'testpassword'
      });
      
      if (authError) {
        console.log('❌ authenticate_agent failed:', authError.message);
      } else {
        console.log('✅ authenticate_agent is available');
      }
    } catch (err) {
      console.log('❌ authenticate_agent error:', err.message);
    }

    // Check if we can query agent_credentials table directly
    console.log('\n🔍 Checking agent_credentials table...');
    try {
      const { data: tableData, error: tableError } = await supabase
        .from('agent_credentials')
        .select('username, is_temporary, agent_id')
        .limit(5);

      if (tableError) {
        console.error('❌ agent_credentials table error:', tableError.message);
      } else {
        console.log('✅ agent_credentials table is accessible');
        console.log(`Found ${tableData?.length || 0} records`);
        if (tableData && tableData.length > 0) {
          console.log('Sample records:');
          tableData.forEach((record, index) => {
            console.log(`  ${index + 1}. ${record.username} (temp: ${record.is_temporary})`);
          });
        }
      }
    } catch (err) {
      console.log('❌ agent_credentials table error:', err.message);
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

async function tryDirectSQLExecution() {
  console.log('\n🔧 Trying direct SQL execution methods...\n');

  // Method 1: Try to create the function using a simple INSERT/UPDATE operation
  console.log('1. Trying to create function via direct SQL...');
  
  const functionSQL = `
CREATE OR REPLACE FUNCTION get_agent_credentials_status(p_username TEXT)
RETURNS TABLE(
  exists BOOLEAN,
  is_temporary BOOLEAN,
  agent_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as exists,
    ac.is_temporary,
    ac.agent_id
  FROM public.agent_credentials ac
  WHERE ac.username = p_username;
  
  -- If no record found, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE as exists, FALSE as is_temporary, NULL::UUID as agent_id;
  END IF;
END;
$$;
`;

  try {
    // Try using the REST API with raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: functionSQL })
    });

    if (response.ok) {
      console.log('✅ Function created via REST API');
    } else {
      const errorText = await response.text();
      console.log('❌ REST API failed:', errorText);
    }
  } catch (err) {
    console.log('❌ REST API error:', err.message);
  }

  // Method 2: Try to use any available SQL execution function
  console.log('\n2. Checking for SQL execution functions...');
  
  const sqlFunctions = ['exec_sql', 'execute_sql', 'run_sql', 'sql_exec'];
  
  for (const funcName of sqlFunctions) {
    try {
      const { data, error } = await supabase.rpc(funcName, { sql: 'SELECT 1' });
      if (!error) {
        console.log(`✅ Found working SQL function: ${funcName}`);
        
        // Try to create our function using this
        const { data: createData, error: createError } = await supabase.rpc(funcName, { 
          sql: functionSQL 
        });
        
        if (!createError) {
          console.log('✅ Function created successfully!');
          return true;
        } else {
          console.log(`❌ Function creation failed with ${funcName}:`, createError.message);
        }
      }
    } catch (err) {
      // Function doesn't exist, continue
    }
  }

  return false;
}

async function main() {
  console.log('🎯 Checking Supabase RPC Functions');
  console.log('==================================');
  
  await checkAvailableRPCs();
  await tryDirectSQLExecution();
  
  console.log('\n✅ Check completed!');
}

main().catch(console.error);