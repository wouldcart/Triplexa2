#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUIIntegration() {
  console.log('🧪 Testing UI Integration with Transport Routes Database\n');

  try {
    // 1. Create a sample route that should appear in the UI
    console.log('1. Creating a sample route for UI testing...');
    
    const sampleRoute = {
      route_code: 'UI_TEST_001',
      route_name: 'UI Test Route - Dubai to Abu Dhabi',
      country: 'UAE',
      transfer_type: 'One-Way',
      start_location: 'DXB',
      start_location_full_name: 'Dubai International Airport',
      end_location: 'AUH',
      end_location_full_name: 'Abu Dhabi City Center',
      description: 'Test route for UI integration verification',
      status: 'active',
      distance: 150,
      duration: '90 minutes'
    };

    const { data: insertedRoute, error: insertError } = await supabase
      .from('transport_routes')
      .insert(sampleRoute)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create sample route:', insertError.message);
      return;
    }

    console.log('✅ Sample route created successfully!');
    console.log(`   Route ID: ${insertedRoute.id}`);
    console.log(`   Route Code: ${insertedRoute.route_code}`);
    console.log(`   Route Name: ${insertedRoute.route_name}`);

    // 2. Verify the route can be retrieved
    console.log('\n2. Verifying route retrieval...');
    
    const { data: retrievedRoute, error: retrieveError } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('id', insertedRoute.id)
      .single();

    if (retrieveError) {
      console.error('❌ Failed to retrieve route:', retrieveError.message);
      return;
    }

    console.log('✅ Route retrieved successfully!');
    console.log('📋 Route details:');
    console.log(`   ID: ${retrievedRoute.id}`);
    console.log(`   Code: ${retrievedRoute.route_code}`);
    console.log(`   Name: ${retrievedRoute.route_name}`);
    console.log(`   Country: ${retrievedRoute.country}`);
    console.log(`   Transfer Type: ${retrievedRoute.transfer_type}`);
    console.log(`   From: ${retrievedRoute.start_location_full_name}`);
    console.log(`   To: ${retrievedRoute.end_location_full_name}`);
    console.log(`   Status: ${retrievedRoute.status}`);

    // 3. List all routes to verify count
    console.log('\n3. Checking total routes in database...');
    
    const { data: allRoutes, error: listError } = await supabase
      .from('transport_routes')
      .select('id, route_code, route_name, status')
      .order('created_at', { ascending: false });

    if (listError) {
      console.error('❌ Failed to list routes:', listError.message);
      return;
    }

    console.log(`✅ Found ${allRoutes.length} total routes in database`);
    console.log('📋 Recent routes:');
    allRoutes.slice(0, 5).forEach((route, index) => {
      console.log(`   ${index + 1}. ${route.route_code} - ${route.route_name} (${route.status})`);
    });

    // 4. Test schema compatibility
    console.log('\n4. Testing schema compatibility...');
    
    const { data: schemaTest, error: schemaError } = await supabase
      .from('transport_routes')
      .select('id, route_code, route_name, country, transfer_type, start_location, end_location, status, created_at')
      .limit(1);

    if (schemaError) {
      console.error('❌ Schema compatibility test failed:', schemaError.message);
      return;
    }

    console.log('✅ Schema compatibility verified!');
    console.log('📋 Available columns confirmed:');
    if (schemaTest.length > 0) {
      const columns = Object.keys(schemaTest[0]);
      columns.forEach(col => console.log(`   - ${col}`));
    }

    console.log('\n🎉 UI Integration Test Complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Open the UI at http://localhost:5173');
    console.log('   2. Navigate to Transport > Routes');
    console.log('   3. Verify the test route appears in the list');
    console.log('   4. Test creating, editing, and deleting routes through the UI');
    
    console.log('\n💡 The sample route will remain in the database for UI testing.');
    console.log(`   Route ID: ${insertedRoute.id} (${insertedRoute.route_code})`);

  } catch (error) {
    console.error('❌ Unexpected error during UI integration test:', error);
  }
}

// Run the test
testUIIntegration().then(() => {
  console.log('\n🏁 UI Integration test completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ UI Integration test failed:', error);
  process.exit(1);
});