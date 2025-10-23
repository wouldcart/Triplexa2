#!/usr/bin/env node

/**
 * Test script for integrated transport service
 * This script tests the basic functionality of the integrated transport service
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testIntegratedTransportService() {
  console.log('🚀 Testing Integrated Transport Service...\n');

  try {
    // Test 1: Check if location_codes table exists and has data
    console.log('1. Testing location_codes table...');
    const { data: locationCodes, error: locationError } = await supabase
      .from('location_codes')
      .select('*')
      .limit(5);

    if (locationError) {
      console.error('❌ Error fetching location codes:', locationError.message);
    } else {
      console.log(`✅ Found ${locationCodes?.length || 0} location codes`);
      if (locationCodes && locationCodes.length > 0) {
        console.log('   Sample location:', locationCodes[0].code, '-', locationCodes[0].full_name);
      }
    }

    // Test 2: Check transport_routes table
    console.log('\n2. Testing transport_routes table...');
    const { data: routes, error: routesError } = await supabase
      .from('transport_routes')
      .select('*')
      .limit(5);

    if (routesError) {
      console.error('❌ Error fetching transport routes:', routesError.message);
    } else {
      console.log(`✅ Found ${routes?.length || 0} transport routes`);
      if (routes && routes.length > 0) {
        console.log('   Sample route:', routes[0].route_code, '-', routes[0].route_name);
      }
    }

    // Test 3: Check intermediate_stops table
    console.log('\n3. Testing intermediate_stops table...');
    const { data: stops, error: stopsError } = await supabase
      .from('intermediate_stops')
      .select('*')
      .limit(5);

    if (stopsError) {
      console.error('❌ Error fetching intermediate stops:', stopsError.message);
    } else {
      console.log(`✅ Found ${stops?.length || 0} intermediate stops`);
    }

    // Test 4: Check transport_types table
    console.log('\n4. Testing transport_types table...');
    const { data: types, error: typesError } = await supabase
      .from('transport_types')
      .select('*')
      .limit(5);

    if (typesError) {
      console.error('❌ Error fetching transport types:', typesError.message);
    } else {
      console.log(`✅ Found ${types?.length || 0} transport types`);
    }

    // Test 5: Test the integrated view
    console.log('\n5. Testing transport_routes_view...');
    const { data: viewData, error: viewError } = await supabase
      .from('transport_routes_view')
      .select('*')
      .limit(3);

    if (viewError) {
      console.error('❌ Error fetching from transport_routes_view:', viewError.message);
    } else {
      console.log(`✅ Found ${viewData?.length || 0} routes in view`);
      if (viewData && viewData.length > 0) {
        console.log('   Sample view data structure:');
        console.log('   - Route:', viewData[0].route_code);
        console.log('   - Has intermediate_stops:', !!viewData[0].intermediate_stops);
        console.log('   - Has transport_types:', !!viewData[0].transport_types);
      }
    }

    // Test 6: Test foreign key relationships
    console.log('\n6. Testing foreign key relationships...');
    const { data: routeWithDetails, error: detailsError } = await supabase
      .from('transport_routes')
      .select(`
        *,
        start_location:location_codes!transport_routes_start_location_code_fkey(*),
        end_location:location_codes!transport_routes_end_location_code_fkey(*)
      `)
      .limit(1);

    if (detailsError) {
      console.error('❌ Error testing foreign key relationships:', detailsError.message);
    } else {
      console.log('✅ Foreign key relationships working');
      if (routeWithDetails && routeWithDetails.length > 0) {
        const route = routeWithDetails[0];
        console.log(`   Route: ${route.route_code}`);
        console.log(`   Start: ${route.start_location?.full_name || 'N/A'}`);
        console.log(`   End: ${route.end_location?.full_name || 'N/A'}`);
      }
    }

    console.log('\n🎉 Integration test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testIntegratedTransportService();