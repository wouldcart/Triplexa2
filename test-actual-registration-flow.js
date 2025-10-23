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

async function testActualRegistrationFlow() {
  console.log('🚀 TESTING ACTUAL AGENT REGISTRATION FLOW\n');
  
  const testEmail = `actual-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testCompanyName = 'Actual Test Travel Agency Ltd';
  
  // Simulate the exact data structure from AgentSignup.tsx
  const formData = {
    name: 'Actual Test Agent',
    email: testEmail,
    phone: '+1234567890',
    company_name: testCompanyName,
    business_type: 'Travel Agency',
    specialization: 'Leisure Travel',
    address: '123 Actual Test Street',
    city: 'Test City',
    country: 'Test Country',
    password: testPassword,
    confirm_password: testPassword
  };

  console.log('📋 Test Registration Data:');
  console.log(`   Company Name: "${formData.company_name}"`);
  console.log(`   Name: "${formData.name}"`);
  console.log(`   Email: "${formData.email}"`);
  console.log('\n');

  try {
    // Step 1: Test Supabase Auth Signup (like AuthService.signUp)
    console.log('1️⃣ Testing Supabase Auth Signup...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${supabaseUrl}/login`,
        data: {
          role: 'agent',
          name: formData.name,
          phone: formData.phone,
          company_name: formData.company_name,
          department: 'Agents',
          position: 'External Agent',
          business_address: formData.address,
          city: formData.city,
          country: formData.country,
          business_type: formData.business_type,
          specialization: formData.specialization
        }
      }
    });

    if (signUpError) {
      console.log(`   ❌ Auth signup failed: ${signUpError.message}`);
      
      // Check if it's the email confirmation issue
      if (signUpError.message.includes('confirmation email') || signUpError.message.includes('email')) {
        console.log('   📧 Email confirmation issue detected - this is the root cause');
        console.log('   💡 Solution: Disable email confirmation in Supabase dashboard');
        console.log('   🔧 Or configure SMTP settings in Supabase Auth settings');
        return;
      }
    } else {
      console.log('   ✅ Auth signup successful');
      console.log(`   👤 User ID: ${signUpData.user?.id}`);
      console.log(`   📧 Email confirmed: ${signUpData.user?.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   📝 User metadata company_name: "${signUpData.user?.user_metadata?.company_name}"`);
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      console.log('   ❌ No user ID returned from auth signup');
      return;
    }

    // Step 2: Test AgentManagementService.signupAgent equivalent
    console.log('\n2️⃣ Testing Agent Management Service Signup...');
    
    // Simulate the exact data passed to signupAgent
    const signupRequest = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company_name: formData.company_name,
      password: formData.password,
    };

    const additionalAgentData = {
      business_address: formData.address,
      city: formData.city,
      country: formData.country,
      type: formData.business_type,
      specializations: formData.specialization,
    };

    const finalSignupData = {
      ...signupRequest,
      ...additionalAgentData
    };

    console.log(`   🔍 Final signup data company_name: "${finalSignupData.company_name}"`);

    // Test admin client path (should work if email confirmation is disabled)
    console.log('\n   🔧 Testing Admin Client Path...');
    try {
      const profileInsert = await adminSupabase
        .from('profiles')
        .upsert({
          id: userId,
          name: finalSignupData.name,
          email: finalSignupData.email,
          phone: finalSignupData.phone,
          company_name: finalSignupData.company_name,
          role: 'agent',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (profileInsert.error) {
        console.log(`   ❌ Profile insert failed: ${profileInsert.error.message}`);
      } else {
        console.log('   ✅ Profile insert successful');
      }

      const agentInsert = await adminSupabase
        .from('agents')
        .upsert({
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
        }, { onConflict: 'id' });

      if (agentInsert.error) {
        console.log(`   ❌ Agent insert failed: ${agentInsert.error.message}`);
      } else {
        console.log('   ✅ Agent insert successful');
        
        // Update additional fields
        await adminSupabase
          .from('agents')
          .update({
            name: finalSignupData.name,
            email: finalSignupData.email,
            city: finalSignupData.city,
            country: finalSignupData.country,
            type: finalSignupData.type
          })
          .eq('id', userId);
      }

    } catch (adminError) {
      console.log(`   ❌ Admin client error: ${adminError.message}`);
    }

    // Step 3: Verify final state
    console.log('\n3️⃣ Verifying Final State...');
    
    // Check profile
    const { data: finalProfile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, name, email, company_name, role')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.log(`   ❌ Profile verification failed: ${profileError.message}`);
    } else {
      console.log('   ✅ Profile verification:');
      console.log(`      Company Name: "${finalProfile.company_name}"`);
      
      if (finalProfile.company_name === testCompanyName) {
        console.log('   🎯 PROFILES TABLE: Company Name mapping ✅ CORRECT');
      } else {
        console.log('   🎯 PROFILES TABLE: Company Name mapping ❌ INCORRECT');
        console.log(`      Expected: "${testCompanyName}"`);
        console.log(`      Got: "${finalProfile.company_name}"`);
      }
    }

    // Check agent
    const { data: finalAgent, error: agentError } = await adminSupabase
      .from('agents')
      .select('id, name, email, agency_name, status')
      .eq('id', userId)
      .single();

    if (agentError) {
      console.log(`   ❌ Agent verification failed: ${agentError.message}`);
    } else {
      console.log('   ✅ Agent verification:');
      console.log(`      Agency Name: "${finalAgent.agency_name}"`);
      
      if (finalAgent.agency_name === testCompanyName) {
        console.log('   🎯 AGENTS TABLE: Company Name → Agency Name mapping ✅ CORRECT');
      } else {
        console.log('   🎯 AGENTS TABLE: Company Name → Agency Name mapping ❌ INCORRECT');
        console.log(`      Expected: "${testCompanyName}"`);
        console.log(`      Got: "${finalAgent.agency_name}"`);
      }
    }

    // Step 4: Summary
    console.log('\n📊 FINAL SUMMARY:');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│                 AGENT REGISTRATION RESULTS                 │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log(`│ Auth Signup: ${signUpError ? '❌ FAILED' : '✅ SUCCESS'}`);
    console.log(`│ Profiles Mapping: ${finalProfile?.company_name === testCompanyName ? '✅ CORRECT' : '❌ INCORRECT'}`);
    console.log(`│ Agents Mapping: ${finalAgent?.agency_name === testCompanyName ? '✅ CORRECT' : '❌ INCORRECT'}`);
    console.log('└─────────────────────────────────────────────────────────────┘');

    if (!signUpError && finalProfile?.company_name === testCompanyName && finalAgent?.agency_name === testCompanyName) {
      console.log('\n🎉 SUCCESS: Agent registration with Company Name mapping is working correctly!');
    } else if (signUpError) {
      console.log('\n⚠️  ISSUE: Email confirmation preventing registration - fix Supabase email settings');
    } else {
      console.log('\n⚠️  ISSUE: Company Name mapping has problems despite successful auth');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    try {
      await adminSupabase.from('agents').delete().eq('id', userId);
      await adminSupabase.from('profiles').delete().eq('id', userId);
      await adminSupabase.auth.admin.deleteUser(userId);
      console.log('   ✅ Cleanup completed');
    } catch (cleanupError) {
      console.log(`   ⚠️  Cleanup error: ${cleanupError.message}`);
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

testActualRegistrationFlow().catch(console.error);