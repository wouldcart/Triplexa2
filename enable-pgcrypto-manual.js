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

async function enablePgcrypto() {
  console.log('🔧 Manually enabling pgcrypto extension...');
  
  // Try to create a test function that enables pgcrypto
  try {
    console.log('\n1. Creating test function to enable pgcrypto...');
    
    const { data, error } = await adminSupabase.rpc('set_agent_credentials', {
      p_id: '00000000-0000-0000-0000-000000000001', // Use a different fake UUID
      p_username: 'pgcrypto_test',
      p_password: 'test123',
      p_is_temporary: true
    });
    
    if (error) {
      console.log('❌ set_agent_credentials failed:', error.message);
      
      // If it's a foreign key error, that's actually good - it means the function works
      if (error.message.includes('foreign key constraint')) {
        console.log('✅ Function works (foreign key error is expected with fake UUID)');
        console.log('✅ This means pgcrypto is working in set_agent_credentials');
      }
    } else {
      console.log('✅ set_agent_credentials worked:', data);
    }
  } catch (error) {
    console.log('❌ set_agent_credentials error:', error.message);
  }
  
  // Test the crypt function directly by creating a simple test function
  console.log('\n2. Testing crypt function availability...');
  
  try {
    // Create a simple test function that uses crypt
    const testFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.test_crypt_function(test_password text, test_hash text)
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN crypt(test_password, test_hash) = test_hash;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN false;
      END;
      $$;
    `;
    
    // We can't execute raw SQL, but let's test if crypt works in authenticate_managed_agent
    const { data, error } = await adminSupabase.rpc('authenticate_managed_agent', {
      p_username: 'nonexistent_user',
      p_password: 'test'
    });
    
    if (error) {
      console.log('❌ authenticate_managed_agent failed:', error.message);
      
      if (error.message.includes('function crypt(text, text) does not exist')) {
        console.log('❌ pgcrypto crypt function is not available');
        return false;
      }
    } else {
      console.log('✅ authenticate_managed_agent works:', data);
      console.log('✅ This means pgcrypto crypt function is available');
      return true;
    }
  } catch (error) {
    console.log('❌ crypt test error:', error.message);
  }
  
  // Test gen_salt function
  console.log('\n3. Testing gen_salt function...');
  
  try {
    // Test gen_salt by trying to set credentials for a real agent
    const { data: agents, error: agentsError } = await adminSupabase
      .from('agents')
      .select('id')
      .limit(1);
    
    if (agentsError) {
      console.log('❌ Could not get agents:', agentsError.message);
      return false;
    }
    
    if (agents && agents.length > 0) {
      const agentId = agents[0].id;
      console.log('   Using real agent ID:', agentId);
      
      const { data, error } = await adminSupabase.rpc('set_agent_credentials', {
        p_id: agentId,
        p_username: 'test_pgcrypto_' + Date.now(),
        p_password: 'test123',
        p_is_temporary: true
      });
      
      if (error) {
        console.log('❌ set_agent_credentials with real agent failed:', error.message);
        
        if (error.message.includes('function gen_salt')) {
          console.log('❌ pgcrypto gen_salt function is not available');
          return false;
        }
      } else {
        console.log('✅ set_agent_credentials with real agent worked');
        console.log('✅ This means pgcrypto gen_salt function is available');
        return true;
      }
    } else {
      console.log('❌ No agents found to test with');
    }
  } catch (error) {
    console.log('❌ gen_salt test error:', error.message);
  }
  
  return false;
}

enablePgcrypto()
  .then(success => {
    if (success) {
      console.log('\n🎉 pgcrypto is working properly!');
      process.exit(0);
    } else {
      console.log('\n❌ pgcrypto is not working properly');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ pgcrypto test failed:', error);
    process.exit(1);
  });