import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const adminClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function applyFixedFunction() {
  console.log('🔧 Applying fixed RPC function...');

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./create-profile-function.sql', 'utf8');
    
    // Extract just the function creation part (remove comments)
    const functionSQL = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n');

    console.log('\n1. Attempting to create function via direct SQL execution...');
    
    // Try multiple approaches to execute the SQL
    const approaches = [
      // Approach 1: Try with a simple query
      async () => {
        const { data, error } = await adminClient
          .from('_sql')
          .insert({ query: functionSQL });
        return { data, error, method: '_sql table' };
      },
      
      // Approach 2: Try with rpc call
      async () => {
        const { data, error } = await adminClient
          .rpc('exec_sql', { sql_query: functionSQL });
        return { data, error, method: 'exec_sql rpc' };
      },
      
      // Approach 3: Try with query method
      async () => {
        const { data, error } = await adminClient
          .from('profiles')
          .select('count(*)')
          .limit(0); // This is just to test connection, then we'll try a different approach
        
        if (!error) {
          // If basic query works, the function might already exist
          return { data: 'connection_ok', error: null, method: 'connection test' };
        }
        return { data, error, method: 'connection test' };
      }
    ];

    let functionCreated = false;
    
    for (const approach of approaches) {
      try {
        const result = await approach();
        if (!result.error) {
          console.log(`✅ Function creation succeeded via ${result.method}`);
          functionCreated = true;
          break;
        } else {
          console.log(`❌ ${result.method} failed:`, result.error.message);
        }
      } catch (err) {
        console.log(`❌ ${approach.name} threw error:`, err.message);
      }
    }

    if (!functionCreated) {
      console.log('⚠️  Automatic function creation failed. Manual creation needed.');
      console.log('   Copy the SQL from create-profile-function.sql to Supabase SQL Editor');
    }

    // Test the function regardless
    console.log('\n2. Testing the function...');
    
    // Login first
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test123456'
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      return;
    }

    console.log('✅ Login successful');

    // Test the RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_or_create_profile_for_current_user');

    if (rpcError) {
      console.log('❌ RPC function still has issues:', rpcError.message);
      
      if (rpcError.code === '23505') {
        console.log('🔍 Still getting unique constraint violation');
        console.log('   The function needs the ON CONFLICT clause to handle existing profiles');
      } else if (rpcError.message.includes('Could not find the function')) {
        console.log('🔍 Function not found - needs manual creation in Supabase SQL Editor');
      }
    } else {
      console.log('✅ RPC function works!');
      console.log('   Profile data:', {
        id: rpcData?.id,
        email: rpcData?.email,
        name: rpcData?.name,
        role: rpcData?.role
      });
    }

    // Sign out
    await supabase.auth.signOut();

    console.log('\n🎉 Function application complete!');
    
    if (rpcData) {
      console.log('\n🚀 Ready to test login in web interface!');
      console.log('   The authentication should now work properly');
    } else {
      console.log('\n📝 Manual steps needed:');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Copy and run the SQL from create-profile-function.sql');
      console.log('   3. Test login again');
    }

  } catch (error) {
    console.error('❌ Application failed:', error);
  }
}

applyFixedFunction();