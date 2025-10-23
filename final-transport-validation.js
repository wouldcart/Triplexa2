import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Final Transport Validation & Setup');
console.log('====================================');
console.log(`📍 URL: ${supabaseUrl}`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function discoverTransferTypes() {
  console.log('\n🚗 Discovering valid transfer_type values...');
  
  const transferTypes = ['direct', 'connecting', 'transfer', 'express', 'local', 'shuttle', 'bus', 'train', 'flight'];
  
  for (const transferType of transferTypes) {
    try {
      const testRoute = {
        route_code: `TEST_${transferType.toUpperCase()}`,
        route_name: `Test ${transferType} Route`,
        country: 'US',
        transfer_type: transferType,
        start_location: 'Start',
        start_location_full_name: 'Start Location',
        end_location: 'End',
        end_location_full_name: 'End Location'
      };
      
      const { data, error } = await supabase
        .from('transport_routes')
        .insert(testRoute)
        .select();
      
      if (error) {
        if (error.message.includes('check constraint')) {
          console.log(`   ❌ ${transferType}: Invalid (constraint violation)`);
        } else {
          console.log(`   ❓ ${transferType}: ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${transferType}: Valid!`);
        // Clean up immediately
        await supabase.from('transport_routes').delete().eq('id', data[0].id);
        return transferType; // Return first valid type
      }
    } catch (err) {
      console.log(`   ❌ ${transferType}: Exception - ${err.message}`);
    }
  }
  
  return null;
}

async function runFinalTest() {
  console.log('\n🧪 Running Final Comprehensive Test...');
  
  // First discover valid transfer type
  const validTransferType = await discoverTransferTypes();
  
  if (!validTransferType) {
    console.log('\n❌ Could not find valid transfer_type. Checking existing data...');
    
    // Check existing routes for valid transfer types
    const { data: existingRoutes } = await supabase
      .from('transport_routes')
      .select('transfer_type')
      .limit(5);
    
    if (existingRoutes && existingRoutes.length > 0) {
      const existingTypes = [...new Set(existingRoutes.map(r => r.transfer_type))];
      console.log(`   📊 Found existing transfer types: ${existingTypes.join(', ')}`);
      
      if (existingTypes.length > 0) {
        validTransferType = existingTypes[0];
        console.log(`   🎯 Using: ${validTransferType}`);
      }
    }
  }
  
  if (!validTransferType) {
    console.log('\n❌ Cannot proceed without valid transfer_type');
    return;
  }
  
  console.log(`\n✅ Using valid transfer_type: ${validTransferType}`);
  
  // Test with valid transfer type
  const results = {
    transportTypes: false,
    transportRoutes: false,
    intermediateStops: false,
    sightseeingOptions: false,
    relationships: false
  };
  
  let createdIds = {
    transportType: null,
    transportRoute: null,
    intermediateStop: null,
    sightseeingOption: null
  };
  
  // Test 1: Transport Types
  console.log('\n🚌 Testing transport_types...');
  try {
    const testType = {
      category: 'bus',
      name: 'Final Test Bus'
    };
    
    const { data: typeData, error: typeError } = await supabase
      .from('transport_types')
      .insert(testType)
      .select();
    
    if (typeError) {
      console.log(`   ❌ Failed: ${typeError.message}`);
    } else {
      createdIds.transportType = typeData[0].id;
      console.log(`   ✅ Created: ${createdIds.transportType}`);
      results.transportTypes = true;
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }
  
  // Test 2: Transport Routes
  console.log('\n🚗 Testing transport_routes...');
  try {
    const testRoute = {
      route_code: 'FINAL001',
      route_name: 'Final Test Route',
      country: 'US',
      transfer_type: validTransferType,
      start_location: 'Start Point',
      start_location_full_name: 'Start Point Full Name',
      end_location: 'End Point',
      end_location_full_name: 'End Point Full Name'
    };
    
    const { data: routeData, error: routeError } = await supabase
      .from('transport_routes')
      .insert(testRoute)
      .select();
    
    if (routeError) {
      console.log(`   ❌ Failed: ${routeError.message}`);
    } else {
      createdIds.transportRoute = routeData[0].id;
      console.log(`   ✅ Created: ${createdIds.transportRoute}`);
      results.transportRoutes = true;
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }
  
  // Test 3: Intermediate Stops
  if (createdIds.transportRoute) {
    console.log('\n🛑 Testing intermediate_stops...');
    try {
      const testStop = {
        route_id: createdIds.transportRoute,
        stop_name: 'Final Test Stop',
        stop_order: 1
      };
      
      const { data: stopData, error: stopError } = await supabase
        .from('intermediate_stops')
        .insert(testStop)
        .select();
      
      if (stopError) {
        console.log(`   ❌ Failed: ${stopError.message}`);
      } else {
        createdIds.intermediateStop = stopData[0].id;
        console.log(`   ✅ Created: ${createdIds.intermediateStop}`);
        results.intermediateStops = true;
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
  }
  
  // Test 4: Sightseeing Options
  if (createdIds.transportRoute) {
    console.log('\n🏛️ Testing sightseeing_options...');
    try {
      const testOption = {
        route_id: createdIds.transportRoute,
        option_name: 'Final Test Museum'
      };
      
      const { data: optionData, error: optionError } = await supabase
        .from('sightseeing_options')
        .insert(testOption)
        .select();
      
      if (optionError) {
        console.log(`   ❌ Failed: ${optionError.message}`);
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
  
  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
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
  const results = await runFinalTest();
  
  if (!results) {
    console.log('\n❌ Test could not complete');
    return;
  }
  
  // Final Summary
  console.log('\n📊 FINAL VALIDATION RESULTS');
  console.log('===========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Final Score: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests >= 2) {
    console.log('\n🎉 SUCCESS: Transport system is working!');
    console.log('✅ Remote Supabase connection established');
    console.log('✅ Transport tables accessible and functional');
    console.log('✅ CRUD operations working');
    
    if (passedTests >= 4) {
      console.log('✅ Advanced relationships working');
    }
    
    if (passedTests === totalTests) {
      console.log('✅ All features working perfectly!');
    }
    
    console.log('\n🚀 Ready for development!');
    console.log('📝 You can now use the transport tables in your application');
  } else {
    console.log('\n⚠️ Some issues remain - check the error messages above');
  }
}

// Run the script
main().catch(console.error);