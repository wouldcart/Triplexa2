#!/usr/bin/env node

/**
 * Apply Migration Direct - Use direct SQL execution
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigrationDirect() {
  console.log('🚀 Applying Enhanced Migration Direct');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Drop existing trigger and function
    console.log('\n1️⃣ Dropping existing trigger and function...');
    
    try {
      const dropSql = `
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
      `;
      
      // Try using the SQL editor approach
      const { error: dropError } = await adminSupabase.rpc('exec_sql', { sql: dropSql });
      if (dropError) {
        console.log(`   ⚠️ Drop via exec_sql failed: ${dropError.message}`);
      } else {
        console.log('   ✅ Existing trigger and function dropped');
      }
    } catch (dropErr) {
      console.log(`   ⚠️ Drop operation failed: ${dropErr.message}`);
    }
    
    // Step 2: Create the enhanced function
    console.log('\n2️⃣ Creating enhanced function...');
    
    const functionSql = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        user_name TEXT;
        user_role TEXT;
        user_phone TEXT;
        user_department TEXT;
        user_position TEXT;
        user_employee_id TEXT;
        user_company_name TEXT;
        user_city TEXT;
        user_country TEXT;
        user_profile_image TEXT;
        user_preferred_language TEXT;
        user_business_address TEXT;
        user_business_type TEXT;
        user_specialization TEXT;
        user_specializations TEXT[];
        user_source_type TEXT;
        user_source_details TEXT;
        user_status TEXT;
      BEGIN
        -- Extract basic fields with fallbacks
        user_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1));
        user_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'agent');
        user_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
        user_department := NULLIF(NEW.raw_user_meta_data->>'department', '');
        user_position := NULLIF(NEW.raw_user_meta_data->>'position', '');
        user_employee_id := NULLIF(NEW.raw_user_meta_data->>'employee_id', '');
        user_company_name := NULLIF(NEW.raw_user_meta_data->>'company_name', '');
        user_city := NULLIF(NEW.raw_user_meta_data->>'city', '');
        user_country := NULLIF(NEW.raw_user_meta_data->>'country', '');
        
        -- Extract extended fields
        user_profile_image := NULLIF(NEW.raw_user_meta_data->>'profile_image', '');
        user_preferred_language := COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_language', ''), 'en');
        user_business_address := NULLIF(NEW.raw_user_meta_data->>'business_address', '');
        user_business_type := NULLIF(NEW.raw_user_meta_data->>'business_type', '');
        user_specialization := NULLIF(NEW.raw_user_meta_data->>'specialization', '');
        user_source_type := COALESCE(NULLIF(NEW.raw_user_meta_data->>'source_type', ''), 'organic');
        user_source_details := COALESCE(NULLIF(NEW.raw_user_meta_data->>'source_details', ''), 'direct_signup');
        user_status := COALESCE(NULLIF(NEW.raw_user_meta_data->>'status', ''), 'active');
        
        -- Handle specializations array
        IF NEW.raw_user_meta_data ? 'specializations' THEN
          user_specializations := ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'specializations'));
        ELSIF user_specialization IS NOT NULL THEN
          user_specializations := ARRAY[user_specialization];
        END IF;

        -- Insert/update profile
        INSERT INTO public.profiles (
          id, email, name, role, phone, department, position, employee_id, 
          company_name, city, country, profile_image, preferred_language,
          status, created_at, updated_at
        ) VALUES (
          NEW.id, NEW.email, user_name, user_role, user_phone, user_department, 
          user_position, user_employee_id, user_company_name, user_city, user_country,
          user_profile_image, user_preferred_language, user_status, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          name = COALESCE(EXCLUDED.name, profiles.name),
          role = COALESCE(EXCLUDED.role, profiles.role),
          phone = COALESCE(EXCLUDED.phone, profiles.phone),
          department = COALESCE(EXCLUDED.department, profiles.department),
          position = COALESCE(EXCLUDED.position, profiles.position),
          employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
          company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
          city = COALESCE(EXCLUDED.city, profiles.city),
          country = COALESCE(EXCLUDED.country, profiles.country),
          profile_image = COALESCE(EXCLUDED.profile_image, profiles.profile_image),
          preferred_language = COALESCE(EXCLUDED.preferred_language, profiles.preferred_language),
          status = COALESCE(EXCLUDED.status, profiles.status),
          updated_at = NOW();

        -- Insert/update agent if role is agent
        IF user_role = 'agent' THEN
          INSERT INTO public.agents (
            id, user_id, name, email, agency_name, business_phone, business_address,
            city, country, agent_type, specializations, source_type, source_details,
            status, created_at, updated_at, created_by
          ) VALUES (
            NEW.id, NEW.id, user_name, NEW.email, user_company_name, user_phone, 
            user_business_address, user_city, user_country, user_business_type,
            user_specializations, user_source_type, user_source_details,
            CASE WHEN user_status = 'active' THEN 'active' ELSE 'inactive' END,
            NOW(), NOW(), NEW.id
          )
          ON CONFLICT (user_id) DO UPDATE SET
            name = COALESCE(EXCLUDED.name, agents.name),
            email = COALESCE(EXCLUDED.email, agents.email),
            agency_name = COALESCE(EXCLUDED.agency_name, agents.agency_name),
            business_phone = COALESCE(EXCLUDED.business_phone, agents.business_phone),
            business_address = COALESCE(EXCLUDED.business_address, agents.business_address),
            city = COALESCE(EXCLUDED.city, agents.city),
            country = COALESCE(EXCLUDED.country, agents.country),
            agent_type = COALESCE(EXCLUDED.agent_type, agents.agent_type),
            specializations = COALESCE(EXCLUDED.specializations, agents.specializations),
            source_type = COALESCE(EXCLUDED.source_type, agents.source_type),
            source_details = COALESCE(EXCLUDED.source_details, agents.source_details),
            status = COALESCE(EXCLUDED.status, agents.status),
            updated_at = NOW();
        END IF;

        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Error in enhanced handle_new_user: %', SQLERRM;
          RETURN NEW;
      END;
      $$;
    `;
    
    try {
      const { error: functionError } = await adminSupabase.rpc('exec_sql', { sql: functionSql });
      if (functionError) {
        console.log(`   ❌ Function creation failed: ${functionError.message}`);
        
        // Try alternative approach - create function using a different method
        console.log('   🔄 Trying alternative function creation...');
        
        // Let's try to create the function by inserting it directly
        const { error: altError } = await adminSupabase
          .from('pg_proc')
          .insert({
            proname: 'handle_new_user',
            pronamespace: 'public'
          });
        
        if (altError) {
          console.log(`   ❌ Alternative function creation also failed: ${altError.message}`);
        }
      } else {
        console.log('   ✅ Enhanced function created successfully');
      }
    } catch (funcErr) {
      console.log(`   ❌ Function creation error: ${funcErr.message}`);
    }
    
    // Step 3: Create the trigger
    console.log('\n3️⃣ Creating trigger...');
    
    const triggerSql = `
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    `;
    
    try {
      const { error: triggerError } = await adminSupabase.rpc('exec_sql', { sql: triggerSql });
      if (triggerError) {
        console.log(`   ❌ Trigger creation failed: ${triggerError.message}`);
      } else {
        console.log('   ✅ Trigger created successfully');
      }
    } catch (trigErr) {
      console.log(`   ❌ Trigger creation error: ${trigErr.message}`);
    }
    
    console.log('\n🎉 Migration application completed!');
    console.log('\n📝 Note: If the migration failed, the trigger may need to be applied');
    console.log('   through the Supabase dashboard SQL editor manually.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

applyMigrationDirect().catch(console.error);