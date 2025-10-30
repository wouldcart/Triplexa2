require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkCurrentFunction() {
  console.log('🔍 Checking current get_or_create_profile_for_current_user function...\n');

  try {
    // Check if the function exists and get its definition
    const { data: functionData, error: functionError } = await adminClient
      .from('pg_proc')
      .select('proname, prosrc')
      .eq('proname', 'get_or_create_profile_for_current_user')
      .single();

    if (functionError) {
      console.log('❌ Function query failed:', functionError.message);
      
      // Try alternative approach - check if function exists by calling it
      console.log('\n🧪 Testing function existence by calling it...');
      
      // Create a test user first
      const testEmail = `test-function-${Date.now()}@example.com`;
      const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: 'testpassword123',
        user_metadata: {
          name: 'Test User',
          phone: '+1234567890',
          company_name: 'Test Company'
        }
      });

      if (userError) {
        console.log('❌ Test user creation failed:', userError.message);
        return;
      }

      console.log('✅ Test user created:', userData.user.id);

      // Try to call the function
      const regularClient = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
      
      const { data: signinData, error: signinError } = await regularClient.auth.signInWithPassword({
        email: testEmail,
        password: 'testpassword123'
      });

      if (signinError) {
        console.log('❌ Test signin failed:', signinError.message);
      } else {
        console.log('✅ Test signin successful');
        
        const { data: rpcData, error: rpcError } = await regularClient
          .rpc('get_or_create_profile_for_current_user');

        if (rpcError) {
          console.log('❌ RPC function failed:', rpcError.message);
          console.log('   Error details:', rpcError.details);
          console.log('   Error code:', rpcError.code);
        } else {
          console.log('✅ RPC function works!');
          console.log('   Profile data:', {
            id: rpcData?.id,
            name: rpcData?.name,
            phone: rpcData?.phone,
            company_name: rpcData?.company_name
          });
        }
      }

      // Cleanup
      await adminClient.auth.admin.deleteUser(userData.user.id);
      console.log('✅ Test user cleaned up');

    } else {
      console.log('✅ Function found in database');
      console.log('📝 Function source (first 500 chars):');
      console.log(functionData.prosrc.substring(0, 500) + '...');
    }

  } catch (error) {
    console.error('❌ Error checking function:', error);
  }
}

checkCurrentFunction();