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

async function enablePgCrypto() {
  console.log('🔧 Enabling pgcrypto extension...');
  
  try {
    // Method 1: Try using direct SQL execution
    const response = await fetch(`${supabaseUrl}/rest/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.pgrst.object+json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Prefer': 'return=minimal'
      },
      body: 'CREATE EXTENSION IF NOT EXISTS pgcrypto;'
    });
    
    if (response.ok) {
      console.log('✅ pgcrypto extension enabled via REST API');
    } else {
      console.log('⚠️  REST API method failed, trying RPC...');
      
      // Method 2: Try using RPC if available
      const { error: rpcError } = await adminSupabase.rpc('exec_sql', {
        sql_query: 'CREATE EXTENSION IF NOT EXISTS pgcrypto;'
      });
      
      if (rpcError) {
        console.log('⚠️  RPC method failed:', rpcError.message);
      } else {
        console.log('✅ pgcrypto extension enabled via RPC');
      }
    }
    
    // Test if gen_salt function is now available
    console.log('\n🧪 Testing gen_salt function...');
    
    const { data: testData, error: testError } = await adminSupabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('❌ Database connection test failed:', testError.message);
      return false;
    }
    
    // Try to use gen_salt in a simple query
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.pgrst.object+json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Prefer': 'return=minimal'
      },
      body: "SELECT gen_salt('bf') as test_salt;"
    });
    
    if (testResponse.ok) {
      console.log('✅ gen_salt function is working!');
      return true;
    } else {
      console.log('❌ gen_salt function still not available');
      
      // Check what extensions are available
      console.log('\n🔍 Checking available extensions...');
      const extResponse = await fetch(`${supabaseUrl}/rest/v1/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.pgrst.object+json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Prefer': 'return=minimal'
        },
        body: "SELECT name, installed_version FROM pg_available_extensions WHERE name = 'pgcrypto';"
      });
      
      if (extResponse.ok) {
        const extText = await extResponse.text();
        console.log('Extension info:', extText);
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error enabling pgcrypto:', error);
    return false;
  }
}

enablePgCrypto()
  .then(success => {
    if (success) {
      console.log('\n🎉 pgcrypto extension is ready!');
      process.exit(0);
    } else {
      console.log('\n❌ Failed to enable pgcrypto extension');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });