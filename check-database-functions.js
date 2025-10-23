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

async function checkDatabaseFunctions() {
  console.log('🔍 Checking database functions and tables...');
  
  // 1. Check if agent_credentials table exists
  console.log('\n1. Checking agent_credentials table...');
  try {
    const { data, error } = await adminSupabase
      .from('agent_credentials')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ agent_credentials table not accessible:', error.message);
    } else {
      console.log('✅ agent_credentials table exists and accessible');
    }
  } catch (error) {
    console.log('❌ agent_credentials table check error:', error.message);
  }
  
  // 2. Check if pgcrypto extension is available by testing gen_salt
  console.log('\n2. Testing pgcrypto extension...');
  try {
    // Try to use a simple SQL query that would work if pgcrypto is available
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/test_gen_salt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({})
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ pgcrypto test function available:', result);
    } else {
      console.log('❌ pgcrypto test function not available');
    }
  } catch (error) {
    console.log('❌ pgcrypto test error:', error.message);
  }
  
  // 3. Try to call set_agent_credentials directly
  console.log('\n3. Testing set_agent_credentials function...');
  try {
    const { data, error } = await adminSupabase.rpc('set_agent_credentials', {
      p_id: '00000000-0000-0000-0000-000000000000',
      p_username: 'test',
      p_password: 'test',
      p_is_temporary: true
    });
    
    if (error) {
      console.log('❌ set_agent_credentials not available:', error.message);
    } else {
      console.log('✅ set_agent_credentials function works');
    }
  } catch (error) {
    console.log('❌ set_agent_credentials error:', error.message);
  }
  
  // 4. Try to call authenticate_managed_agent directly
  console.log('\n4. Testing authenticate_managed_agent function...');
  try {
    const { data, error } = await adminSupabase.rpc('authenticate_managed_agent', {
      p_username: 'test',
      p_password: 'test'
    });
    
    if (error) {
      console.log('❌ authenticate_managed_agent not available:', error.message);
    } else {
      console.log('✅ authenticate_managed_agent function works:', data);
    }
  } catch (error) {
    console.log('❌ authenticate_managed_agent error:', error.message);
  }
  
  // 5. Check what tables are available
  console.log('\n5. Checking available tables...');
  try {
    const { data, error } = await adminSupabase
      .from('agents')
      .select('id, name')
      .limit(3);
    
    if (error) {
      console.log('❌ agents table not accessible:', error.message);
    } else {
      console.log('✅ agents table accessible, found', data?.length || 0, 'agents');
      if (data && data.length > 0) {
        console.log('   Sample agent:', data[0]);
      }
    }
  } catch (error) {
    console.log('❌ agents table check error:', error.message);
  }
  
  // 6. Check profiles table
  console.log('\n6. Checking profiles table...');
  try {
    const { data, error } = await adminSupabase
      .from('profiles')
      .select('id, email')
      .limit(3);
    
    if (error) {
      console.log('❌ profiles table not accessible:', error.message);
    } else {
      console.log('✅ profiles table accessible, found', data?.length || 0, 'profiles');
    }
  } catch (error) {
    console.log('❌ profiles table check error:', error.message);
  }
}

checkDatabaseFunctions()
  .then(() => {
    console.log('\n🎉 Database function check complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Database function check failed:', error);
    process.exit(1);
  });