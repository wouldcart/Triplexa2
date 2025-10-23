import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testUserRoleFunction() {
  console.log('🧪 Testing get_current_user_role function fix');
  console.log('=============================================');
  
  try {
    // Test the function call
    console.log('📞 Calling get_current_user_role...');
    const { data, error } = await supabase.rpc('get_current_user_role');
    
    if (error) {
      console.log('⚠️  Error (expected for unauthenticated user):', error.message);
      
      // Check if it's the old "function does not exist" error
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('❌ Function still does not exist - fix failed');
        return false;
      } else {
        console.log('✅ Function exists but returned error (normal for unauthenticated user)');
        return true;
      }
    } else {
      console.log('✅ Function call successful, returned:', data);
      return true;
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

async function testAppSettingsService() {
  console.log('\n🔧 Testing AppSettingsService integration');
  console.log('=========================================');
  
  try {
    // Create a client similar to how AppSettingsService would use it
    const publicClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || supabaseServiceKey);
    
    console.log('📞 Testing AppSettingsService-style call...');
    const { data, error } = await publicClient.rpc('get_current_user_role');
    
    if (error) {
      console.log('⚠️  Error (expected for unauthenticated user):', error.message);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('TypeError')) {
        console.log('❌ Still getting network/fetch errors - may need more investigation');
        return false;
      } else {
        console.log('✅ No more "Failed to fetch" errors - AppSettingsService should work');
        return true;
      }
    } else {
      console.log('✅ AppSettingsService-style call successful, returned:', data);
      return true;
    }
  } catch (error) {
    console.error('❌ AppSettingsService test error:', error.message);
    return false;
  }
}

async function main() {
  const functionTest = await testUserRoleFunction();
  const appServiceTest = await testAppSettingsService();
  
  console.log('\n📊 Test Results');
  console.log('===============');
  console.log(`Function exists: ${functionTest ? '✅' : '❌'}`);
  console.log(`AppSettingsService compatible: ${appServiceTest ? '✅' : '❌'}`);
  
  if (functionTest && appServiceTest) {
    console.log('\n🎉 SUCCESS: The AppSettingsService error should be resolved!');
    console.log('💡 The "Failed to fetch" error was caused by the missing get_current_user_role function.');
    console.log('💡 Now that the function exists, the AppSettingsService should work properly.');
  } else {
    console.log('\n⚠️  Some tests failed - the fix may need additional work.');
  }
}

main().catch(console.error);