require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function fixSignupDatabaseError() {
  console.log('🔧 Fixing Supabase signup database error...\n');
  
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Drop any existing problematic triggers and functions
    console.log('1. CLEANING UP EXISTING TRIGGERS AND FUNCTIONS:');
    
    const cleanupSQL = `
      -- Drop existing triggers
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      DROP TRIGGER IF EXISTS on_profile_insert_sync_agent ON public.profiles;
      DROP TRIGGER IF EXISTS on_profile_update_sync_agent ON public.profiles;
      
      -- Drop existing functions
      DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
      DROP FUNCTION IF EXISTS public.handle_agent_profile_insert() CASCADE;
      DROP FUNCTION IF EXISTS public.handle_agent_profile_update() CASCADE;
    `;

    const { error: cleanupError } = await supabase.rpc('exec_sql', { sql: cleanupSQL });
    if (cleanupError) {
      console.log('   ⚠️  Cleanup warning:', cleanupError.message);
    } else {
      console.log('   ✅ Cleanup completed');
    }

    // 2. Create the correct handle_new_user function
    console.log('\n2. CREATING CORRECT handle_new_user FUNCTION:');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        -- Insert a new profile record for the new user
        INSERT INTO public.profiles (
          id,
          email,
          name,
          role,
          phone,
          company_name,
          department,
          position,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          COALESCE(NEW.raw_user_meta_data->>'role', 'agent'),
          COALESCE(NEW.raw_user_meta_data->>'phone', ''),
          COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
          COALESCE(NEW.raw_user_meta_data->>'department', ''),
          COALESCE(NEW.raw_user_meta_data->>'position', ''),
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          name = COALESCE(EXCLUDED.name, public.profiles.name),
          role = COALESCE(EXCLUDED.role, public.profiles.role),
          phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
          company_name = COALESCE(EXCLUDED.company_name, public.profiles.company_name),
          department = COALESCE(EXCLUDED.department, public.profiles.department),
          position = COALESCE(EXCLUDED.position, public.profiles.position),
          updated_at = NOW();

        -- If the user role is 'agent', also create an agent record
        IF COALESCE(NEW.raw_user_meta_data->>'role', 'agent') = 'agent' THEN
          INSERT INTO public.agents (
            id,
            user_id,
            name,
            email,
            business_phone,
            status,
            source_type,
            source_details,
            created_at,
            updated_at
          ) VALUES (
            NEW.id,
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'name', ''),
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'phone', ''),
            'active',
            'signup',
            'User registration',
            NOW(),
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            name = COALESCE(EXCLUDED.name, public.agents.name),
            email = EXCLUDED.email,
            business_phone = COALESCE(EXCLUDED.business_phone, public.agents.business_phone),
            updated_at = NOW();
        END IF;

        RETURN NEW;
      END;
      $$;
    `;

    const { error: functionError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    if (functionError) {
      console.log('   ❌ Function creation error:', functionError.message);
      throw functionError;
    } else {
      console.log('   ✅ Function created successfully');
    }

    // 3. Create the trigger
    console.log('\n3. CREATING TRIGGER:');
    
    const createTriggerSQL = `
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: createTriggerSQL });
    if (triggerError) {
      console.log('   ❌ Trigger creation error:', triggerError.message);
      throw triggerError;
    } else {
      console.log('   ✅ Trigger created successfully');
    }

    // 4. Test the signup process
    console.log('\n4. TESTING SIGNUP PROCESS:');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          name: 'Test User',
          role: 'agent',
          phone: '+1-555-0123',
          company_name: 'Test Company'
        }
      }
    });

    if (signupError) {
      console.log('   ❌ SIGNUP STILL FAILING:', signupError.message);
      console.log('   📋 Error details:', signupError);
    } else {
      console.log('   ✅ SIGNUP SUCCESSFUL!');
      console.log('   📋 User created:', signupData.user?.email);
      
      // Check if profile was created
      if (signupData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signupData.user.id)
          .single();
        
        if (profileError) {
          console.log('   ⚠️  Profile check error:', profileError.message);
        } else {
          console.log('   ✅ Profile created:', profile);
        }

        // Check if agent was created
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select('*')
          .eq('id', signupData.user.id)
          .single();
        
        if (agentError) {
          console.log('   ⚠️  Agent check error:', agentError.message);
        } else {
          console.log('   ✅ Agent created:', agent);
        }

        // Clean up test user
        await supabase.auth.admin.deleteUser(signupData.user.id);
        console.log('   🧹 Test user cleaned up');
      }
    }

    console.log('\n🎉 SIGNUP DATABASE ERROR FIX COMPLETED!');
    console.log('   ✅ handle_new_user function created');
    console.log('   ✅ Trigger configured');
    console.log('   ✅ Signup process tested');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    throw error;
  }
}

fixSignupDatabaseError().catch(console.error);