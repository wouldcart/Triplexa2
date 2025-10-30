/*
 * Comprehensive Test Suite for Authentication Endpoints
 * Tests /signup/agent and /login endpoints with various scenarios
 * Includes CRUD operations, role-based access control, and error handling
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = 'http://localhost:5000';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Initialize admin Supabase client for cleanup
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test data
const testAgentData = {
  name: 'Test Agent',
  email: 'test.agent@example.com',
  password: 'TestPassword123!',
  phone: '+1234567890',
  company_name: 'Test Travel Agency',
  business_address: '123 Test Street, Test City',
  business_phone: '+1234567891',
  city: 'Test City',
  country: 'Test Country',
  business_type: 'travel_agency',
  specializations: ['flights', 'hotels'],
  license_number: 'LIC123456',
  agency_code: 'TEST001',
  iata_number: 'IATA123',
  source_type: 'organic',
  source_details: 'Direct website signup'
};

const testLoginData = {
  email: 'test.agent@example.com',
  password: 'TestPassword123!',
  remember_me: false
};

// Utility functions
const makeRequest = async (endpoint, method = 'GET', body = null, headers = {}) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  
  return {
    status: response.status,
    data,
    headers: response.headers
  };
};

const cleanupTestData = async () => {
  try {
    // Delete test agent record
    await adminSupabase
      .from('agents')
      .delete()
      .eq('agency_name', testAgentData.company_name);

    // Delete test profile record
    await adminSupabase
      .from('profiles')
      .delete()
      .eq('email', testAgentData.email);

    // Delete test auth user
    const { data: users } = await adminSupabase.auth.admin.listUsers();
    const testUser = users.users.find(user => user.email === testAgentData.email);
    if (testUser) {
      await adminSupabase.auth.admin.deleteUser(testUser.id);
    }

    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.log('⚠️ Cleanup warning:', error.message);
  }
};

const runTests = async () => {
  console.log('🧪 Starting Authentication Endpoints Test Suite\n');

  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };

  const test = async (name, testFn) => {
    testResults.total++;
    try {
      console.log(`🔍 Testing: ${name}`);
      await testFn();
      console.log(`✅ PASSED: ${name}\n`);
      testResults.passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Error: ${error.message}\n`);
      testResults.failed++;
    }
  };

  // Cleanup before starting tests
  await cleanupTestData();

  // Test 1: Health Check
  await test('Health Check Endpoint', async () => {
    const response = await makeRequest('/health');
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (response.data.status !== 'healthy') {
      throw new Error(`Expected status 'healthy', got ${response.data.status}`);
    }
  });

  // Test 2: Agent Signup - Valid Data
  await test('Agent Signup with Valid Data', async () => {
    const response = await makeRequest('/signup/agent', 'POST', testAgentData);
    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}. Response: ${JSON.stringify(response.data)}`);
    }
    if (!response.data.success) {
      throw new Error(`Expected success true, got ${response.data.success}`);
    }
    if (!response.data.data.user_id) {
      throw new Error('Expected user_id in response');
    }
  });

  // Test 3: Agent Signup - Duplicate Email
  await test('Agent Signup with Duplicate Email', async () => {
    const response = await makeRequest('/signup/agent', 'POST', testAgentData);
    if (response.status !== 409) {
      throw new Error(`Expected status 409, got ${response.status}`);
    }
    if (response.data.error.code !== 'EMAIL_EXISTS') {
      throw new Error(`Expected error code 'EMAIL_EXISTS', got ${response.data.error.code}`);
    }
  });

  // Test 4: Agent Signup - Invalid Data
  await test('Agent Signup with Invalid Data', async () => {
    const invalidData = {
      ...testAgentData,
      email: 'invalid-email',
      password: '123', // Too short
      name: 'A' // Too short
    };
    const response = await makeRequest('/signup/agent', 'POST', invalidData);
    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }
    if (response.data.error.code !== 'VALIDATION_ERROR') {
      throw new Error(`Expected error code 'VALIDATION_ERROR', got ${response.data.error.code}`);
    }
  });

  // Test 5: Login - Valid Credentials
  await test('Login with Valid Credentials', async () => {
    const response = await makeRequest('/login', 'POST', testLoginData);
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}. Response: ${JSON.stringify(response.data)}`);
    }
    if (!response.data.success) {
      throw new Error(`Expected success true, got ${response.data.success}`);
    }
    if (!response.data.data.session.access_token) {
      throw new Error('Expected access_token in response');
    }
    if (response.data.data.user.role !== 'agent') {
      throw new Error(`Expected role 'agent', got ${response.data.data.user.role}`);
    }
  });

  // Test 6: Login - Invalid Credentials
  await test('Login with Invalid Credentials', async () => {
    const invalidLoginData = {
      ...testLoginData,
      password: 'wrongpassword'
    };
    const response = await makeRequest('/login', 'POST', invalidLoginData);
    if (response.status !== 401) {
      throw new Error(`Expected status 401, got ${response.status}`);
    }
    if (response.data.error.code !== 'INVALID_CREDENTIALS') {
      throw new Error(`Expected error code 'INVALID_CREDENTIALS', got ${response.data.error.code}`);
    }
  });

  // Test 7: Login - Invalid Email Format
  await test('Login with Invalid Email Format', async () => {
    const invalidEmailData = {
      ...testLoginData,
      email: 'invalid-email-format'
    };
    const response = await makeRequest('/login', 'POST', invalidEmailData);
    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }
    if (response.data.error.code !== 'VALIDATION_ERROR') {
      throw new Error(`Expected error code 'VALIDATION_ERROR', got ${response.data.error.code}`);
    }
  });

  // Test 8: Session Validation - Valid Token
  await test('Session Validation with Valid Token', async () => {
    // First login to get a token
    const loginResponse = await makeRequest('/login', 'POST', testLoginData);
    const token = loginResponse.data.data.session.access_token;
    
    const response = await makeRequest('/validate-session', 'GET', null, {
      'Authorization': `Bearer ${token}`
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.data.session_valid) {
      throw new Error('Expected session_valid to be true');
    }
  });

  // Test 9: Session Validation - Invalid Token
  await test('Session Validation with Invalid Token', async () => {
    const response = await makeRequest('/validate-session', 'GET', null, {
      'Authorization': 'Bearer invalid-token'
    });
    
    if (response.status !== 401) {
      throw new Error(`Expected status 401, got ${response.status}`);
    }
    if (response.data.error.code !== 'INVALID_SESSION') {
      throw new Error(`Expected error code 'INVALID_SESSION', got ${response.data.error.code}`);
    }
  });

  // Test 10: Session Validation - No Token
  await test('Session Validation without Token', async () => {
    const response = await makeRequest('/validate-session', 'GET');
    
    if (response.status !== 401) {
      throw new Error(`Expected status 401, got ${response.status}`);
    }
    if (response.data.error.code !== 'NO_TOKEN') {
      throw new Error(`Expected error code 'NO_TOKEN', got ${response.data.error.code}`);
    }
  });

  // Test 11: Logout
  await test('Logout Endpoint', async () => {
    // First login to get a token
    const loginResponse = await makeRequest('/login', 'POST', testLoginData);
    const token = loginResponse.data.data.session.access_token;
    
    const response = await makeRequest('/logout', 'POST', null, {
      'Authorization': `Bearer ${token}`
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.success) {
      throw new Error('Expected success to be true');
    }
  });

  // Test 12: Database Integrity - Check Profile Record
  await test('Database Integrity - Profile Record', async () => {
    const { data: profile, error } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('email', testAgentData.email)
      .single();

    if (error) {
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }
    if (profile.role !== 'agent') {
      throw new Error(`Expected role 'agent', got ${profile.role}`);
    }
    if (profile.company_name !== testAgentData.company_name) {
      throw new Error(`Expected company_name '${testAgentData.company_name}', got ${profile.company_name}`);
    }
  });

  // Test 13: Database Integrity - Check Agent Record
  await test('Database Integrity - Agent Record', async () => {
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('email', testAgentData.email)
      .single();

    const { data: agent, error } = await adminSupabase
      .from('agents')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch agent: ${error.message}`);
    }
    if (agent.agency_name !== testAgentData.company_name) {
      throw new Error(`Expected agency_name '${testAgentData.company_name}', got ${agent.agency_name}`);
    }
    if (!Array.isArray(agent.specializations)) {
      throw new Error('Expected specializations to be an array');
    }
  });

  // Test 14: Rate Limiting
  await test('Rate Limiting on Auth Endpoints', async () => {
    const promises = [];
    // Make 6 rapid requests (limit is 5 per 15 minutes)
    for (let i = 0; i < 6; i++) {
      promises.push(makeRequest('/login', 'POST', {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }));
    }

    const responses = await Promise.all(promises);
    const rateLimitedResponse = responses.find(r => r.status === 429);
    
    if (!rateLimitedResponse) {
      throw new Error('Expected at least one rate limited response (429)');
    }
    if (rateLimitedResponse.data.error.code !== 'RATE_LIMIT_EXCEEDED') {
      throw new Error(`Expected error code 'RATE_LIMIT_EXCEEDED', got ${rateLimitedResponse.data.error.code}`);
    }
  });

  // Test 15: 404 Handler
  await test('404 Handler for Non-existent Endpoint', async () => {
    const response = await makeRequest('/nonexistent-endpoint');
    if (response.status !== 404) {
      throw new Error(`Expected status 404, got ${response.status}`);
    }
    if (response.data.error.code !== 'NOT_FOUND') {
      throw new Error(`Expected error code 'NOT_FOUND', got ${response.data.error.code}`);
    }
  });

  // Test 16: Security Headers
  await test('Security Headers Present', async () => {
    const response = await makeRequest('/health');
    const headers = response.headers;
    
    if (!headers.get('x-content-type-options')) {
      throw new Error('Missing X-Content-Type-Options header');
    }
    if (!headers.get('x-frame-options')) {
      throw new Error('Missing X-Frame-Options header');
    }
  });

  // Test 17: Input Sanitization
  await test('Input Sanitization', async () => {
    const maliciousData = {
      ...testAgentData,
      email: 'malicious@example.com',
      name: '<script>alert("xss")</script>Test Name',
      company_name: '<img src=x onerror=alert("xss")>Test Company'
    };

    // First cleanup any existing malicious user
    await adminSupabase.from('profiles').delete().eq('email', maliciousData.email);
    const { data: users } = await adminSupabase.auth.admin.listUsers();
    const maliciousUser = users.users.find(user => user.email === maliciousData.email);
    if (maliciousUser) {
      await adminSupabase.auth.admin.deleteUser(maliciousUser.id);
    }

    const response = await makeRequest('/signup/agent', 'POST', maliciousData);
    
    if (response.status === 201) {
      // Check if the data was sanitized
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('name, company_name')
        .eq('email', maliciousData.email)
        .single();

      if (profile.name.includes('<script>') || profile.company_name.includes('<img')) {
        throw new Error('Input was not properly sanitized');
      }

      // Cleanup
      await adminSupabase.from('profiles').delete().eq('email', maliciousData.email);
      await adminSupabase.from('agents').delete().eq('agency_name', profile.company_name);
      const { data: newUsers } = await adminSupabase.auth.admin.listUsers();
      const newMaliciousUser = newUsers.users.find(user => user.email === maliciousData.email);
      if (newMaliciousUser) {
        await adminSupabase.auth.admin.deleteUser(newMaliciousUser.id);
      }
    }
  });

  // Cleanup after all tests
  await cleanupTestData();

  // Print test results
  console.log('📊 Test Results Summary:');
  console.log(`   Total Tests: ${testResults.total}`);
  console.log(`   Passed: ${testResults.passed}`);
  console.log(`   Failed: ${testResults.failed}`);
  console.log(`   Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Authentication endpoints are working correctly.');
  } else {
    console.log(`\n⚠️ ${testResults.failed} test(s) failed. Please review the errors above.`);
  }

  return testResults;
};

// Performance test
const runPerformanceTest = async () => {
  console.log('\n🚀 Running Performance Tests...\n');

  const performanceTest = async (name, testFn, iterations = 10) => {
    console.log(`⏱️ Performance Test: ${name}`);
    const startTime = Date.now();
    
    const promises = [];
    for (let i = 0; i < iterations; i++) {
      promises.push(testFn());
    }
    
    await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    
    console.log(`   Total Time: ${totalTime}ms`);
    console.log(`   Average Time: ${avgTime.toFixed(2)}ms per request`);
    console.log(`   Requests per Second: ${(1000 / avgTime).toFixed(2)}\n`);
  };

  await performanceTest('Health Check Performance', async () => {
    await makeRequest('/health');
  }, 20);

  await performanceTest('Login Performance', async () => {
    await makeRequest('/login', 'POST', testLoginData);
  }, 10);
};

// Main execution
const main = async () => {
  try {
    // Wait for server to be ready
    console.log('⏳ Waiting for auth server to be ready...');
    let serverReady = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!serverReady && attempts < maxAttempts) {
      try {
        const response = await makeRequest('/health');
        if (response.status === 200) {
          serverReady = true;
          console.log('✅ Auth server is ready!\n');
        }
      } catch (error) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!serverReady) {
      throw new Error('Auth server is not responding. Please make sure it is running on port 5000.');
    }

    // Run functional tests
    const results = await runTests();
    
    // Run performance tests only if functional tests pass
    if (results.failed === 0) {
      await runPerformanceTest();
    }

    process.exit(results.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runTests, runPerformanceTest, cleanupTestData };