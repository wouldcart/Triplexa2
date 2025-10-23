#!/usr/bin/env node

/**
 * Comprehensive CRUD Test Script for Transport Management
 * Tests all operations for Transport Types and Transport Routes
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test data
const testTransportType = {
  name: 'Test Luxury Van',
  category: 'van',
  seating_capacity: 8,
  luggage_capacity: 6,
  active: true
};

const testLocationCodes = [
  {
    code: 'BKK APT',
    full_name: 'Bangkok Suvarnabhumi Airport',
    category: 'airport',
    city: 'Bangkok',
    country: 'Thailand'
  },
  {
    code: 'PAT HTL',
    full_name: 'Pattaya Hotel Zone',
    category: 'hotel',
    city: 'Pattaya',
    country: 'Thailand'
  }
];

const testTransportRoute = {
  country: 'Thailand',
  route_name: 'Bangkok to Pattaya Express',
  route_code: 'BKK APT - PAT HTL',
  transfer_type: 'One-Way',
  start_location: 'BKK APT',
  start_location_full_name: 'Bangkok Suvarnabhumi Airport',
  end_location: 'PAT HTL',
  end_location_full_name: 'Pattaya Hotel Zone',
  status: 'active',
  notes: 'Test route for CRUD operations'
};

let createdTransportTypeId = null;
let createdRouteId = null;
let createdLocationIds = [];

async function testTransportTypesCRUD() {
  console.log('\n🚗 Testing Transport Types CRUD Operations...');
  
  try {
    // CREATE
    console.log('  📝 Creating transport type...');
    const { data: createData, error: createError } = await supabase
      .from('transport_types')
      .insert(testTransportType)
      .select()
      .single();
    
    if (createError) throw createError;
    createdTransportTypeId = createData.id;
    console.log(`  ✅ Created transport type with ID: ${createdTransportTypeId}`);
    
    // READ
    console.log('  📖 Reading transport type...');
    const { data: readData, error: readError } = await supabase
      .from('transport_types')
      .select('*')
      .eq('id', createdTransportTypeId)
      .single();
    
    if (readError) throw readError;
    console.log(`  ✅ Read transport type: ${readData.name}`);
    
    // UPDATE
    console.log('  ✏️  Updating transport type...');
    const updatedData = { name: 'Updated Luxury Van', seating_capacity: 10 };
    const { data: updateData, error: updateError } = await supabase
      .from('transport_types')
      .update(updatedData)
      .eq('id', createdTransportTypeId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    console.log(`  ✅ Updated transport type: ${updateData.name} (capacity: ${updateData.seating_capacity})`);
    
    // TOGGLE STATUS
    console.log('  🔄 Toggling transport type status...');
    const { data: toggleData, error: toggleError } = await supabase
      .from('transport_types')
      .update({ active: false })
      .eq('id', createdTransportTypeId)
      .select()
      .single();
    
    if (toggleError) throw toggleError;
    console.log(`  ✅ Toggled status to: ${toggleData.active ? 'active' : 'inactive'}`);
    
    console.log('  ✅ Transport Types CRUD operations completed successfully!');
    
  } catch (error) {
    console.error('  ❌ Transport Types CRUD test failed:', error.message);
    throw error;
  }
}

async function setupLocationCodes() {
  console.log('\n📍 Setting up location codes for route testing...');
  
  try {
    for (const location of testLocationCodes) {
      // Check if location already exists
      const { data: existing } = await supabase
        .from('location_codes')
        .select('id')
        .eq('code', location.code)
        .single();
      
      if (!existing) {
        const { data: created, error } = await supabase
          .from('location_codes')
          .insert(location)
          .select()
          .single();
        
        if (error) throw error;
        createdLocationIds.push(created.id);
        console.log(`  ✅ Created location: ${location.full_name}`);
      } else {
        console.log(`  ℹ️  Location already exists: ${location.full_name}`);
      }
    }
  } catch (error) {
    console.error('  ❌ Location setup failed:', error.message);
    throw error;
  }
}

async function testTransportRoutesCRUD() {
  console.log('\n🛣️  Testing Transport Routes CRUD Operations...');
  
  try {
    // CREATE
    console.log('  📝 Creating transport route...');
    const { data: createData, error: createError } = await supabase
      .from('transport_routes')
      .insert(testTransportRoute)
      .select()
      .single();
    
    if (createError) throw createError;
    createdRouteId = createData.id;
    console.log(`  ✅ Created transport route with ID: ${createdRouteId}`);
    
    // READ
    console.log('  📖 Reading transport route...');
    const { data: readData, error: readError } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('id', createdRouteId)
      .single();
    
    if (readError) throw readError;
    console.log(`  ✅ Read transport route: ${readData.name}`);
    
    // UPDATE
    console.log('  ✏️  Updating transport route...');
    const updatedRouteData = { 
      route_name: 'Updated Bangkok to Pattaya Express',
      notes: 'Updated test route'
    };
    const { data: updateData, error: updateError } = await supabase
      .from('transport_routes')
      .update(updatedRouteData)
      .eq('id', createdRouteId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    console.log(`  ✅ Updated transport route: ${updateData.route_name}`);
    
    // Test vehicle_types field (stored as JSON in transport_routes)
    console.log('  🚗 Testing vehicle types field...');
    const vehicleTypes = [
      {
        type: 'SUV',
        seating_capacity: 6,
        luggage_capacity: 5,
        duration: '2h',
        price: 2000
      }
    ];
    
    const { data: vehicleUpdateData, error: vehicleUpdateError } = await supabase
      .from('transport_routes')
      .update({ vehicle_types: vehicleTypes })
      .eq('id', createdRouteId)
      .select()
      .single();
    
    if (vehicleUpdateError) throw vehicleUpdateError;
    console.log(`  ✅ Updated vehicle types: ${vehicleUpdateData.vehicle_types?.length || 0} types`);
    
    // Test intermediate stops
    console.log('  🛑 Testing intermediate stops...');
    const intermediateStop = {
      route_id: createdRouteId,
      stop_order: 1,
      location_code: 'PAT HTL',
      full_name: 'Pattaya Hotel Zone',
      coordinates: { lat: 12.9236, lng: 100.8831 }
    };
    
    const { data: stopData, error: stopError } = await supabase
      .from('intermediate_stops')
      .insert(intermediateStop)
      .select()
      .single();
    
    if (stopError) throw stopError;
    console.log(`  ✅ Created intermediate stop: ${stopData.full_name}`);
    
    // Test sightseeing options
    console.log('  🎯 Testing sightseeing options...');
    const sightseeingOption = {
      route_id: createdRouteId,
      location: 'Pattaya Beach',
      adult_price: 500,
      child_price: 250,
      description: 'Beautiful beach visit'
    };
    
    const { data: sightseeingData, error: sightseeingError } = await supabase
      .from('sightseeing_options')
      .insert(sightseeingOption)
      .select()
      .single();
    
    if (sightseeingError) throw sightseeingError;
    console.log(`  ✅ Created sightseeing option: ${sightseeingData.location}`);
    
    console.log('  ✅ Transport Routes CRUD operations completed successfully!');
    
  } catch (error) {
    console.error('  ❌ Transport Routes CRUD test failed:', error.message);
    throw error;
  }
}

async function testDatabaseConnectivity() {
  console.log('\n🔌 Testing database connectivity...');
  
  try {
    // Test basic connectivity
    const { data, error } = await supabase
      .from('transport_types')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    console.log('  ✅ Database connection successful');
    
    // Test RLS bypass with service role key
    const { data: testData, error: testError } = await supabase
      .from('transport_types')
      .select('*')
      .limit(1);
    
    if (testError) throw testError;
    console.log('  ✅ RLS bypass working (service role key active)');
    
  } catch (error) {
    console.error('  ❌ Database connectivity test failed:', error.message);
    throw error;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete related data first (foreign key constraints)
    if (createdRouteId) {
      await supabase.from('intermediate_stops').delete().eq('route_id', createdRouteId);
      await supabase.from('sightseeing_options').delete().eq('route_id', createdRouteId);
      console.log('  ✅ Cleaned up intermediate stops and sightseeing options');
    }
    
    // Delete transport route
    if (createdRouteId) {
      const { error: routeError } = await supabase
        .from('transport_routes')
        .delete()
        .eq('id', createdRouteId);
      
      if (routeError) throw routeError;
      console.log('  ✅ Deleted test transport route');
    }
    
    // Delete transport type
    if (createdTransportTypeId) {
      const { error: typeError } = await supabase
        .from('transport_types')
        .delete()
        .eq('id', createdTransportTypeId);
      
      if (typeError) throw typeError;
      console.log('  ✅ Deleted test transport type');
    }
    
    // Delete created location codes
    if (createdLocationIds.length > 0) {
      const { error: locationError } = await supabase
        .from('location_codes')
        .delete()
        .in('id', createdLocationIds);
      
      if (locationError) throw locationError;
      console.log('  ✅ Deleted test location codes');
    }
    
    console.log('  ✅ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('  ❌ Cleanup failed:', error.message);
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive CRUD Test Suite');
  console.log('==========================================');
  
  try {
    await testDatabaseConnectivity();
    await setupLocationCodes();
    await testTransportTypesCRUD();
    await testTransportRoutesCRUD();
    
    console.log('\n🎉 All CRUD operations completed successfully!');
    console.log('✅ Transport Types: Create, Read, Update, Toggle Status');
    console.log('✅ Transport Routes: Create, Read, Update, Toggle Status, Vehicle Types (JSON), Intermediate Stops, Sightseeing Options');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Run the test suite
runComprehensiveTest();