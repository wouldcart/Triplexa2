import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugCompanyNameFlow() {
  console.log('🔍 DEBUGGING COMPANY NAME FLOW - Step by Step\n');
  
  const testEmail = `debug-flow-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testCompanyName = 'Debug Travel Solutions Ltd';
  
  // Simulate the exact data structure from AgentSignup.tsx
  const formData = {
    name: 'Debug Agent',
    email: testEmail,
    phone: '+1234567890',
    company_name: testCompanyName,
    business_type: 'Travel Agency',
    specialization: 'Leisure Travel',
    address: '123 Debug Street',
    city: 'Debug City',
    country: 'Debug Country',
    password: testPassword,
    confirm_password: testPassword
  };

  console.log('📋 Original Form Data:');
  console.log(JSON.stringify(formData, null, 2));
  console.log('\n');

  // Simulate the signupRequest creation from AgentSignup.tsx
  const signupRequest = {
    name: formData.name,                    // maps to 'name' column
    email: formData.email,                  // maps to 'email' column
    phone: formData.phone,                  // maps to 'business_phone' column
    company_name: formData.company_name,    // maps to 'agency_name' column
    password: formData.password,
  };

  console.log('📤 Signup Request Object:');
  console.log(JSON.stringify(signupRequest, null, 2));
  console.log('\n');

  // Simulate the additionalAgentData creation from AgentSignup.tsx
  const additionalAgentData = {
    business_address: formData.address,     // maps to 'business_address' column
    city: formData.city,                    // maps to 'city' column
    country: formData.country,              // maps to 'country' column
    type: formData.business_type,           // maps to 'type' column
    specializations: formData.specialization, // maps to 'specializations' column
  };

  console.log('📦 Additional Agent Data Object:');
  console.log(JSON.stringify(additionalAgentData, null, 2));
  console.log('\n');

  // Simulate the final combined object passed to signupAgent
  const finalSignupData = {
    ...signupRequest,
    ...additionalAgentData
  };

  console.log('🔗 Final Combined Signup Data (passed to signupAgent):');
  console.log(JSON.stringify(finalSignupData, null, 2));
  console.log('\n');

  // Verify company_name is present
  console.log('🔍 Company Name Verification:');
  console.log(`   Original formData.company_name: "${formData.company_name}"`);
  console.log(`   signupRequest.company_name: "${signupRequest.company_name}"`);
  console.log(`   finalSignupData.company_name: "${finalSignupData.company_name}"`);
  console.log('\n');

  let userId = null;

  try {
    // Step 1: Create user with admin client (bypassing email confirmation)
    console.log('1️⃣ Creating user with admin client...');
    const { data: adminAuthData, error: adminAuthError } = await adminSupabase.auth.admin.createUser({
      email: finalSignupData.email,
      password: finalSignupData.password,
      email_confirm: true,
      user_metadata: {
        name: finalSignupData.name,
        role: 'agent',
        company_name: finalSignupData.company_name // Include in metadata
      }
    });

    if (adminAuthError) {
      console.log('   ❌ User creation failed:', adminAuthError.message);
      return;
    }

    userId = adminAuthData.user.id;
    console.log(`   ✅ User created successfully. User ID: ${userId}`);
    console.log(`   📝 User metadata company_name: "${adminAuthData.user.user_metadata?.company_name}"`);

    // Step 2: Test Admin Client Path - Profile Insert
    console.log('\n2️⃣ Testing Admin Client Path - Profile Insert...');
    console.log(`   🔍 Inserting company_name: "${finalSignupData.company_name}"`);
    
    const profileInsertData = {
      id: userId,
      name: finalSignupData.name,
      email: finalSignupData.email,
      phone: finalSignupData.phone,
      company_name: finalSignupData.company_name,
      role: 'agent',
      updated_at: new Date().toISOString()
    };

    console.log('   📤 Profile Insert Data:');
    console.log(JSON.stringify(profileInsertData, null, 2));

    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .upsert(profileInsertData, { onConflict: 'id' })
      .select();

    if (profileError) {
      console.log('   ❌ Profile insert failed:', profileError.message);
      console.log('   📝 Error details:', profileError);
    } else {
      console.log('   ✅ Profile insert successful');
      console.log(`   🏢 Returned company_name: "${profileData[0]?.company_name}"`);
      
      // Check if the value was actually saved
      const { data: verifyProfile, error: verifyError } = await adminSupabase
        .from('profiles')
        .select('id, name, email, company_name, role')
        .eq('id', userId)
        .single();

      if (verifyError) {
        console.log('   ❌ Profile verification failed:', verifyError.message);
      } else {
        console.log('   🔍 Profile verification:');
        console.log(`      Saved company_name: "${verifyProfile.company_name}"`);
        console.log(`      Type: ${typeof verifyProfile.company_name}`);
        console.log(`      Is null: ${verifyProfile.company_name === null}`);
        console.log(`      Is undefined: ${verifyProfile.company_name === undefined}`);
        console.log(`      Is empty string: ${verifyProfile.company_name === ''}`);
      }
    }

    // Step 3: Test Admin Client Path - Agent Insert
    console.log('\n3️⃣ Testing Admin Client Path - Agent Insert...');
    console.log(`   🔍 Inserting agency_name: "${finalSignupData.company_name}"`);
    
    const agentInsertData = {
      id: userId,
      user_id: userId,
      agency_name: finalSignupData.company_name,
      business_phone: finalSignupData.phone,
      business_address: finalSignupData.business_address,
      specializations: finalSignupData.specializations ? [finalSignupData.specializations] : [],
      status: 'inactive',
      created_by: userId,
      source_type: 'website',
      source_details: 'Public Self-Registration'
    };

    console.log('   📤 Agent Insert Data:');
    console.log(JSON.stringify(agentInsertData, null, 2));

    const { data: agentData, error: agentError } = await adminSupabase
      .from('agents')
      .upsert(agentInsertData, { onConflict: 'id' })
      .select();

    if (agentError) {
      console.log('   ❌ Agent insert failed:', agentError.message);
      console.log('   📝 Error details:', agentError);
    } else {
      console.log('   ✅ Agent insert successful');
      console.log(`   🏢 Returned agency_name: "${agentData[0]?.agency_name}"`);
      
      // Update additional fields
      const updateData = {
        name: finalSignupData.name,
        email: finalSignupData.email,
        city: finalSignupData.city,
        country: finalSignupData.country,
        type: finalSignupData.type
      };

      console.log('   📤 Agent Update Data:');
      console.log(JSON.stringify(updateData, null, 2));

      const { error: updateError } = await adminSupabase
        .from('agents')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        console.log('   ❌ Agent update failed:', updateError.message);
      } else {
        console.log('   ✅ Agent update successful');
      }

      // Verify final agent state
      const { data: verifyAgent, error: verifyAgentError } = await adminSupabase
        .from('agents')
        .select('id, name, email, agency_name, status')
        .eq('id', userId)
        .single();

      if (verifyAgentError) {
        console.log('   ❌ Agent verification failed:', verifyAgentError.message);
      } else {
        console.log('   🔍 Agent verification:');
        console.log(`      Saved agency_name: "${verifyAgent.agency_name}"`);
        console.log(`      Type: ${typeof verifyAgent.agency_name}`);
        console.log(`      Is null: ${verifyAgent.agency_name === null}`);
        console.log(`      Is undefined: ${verifyAgent.agency_name === undefined}`);
        console.log(`      Is empty string: ${verifyAgent.agency_name === ''}`);
      }
    }

    // Step 4: Check database schema for company_name column
    console.log('\n4️⃣ Checking Database Schema...');
    
    // Check profiles table schema
    const { data: profilesSchema, error: profilesSchemaError } = await adminSupabase
      .rpc('get_table_columns', { table_name: 'profiles' })
      .select();

    if (!profilesSchemaError && profilesSchema) {
      const companyNameColumn = profilesSchema.find(col => col.column_name === 'company_name');
      if (companyNameColumn) {
        console.log('   ✅ profiles.company_name column exists');
        console.log(`      Data type: ${companyNameColumn.data_type}`);
        console.log(`      Is nullable: ${companyNameColumn.is_nullable}`);
        console.log(`      Default value: ${companyNameColumn.column_default}`);
      } else {
        console.log('   ❌ profiles.company_name column NOT FOUND');
      }
    } else {
      console.log('   ⚠️  Could not check profiles schema');
    }

    // Check agents table schema
    const { data: agentsSchema, error: agentsSchemaError } = await adminSupabase
      .rpc('get_table_columns', { table_name: 'agents' })
      .select();

    if (!agentsSchemaError && agentsSchema) {
      const agencyNameColumn = agentsSchema.find(col => col.column_name === 'agency_name');
      if (agencyNameColumn) {
        console.log('   ✅ agents.agency_name column exists');
        console.log(`      Data type: ${agencyNameColumn.data_type}`);
        console.log(`      Is nullable: ${agencyNameColumn.is_nullable}`);
        console.log(`      Default value: ${agencyNameColumn.column_default}`);
      } else {
        console.log('   ❌ agents.agency_name column NOT FOUND');
      }
    } else {
      console.log('   ⚠️  Could not check agents schema');
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  } finally {
    // Cleanup
    if (userId) {
      console.log('\n🧹 Cleaning up test data...');
      try {
        await adminSupabase.from('agents').delete().eq('id', userId);
        await adminSupabase.from('profiles').delete().eq('id', userId);
        await adminSupabase.auth.admin.deleteUser(userId);
        console.log('   ✅ Cleanup completed');
      } catch (cleanupError) {
        console.log('   ⚠️  Cleanup error:', cleanupError.message);
      }
    }
  }
}

debugCompanyNameFlow().catch(console.error);