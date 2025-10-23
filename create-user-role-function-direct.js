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

async function testFunctionExists() {
  try {
    console.log('🔍 Testing if get_current_user_role function exists...');
    const { data, error } = await supabase.rpc('get_current_user_role');
    
    if (error) {
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('❌ Function does not exist');
        return false;
      } else {
        console.log('✅ Function exists (error is expected for unauthenticated user):', error.message);
        return true;
      }
    } else {
      console.log('✅ Function exists and returned:', data);
      return true;
    }
  } catch (error) {
    console.log('❌ Function does not exist:', error.message);
    return false;
  }
}

async function createFunctionManually() {
  console.log('\n📝 Since automated creation failed, please manually create the function in Supabase SQL Editor:');
  console.log('==================================================================================');
  console.log('');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Create a new query and paste the following SQL:');
  console.log('');
  console.log('-- Create get_current_user_role function');
  console.log('CREATE OR REPLACE FUNCTION get_current_user_role()');
  console.log('RETURNS TEXT');
  console.log('LANGUAGE plpgsql');
  console.log('SECURITY DEFINER');
  console.log('AS $$');
  console.log('DECLARE');
  console.log('    user_role TEXT;');
  console.log('BEGIN');
  console.log('    -- Check if user is authenticated');
  console.log('    IF auth.uid() IS NULL THEN');
  console.log('        RETURN \'guest\';');
  console.log('    END IF;');
  console.log('    ');
  console.log('    -- Get the user\'s role from the user_roles table');
  console.log('    SELECT role INTO user_role');
  console.log('    FROM user_roles');
  console.log('    WHERE user_id = auth.uid()');
  console.log('    LIMIT 1;');
  console.log('    ');
  console.log('    -- If no role found, return default role');
  console.log('    IF user_role IS NULL THEN');
  console.log('        RETURN \'user\';');
  console.log('    END IF;');
  console.log('    ');
  console.log('    RETURN user_role;');
  console.log('END;');
  console.log('$$;');
  console.log('');
  console.log('-- Grant permissions');
  console.log('GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;');
  console.log('GRANT EXECUTE ON FUNCTION get_current_user_role() TO anon;');
  console.log('');
  console.log('4. Run the query');
  console.log('5. Come back and run this script again to test');
  console.log('');
}

async function main() {
  console.log('🎯 Checking get_current_user_role function');
  console.log('==========================================');
  
  const exists = await testFunctionExists();
  
  if (!exists) {
    await createFunctionManually();
    console.log('\n⏳ After creating the function manually, the AppSettingsService error should be resolved.');
    console.log('💡 You can test the fix by refreshing your application.');
  } else {
    console.log('\n✅ Function already exists! The AppSettingsService should work now.');
    console.log('💡 If you\'re still seeing errors, try refreshing your application.');
  }
}

main().catch(console.error);