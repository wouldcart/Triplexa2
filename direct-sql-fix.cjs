const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Extract connection details from Supabase URL
const url = new URL(supabaseUrl);
const projectRef = url.hostname.split('.')[0];

// Create PostgreSQL client
const pgClient = new Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function directSqlFix() {
  console.log('🔧 Applying direct SQL fix...\n');

  try {
    // Connect to PostgreSQL directly
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL directly');

    // 1. Drop existing policies that might cause recursion
    console.log('\n1. Dropping problematic RLS policies...');
    await pgClient.query('DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles');
    await pgClient.query('DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles');
    await pgClient.query('DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles');
    console.log('✅ Policies dropped');

    // 2. Disable RLS temporarily
    console.log('\n2. Disabling RLS temporarily...');
    await pgClient.query('ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY');
    console.log('✅ RLS disabled');

    // 3. Create the function
    console.log('\n3. Creating handle_new_user function...');
    const functionSql = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- Insert into profiles
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
      $$;
    `;
    
    await pgClient.query(functionSql);
    console.log('✅ Function created');

    // 4. Create the trigger
    console.log('\n4. Creating trigger...');
    await pgClient.query('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users');
    await pgClient.query(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user()
    `);
    console.log('✅ Trigger created');

    // 5. Grant permissions
    console.log('\n5. Granting permissions...');
    await pgClient.query('GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres');
    await pgClient.query('GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role');
    await pgClient.query('GRANT ALL ON public.profiles TO postgres');
    await pgClient.query('GRANT ALL ON public.profiles TO service_role');
    console.log('✅ Permissions granted');

    // 6. Test signup with RLS disabled
    console.log('\n6. Testing signup with RLS disabled...');
    const testEmail = `test-direct-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'agent',
          name: 'Test User Direct'
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
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check directly in PostgreSQL
        const profileResult = await pgClient.query(
          'SELECT * FROM public.profiles WHERE id = $1',
          [signupData.user.id]
        );

        if (profileResult.rows.length > 0) {
          console.log('✅ Profile created successfully!');
          console.log('Profile data:', profileResult.rows[0]);
        } else {
          console.log('❌ Profile not found in database');
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

    // 7. Re-enable RLS with simple policies
    console.log('\n7. Re-enabling RLS with simple policies...');
    await pgClient.query('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY');
    
    // Create simple, non-recursive policies
    await pgClient.query(`
      CREATE POLICY "Enable read access for authenticated users" ON public.profiles
      FOR SELECT USING (auth.role() = 'authenticated')
    `);
    
    await pgClient.query(`
      CREATE POLICY "Enable insert for service role" ON public.profiles
      FOR INSERT WITH CHECK (auth.role() = 'service_role')
    `);
    
    await pgClient.query(`
      CREATE POLICY "Enable update for service role" ON public.profiles
      FOR UPDATE USING (auth.role() = 'service_role')
    `);
    
    console.log('✅ RLS re-enabled with simple policies');

    // 8. Final test with RLS enabled
    console.log('\n8. Final test with RLS enabled...');
    const finalTestEmail = `test-final-${Date.now()}@example.com`;
    
    const { data: finalSignupData, error: finalSignupError } = await supabase.auth.signUp({
      email: finalTestEmail,
      password: testPassword,
      options: {
        data: {
          role: 'agent',
          name: 'Final Test User'
        }
      }
    });

    if (finalSignupError) {
      console.log('❌ Final signup failed:', finalSignupError.message);
    } else {
      console.log('✅ Final signup successful!');
      
      if (finalSignupData.user?.id) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const finalProfileResult = await pgClient.query(
          'SELECT * FROM public.profiles WHERE id = $1',
          [finalSignupData.user.id]
        );

        if (finalProfileResult.rows.length > 0) {
          console.log('✅ Final profile created successfully!');
          console.log('Profile data:', finalProfileResult.rows[0]);
        } else {
          console.log('❌ Final profile not found');
        }

        // Clean up
        await supabase.auth.admin.deleteUser(finalSignupData.user.id);
        console.log('🧹 Final test user cleaned up');
      }
    }

    console.log('\n🎉 Direct SQL fix completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pgClient.end();
  }
}

directSqlFix();