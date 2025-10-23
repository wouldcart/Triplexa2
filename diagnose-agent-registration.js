import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const adminSupabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function diagnoseAgentRegistration() {
  console.log('🔍 DIAGNOSING AGENT REGISTRATION PROCESS\n');
  
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
    // Step 1: Test Supabase Auth Signup
    console.log('1️⃣ Testing Supabase Auth Signup...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testData.email,
      password: testData.password,
      options: {
        data: {
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
      }
    });

    if (authError) {
      console.log('   ❌ Auth signup failed:', authError.message);
      return;
    }

    if (!authData.user) {
      console.log('   ❌ Auth signup failed: No user returned');
      return;
    }

    userId = authData.user.id;
    console.log(`   ✅ Auth signup successful. User ID: ${userId}`);
    console.log(`   📧 Email confirmation required: ${!authData.user.email_confirmed_at}`);

    // Step 2: Test Profile Insert (Session Client)
    console.log('\n2️⃣ Testing Profile Insert (Session Client)...');
    const { data: profileData, error: profileError } = await supabase
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

    // Step 3: Test Agent Insert (Session Client)
    console.log('\n3️⃣ Testing Agent Insert (Session Client)...');
    const { data: agentData, error: agentError } = await supabase
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

    // Step 4: Test with Admin Client (if available)
    if (adminSupabase) {
      console.log('\n4️⃣ Testing with Admin Client...');
      
      // Test profile upsert with admin
      const { data: adminProfileData, error: adminProfileError } = await adminSupabase
        .from('profiles')
        .upsert({
          id: userId,
          name: testData.name,
          email: testData.email,
          phone: testData.phone,
          company_name: testData.company_name,
          role: 'agent'
        })
        .select();

      if (adminProfileError) {
        console.log('   ❌ Admin profile upsert failed:', adminProfileError.message);
      } else {
        console.log('   ✅ Admin profile upsert successful');
      }

      // Test agent upsert with admin
      const { data: adminAgentData, error: adminAgentError } = await adminSupabase
        .from('agents')
        .upsert({
          id: userId,
          user_id: userId,
          agency_name: testData.company_name,
          business_phone: testData.phone,
          business_address: testData.business_address,
          specializations: [testData.specialization],
          status: 'inactive',
          created_by: userId
        })
        .select();

      if (adminAgentError) {
        console.log('   ❌ Admin agent upsert failed:', adminAgentError.message);
      } else {
        console.log('   ✅ Admin agent upsert successful');
      }
    } else {
      console.log('\n4️⃣ Admin client not available (no service role key)');
    }

    // Step 5: Check what was actually saved
    console.log('\n5️⃣ Checking what was actually saved...');
    
    // Check profile
    const { data: savedProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileCheckError) {
      console.log('   ❌ Profile check failed:', profileCheckError.message);
    } else {
      console.log('   ✅ Profile found:');
      console.log('   📄', savedProfile);
    }

    // Check agent
    const { data: savedAgent, error: agentCheckError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', userId)
      .single();

    if (agentCheckError) {
      console.log('   ❌ Agent check failed:', agentCheckError.message);
    } else {
      console.log('   ✅ Agent found:');
      console.log('   📄', savedAgent);
    }

    // Step 6: Check RLS policies
    console.log('\n6️⃣ Checking RLS Policies...');
    
    if (adminSupabase) {
      try {
        const { data: policies, error: policyError } = await adminSupabase
          .rpc('get_table_policies', { table_name: 'profiles' });
        
        if (policyError) {
          console.log('   ❌ Could not check RLS policies:', policyError.message);
        } else {
          console.log('   📋 RLS policies found:', policies?.length || 0);
        }
      } catch (e) {
        console.log('   ⚠️  RLS policy check not available');
      }
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  } finally {
    // Cleanup
    if (userId) {
      console.log('\n🧹 Cleaning up test data...');
      try {
        if (adminSupabase) {
          await adminSupabase.from('agents').delete().eq('id', userId);
          await adminSupabase.from('profiles').delete().eq('id', userId);
          await adminSupabase.auth.admin.deleteUser(userId);
        } else {
          await supabase.from('agents').delete().eq('id', userId);
          await supabase.from('profiles').delete().eq('id', userId);
        }
        console.log('   ✅ Cleanup completed');
      } catch (cleanupError) {
        console.log('   ⚠️  Cleanup error:', cleanupError.message);
      }
    }
  }

  console.log('\n🎯 DIAGNOSIS COMPLETE');
}

diagnoseAgentRegistration().catch(console.error);