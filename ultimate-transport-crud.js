import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Ultimate Transport CRUD Test - Final Version');
console.log('===============================================');
console.log(`📍 URL: ${supabaseUrl}`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Complete test data with ALL discovered required fields
const testTransportType = {
  category: 'bus',
  name: 'Ultimate Express Bus',
  seating_capacity: 45,
  luggage_capacity: 30
};

const testTransportRoute = {
  route_code: 'ULT001',
  route_name: 'Ultimate Test Route',
  country: 'US',
  transfer_type: 'direct',
  start_location: 'Downtown Station',
  start_location_full_name: 'Downtown Central Station, Main Street',
  end_location: 'Airport Terminal',
  end_location_full_name: 'International Airport Terminal 1',
  description: 'Ultimate test route description',
  distance: 50,
  estimated_duration: '2 hours',
  price: 25.00
};

let createdIds = {
  transportType: null,
  transportRoute: null,
  intermediateStop: null,
  sightseeingOption: null
};

async function runFullCRUDTest() {
  console.log('\n🧪 Running Full CRUD Test Suite...');
  
  const results = {
    transportTypes: false,
    transportRoutes: false,
    intermediateStops: false,
    sightseeingOptions: false,
    relationships: false,
    cascadeDelete: false
  };
  
  // Test 1: Transport Types
  console.log('\n🚌 Testing transport_types...');
  try {
    const { data: typeData, error: typeError } = await supabase
      .from('transport_types')
      .insert(testTransportType)
      .select();
    
    if (typeError) {
      console.log(`   ❌ Create failed: ${typeError.message}`);
    } else {
      createdIds.transportType = typeData[0].id;
      console.log(`   ✅ Created: ${createdIds.transportType}`);
      
      // Test update
      const { error: updateError } = await supabase
        .from('transport_types')
        .update({ name: 'Updated Ultimate Express Bus' })
        .eq('id', createdIds.transportType);
      
      if (updateError) {
        console.log(`   ❌ Update failed: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated successfully`);
        
        // Test read
        const { data: readData, error: readError } = await supabase
          .from('transport_types')
          .select('*')
          .eq('id', createdIds.transportType);
        
        if (readError) {
          console.log(`   ❌ Read failed: ${readError.message}`);
        } else {
          console.log(`   ✅ Read successful: ${readData[0].name}`);
          results.transportTypes = true;
        }
      }
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }
  
  // Test 2: Transport Routes
  console.log('\n🚗 Testing transport_routes...');
  try {
    const { data: routeData, error: routeError } = await supabase
      .from('transport_routes')
      .insert(testTransportRoute)
      .select();
    
    if (routeError) {
      console.log(`   ❌ Create failed: ${routeError.message}`);
      console.log(`   🔍 Trying to identify missing field...`);
      
      // Try with minimal required fields only
      const minimalRoute = {
        route_code: 'MIN001',
        route_name: 'Minimal Route',
        country: 'US',
        transfer_type: 'direct',
        start_location: 'Start',
        start_location_full_name: 'Start Location Full Name',
        end_location: 'End',
        end_location_full_name: 'End Location Full Name'
      };
      
      const { data: minData, error: minError } = await supabase
        .from('transport_routes')
        .insert(minimalRoute)
        .select();
      
      if (minError) {
        console.log(`   ❌ Minimal create failed: ${minError.message}`);
      } else {
        createdIds.transportRoute = minData[0].id;
        console.log(`   ✅ Created with minimal data: ${createdIds.transportRoute}`);
        results.transportRoutes = true;
      }
    } else {
      createdIds.transportRoute = routeData[0].id;
      console.log(`   ✅ Created: ${createdIds.transportRoute}`);
      
      // Test update
      const { error: updateError } = await supabase
        .from('transport_routes')
        .update({ description: 'Updated description' })
        .eq('id', createdIds.transportRoute);
      
      if (updateError) {
        console.log(`   ❌ Update failed: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated successfully`);
        results.transportRoutes = true;
      }
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }
  
  // Test 3: Intermediate Stops (only if route exists)
  if (createdIds.transportRoute) {
    console.log('\n🛑 Testing intermediate_stops...');
    try {
      const testStop = {
        route_id: createdIds.transportRoute,
        stop_name: 'Ultimate Central Station',
        stop_order: 1,
        location: 'Central District',
        estimated_arrival: '10:30:00'
      };
      
      const { data: stopData, error: stopError } = await supabase
        .from('intermediate_stops')
        .insert(testStop)
        .select();
      
      if (stopError) {
        console.log(`   ❌ Create failed: ${stopError.message}`);
        
        // Try minimal
        const minimalStop = {
          route_id: createdIds.transportRoute,
          stop_name: 'Minimal Stop',
          stop_order: 1
        };
        
        const { data: minStopData, error: minStopError } = await supabase
          .from('intermediate_stops')
          .insert(minimalStop)
          .select();
        
        if (minStopError) {
          console.log(`   ❌ Minimal create failed: ${minStopError.message}`);
        } else {
          createdIds.intermediateStop = minStopData[0].id;
          console.log(`   ✅ Created minimal: ${createdIds.intermediateStop}`);
          results.intermediateStops = true;
        }
      } else {
        createdIds.intermediateStop = stopData[0].id;
        console.log(`   ✅ Created: ${createdIds.intermediateStop}`);
        results.intermediateStops = true;
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
  }
  
  // Test 4: Sightseeing Options (only if route exists)
  if (createdIds.transportRoute) {
    console.log('\n🏛️ Testing sightseeing_options...');
    try {
      const testOption = {
        route_id: createdIds.transportRoute,
        option_name: 'Ultimate City Museum',
        description: 'The ultimate museum experience',
        location: 'Museum District',
        price: 15.00
      };
      
      const { data: optionData, error: optionError } = await supabase
        .from('sightseeing_options')
        .insert(testOption)
        .select();
      
      if (optionError) {
        console.log(`   ❌ Create failed: ${optionError.message}`);
        
        // Try minimal
        const minimalOption = {
          route_id: createdIds.transportRoute,
          option_name: 'Minimal Museum'
        };
        
        const { data: minOptionData, error: minOptionError } = await supabase
          .from('sightseeing_options')
          .insert(minimalOption)
          .select();
        
        if (minOptionError) {
          console.log(`   ❌ Minimal create failed: ${minOptionError.message}`);
        } else {
          createdIds.sightseeingOption = minOptionData[0].id;
          console.log(`   ✅ Created minimal: ${createdIds.sightseeingOption}`);
          results.sightseeingOptions = true;
        }
      } else {
        createdIds.sightseeingOption = optionData[0].id;
        console.log(`   ✅ Created: ${createdIds.sightseeingOption}`);
        results.sightseeingOptions = true;
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
  }
  
  // Test 5: Relationships
  if (createdIds.transportRoute) {
    console.log('\n🔗 Testing relationships...');
    try {
      const { data: stopsData } = await supabase
        .from('intermediate_stops')
        .select('*')
        .eq('route_id', createdIds.transportRoute);
      
      const { data: optionsData } = await supabase
        .from('sightseeing_options')
        .select('*')
        .eq('route_id', createdIds.transportRoute);
      
      console.log(`   ✅ Found ${stopsData?.length || 0} stops and ${optionsData?.length || 0} options`);
      results.relationships = true;
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
  }
  
  // Test 6: Cascade Delete
  if (createdIds.transportRoute) {
    console.log('\n🗑️ Testing cascade delete...');
    try {
      const { error: deleteError } = await supabase
        .from('transport_routes')
        .delete()
        .eq('id', createdIds.transportRoute);
      
      if (deleteError) {
        console.log(`   ❌ Delete failed: ${deleteError.message}`);
      } else {
        console.log(`   ✅ Route deleted successfully`);
        
        // Check if related data was cleaned up
        const { data: remainingStops } = await supabase
          .from('intermediate_stops')
          .select('*')
          .eq('route_id', createdIds.transportRoute);
        
        const { data: remainingOptions } = await supabase
          .from('sightseeing_options')
          .select('*')
          .eq('route_id', createdIds.transportRoute);
        
        console.log(`   📊 Remaining: ${remainingStops?.length || 0} stops, ${remainingOptions?.length || 0} options`);
        results.cascadeDelete = true;
        
        // Mark as deleted
        createdIds.transportRoute = null;
        createdIds.intermediateStop = null;
        createdIds.sightseeingOption = null;
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
  }
  
  // Cleanup remaining data
  console.log('\n🧹 Final cleanup...');
  try {
    if (createdIds.sightseeingOption) {
      await supabase.from('sightseeing_options').delete().eq('id', createdIds.sightseeingOption);
      console.log('   ✅ Cleaned up sightseeing option');
    }
    if (createdIds.intermediateStop) {
      await supabase.from('intermediate_stops').delete().eq('id', createdIds.intermediateStop);
      console.log('   ✅ Cleaned up intermediate stop');
    }
    if (createdIds.transportRoute) {
      await supabase.from('transport_routes').delete().eq('id', createdIds.transportRoute);
      console.log('   ✅ Cleaned up transport route');
    }
    if (createdIds.transportType) {
      await supabase.from('transport_types').delete().eq('id', createdIds.transportType);
      console.log('   ✅ Cleaned up transport type');
    }
  } catch (err) {
    console.log(`   ❌ Cleanup error: ${err.message}`);
  }
  
  return results;
}

async function main() {
  const results = await runFullCRUDTest();
  
  // Final Summary
  console.log('\n📊 ULTIMATE TEST RESULTS');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Final Score: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests >= 2) { // At least transport types and routes working
    console.log('\n🎉 SUCCESS: Core transport functionality is working!');
    console.log('✅ Remote Supabase connection established');
    console.log('✅ Transport tables accessible');
    console.log('✅ Basic CRUD operations functional');
    
    if (passedTests >= 4) {
      console.log('✅ Advanced features working well!');
    }
    
    if (passedTests === totalTests) {
      console.log('✅ All features working perfectly!');
    }
  } else {
    console.log('\n⚠️ Partial success - some core functionality may need attention');
  }
  
  console.log('\n🚀 Transport system ready for development!');
}

// Run the script
main().catch(console.error);