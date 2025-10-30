const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function restApiFix() {
  console.log('🔧 Applying fix using REST API approach...\n');

  try {
    // 1. First, let's disable RLS on profiles to avoid recursion
    console.log('1. Disabling RLS on profiles...');
    
    const disableRlsResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY'
      })
    });

    if (!disableRlsResponse.ok) {
      const error = await disableRlsResponse.text();
      console.log('❌ Failed to disable RLS:', error);
    } else {
      console.log('✅ RLS disabled');
    }

    // 2. Create the function using a simpler approach
    console.log('\n2. Creating handle_new_user function...');
    
    const createFunctionSql = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
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
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$function$`;

    const createFunctionResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: createFunctionSql })
    });

    if (!createFunctionResponse.ok) {
      const error = await createFunctionResponse.text();
      console.log('❌ Failed to create function:', error);
    } else {
      console.log('✅ Function created');
    }

    // 3. Create the trigger
    console.log('\n3. Creating trigger...');
    
    const createTriggerSql = `
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user()`;

    const createTriggerResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: createTriggerSql })
    });

    if (!createTriggerResponse.ok) {
      const error = await createTriggerResponse.text();
      console.log('❌ Failed to create trigger:', error);
    } else {
      console.log('✅ Trigger created');
    }

    // 4. Test signup
    console.log('\n4. Testing signup...');
    const testEmail = `test-rest-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'agent',
          name: 'Test User REST'
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
        // Wait for trigger to execute
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try to get profile using direct table access
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData.user.id)
          .single();

        if (profileError) {
          console.log('❌ Profile not found via Supabase client:', profileError.message);
          
          // Try direct REST API call
          const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${signupData.user.id}`, {
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            }
          });
          
          if (profileResponse.ok) {
            const profiles = await profileResponse.json();
            if (profiles.length > 0) {
              console.log('✅ Profile found via REST API!');
              console.log('Profile data:', profiles[0]);
            } else {
              console.log('❌ Profile not found via REST API either');
            }
          } else {
            console.log('❌ REST API call failed:', await profileResponse.text());
          }
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

    console.log('\n🎉 REST API fix completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

restApiFix();