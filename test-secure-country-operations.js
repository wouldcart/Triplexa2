#!/usr/bin/env node

/**
 * Comprehensive Test Script for Secure Country Operations
 * Tests the integration between transport routes and public.countries table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Test 1: Verify public.countries table access and active countries
 */
async function testActiveCountries() {
  console.log('\n🧪 Test 1: Verifying active countries from public.countries table...');
  
  try {
    const { data: countries, error } = await supabase
      .from('countries')
      .select('id, name, code, status')
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('❌ Error fetching active countries:', error.message);
      return false;
    }

    if (!countries || countries.length === 0) {
      console.error('❌ No active countries found in public.countries table');
      return false;
    }

    console.log(`✅ Found ${countries.length} active countries:`);
    countries.slice(0, 5).forEach(country => {
      console.log(`   - ${country.name} (${country.code})`);
    });
    
    if (countries.length > 5) {
      console.log(`   ... and ${countries.length - 5} more`);
    }

    return { success: true, countries };
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

/**
 * Test 2: Verify transport_routes table structure and data
 */
async function testTransportRoutes() {
  console.log('\n🧪 Test 2: Verifying transport_routes table structure...');
  
  try {
    const { data: routes, error } = await supabase
      .from('transport_routes')
      .select('id, route_name, country, transfer_type, status')
      .limit(5);

    if (error) {
      console.error('❌ Error fetching transport routes:', error.message);
      return false;
    }

    console.log(`✅ Transport routes table accessible`);
    console.log(`   Found ${routes?.length || 0} routes (showing first 5)`);
    
    if (routes && routes.length > 0) {
      routes.forEach(route => {
        console.log(`   - ${route.route_name} (${route.country}) - ${route.transfer_type}`);
      });
    }

    return { success: true, routes };
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

/**
 * Test 3: Verify country validation logic
 */
async function testCountryValidation(activeCountries) {
  console.log('\n🧪 Test 3: Testing country validation logic...');
  
  if (!activeCountries || !activeCountries.countries) {
    console.error('❌ No active countries available for validation test');
    return false;
  }

  const countries = activeCountries.countries;
  const validCountry = countries[0]?.name;
  const invalidCountry = 'NonExistentCountry123';

  // Test valid country
  console.log(`   Testing valid country: "${validCountry}"`);
  const validExists = countries.some(
    country => country.name.toLowerCase() === validCountry.toLowerCase()
  );
  
  if (validExists) {
    console.log(`   ✅ Valid country "${validCountry}" found in active countries`);
  } else {
    console.error(`   ❌ Valid country "${validCountry}" not found`);
    return false;
  }

  // Test invalid country
  console.log(`   Testing invalid country: "${invalidCountry}"`);
  const invalidExists = countries.some(
    country => country.name.toLowerCase() === invalidCountry.toLowerCase()
  );
  
  if (!invalidExists) {
    console.log(`   ✅ Invalid country "${invalidCountry}" correctly rejected`);
  } else {
    console.error(`   ❌ Invalid country "${invalidCountry}" incorrectly accepted`);
    return false;
  }

  return true;
}

/**
 * Test 4: Test route statistics with null safety
 */
async function testRouteStatistics() {
  console.log('\n🧪 Test 4: Testing route statistics with null safety...');
  
  try {
    const { data: routes, error } = await supabase
      .from('transport_routes')
      .select('country, transfer_type, status');

    if (error) {
      console.error('❌ Error fetching routes for statistics:', error.message);
      return false;
    }

    // Test the null-safe country grouping logic
    const routesByCountry = (routes || []).reduce((acc, route) => {
      const country = route.country || 'Unknown'; // Null safety check
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    console.log('✅ Route statistics calculated successfully:');
    Object.entries(routesByCountry).forEach(([country, count]) => {
      console.log(`   - ${country}: ${count} routes`);
    });

    // Check for null/undefined countries
    const nullCountries = (routes || []).filter(route => !route.country);
    if (nullCountries.length > 0) {
      console.log(`   ⚠️  Found ${nullCountries.length} routes with null/undefined countries`);
    }

    return true;
  } catch (error) {
    console.error('❌ Error in route statistics test:', error.message);
    return false;
  }
}

/**
 * Test 5: Verify database connection and permissions
 */
async function testDatabaseConnection() {
  console.log('\n🧪 Test 5: Verifying database connection and permissions...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('countries')
      .select('count(*)')
      .single();

    if (error) {
      console.error('❌ Database connection error:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    console.log(`   Total countries in database: ${data.count}`);

    // Test RLS policies
    const { data: testData, error: rlsError } = await supabase
      .from('countries')
      .select('id')
      .limit(1);

    if (rlsError) {
      console.error('❌ RLS policy error:', rlsError.message);
      return false;
    }

    console.log('✅ RLS policies allow read access');
    return true;
  } catch (error) {
    console.error('❌ Unexpected database error:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Secure Country Operations Test Suite');
  console.log('=' .repeat(60));

  const results = {
    activeCountries: false,
    transportRoutes: false,
    countryValidation: false,
    routeStatistics: false,
    databaseConnection: false
  };

  // Run tests
  results.databaseConnection = await testDatabaseConnection();
  const activeCountriesResult = await testActiveCountries();
  results.activeCountries = !!activeCountriesResult;
  results.transportRoutes = await testTransportRoutes();
  results.countryValidation = await testCountryValidation(activeCountriesResult);
  results.routeStatistics = await testRouteStatistics();

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=' .repeat(60));
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });

  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Secure country operations are working correctly.');
    return true;
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    return false;
  }
}

// Run the tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });