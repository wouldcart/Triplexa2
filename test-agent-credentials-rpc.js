import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAgentCredentialsRPC() {
  console.log('🧪 Testing get_agent_credentials_status RPC function...\n');

  try {
    // Test 1: Check if the function exists by calling it with a test username
    console.log('1. Testing RPC function with test username...');
    const { data, error } = await supabase.rpc('get_agent_credentials_status', {
      p_username: 'test@example.com'
    });

    if (error) {
      console.error('❌ RPC function error:', error.message);
      console.log('This likely means the migration was not applied.');
      return false;
    }

    console.log('✅ RPC function exists and is callable');
    console.log('Response:', data);

    // Test 2: Check if agent_credentials table exists
    console.log('\n2. Testing agent_credentials table access...');
    const { data: tableData, error: tableError } = await supabase
      .from('agent_credentials')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ agent_credentials table error:', tableError.message);
      return false;
    }

    console.log('✅ agent_credentials table is accessible');
    console.log('Sample data count:', tableData?.length || 0);

    // Test 3: Check for any existing agent credentials
    console.log('\n3. Checking for existing agent credentials...');
    const { data: allCreds, error: allCredsError } = await supabase
      .from('agent_credentials')
      .select('username, is_temporary, agent_id')
      .limit(10);

    if (allCredsError) {
      console.error('❌ Error fetching agent credentials:', allCredsError.message);
      return false;
    }

    console.log('✅ Found', allCreds?.length || 0, 'agent credentials');
    if (allCreds && allCreds.length > 0) {
      console.log('Sample credentials:');
      allCreds.forEach((cred, index) => {
        console.log(`  ${index + 1}. Username: ${cred.username}, Temporary: ${cred.is_temporary}, Agent ID: ${cred.agent_id}`);
      });
    }

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function applyMigrationIfNeeded() {
  console.log('\n🔧 Attempting to apply migration...');

  const migrationSQL = `
-- Add RPC function to get agent credentials status
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_agent_credentials_status(TEXT) TO authenticated;
`;

  try {
    // Try to execute the migration SQL directly
    const { error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });

    if (error) {
      console.error('❌ Failed to apply migration via exec_sql:', error.message);
      
      // Try alternative method using REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql_query: migrationSQL })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to apply migration via REST API:', errorText);
        return false;
      }
    }

    console.log('✅ Migration applied successfully');
    return true;

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting agent credentials RPC test...\n');

  // First, test if the RPC function exists
  const rpcExists = await testAgentCredentialsRPC();

  if (!rpcExists) {
    console.log('\n📝 RPC function not found. Attempting to apply migration...');
    const migrationApplied = await applyMigrationIfNeeded();

    if (migrationApplied) {
      console.log('\n🔄 Re-testing after migration...');
      await testAgentCredentialsRPC();
    }
  }

  console.log('\n✅ Test completed!');
}

main().catch(console.error);