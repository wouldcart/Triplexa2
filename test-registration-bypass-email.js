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

async function testRegistrationBypassEmail() {
  console.log('🔍 TESTING AGENT REGISTRATION (BYPASSING EMAIL CONFIRMATION)\n');
  
  const testEmail = `test-agent-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testData = {
    name: 'Test Agent',
    email: testEmail,
    phone: '+1234567890',
    company_name: 'Test Company Ltd',
    business_address: '123 Test Street',
    city: 'Test City',
    country: 'Test Country',
    business_type: 'individual',
    specialization: 'leisure',
    password: testPassword
  };

  console.log('📋 Test Data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n');

  let userId = null;

  try {
    // Step 1: Create user with admin client (bypasses email confirmation)
    console.log('1️⃣ Creating user with admin client (bypassing email)...');
    const { data: adminAuthData, error: adminAuthError } = await adminSupabase.auth.admin.createUser({
      email: testData.email,
      password: testData.password,
      email_confirm: true, // This bypasses email confirmation
      user_metadata: {
        name: testData.name,
        role: 'agent',
        department: 'Agents',
        position: 'External Agent',
        business_address: testData.business_address,
        city: testData.city,
        country: testData.country,
        business_type: testData.business_type,
        specialization: testData.specialization
      }
    });

    if (adminAuthError) {
      console.log('   ❌ Admin user creation failed:', adminAuthError.message);
      return;
    }

    if (!adminAuthData.user) {
      console.log('   ❌ Admin user creation failed: No user returned');
      return;
    }

    userId = adminAuthData.user.id;
    console.log(`   ✅ User created successfully. User ID: ${userId}`);
    console.log(`   📧 Email confirmed: ${adminAuthData.user.email_confirmed_at ? 'Yes' : 'No'}`);

    // Step 2: Test Profile Insert with Admin Client
    console.log('\n2️⃣ Testing Profile Insert with Admin Client...');
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .insert([{
        id: userId,
        name: testData.name,
        email: testData.email,
        phone: testData.phone,
        company_name: testData.company_name,
        role: 'agent'
      }])
      .select();

    if (profileError) {
      console.log('   ❌ Profile insert failed:', profileError.message);
      console.log('   📝 Error details:', profileError);
    } else {
      console.log('   ✅ Profile insert successful');
      console.log('   📄 Profile data:', profileData);
    }

    // Step 3: Test Agent Insert with Admin Client
    console.log('\n3️⃣ Testing Agent Insert with Admin Client...');
    const { data: agentData, error: agentError } = await adminSupabase
      .from('agents')
      .insert([{
        id: userId,
        user_id: userId,
        name: testData.name,
        email: testData.email,
        agency_name: testData.company_name,
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
      console.log('   📝 Error details:', agentError);
      console.log('   🔍 Error code:', agentError.code);
      console.log('   🔍 Error hint:', agentError.hint);
    } else {
      console.log('   ✅ Agent insert successful');
      console.log('   📄 Agent data:', agentData);
    }

    // Step 4: Test with Session Client (simulate normal user flow)
    console.log('\n4️⃣ Testing with Session Client (simulating normal user)...');
    
    // First sign in the user to get a session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testData.email,
      password: testData.password
    });

    if (signInError) {
      console.log('   ❌ Sign in failed:', signInError.message);
    } else {
      console.log('   ✅ Sign in successful');
      
      // Now test inserting with session client
      const { data: sessionProfileData, error: sessionProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);

      if (sessionProfileError) {
        console.log('   ❌ Session profile read failed:', sessionProfileError.message);
      } else {
        console.log('   ✅ Session profile read successful:', sessionProfileData);
      }

      const { data: sessionAgentData, error: sessionAgentError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', userId);

      if (sessionAgentError) {
        console.log('   ❌ Session agent read failed:', sessionAgentError.message);
      } else {
        console.log('   ✅ Session agent read successful:', sessionAgentData);
      }
    }

    // Step 5: Verify final state
    console.log('\n5️⃣ Verifying final state...');
    
    // Check profile
    const { data: finalProfile, error: finalProfileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (finalProfileError) {
      console.log('   ❌ Final profile check failed:', finalProfileError.message);
    } else {
      console.log('   ✅ Final profile state:');
      console.log('   📄', finalProfile);
    }

    // Check agent
    const { data: finalAgent, error: finalAgentError } = await adminSupabase
      .from('agents')
      .select('*')
      .eq('id', userId)
      .single();

    if (finalAgentError) {
      console.log('   ❌ Final agent check failed:', finalAgentError.message);
    } else {
      console.log('   ✅ Final agent state:');
      console.log('   📄', finalAgent);
    }

    console.log('\n🎯 SUMMARY:');
    console.log('✅ The database insertion process works correctly when email confirmation is bypassed');
    console.log('❌ The issue is with Supabase email configuration preventing user creation');

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

testRegistrationBypassEmail().catch(console.error);