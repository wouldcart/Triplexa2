import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function testColumnStructure() {
  console.log('🧪 Testing actual column structure by attempting inserts...\n');

  // Test transport_types table structure
  console.log('📋 Testing transport_types table:');
  try {
    const testTransportType = {
      type: 'Test Bus',
      seating_capacity: 50,
      luggage_capacity: 100,
      duration: '2 hours',
      price: 25.00,
      notes: 'Test transport type'
    };

    const { data, error } = await supabase
      .from('transport_types')
      .insert(testTransportType)
      .select();

    if (error) {
      console.log(`   ❌ Insert error: ${error.message}`);
      console.log(`   💡 This reveals the expected column structure`);
    } else {
      console.log(`   ✅ Insert successful - columns exist as expected`);
      console.log(`   📄 Inserted data:`, data);
      
      // Clean up
      if (data && data[0]) {
        await supabase
          .from('transport_types')
          .delete()
          .eq('id', data[0].id);
        console.log(`   🧹 Cleaned up test data`);
      }
    }
  } catch (err) {
    console.log(`   💥 Unexpected error: ${err.message}`);
  }

  console.log('');

  // Test intermediate_stops table structure
  console.log('📋 Testing intermediate_stops table:');
  try {
    const testStop = {
      stop_order: 1,
      location_code: 'TEST-LOC',
      full_name: 'Test Location',
      coordinates: { lat: 0, lng: 0 }
    };

    const { data, error } = await supabase
      .from('intermediate_stops')
      .insert(testStop)
      .select();

    if (error) {
      console.log(`   ❌ Insert error: ${error.message}`);
      console.log(`   💡 This reveals the expected column structure`);
    } else {
      console.log(`   ✅ Insert successful - columns exist as expected`);
      console.log(`   📄 Inserted data:`, data);
      
      // Clean up
      if (data && data[0]) {
        await supabase
          .from('intermediate_stops')
          .delete()
          .eq('id', data[0].id);
        console.log(`   🧹 Cleaned up test data`);
      }
    }
  } catch (err) {
    console.log(`   💥 Unexpected error: ${err.message}`);
  }

  console.log('');

  // Test transport_routes table structure
  console.log('📋 Testing transport_routes table:');
  try {
    const testRoute = {
      route_code: 'TEST-001',
      route_name: 'Test Route',
      country: 'Test Country',
      transfer_type: 'One-Way',
      start_location: 'TEST-START',
      start_location_full_name: 'Test Start Location',
      end_location: 'TEST-END',
      end_location_full_name: 'Test End Location',
      status: 'active'
    };

    const { data, error } = await supabase
      .from('transport_routes')
      .insert(testRoute)
      .select();

    if (error) {
      console.log(`   ❌ Insert error: ${error.message}`);
      console.log(`   💡 This reveals the expected column structure`);
    } else {
      console.log(`   ✅ Insert successful - columns exist as expected`);
      console.log(`   📄 Inserted data:`, data);
      
      // Clean up
      if (data && data[0]) {
        await supabase
          .from('transport_routes')
          .delete()
          .eq('id', data[0].id);
        console.log(`   🧹 Cleaned up test data`);
      }
    }
  } catch (err) {
    console.log(`   💥 Unexpected error: ${err.message}`);
  }

  console.log('');

  // Test location_codes table structure
  console.log('📋 Testing location_codes table:');
  try {
    const testLocation = {
      code: 'TEST-LOC',
      name: 'Test Location',
      type: 'city',
      country: 'Test Country'
    };

    const { data, error } = await supabase
      .from('location_codes')
      .insert(testLocation)
      .select();

    if (error) {
      console.log(`   ❌ Insert error: ${error.message}`);
      console.log(`   💡 This reveals the expected column structure`);
    } else {
      console.log(`   ✅ Insert successful - columns exist as expected`);
      console.log(`   📄 Inserted data:`, data);
      
      // Clean up
      if (data && data[0]) {
        await supabase
          .from('location_codes')
          .delete()
          .eq('id', data[0].id);
        console.log(`   🧹 Cleaned up test data`);
      }
    }
  } catch (err) {
    console.log(`   💥 Unexpected error: ${err.message}`);
  }

  console.log('\n🎯 Column structure testing completed!');
}

testColumnStructure().catch(console.error);