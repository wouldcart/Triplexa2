#!/usr/bin/env node

/**
 * Test Enhanced Auth Trigger - Comprehensive User Data Loading
 * 
 * This script tests the enhanced handle_new_user trigger to ensure it properly
 * extracts and loads comprehensive auth user data from raw_user_meta_data
 * into both profiles and agents tables.
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Comprehensive test user data with all possible metadata fields
const testUserData = {
  email: 'enhanced-test-agent@example.com',
  password: 'testpass123',
  user_metadata: {
    // Basic profile fields
    name: 'Enhanced Test Agent',
    role: 'agent',
    phone: '+1-555-0199',
    department: 'External Agents',
    position: 'Premium Travel Agent',
    employee_id: 'ETA001',
    company_name: 'Enhanced Travel Solutions',
    city: 'San Francisco',
    country: 'USA',
    
    // Extended profile fields
    profile_image: 'https://example.com/avatar.jpg',
    preferred_language: 'en',
    business_address: '123 Enhanced Street, Suite 456, San Francisco, CA 94105',
    business_type: 'travel_agency',
    specialization: 'luxury_travel',
    specializations: ['luxury_travel', 'corporate_travel', 'destination_weddings'],
    source_type: 'staff_referral',
    source_details: 'REF_STAFF_001',
    status: 'active',
    
    // Additional metadata fields
    work_location: 'Remote',
    join_date: '2024-01-01',
    reporting_manager: 'John Manager',
    avatar: '/avatars/enhanced-agent.jpg',
    timezone: 'America/Los_Angeles',
    nationality: 'American',
    date_of_birth: '1985-06-15',
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '+1-555-0200',
    emergency_contact_relationship: 'Spouse'
  }
};

async function testEnhancedAuthTrigger() {
  console.log('🧪 Testing Enhanced Auth Trigger - Comprehensive User Data Loading');
  console.log('=' .repeat(80));
  
  let testUserId = null;
  
  try {
    // Step 1: Clean up any existing test user
    console.log('\n1️⃣ Cleaning up existing test user...');
    const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === testUserData.email);
    
    if (existingUser) {
      console.log(`   🗑️ Removing existing user: ${existingUser.id}`);
      await adminSupabase.auth.admin.deleteUser(existingUser.id);
      
      // Also clean up profile and agent records
      await adminSupabase.from('agents').delete().eq('user_id', existingUser.id);
      await adminSupabase.from('profiles').delete().eq('id', existingUser.id);
    }
    
    // Step 2: Apply the enhanced migration
    console.log('\n2️⃣ Applying enhanced migration...');
    try {
      const migrationSql = `
        -- Enhanced handle_new_user trigger to load comprehensive auth user data
        BEGIN;
        
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
        
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
          user_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1));
          user_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'agent');
          user_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
          user_department := NULLIF(NEW.raw_user_meta_data->>'department', '');
          user_position := NULLIF(NEW.raw_user_meta_data->>'position', '');
          user_employee_id := NULLIF(NEW.raw_user_meta_data->>'employee_id', '');
          user_company_name := NULLIF(NEW.raw_user_meta_data->>'company_name', '');
          user_city := NULLIF(NEW.raw_user_meta_data->>'city', '');
          user_country := NULLIF(NEW.raw_user_meta_data->>'country', '');
          user_profile_image := NULLIF(NEW.raw_user_meta_data->>'profile_image', '');
          user_preferred_language := COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_language', ''), 'en');
          user_business_address := NULLIF(NEW.raw_user_meta_data->>'business_address', '');
          user_business_type := NULLIF(NEW.raw_user_meta_data->>'business_type', '');
          user_specialization := NULLIF(NEW.raw_user_meta_data->>'specialization', '');
          user_source_type := COALESCE(NULLIF(NEW.raw_user_meta_data->>'source_type', ''), 'organic');
          user_source_details := COALESCE(NULLIF(NEW.raw_user_meta_data->>'source_details', ''), 'direct_signup');
          user_status := COALESCE(NULLIF(NEW.raw_user_meta_data->>'status', ''), 'active');
          
          IF NEW.raw_user_meta_data ? 'specializations' THEN
            user_specializations := ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'specializations'));
          ELSIF user_specialization IS NOT NULL THEN
            user_specializations := ARRAY[user_specialization];
          END IF;

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
        
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW
          EXECUTE FUNCTION public.handle_new_user();
        
        COMMIT;
      `;
      
      const { error: migrationError } = await adminSupabase.rpc('exec', { sql: migrationSql });
      if (migrationError) {
        console.log('   ⚠️ Migration via RPC failed, trigger may already exist');
        console.log(`   📝 Error: ${migrationError.message}`);
      } else {
        console.log('   ✅ Enhanced migration applied successfully');
      }
    } catch (migrationErr) {
      console.log('   ⚠️ Migration application failed, continuing with existing trigger');
      console.log(`   📝 Error: ${migrationErr.message}`);
    }
    
    // Step 3: Create test user with comprehensive metadata
    console.log('\n3️⃣ Creating test user with comprehensive metadata...');
    console.log('   📝 User metadata fields:');
    Object.entries(testUserData.user_metadata).forEach(([key, value]) => {
      console.log(`      ${key}: ${Array.isArray(value) ? JSON.stringify(value) : value}`);
    });
    
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: testUserData.email,
      password: testUserData.password,
      email_confirm: true,
      user_metadata: testUserData.user_metadata
    });
    
    if (authError) {
      console.log(`   ❌ User creation failed: ${authError.message}`);
      return;
    }
    
    testUserId = authData.user.id;
    console.log(`   ✅ User created successfully`);
    console.log(`   👤 User ID: ${testUserId}`);
    console.log(`   📧 Email: ${authData.user.email}`);
    
    // Step 4: Wait for trigger to process
    console.log('\n4️⃣ Waiting for trigger to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 5: Verify profile data
    console.log('\n5️⃣ Verifying profile data...');
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (profileError) {
      console.log(`   ❌ Profile lookup failed: ${profileError.message}`);
    } else if (!profileData) {
      console.log('   ❌ No profile record found');
    } else {
      console.log('   ✅ Profile record found');
      console.log('   📋 Profile data verification:');
      
      const expectedFields = {
        name: testUserData.user_metadata.name,
        role: testUserData.user_metadata.role,
        phone: testUserData.user_metadata.phone,
        department: testUserData.user_metadata.department,
        position: testUserData.user_metadata.position,
        employee_id: testUserData.user_metadata.employee_id,
        company_name: testUserData.user_metadata.company_name,
        city: testUserData.user_metadata.city,
        country: testUserData.user_metadata.country,
        profile_image: testUserData.user_metadata.profile_image,
        preferred_language: testUserData.user_metadata.preferred_language,
        status: testUserData.user_metadata.status
      };
      
      Object.entries(expectedFields).forEach(([field, expected]) => {
        const actual = profileData[field];
        const match = actual === expected;
        console.log(`      ${field}: ${match ? '✅' : '❌'} ${actual} ${match ? '' : `(expected: ${expected})`}`);
      });
    }
    
    // Step 6: Verify agent data
    console.log('\n6️⃣ Verifying agent data...');
    const { data: agentData, error: agentError } = await adminSupabase
      .from('agents')
      .select('*')
      .eq('user_id', testUserId)
      .single();
    
    if (agentError) {
      console.log(`   ❌ Agent lookup failed: ${agentError.message}`);
    } else if (!agentData) {
      console.log('   ❌ No agent record found');
    } else {
      console.log('   ✅ Agent record found');
      console.log('   📋 Agent data verification:');
      
      const expectedAgentFields = {
        name: testUserData.user_metadata.name,
        email: testUserData.email,
        agency_name: testUserData.user_metadata.company_name,
        business_phone: testUserData.user_metadata.phone,
        business_address: testUserData.user_metadata.business_address,
        city: testUserData.user_metadata.city,
        country: testUserData.user_metadata.country,
        agent_type: testUserData.user_metadata.business_type,
        source_type: testUserData.user_metadata.source_type,
        source_details: testUserData.user_metadata.source_details,
        status: 'active'
      };
      
      Object.entries(expectedAgentFields).forEach(([field, expected]) => {
        const actual = agentData[field];
        const match = actual === expected;
        console.log(`      ${field}: ${match ? '✅' : '❌'} ${actual} ${match ? '' : `(expected: ${expected})`}`);
      });
      
      // Check specializations array
      const actualSpecializations = agentData.specializations || [];
      const expectedSpecializations = testUserData.user_metadata.specializations;
      const specializationsMatch = JSON.stringify(actualSpecializations.sort()) === JSON.stringify(expectedSpecializations.sort());
      console.log(`      specializations: ${specializationsMatch ? '✅' : '❌'} ${JSON.stringify(actualSpecializations)} ${specializationsMatch ? '' : `(expected: ${JSON.stringify(expectedSpecializations)})`}`);
    }
    
    console.log('\n🎉 Enhanced auth trigger test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📝 Error details:', error);
  } finally {
    // Cleanup
    if (testUserId) {
      console.log('\n🧹 Cleaning up test data...');
      try {
        await adminSupabase.auth.admin.deleteUser(testUserId);
        await adminSupabase.from('agents').delete().eq('user_id', testUserId);
        await adminSupabase.from('profiles').delete().eq('id', testUserId);
        console.log('   ✅ Cleanup completed');
      } catch (cleanupError) {
        console.log(`   ⚠️ Cleanup warning: ${cleanupError.message}`);
      }
    }
  }
}

// Run the test
testEnhancedAuthTrigger().catch(console.error);