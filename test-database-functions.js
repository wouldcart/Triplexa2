import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testDatabaseFunctions() {
  console.log('🔍 Testing Database Functions and Extensions');
  console.log('==============================================');
  
  try {
    // Test 1: Check if pgcrypto extension is available
    console.log('\n1. Testing pgcrypto extension...');
    const { data: extensionData, error: extensionError } = await adminSupabase
      .rpc('sql', { 
        query: "SELECT gen_salt('bf') as salt;" 
      });
    
    if (extensionError) {
      console.log('❌ pgcrypto test failed:', extensionError);
      
      // Try to enable the extension
      console.log('🔧 Attempting to enable pgcrypto extension...');
      const { error: enableError } = await adminSupabase
        .rpc('sql', { 
          query: "CREATE EXTENSION IF NOT EXISTS pgcrypto;" 
        });
      
      if (enableError) {
        console.log('❌ Failed to enable pgcrypto:', enableError);
      } else {
        console.log('✅ pgcrypto extension enabled');
      }
    } else {
      console.log('✅ pgcrypto extension is working');
    }
    
    // Test 2: Check if set_agent_credentials function exists
    console.log('\n2. Testing set_agent_credentials function...');
    const { data: functionData, error: functionError } = await adminSupabase
      .rpc('sql', { 
        query: `
          SELECT proname, pronargs 
          FROM pg_proc 
          WHERE proname = 'set_agent_credentials';
        ` 
      });
    
    if (functionError) {
      console.log('❌ Function check failed:', functionError);
    } else if (functionData && functionData.length > 0) {
      console.log('✅ set_agent_credentials function exists');
      console.log('   Function details:', functionData);
    } else {
      console.log('❌ set_agent_credentials function not found');
    }
    
    // Test 3: Try to call set_agent_credentials with test data
    console.log('\n3. Testing set_agent_credentials RPC call...');
    const testAgentId = '00000000-0000-0000-0000-000000000001';
    const { error: rpcError } = await adminSupabase
      .rpc('set_agent_credentials', {
        p_id: testAgentId,
        p_username: 'test_user_db_func',
        p_password: 'test_password_123',
        p_is_temporary: true
      });
    
    if (rpcError) {
      console.log('❌ RPC call failed:', rpcError);
    } else {
      console.log('✅ RPC call succeeded');
      
      // Clean up test data
      await adminSupabase
        .from('agent_credentials')
        .delete()
        .eq('agent_id', testAgentId);
      console.log('✅ Test data cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testDatabaseFunctions();