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

async function checkAvailableFunctions() {
  console.log('🔍 Checking Available Database Functions and Extensions');
  console.log('=======================================================');

  try {
    // Check available tables first
    console.log('\n1. Checking available tables...');
    const { data: tables, error: tableError } = await adminSupabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (tableError) {
      console.log('❌ Table check failed:', tableError);
    } else {
      console.log('✅ Available tables:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }

    // Try to call set_agent_credentials directly
    console.log('\n2. Testing set_agent_credentials function...');
    try {
      const { data, error } = await adminSupabase.rpc('set_agent_credentials', {
        agent_id: 'test-id',
        username: 'test-user',
        password: 'test-pass'
      });
      
      if (error) {
        console.log('❌ set_agent_credentials failed:', error);
      } else {
        console.log('✅ set_agent_credentials works:', data);
      }
    } catch (err) {
      console.log('❌ set_agent_credentials error:', err);
    }

    // Try to call authenticate_managed_agent
    console.log('\n3. Testing authenticate_managed_agent function...');
    try {
      const { data, error } = await adminSupabase.rpc('authenticate_managed_agent', {
        username: 'test-user',
        password: 'test-pass'
      });
      
      if (error) {
        console.log('❌ authenticate_managed_agent failed:', error);
      } else {
        console.log('✅ authenticate_managed_agent works:', data);
      }
    } catch (err) {
      console.log('❌ authenticate_managed_agent error:', err);
    }

    // Try to call approve_agent
    console.log('\n4. Testing approve_agent function...');
    try {
      const { data, error } = await adminSupabase.rpc('approve_agent', {
        agent_id: 'test-id'
      });
      
      if (error) {
        console.log('❌ approve_agent failed:', error);
      } else {
        console.log('✅ approve_agent works:', data);
      }
    } catch (err) {
      console.log('❌ approve_agent error:', err);
    }

    // Check if we can access profiles table
    console.log('\n5. Testing profiles table access...');
    try {
      const { data, error } = await adminSupabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (error) {
        console.log('❌ profiles access failed:', error);
      } else {
        console.log('✅ profiles table accessible, sample count:', data.length);
      }
    } catch (err) {
      console.log('❌ profiles access error:', err);
    }

    // Check if we can access agents table
    console.log('\n6. Testing agents table access...');
    try {
      const { data, error } = await adminSupabase
        .from('agents')
        .select('id')
        .limit(1);
      
      if (error) {
        console.log('❌ agents access failed:', error);
      } else {
        console.log('✅ agents table accessible, sample count:', data.length);
      }
    } catch (err) {
      console.log('❌ agents access error:', err);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAvailableFunctions();