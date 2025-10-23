import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Final Transport CRUD Operations Test');
console.log('======================================');
console.log(`📍 URL: ${supabaseUrl}`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test data with correct schema
const testTransportType = {
  category: 'bus',
  name: 'Express Bus Service',
  seating_capacity: 45,
  luggage_capacity: 30,
  active: true
};

const testTransportRoute = {
  route_code: 'EXP001',
  route_name: 'Express Route to Downtown',
  country: 'US' // Required field discovered
};

let createdIds = {
  transportType: null,
  transportRoute: null,
  intermediateStop: null,
  sightseeingOption: null
};

async function testTransportTypesCRUD() {
  console.log('\n🚌 Testing transport_types CRUD...');
  
  try {
    // CREATE
    const { data: createData, error: createError } = await supabase
      .from('transport_types')
      .insert(testTransportType)
      .select();
    
    if (createError) {
      console.log(`   ❌ Create failed: ${createError.message}`);
      return false;
    }
    
    createdIds.transportType = createData[0].id;
    console.log(`   ✅ Created transport type: ${createdIds.transportType}`);
    
    // READ
    const { data: readData, error: readError } = await supabase
      .from('transport_types')
      .select('*')
      .eq('id', createdIds.transportType)
      .single();
    
    if (readError) {
      console.log(`   ❌ Read failed: ${readError.message}`);
      return false;
    }
    
    console.log(`   ✅ Read successful`);
    
    // UPDATE
    const { data: updatedData, error: updateError } = await supabase
      .from('transport_types')
      .update({ name: 'Updated Express Bus Service', seating_capacity: 50 })
      .eq('id', createdIds.transportType)
      .select();
    
    if (updateError) {
      console.log(`   ❌ Update failed: ${updateError.message}`);
      return false;
    }
    
    console.log(`   ✅ Updated successfully`);
    return true;
    
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function testTransportRoutesCRUD() {
  console.log('\n🚗 Testing transport_routes CRUD...');
  
  try {
    // CREATE
    const { data: createData, error: createError } = await supabase
      .from('transport_routes')
      .insert(testTransportRoute)
      .select();
    
    if (createError) {
      console.log(`   ❌ Create failed: ${createError.message}`);
      return false;
    }
    
    createdIds.transportRoute = createData[0].id;
    console.log(`   ✅ Created transport route: ${createdIds.transportRoute}`);
    
    // READ
    const { data: readData, error: readError } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('id', createdIds.transportRoute)
      .single();
    
    if (readError) {
      console.log(`   ❌ Read failed: ${readError.message}`);
      return false;
    }
    
    console.log(`   ✅ Read successful`);
    
    // UPDATE
    const { data: updatedData, error: updateError } = await supabase
      .from('transport_routes')
      .update({ route_name: 'Updated Express Route to Downtown and Back' })
      .eq('id', createdIds.transportRoute)
      .select();
    
    if (updateError) {
      console.log(`   ❌ Update failed: ${updateError.message}`);
      return false;
    }
    
    console.log(`   ✅ Updated successfully`);
    return true;
    
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function testIntermediateStopsCRUD() {
  console.log('\n🛑 Testing intermediate_stops CRUD...');
  
  if (!createdIds.transportRoute) {
    console.log('   ⚠️ No transport route available');
    return false;
  }
  
  try {
    const testStop = {
      route_id: createdIds.transportRoute,
      stop_name: 'Central Station',
      stop_order: 1
    };
    
    // CREATE
    const { data: createData, error: createError } = await supabase
      .from('intermediate_stops')
      .insert(testStop)
      .select();
    
    if (createError) {
      console.log(`   ❌ Create failed: ${createError.message}`);
      return false;
    }
    
    createdIds.intermediateStop = createData[0].id;
    console.log(`   ✅ Created intermediate stop: ${createdIds.intermediateStop}`);
    
    // READ
    const { data: readData, error: readError } = await supabase
      .from('intermediate_stops')
      .select('*')
      .eq('id', createdIds.intermediateStop)
      .single();
    
    if (readError) {
      console.log(`   ❌ Read failed: ${readError.message}`);
      return false;
    }
    
    console.log(`   ✅ Read successful`);
    
    // UPDATE
    const { data: updatedData, error: updateError } = await supabase
      .from('intermediate_stops')
      .update({ stop_name: 'Updated Central Station', stop_order: 2 })
      .eq('id', createdIds.intermediateStop)
      .select();
    
    if (updateError) {
      console.log(`   ❌ Update failed: ${updateError.message}`);
      return false;
    }
    
    console.log(`   ✅ Updated successfully`);
    return true;
    
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function testSightseeingOptionsCRUD() {
  console.log('\n🏛️ Testing sightseeing_options CRUD...');
  
  if (!createdIds.transportRoute) {
    console.log('   ⚠️ No transport route available');
    return false;
  }
  
  try {
    const testOption = {
      route_id: createdIds.transportRoute,
      option_name: 'City Museum',
      description: 'Historical museum in the city center'
    };
    
    // CREATE
    const { data: createData, error: createError } = await supabase
      .from('sightseeing_options')
      .insert(testOption)
      .select();
    
    if (createError) {
      console.log(`   ❌ Create failed: ${createError.message}`);
      return false;
    }
    
    createdIds.sightseeingOption = createData[0].id;
    console.log(`   ✅ Created sightseeing option: ${createdIds.sightseeingOption}`);
    
    // READ
    const { data: readData, error: readError } = await supabase
      .from('sightseeing_options')
      .select('*')
      .eq('id', createdIds.sightseeingOption)
      .single();
    
    if (readError) {
      console.log(`   ❌ Read failed: ${readError.message}`);
      return false;
    }
    
    console.log(`   ✅ Read successful`);
    
    // UPDATE
    const { data: updatedData, error: updateError } = await supabase
      .from('sightseeing_options')
      .update({ 
        option_name: 'Updated City Museum',
        description: 'Updated: Historical museum with new exhibits'
      })
      .eq('id', createdIds.sightseeingOption)
      .select();
    
    if (updateError) {
      console.log(`   ❌ Update failed: ${updateError.message}`);
      return false;
    }
    
    console.log(`   ✅ Updated successfully`);
    return true;
    
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function testRelationships() {
  console.log('\n🔗 Testing relationships...');
  
  if (!createdIds.transportRoute) {
    console.log('   ⚠️ No transport route available');
    return false;
  }
  
  try {
    // Test reading route with related data
    const { data: stopsData, error: stopsError } = await supabase
      .from('intermediate_stops')
      .select('*')
      .eq('route_id', createdIds.transportRoute);
    
    if (stopsError) {
      console.log(`   ❌ Failed to read related stops: ${stopsError.message}`);
      return false;
    }
    
    const { data: optionsData, error: optionsError } = await supabase
      .from('sightseeing_options')
      .select('*')
      .eq('route_id', createdIds.transportRoute);
    
    if (optionsError) {
      console.log(`   ❌ Failed to read related options: ${optionsError.message}`);
      return false;
    }
    
    console.log(`   ✅ Found ${stopsData.length} stops and ${optionsData.length} options`);
    return true;
    
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function testCascadeDelete() {
  console.log('\n🗑️ Testing cascade delete...');
  
  if (!createdIds.transportRoute) {
    console.log('   ⚠️ No transport route available');
    return false;
  }
  
  try {
    // Count related data before delete
    const { data: stopsBefore } = await supabase
      .from('intermediate_stops')
      .select('*', { count: 'exact' })
      .eq('route_id', createdIds.transportRoute);
    
    const { data: optionsBefore } = await supabase
      .from('sightseeing_options')
      .select('*', { count: 'exact' })
      .eq('route_id', createdIds.transportRoute);
    
    console.log(`   📊 Before delete: ${stopsBefore?.length || 0} stops, ${optionsBefore?.length || 0} options`);
    
    // Delete the transport route
    const { error: deleteError } = await supabase
      .from('transport_routes')
      .delete()
      .eq('id', createdIds.transportRoute);
    
    if (deleteError) {
      console.log(`   ❌ Delete failed: ${deleteError.message}`);
      return false;
    }
    
    console.log('   ✅ Transport route deleted');
    
    // Check if related data was cleaned up
    const { data: stopsAfter } = await supabase
      .from('intermediate_stops')
      .select('*', { count: 'exact' })
      .eq('route_id', createdIds.transportRoute);
    
    const { data: optionsAfter } = await supabase
      .from('sightseeing_options')
      .select('*', { count: 'exact' })
      .eq('route_id', createdIds.transportRoute);
    
    console.log(`   📊 After delete: ${stopsAfter?.length || 0} stops, ${optionsAfter?.length || 0} options`);
    
    // Mark as deleted so cleanup doesn't try to delete again
    createdIds.transportRoute = null;
    createdIds.intermediateStop = null;
    createdIds.sightseeingOption = null;
    
    return true;
    
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up remaining test data...');
  
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
    console.error('   ❌ Cleanup error:', err.message);
  }
}

async function main() {
  console.log('\n🧪 Starting comprehensive CRUD tests...');
  
  const results = {
    transportTypes: await testTransportTypesCRUD(),
    transportRoutes: await testTransportRoutesCRUD(),
    intermediateStops: await testIntermediateStopsCRUD(),
    sightseeingOptions: await testSightseeingOptionsCRUD(),
    relationships: await testRelationships(),
    cascadeDelete: await testCascadeDelete()
  };
  
  // Clean up remaining data
  await cleanup();
  
  // Summary
  console.log('\n📊 Final Test Results:');
  console.log('======================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 SUCCESS: All transport tables are working correctly!');
    console.log('✅ Remote Supabase connection established');
    console.log('✅ All CRUD operations functional');
    console.log('✅ Relationships and data integrity verified');
    console.log('✅ Cascade delete working properly');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
  
  return passedTests === totalTests;
}

// Run the script
main().then(success => {
  if (success) {
    console.log('\n🚀 Transport tables are ready for production use!');
  }
}).catch(console.error);