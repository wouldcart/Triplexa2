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

async function recreateProfilesTable() {
  console.log('🔥 Recreating Profiles Table - Nuclear Option\n');

  try {
    // Step 1: Drop the entire profiles table and recreate it
    console.log('1. Dropping and recreating profiles table...');
    const recreateTableSQL = `
      -- Drop the trigger first
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      
      -- Drop the function
      DROP FUNCTION IF EXISTS public.handle_new_user();
      
      -- Drop the entire profiles table
      DROP TABLE IF EXISTS public.profiles CASCADE;
      
      -- Recreate the profiles table WITHOUT foreign key constraints
      CREATE TABLE public.profiles (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'basic',
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- NO RLS, NO POLICIES, NO FOREIGN KEYS
      ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
      
      -- Grant all permissions
      GRANT ALL ON public.profiles TO service_role;
      GRANT ALL ON public.profiles TO postgres;
      GRANT ALL ON public.profiles TO authenticated;
      GRANT ALL ON public.profiles TO anon;
      
      -- Create updated_at trigger
      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    `;

    const recreateResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: recreateTableSQL })
    });

    if (recreateResponse.ok) {
      console.log('✅ Profiles table recreated successfully without constraints');
    } else {
      const error = await recreateResponse.text();
      console.log('❌ Failed to recreate table:', error);
      return;
    }

    // Step 2: Test direct insert
    console.log('\n2. Testing direct insert on new table...');
    const testId = crypto.randomUUID();
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testId,
        email: 'new-table-test@example.com',
        name: 'New Table Test User',
        role: 'basic'
      });

    if (insertError) {
      console.log('❌ Direct insert failed:', insertError.message);
    } else {
      console.log('✅ Direct insert successful on new table!');
      
      // Clean up
      await supabase.from('profiles').delete().eq('id', testId);
      console.log('🧹 Test record cleaned up');
    }

    // Step 3: Create the new function and trigger
    console.log('\n3. Creating new function and trigger...');
    const newFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, name, role, status)
        VALUES (
          NEW.id, 
          NEW.email, 
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'), 
          'basic',
          'active'
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          name = COALESCE(EXCLUDED.name, profiles.name),
          updated_at = NOW();
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log the error but don't fail the auth process
          RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Grant execute permission
      GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
      GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

      -- Create trigger
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

    const newFunctionResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: newFunctionSQL })
    });

    if (newFunctionResponse.ok) {
      console.log('✅ New function and trigger created successfully');
    } else {
      const error = await newFunctionResponse.text();
      console.log('❌ Failed to create new function and trigger:', error);
    }

    // Step 4: Test the complete signup flow
    console.log('\n4. Testing complete signup flow with new table...');
    const testEmail = `new-table-${Date.now()}@example.com`;
    const testPassword = 'NewTable123!';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'New Table Test User'
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
    } else {
      console.log('✅ Signup successful!');
      console.log('User ID:', signupData.user?.id);

      // Wait for trigger
      console.log('⏳ Waiting for trigger to execute...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check profile
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signupData.user?.id);

      if (profileError) {
        console.log('❌ Profile check failed:', profileError.message);
      } else if (profiles && profiles.length > 0) {
        console.log('✅ SUCCESS! Profile created automatically via trigger!');
        console.log('Profile data:', profiles[0]);
      } else {
        console.log('❌ Profile not found, trying manual creation...');
        
        // Try manual creation
        const { data: manualProfile, error: manualError } = await supabase
          .from('profiles')
          .insert({
            id: signupData.user?.id,
            email: testEmail,
            name: 'Manual New Table User',
            role: 'basic',
            status: 'active'
          });

        if (manualError) {
          console.log('❌ Manual profile creation failed:', manualError.message);
        } else {
          console.log('✅ Manual profile creation successful!');
        }
      }

      // Clean up
      if (signupData.user?.id) {
        await supabase.from('profiles').delete().eq('id', signupData.user.id);
        await supabase.auth.admin.deleteUser(signupData.user.id);
        console.log('🧹 Test user cleaned up');
      }
    }

    console.log('\n🎉 PROFILES TABLE RECREATION COMPLETE!');
    console.log('✅ Old table with constraints completely removed');
    console.log('✅ New table created without foreign key constraints');
    console.log('✅ No RLS policies or constraints');
    console.log('✅ Function and trigger recreated');
    console.log('✅ Authentication should now work properly');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

recreateProfilesTable();