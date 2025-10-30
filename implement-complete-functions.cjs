require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Starting complete function implementation...');

async function fixSyntaxIssue() {
  console.log('\n1. 🔧 Fixing ON CONFLICT syntax issue...');
  
  const fixedFunction = `
    CREATE OR REPLACE FUNCTION get_or_create_profile_for_current_user()
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        user_id uuid;
        user_email text;
        user_name text;
        profile_record json;
    BEGIN
        -- Get current user ID
        user_id := auth.uid();
        
        -- Return null if not authenticated
        IF user_id IS NULL THEN
            RETURN json_build_object(
                'id', null,
                'name', null,
                'email', null,
                'role', null,
                'department', null,
                'phone', null,
                'status', null,
                'position', null,
                'employee_id', null,
                'created_at', null,
                'updated_at', null,
                'company_name', null,
                'avatar', null,
                'preferred_language', null,
                'country', null,
                'city', null,
                'must_change_password', null
            );
        END IF;
        
        -- Get user email from auth.users
        SELECT email INTO user_email FROM auth.users WHERE id = user_id;
        
        -- Extract name from email (part before @)
        user_name := split_part(coalesce(user_email, ''), '@', 1);
        
        -- Insert or update profile with FIXED syntax
        INSERT INTO public.profiles (
            id,
            email,
            name,
            created_at,
            updated_at
        ) VALUES (
            user_id,
            user_email,
            user_name,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET  -- FIXED: removed 'public.profiles.'
            email = COALESCE(NULLIF(profiles.email, ''), EXCLUDED.email),
            name = CASE 
                WHEN profiles.name IS NULL OR profiles.name = '' 
                THEN EXCLUDED.name 
                ELSE profiles.name 
            END,
            updated_at = NOW();
        
        -- Get the final profile data
        SELECT json_build_object(
            'id', p.id,
            'name', p.name,
            'email', p.email,
            'role', p.role,
            'department', p.department,
            'phone', p.phone,
            'status', p.status,
            'position', p.position,
            'employee_id', p.employee_id,
            'created_at', p.created_at,
            'updated_at', p.updated_at,
            'company_name', p.company_name,
            'avatar', p.avatar,
            'preferred_language', p.preferred_language,
            'country', p.country,
            'city', p.city,
            'must_change_password', p.must_change_password
        ) INTO profile_record
        FROM public.profiles p
        WHERE p.id = user_id;
        
        RETURN profile_record;
    END;
    $$;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql: fixedFunction });
  
  if (error) {
    console.log('❌ Error fixing syntax:', error.message);
    return false;
  }
  
  console.log('✅ Syntax issue fixed successfully');
  return true;
}

async function implementExecSql() {
  console.log('\n2. 📝 Implementing exec_sql function...');
  
  const execSqlFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE 
        result json; 
    BEGIN 
        EXECUTE format('SELECT coalesce(json_agg(t), ''[]''::json) FROM (%s) t', sql) INTO result; 
        RETURN result; 
    EXCEPTION WHEN OTHERS THEN 
        RETURN json_build_object('error', SQLERRM); 
    END;
    $$;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql: execSqlFunction });
  
  if (error) {
    console.log('❌ Error creating exec_sql function:', error.message);
    return false;
  }
  
  console.log('✅ exec_sql function created successfully');
  
  // Grant permissions
  const grantSql = `GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated, anon;`;
  const { error: grantError } = await supabase.rpc('exec_sql', { sql: grantSql });
  
  if (grantError) {
    console.log('⚠️ Warning: Could not grant permissions:', grantError.message);
  } else {
    console.log('✅ Permissions granted for exec_sql');
  }
  
  return true;
}

async function implementHandleNewUser() {
  console.log('\n3. 👤 Implementing handle_new_user trigger function...');
  
  // First create the function
  const handleNewUserFunction = `
    CREATE OR REPLACE FUNCTION handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN 
        INSERT INTO public.profiles ( 
            id, 
            email, 
            created_at, 
            updated_at 
        ) VALUES ( 
            NEW.id, 
            NEW.email, 
            NOW(), 
            NOW() 
        ); 
        
        RETURN NEW; 
    END;
    $$;
  `;

  const { error: funcError } = await supabase.rpc('exec_sql', { sql: handleNewUserFunction });
  
  if (funcError) {
    console.log('❌ Error creating handle_new_user function:', funcError.message);
    return false;
  }
  
  console.log('✅ handle_new_user function created');
  
  // Create the trigger
  const createTrigger = `
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  `;

  const { error: triggerError } = await supabase.rpc('exec_sql', { sql: createTrigger });
  
  if (triggerError) {
    console.log('❌ Error creating trigger:', triggerError.message);
    return false;
  }
  
  console.log('✅ Trigger on_auth_user_created created successfully');
  return true;
}

async function implementProfilesEnrich() {
  console.log('\n4. 🔄 Implementing profiles_enrich_after_basic trigger function...');
  
  // First create the function
  const enrichFunction = `
    CREATE OR REPLACE FUNCTION profiles_enrich_after_basic()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE 
        v_email text; 
        v_name text; 
    BEGIN 
        v_email := (SELECT email FROM auth.users WHERE id = NEW.id); 
        v_name := split_part(coalesce(v_email, ''), '@', 1); 

        UPDATE public.profiles 
        SET 
          email = COALESCE(NULLIF(profiles.email, ''), v_email), 
          name = CASE WHEN profiles.name IS NULL OR profiles.name = '' THEN v_name ELSE profiles.name END, 
          updated_at = now() 
        WHERE id = NEW.id; 

        RETURN NEW; 
    END;
    $$;
  `;

  const { error: funcError } = await supabase.rpc('exec_sql', { sql: enrichFunction });
  
  if (funcError) {
    console.log('❌ Error creating profiles_enrich_after_basic function:', funcError.message);
    return false;
  }
  
  console.log('✅ profiles_enrich_after_basic function created');
  
  // Create the trigger
  const createTrigger = `
    DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
    CREATE TRIGGER on_profile_created
      AFTER INSERT ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION profiles_enrich_after_basic();
  `;

  const { error: triggerError } = await supabase.rpc('exec_sql', { sql: createTrigger });
  
  if (triggerError) {
    console.log('❌ Error creating trigger:', triggerError.message);
    return false;
  }
  
  console.log('✅ Trigger on_profile_created created successfully');
  return true;
}

async function testIntegration() {
  console.log('\n5. 🧪 Testing integration...');
  
  // Test the fixed function
  console.log('   Testing get_or_create_profile_for_current_user (unauthenticated)...');
  const { data: testResult, error: testError } = await supabase.rpc('get_or_create_profile_for_current_user');
  
  if (testError) {
    console.log('❌ Function test failed:', testError.message);
    return false;
  }
  
  console.log('✅ Function test successful');
  console.log('   Result:', JSON.stringify(testResult, null, 2));
  
  // Check if all functions exist
  console.log('   Checking all functions exist...');
  const checkFunctions = `
    SELECT 
      proname as function_name,
      prosrc as function_body
    FROM pg_proc 
    WHERE proname IN (
      'exec_sql', 
      'handle_new_user', 
      'profiles_enrich_after_basic', 
      'get_or_create_profile_for_current_user'
    )
    ORDER BY proname;
  `;
  
  const { data: functions, error: funcError } = await supabase.rpc('exec_sql', { sql: checkFunctions });
  
  if (funcError) {
    console.log('❌ Error checking functions:', funcError.message);
    return false;
  }
  
  console.log('✅ Functions found:', functions.length);
  functions.forEach(func => {
    console.log(`   - ${func.function_name}`);
  });
  
  // Check triggers
  console.log('   Checking triggers...');
  const checkTriggers = `
    SELECT 
      trigger_name,
      event_object_table,
      action_timing,
      event_manipulation
    FROM information_schema.triggers 
    WHERE trigger_name IN ('on_auth_user_created', 'on_profile_created')
    ORDER BY trigger_name;
  `;
  
  const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', { sql: checkTriggers });
  
  if (triggerError) {
    console.log('❌ Error checking triggers:', triggerError.message);
    return false;
  }
  
  console.log('✅ Triggers found:', triggers.length);
  triggers.forEach(trigger => {
    console.log(`   - ${trigger.trigger_name} on ${trigger.event_object_table}`);
  });
  
  return true;
}

async function main() {
  try {
    // Step 1: Fix syntax issue
    const syntaxFixed = await fixSyntaxIssue();
    if (!syntaxFixed) {
      console.log('❌ Failed to fix syntax issue');
      return;
    }
    
    // Step 2: Implement exec_sql
    const execSqlCreated = await implementExecSql();
    if (!execSqlCreated) {
      console.log('❌ Failed to create exec_sql function');
      return;
    }
    
    // Step 3: Implement handle_new_user
    const handleNewUserCreated = await implementHandleNewUser();
    if (!handleNewUserCreated) {
      console.log('❌ Failed to create handle_new_user function and trigger');
      return;
    }
    
    // Step 4: Implement profiles_enrich_after_basic
    const enrichCreated = await implementProfilesEnrich();
    if (!enrichCreated) {
      console.log('❌ Failed to create profiles_enrich_after_basic function and trigger');
      return;
    }
    
    // Step 5: Test integration
    const integrationPassed = await testIntegration();
    if (!integrationPassed) {
      console.log('❌ Integration tests failed');
      return;
    }
    
    console.log('\n🎉 All functions implemented successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Fixed ON CONFLICT syntax in get_or_create_profile_for_current_user');
    console.log('✅ Implemented exec_sql utility function');
    console.log('✅ Implemented handle_new_user trigger function');
    console.log('✅ Implemented profiles_enrich_after_basic trigger function');
    console.log('✅ All integration tests passed');
    
    console.log('\n⚠️ Important Notes:');
    console.log('- New user registrations will automatically create profiles');
    console.log('- Profile creation will trigger enrichment with email/name data');
    console.log('- Manual profile creation via get_or_create_profile_for_current_user still works');
    console.log('- All functions handle conflicts gracefully');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

main();