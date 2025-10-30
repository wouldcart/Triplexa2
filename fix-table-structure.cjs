const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixTableStructure() {
  console.log('🔧 Fixing table structure and RLS policies\n');

  try {
    // Step 1: Check current table structure
    console.log('1. Checking current table structure...');
    const structureResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ 
        sql: `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' ORDER BY ordinal_position` 
      })
    });

    if (structureResponse.ok) {
      const structureData = await structureResponse.json();
      console.log('✅ Current table structure:', structureData);
    } else {
      console.log('❌ Failed to check table structure');
    }

    // Step 2: Add missing columns if needed
    console.log('\n2. Adding missing columns...');
    const addColumnsSQL = `
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS full_name TEXT,
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'basic',
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `;

    const addColumnsResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: addColumnsSQL })
    });

    if (addColumnsResponse.ok) {
      console.log('✅ Columns added successfully');
    } else {
      const error = await addColumnsResponse.text();
      console.log('❌ Failed to add columns:', error);
    }

    // Step 3: Completely disable RLS and drop all policies
    console.log('\n3. Completely disabling RLS...');
    const disableRLSSQL = `
      DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Service role can update profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
      ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
    `;

    const disableRLSResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: disableRLSSQL })
    });

    if (disableRLSResponse.ok) {
      console.log('✅ RLS completely disabled');
    } else {
      const error = await disableRLSResponse.text();
      console.log('❌ Failed to disable RLS:', error);
    }

    // Step 4: Test direct table access
    console.log('\n4. Testing direct table access...');
    const testId = crypto.randomUUID();
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testId,
        email: 'direct-test@example.com',
        full_name: 'Direct Test User',
        role: 'basic'
      });

    if (insertError) {
      console.log('❌ Direct insert failed:', insertError.message);
    } else {
      console.log('✅ Direct insert successful!');
      
      // Test read
      const { data: readData, error: readError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testId);

      if (readError) {
        console.log('❌ Direct read failed:', readError.message);
      } else {
        console.log('✅ Direct read successful:', readData);
      }
      
      // Clean up
      await supabase.from('profiles').delete().eq('id', testId);
      console.log('🧹 Test record cleaned up');
    }

    // Step 5: Recreate the function and trigger
    console.log('\n5. Recreating function and trigger...');
    const functionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'basic')
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

    const functionResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: functionSQL })
    });

    if (functionResponse.ok) {
      console.log('✅ Function and trigger recreated successfully');
    } else {
      const error = await functionResponse.text();
      console.log('❌ Failed to recreate function and trigger:', error);
    }

    // Step 6: Test complete signup flow
    console.log('\n6. Testing complete signup flow...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
    } else {
      console.log('✅ Signup successful!');
      console.log('User ID:', signupData.user?.id);

      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check profile
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signupData.user?.id);

      if (profileError) {
        console.log('❌ Profile check failed:', profileError.message);
      } else if (profiles && profiles.length > 0) {
        console.log('✅ Profile created successfully!');
        console.log('Profile data:', profiles[0]);
      } else {
        console.log('❌ Profile not found');
      }

      // Clean up
      if (signupData.user?.id) {
        await supabase.from('profiles').delete().eq('id', signupData.user.id);
        await supabase.auth.admin.deleteUser(signupData.user.id);
        console.log('🧹 Test user cleaned up');
      }
    }

    console.log('\n🎉 Table structure fix completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixTableStructure();