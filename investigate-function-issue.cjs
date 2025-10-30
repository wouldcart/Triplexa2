require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function investigateFunctionIssue() {
  console.log('🔍 Investigating function update issue...\n');

  try {
    // Check for all functions with similar names
    console.log('📋 Checking for all handle_new_user functions...');
    const allFunctionsQuery = `
      SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        p.oid,
        pg_get_functiondef(p.oid) as function_definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname LIKE '%handle_new_user%'
      ORDER BY n.nspname, p.proname
    `;

    const { data: allFunctions, error: allFunctionsError } = await adminClient.rpc('exec_sql', {
      sql: allFunctionsQuery
    });

    if (allFunctionsError) {
      console.log(`❌ All functions query error: ${allFunctionsError.message}`);
    } else {
      console.log(`✅ Found ${allFunctions.length} handle_new_user functions:`);
      allFunctions.forEach((func, index) => {
        console.log(`\n${index + 1}. Schema: ${func.schema_name}, Function: ${func.function_name}, OID: ${func.oid}`);
        if (func.function_definition.includes('raw_user_meta_data')) {
          console.log('   ✅ Uses raw_user_meta_data');
        } else {
          console.log('   ❌ Does NOT use raw_user_meta_data');
        }
      });
    }

    // Check what trigger is actually calling
    console.log('\n📋 Checking trigger definition...');
    const triggerDetailQuery = `
      SELECT 
        t.trigger_name,
        t.event_manipulation,
        t.action_timing,
        t.action_statement,
        t.action_orientation,
        c.relname as table_name,
        n.nspname as table_schema
      FROM information_schema.triggers t
      JOIN pg_class c ON c.oid = (
        SELECT oid FROM pg_class 
        WHERE relname = t.event_object_table 
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.event_object_schema)
      )
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE t.trigger_name = 'on_auth_user_created'
    `;

    const { data: triggerDetail, error: triggerDetailError } = await adminClient.rpc('exec_sql', {
      sql: triggerDetailQuery
    });

    if (triggerDetailError) {
      console.log(`❌ Trigger detail query error: ${triggerDetailError.message}`);
    } else {
      console.log('✅ Trigger details:');
      console.log(JSON.stringify(triggerDetail, null, 2));
    }

    // Try to force drop and recreate with a unique name
    console.log('\n🔧 Force dropping and recreating function with unique name...');
    
    const forceUpdateSql = `
      -- Drop all handle_new_user functions
      DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
      DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
      
      -- Create with a unique name first
      CREATE OR REPLACE FUNCTION public.handle_new_user_v2()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $function$
      BEGIN
        INSERT INTO public.profiles (
          id, 
          email, 
          name,
          role,
          phone,
          company_name,
          department,
          position,
          status,
          created_at,
          updated_at
        )
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1)),
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'agent'),
          NULLIF(NEW.raw_user_meta_data->>'phone', ''),
          NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'department', ''), 'General'),
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'position', ''), 'Agent'),
          'active',
          NOW(),
          NOW()
        );
        RETURN NEW;
      EXCEPTION
        WHEN others THEN
          RAISE LOG 'Error in handle_new_user_v2: %', SQLERRM;
          RETURN NEW;
      END;
      $function$;
      
      -- Now create the original name pointing to v2
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $function$
      BEGIN
        INSERT INTO public.profiles (
          id, 
          email, 
          name,
          role,
          phone,
          company_name,
          department,
          position,
          status,
          created_at,
          updated_at
        )
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1)),
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'agent'),
          NULLIF(NEW.raw_user_meta_data->>'phone', ''),
          NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'department', ''), 'General'),
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'position', ''), 'Agent'),
          'active',
          NOW(),
          NOW()
        );
        RETURN NEW;
      EXCEPTION
        WHEN others THEN
          RAISE LOG 'Error in handle_new_user: %', SQLERRM;
          RETURN NEW;
      END;
      $function$;
    `;

    const { error: forceUpdateError } = await adminClient.rpc('exec_sql', {
      sql: forceUpdateSql
    });

    if (forceUpdateError) {
      console.log(`❌ Force update error: ${forceUpdateError.message}`);
    } else {
      console.log('✅ Functions force updated');
    }

    // Recreate trigger
    console.log('🔧 Recreating trigger...');
    const recreateTriggerSql = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

    const { error: recreateTriggerError } = await adminClient.rpc('exec_sql', {
      sql: recreateTriggerSql
    });

    if (recreateTriggerError) {
      console.log(`❌ Recreate trigger error: ${recreateTriggerError.message}`);
    } else {
      console.log('✅ Trigger recreated');
    }

    // Verify the function is now correct
    console.log('\n📋 Verifying updated function...');
    const verifyQuery = `
      SELECT 
        p.proname as function_name,
        pg_get_functiondef(p.oid) as function_definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'handle_new_user'
      AND n.nspname = 'public'
    `;

    const { data: verifyResult, error: verifyError } = await adminClient.rpc('exec_sql', {
      sql: verifyQuery
    });

    if (verifyError) {
      console.log(`❌ Verify query error: ${verifyError.message}`);
    } else {
      if (verifyResult && verifyResult.length > 0) {
        const definition = verifyResult[0].function_definition;
        if (definition.includes('raw_user_meta_data')) {
          console.log('✅ Function now uses raw_user_meta_data');
        } else {
          console.log('❌ Function still does NOT use raw_user_meta_data');
          console.log('Function definition:');
          console.log(definition);
        }
      }
    }

  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  }
}

investigateFunctionIssue().catch(console.error);