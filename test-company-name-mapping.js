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

async function testCompanyNameMapping() {
  console.log('🏢 TESTING COMPANY NAME MAPPING - Agent Registration\n');
  
  const testEmail = `company-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testCompanyName = 'Acme Travel Solutions Ltd';
  
  const testData = {
    name: 'John Smith',
    email: testEmail,
    phone: '+1234567890',
    company_name: testCompanyName, // This is the key field we're testing
    business_address: '123 Business Street',
    city: 'Business City',
    country: 'Business Country',
    business_type: 'individual',
    specialization: 'leisure',
    password: testPassword
  };

  console.log('📋 Test Data - Focus on Company Name:');
  console.log(`   Company Name: "${testData.company_name}"`);
  console.log(`   Expected in profiles.company_name: "${testData.company_name}"`);
  console.log(`   Expected in agents.agency_name: "${testData.company_name}"`);
  console.log('\n');

  let userId = null;

  try {
    // Step 1: Create user with admin client (bypassing email confirmation)
    console.log('1️⃣ Creating user with admin client...');
    const { data: adminAuthData, error: adminAuthError } = await adminSupabase.auth.admin.createUser({
      email: testData.email,
      password: testData.password,
      email_confirm: true,
      user_metadata: {
        name: testData.name,
        role: 'agent',
        company_name: testData.company_name // Include in metadata
      }
    });

    if (adminAuthError) {
      console.log('   ❌ User creation failed:', adminAuthError.message);
      return;
    }

    userId = adminAuthData.user.id;
    console.log(`   ✅ User created successfully. User ID: ${userId}`);

    // Step 2: Test Profile Insert with Company Name
    console.log('\n2️⃣ Testing Profile Insert with Company Name...');
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .insert([{
        id: userId,
        name: testData.name,
        email: testData.email,
        phone: testData.phone,
        company_name: testData.company_name, // KEY FIELD
        role: 'agent'
      }])
      .select();

    if (profileError) {
      console.log('   ❌ Profile insert failed:', profileError.message);
      console.log('   📝 Error details:', profileError);
    } else {
      console.log('   ✅ Profile insert successful');
      console.log(`   🏢 Company Name saved: "${profileData[0]?.company_name}"`);
      
      // Verify the company name was saved correctly
      if (profileData[0]?.company_name === testData.company_name) {
        console.log('   ✅ Company Name mapping CORRECT ✓');
      } else {
        console.log('   ❌ Company Name mapping INCORRECT ✗');
        console.log(`   Expected: "${testData.company_name}"`);
        console.log(`   Got: "${profileData[0]?.company_name}"`);
      }
    }

    // Step 3: Test Agent Insert with Agency Name (mapped from Company Name)
    console.log('\n3️⃣ Testing Agent Insert with Agency Name...');
    const { data: agentData, error: agentError } = await adminSupabase
      .from('agents')
      .insert([{
        id: userId,
        user_id: userId,
        name: testData.name,
        email: testData.email,
        agency_name: testData.company_name, // company_name maps to agency_name
        business_phone: testData.phone,
        business_address: testData.business_address,
        city: testData.city,
        country: testData.country,
        type: testData.business_type,
        specializations: [testData.specialization],
        status: 'inactive',
        created_by: userId
      }])
      .select();

    if (agentError) {
      console.log('   ❌ Agent insert failed:', agentError.message);
    } else {
      console.log('   ✅ Agent insert successful');
      console.log(`   🏢 Agency Name saved: "${agentData[0]?.agency_name}"`);
      
      // Verify the agency name was saved correctly
      if (agentData[0]?.agency_name === testData.company_name) {
        console.log('   ✅ Company Name → Agency Name mapping CORRECT ✓');
      } else {
        console.log('   ❌ Company Name → Agency Name mapping INCORRECT ✗');
        console.log(`   Expected: "${testData.company_name}"`);
        console.log(`   Got: "${agentData[0]?.agency_name}"`);
      }
    }

    // Step 4: Verify final state with fresh queries
    console.log('\n4️⃣ Verifying final state with fresh queries...');
    
    // Check profile
    const { data: finalProfile, error: finalProfileError } = await adminSupabase
      .from('profiles')
      .select('id, name, email, company_name, role')
      .eq('id', userId)
      .single();

    if (finalProfileError) {
      console.log('   ❌ Final profile check failed:', finalProfileError.message);
    } else {
      console.log('   ✅ Final profile state:');
      console.log(`      ID: ${finalProfile.id}`);
      console.log(`      Name: ${finalProfile.name}`);
      console.log(`      Email: ${finalProfile.email}`);
      console.log(`      Company Name: "${finalProfile.company_name}"`);
      console.log(`      Role: ${finalProfile.role}`);
      
      if (finalProfile.company_name === testData.company_name) {
        console.log('   🎯 FINAL VERIFICATION: Company Name in profiles table ✅ CORRECT');
      } else {
        console.log('   🎯 FINAL VERIFICATION: Company Name in profiles table ❌ INCORRECT');
      }
    }

    // Check agent
    const { data: finalAgent, error: finalAgentError } = await adminSupabase
      .from('agents')
      .select('id, name, email, agency_name, status')
      .eq('id', userId)
      .single();

    if (finalAgentError) {
      console.log('   ❌ Final agent check failed:', finalAgentError.message);
    } else {
      console.log('   ✅ Final agent state:');
      console.log(`      ID: ${finalAgent.id}`);
      console.log(`      Name: ${finalAgent.name}`);
      console.log(`      Email: ${finalAgent.email}`);
      console.log(`      Agency Name: "${finalAgent.agency_name}"`);
      console.log(`      Status: ${finalAgent.status}`);
      
      if (finalAgent.agency_name === testData.company_name) {
        console.log('   🎯 FINAL VERIFICATION: Company Name → Agency Name in agents table ✅ CORRECT');
      } else {
        console.log('   🎯 FINAL VERIFICATION: Company Name → Agency Name in agents table ❌ INCORRECT');
      }
    }

    // Step 5: Summary
    console.log('\n📊 MAPPING SUMMARY:');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│                    COMPANY NAME MAPPING                    │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log(`│ Form Field: company_name = "${testData.company_name}"`);
    console.log(`│ Profiles Table: company_name = "${finalProfile?.company_name || 'NULL'}"`);
    console.log(`│ Agents Table: agency_name = "${finalAgent?.agency_name || 'NULL'}"`);
    console.log('├─────────────────────────────────────────────────────────────┤');
    
    const profilesCorrect = finalProfile?.company_name === testData.company_name;
    const agentsCorrect = finalAgent?.agency_name === testData.company_name;
    
    console.log(`│ Profiles Mapping: ${profilesCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
    console.log(`│ Agents Mapping: ${agentsCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
    console.log('└─────────────────────────────────────────────────────────────┘');

    if (profilesCorrect && agentsCorrect) {
      console.log('\n🎉 SUCCESS: Company Name field mapping is working correctly!');
    } else {
      console.log('\n⚠️  WARNING: Company Name field mapping has issues!');
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

testCompanyNameMapping().catch(console.error);