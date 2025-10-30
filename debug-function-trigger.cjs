const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugFunctionTrigger() {
  console.log('🔍 Debugging function and trigger status...\n');

  try {
    // Check functions using different approaches
    console.log('1. Checking functions with pg_proc...');
    
    const { data: functions1, error: funcError1 } = await supabase
      .rpc('exec_sql', {
        sql: `SELECT proname, pronamespace::regnamespace as schema FROM pg_proc WHERE proname = 'handle_new_user';`
      });

    if (funcError1) {
      console.log('❌ Error checking pg_proc:', funcError1.message);
    } else {
      console.log('Functions found in pg_proc:', functions1);
    }

    // Check triggers using pg_trigger
    console.log('\n2. Checking triggers with pg_trigger...');
    
    const { data: triggers1, error: triggerError1 } = await supabase
      .rpc('exec_sql', {
        sql: `SELECT tgname, tgrelid::regclass as table_name FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
      });

    if (triggerError1) {
      console.log('❌ Error checking pg_trigger:', triggerError1.message);
    } else {
      console.log('Triggers found in pg_trigger:', triggers1);
    }

    // Check all triggers on auth.users
    console.log('\n3. Checking all triggers on auth.users...');
    
    const { data: authTriggers, error: authTriggerError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT t.tgname, t.tgtype, t.tgenabled, p.proname as function_name
          FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          JOIN pg_namespace n ON c.relnamespace = n.oid
          LEFT JOIN pg_proc p ON t.tgfoid = p.oid
          WHERE c.relname = 'users' AND n.nspname = 'auth';
        `
      });

    if (authTriggerError) {
      console.log('❌ Error checking auth.users triggers:', authTriggerError.message);
    } else {
      console.log('All triggers on auth.users:', authTriggers);
    }

    // Try to recreate the function with a simpler approach
    console.log('\n4. Recreating function with minimal approach...');
    
    const simpleFunctionSql = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- Simple insert into profiles
        INSERT INTO public.profiles (
          id,
          email,
          name,
          role,
          status,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
          COALESCE(NEW.raw_user_meta_data->>'role', 'agent'),
          'active',
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log error but don't fail
          RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
          RETURN NEW;
      END;
      $$;
    `;

    const { error: simpleFuncError } = await supabase.rpc('exec_sql', { sql: simpleFunctionSql });
    if (simpleFuncError) {
      console.log('❌ Simple function creation failed:', simpleFuncError.message);
    } else {
      console.log('✅ Simple function created');
    }

    // Recreate the trigger
    console.log('\n5. Recreating trigger...');
    
    const simpleTriggerSql = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    `;

    const { error: simpleTriggerError } = await supabase.rpc('exec_sql', { sql: simpleTriggerSql });
    if (simpleTriggerError) {
      console.log('❌ Simple trigger creation failed:', simpleTriggerError.message);
    } else {
      console.log('✅ Simple trigger created');
    }

    // Verify again
    console.log('\n6. Final verification...');
    
    const { data: finalCheck, error: finalError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            (SELECT COUNT(*) FROM pg_proc WHERE proname = 'handle_new_user') as function_count,
            (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created') as trigger_count;
        `
      });

    if (finalError) {
      console.log('❌ Final verification failed:', finalError.message);
    } else {
      console.log('Final counts:', finalCheck);
    }

    // Test signup one more time
    console.log('\n7. Testing signup with simplified function...');
    const testEmail = `test-simple-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'agent',
          name: 'Test User Simple'
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
    } else {
      console.log('✅ Signup successful!');
      console.log('User ID:', signupData.user?.id);
      
      // Check if profile was created
      if (signupData.user?.id) {
        // Wait a moment for trigger to execute
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData.user.id)
          .single();

        if (profileError) {
          console.log('❌ Profile not found:', profileError.message);
        } else {
          console.log('✅ Profile created successfully!');
          console.log('Profile data:', profile);
        }

        // Clean up test user
        const { error: deleteError } = await supabase.auth.admin.deleteUser(signupData.user.id);
        if (deleteError) {
          console.log('⚠️ Could not delete test user:', deleteError.message);
        } else {
          console.log('🧹 Test user cleaned up');
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugFunctionTrigger();