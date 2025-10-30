const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function debugAuthFlow() {
  console.log('🔍 Starting Authentication Flow Debug...\n');

  // Test data
  const testAgent = {
    name: "Debug Test Agent",
    email: "debug.test@example.com",
    password: "TestPassword123!",
    phone: "+1234567890",
    company_name: "Debug Test Agency",
    business_address: "123 Debug St, Test City, TC",
    business_phone: "+1234567891",
    city: "Test City",
    country: "USA",
    business_type: "travel_agency",
    specializations: ["flights", "hotels"],
    license_number: "DEBUG123",
    agency_code: "DTA001",
    source_type: "organic"
  };

  try {
    // Step 1: Test Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
    console.log('');

    // Step 2: Test Agent Signup
    console.log('2️⃣ Testing Agent Signup...');
    const signupResponse = await fetch(`${BASE_URL}/signup/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAgent)
    });

    const signupData = await signupResponse.json();
    console.log('📝 Signup Response Status:', signupResponse.status);
    console.log('📝 Signup Response:', JSON.stringify(signupData, null, 2));
    console.log('');

    if (signupResponse.status !== 201) {
      console.log('❌ Signup failed, stopping debug...');
      return;
    }

    // Step 3: Test Login
    console.log('3️⃣ Testing Login...');
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testAgent.email,
        password: testAgent.password,
        remember_me: false
      })
    });

    const loginData = await loginResponse.json();
    console.log('🔑 Login Response Status:', loginResponse.status);
    console.log('🔑 Login Response:', JSON.stringify(loginData, null, 2));
    console.log('');

    if (loginResponse.status === 200 && loginData.data?.session?.access_token) {
      // Step 4: Test Session Validation
      console.log('4️⃣ Testing Session Validation...');
      const sessionResponse = await fetch(`${BASE_URL}/validate-session`, {
        headers: {
          'Authorization': `Bearer ${loginData.data.session.access_token}`
        }
      });

      const sessionData = await sessionResponse.json();
      console.log('🔐 Session Response Status:', sessionResponse.status);
      console.log('🔐 Session Response:', JSON.stringify(sessionData, null, 2));
      console.log('');

      // Step 5: Test Logout
      console.log('5️⃣ Testing Logout...');
      const logoutResponse = await fetch(`${BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.data.session.access_token}`
        }
      });

      const logoutData = await logoutResponse.json();
      console.log('👋 Logout Response Status:', logoutResponse.status);
      console.log('👋 Logout Response:', JSON.stringify(logoutData, null, 2));
    }

  } catch (error) {
    console.error('❌ Debug Error:', error.message);
  }

  console.log('\n🏁 Debug completed!');
}

debugAuthFlow();