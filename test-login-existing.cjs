const axios = require('axios');

const AUTH_SERVER_URL = 'http://localhost:5000';

async function testLoginFlow() {
  console.log('🧪 Testing Authentication Flow...\n');
  
  try {
    // 1. Health Check
    console.log('1️⃣ Health Check...');
    const healthResponse = await axios.get(`${AUTH_SERVER_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // 2. Test Login
    console.log('\n2️⃣ Testing Login...');
    const loginData = {
      email: 'test@example.com',
      password: 'TestPassword123!'
    };
    
    console.log('📧 Email:', loginData.email);
    console.log('🔑 Password:', loginData.password);
    
    const loginResponse = await axios.post(`${AUTH_SERVER_URL}/login`, loginData);
    console.log('✅ Login successful!');
    console.log('📊 Response status:', loginResponse.status);
    console.log('📝 Full response data:', JSON.stringify(loginResponse.data, null, 2));
    
    // Extract session token from response
    const sessionToken = loginResponse.data.data?.session?.access_token || 
                        loginResponse.data.session?.token || 
                        loginResponse.data.session?.access_token ||
                        loginResponse.data.access_token;
    
    console.log('🎫 Session token present:', !!sessionToken);
    
    // 3. Test Session Validation (if endpoint exists)
    if (sessionToken) {
      console.log('\n3️⃣ Testing Session Validation...');
      try {
        const sessionResponse = await axios.get(`${AUTH_SERVER_URL}/validate-session`, {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
        console.log('✅ Session validation passed:', sessionResponse.data);
      } catch (sessionError) {
        console.log('ℹ️ Session validation endpoint not available or failed:', sessionError.response?.status);
      }
    }
    
    // 4. Test Logout (if endpoint exists)
    console.log('\n4️⃣ Testing Logout...');
    try {
      const logoutResponse = await axios.post(`${AUTH_SERVER_URL}/logout`, {}, {
        headers: sessionToken ? {
          'Authorization': `Bearer ${sessionToken}`
        } : {}
      });
      console.log('✅ Logout successful:', logoutResponse.data);
    } catch (logoutError) {
      console.log('ℹ️ Logout endpoint not available or failed:', logoutError.response?.status);
    }
    
    console.log('\n🎉 Authentication flow test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Authentication test failed:');
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📝 Response:', error.response.data);
    } else if (error.request) {
      console.error('🌐 Network error - no response received');
      console.error('📝 Request details:', error.message);
    } else {
      console.error('⚠️ Error:', error.message);
    }
  }
}

testLoginFlow();