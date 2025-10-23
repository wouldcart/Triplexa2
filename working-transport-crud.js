import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Working Transport CRUD Operations');
console.log('===================================');
console.log(`📍 URL: ${supabaseUrl}`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test data based on discovered schema
const testTransportType = {
  category: 'bus',
  name: 'Express Bus',
  seating_capacity: 45,
  luggage_capacity: 30,
  active: true
};

const testTransportRoute = {
  route_code: 'EXP001',
  route_name: 'Express Route to Downtown'
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
    console.log('   📝 Creating transport type...');
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
    console.log(`      Data:`, createData[0]);
    
    // READ
    console.log('   📖 Reading transport type...');
    const { data: readData, error: readError } = await supabase
      .from('transport_types')
      .select('*')
      .eq('id', createdIds.transportType)
      .single();
    
    if (readError) {
      console.log(`   ❌ Read failed: ${readError.message}`);
      return false;
    }
    
    console.log(`   ✅ Read successful:`, readData);
    
    // UPDATE
    console.log('   ✏️ Updating transport type...');
    const updateData = {
      name: 'Updated Express Bus',
      seating_capacity: 50
    };
    
    const { data: updatedData, error: updateError } = await supabase
      .from('transport_types')
      .update(updateData)
      .eq('id', createdIds.transportType)
      .select();
    
    if (updateError) {
      console.log(`   ❌ Update failed: ${updateError.message}`);
      return false;
    }
    
    console.log(`   ✅ Updated successfully:`, updatedData[0]);
    
    return true;
    
  } catch (err) {
    console.error(`   ❌ Exception in transport_types CRUD:`, err.message);
    return false;
  }
}

async function testTransportRoutesCRUD() {
  console.log('\n🚗 Testing transport_routes CRUD...');
  
  try {
    // CREATE
    console.log('   📝 Creating transport route...');
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
    console.log(`      Data:`, createData[0]);
    
    // READ
    console.log('   📖 Reading transport route...');
    const { data: readData, error: readError } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('id', createdIds.transportRoute)
      .single();
    
    if (readError) {
      console.log(`   ❌ Read failed: ${readError.message}`);
      return false;
    }
    
    console.log(`   ✅ Read successful:`, readData);
    
    // UPDATE
    console.log('   ✏️ Updating transport route...');
    const updateData = {
      route_name: 'Updated Express Route to Downtown and Back'
    };
    
    const { data: updatedData, error: updateError } = await supabase
      .from('transport_routes')
      .update(updateData)
      .eq('id', createdIds.transportRoute)
      .select();
    
    if (updateError) {
      console.log(`   ❌ Update failed: ${updateError.message}`);
      return false;
    }
    
    console.log(`   ✅ Updated successfully:`, updatedData[0]);
    
    return true;
    
  } catch (err) {
    console.error(`   ❌ Exception in transport_routes CRUD:`, err.message);
    return false;
  }
}

async function testIntermediateStopsCRUD() {
  console.log('\n🛑 Testing intermediate_stops CRUD...');
  
  if (!createdIds.transportRoute) {
    console.log('   ⚠️ No transport route available for testing');
    return false;
  }
  
  try {
    const testStop = {
      route_id: createdIds.transportRoute,
      stop_name: 'Central Station',
      stop_order: 1
    };
    
    // CREATE
    console.log('   📝 Creating intermediate stop...');
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
    console.log(`      Data:`, createData[0]);
    
    // READ
    console.log('   📖 Reading intermediate stop...');
    const { data: readData, error: readError } = await supabase
      .from('intermediate_stops')
      .select('*')
      .eq('id', createdIds.intermediateStop)
      .single();
    
    if (readError) {
      console.log(`   ❌ Read failed: ${readError.message}`);
      return false;
    }
    
    console.log(`   ✅ Read successful:`, readData);
    
    // UPDATE
    console.log('   ✏️ Updating intermediate stop...');
    const updateData = {
      stop_name: 'Updated Central Station',
      stop_order: 2
    };
    
    const { data: updatedData, error: updateError } = await supabase
      .from('intermediate_stops')
      .update(updateData)
      .eq('id', createdIds.intermediateStop)
      .select();
    
    if (updateError) {
      console.log(`   ❌ Update failed: ${updateError.message}`);
      return false;
    }
    
    console.log(`   ✅ Updated successfully:`, updatedData[0]);
    
    return true;
    
  } catch (err) {
    console.error(`   ❌ Exception in intermediate_stops CRUD:`, err.message);
    return false;
  }
}

async function testSightseeingOptionsCRUD() {
  console.log('\n🏛️ Testing sightseeing_options CRUD...');
  
  if (!createdIds.transportRoute) {
    console.log('   ⚠️ No transport route available for testing');
    return false;
  }
  
  try {
    const testOption = {
      route_id: createdIds.transportRoute,
      option_name: 'City Museum',
      description: 'Historical museum in the city center'
    };
    
    // CREATE
    console.log('   📝 Creating sightseeing option...');
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
    console.log(`      Data:`, createData[0]);
    
    // READ
    console.log('   📖 Reading sightseeing option...');
    const { data: readData, error: readError } = await supabase
      .from('sightseeing_options')
      .select('*')
      .eq('id', createdIds.sightseeingOption)
      .single();
    
    if (readError) {
      console.log(`   ❌ Read failed: ${readError.message}`);
      return false;
    }
    
    console.log(`   ✅ Read successful:`, readData);
    
    // UPDATE
    console.log('   ✏️ Updating sightseeing option...');
    const updateData = {
      option_name: 'Updated City Museum',
      description: 'Updated: Historical museum with new exhibits'
    };
    
    const { data: updatedData, error: updateError } = await supabase
      .from('sightseeing_options')
      .update(updateData)
      .eq('id', createdIds.sightseeingOption)
      .select();
    
    if (updateError) {
      console.log(`   ❌ Update failed: ${updateError.message}`);
      return false;
    }
    
    console.log(`   ✅ Updated successfully:`, updatedData[0]);
    
    return true;
    
  } catch (err) {
    console.error(`   ❌ Exception in sightseeing_options CRUD:`, err.message);
    return false;
  }
}

async function testRelationships() {
  console.log('\n🔗 Testing relationships and data integrity...');
  
  if (!createdIds.transportRoute) {
    console.log('   ⚠️ No transport route available for relationship testing');
    return false;
  }
  
  try {
    // Test reading route with related data
    console.log('   📖 Reading route with related stops and options...');
    
    const { data: stopsData, error: stopsError } = await supabase
      .from('intermediate_stops')
      .select('*')
      .eq('route_id', createdIds.transportRoute);
    
    if (stopsError) {
      console.log(`   ❌ Failed to read related stops: ${stopsError.message}`);
    } else {
      console.log(`   ✅ Found ${stopsData.length} related stops`);
    }
    
    const { data: optionsData, error: optionsError } = await supabase
      .from('sightseeing_options')
      .select('*')
      .eq('route_id', createdIds.transportRoute);
    
    if (optionsError) {
      console.log(`   ❌ Failed to read related options: ${optionsError.message}`);
    } else {
      console.log(`   ✅ Found ${optionsData.length} related sightseeing options`);
    }
    
    return true;
    
  } catch (err) {
    console.error(`   ❌ Exception in relationship testing:`, err.message);
    return false;
  }
}

async function testCascadeDelete() {
  console.log('\n🗑️ Testing cascade delete...');
  
  if (!createdIds.transportRoute) {
    console.log('   ⚠️ No transport route available for cascade delete testing');
    return false;
  }
  
  try {
    // Delete the transport route and see if related data is cleaned up
    console.log('   🗑️ Deleting transport route...');
    const { error: deleteError } = await supabase
      .from('transport_routes')
      .delete()
      .eq('id', createdIds.transportRoute);
    
    if (deleteError) {
      console.log(`   ❌ Delete failed: ${deleteError.message}`);
      return false;
    }
    
    console.log('   ✅ Transport route deleted');
    
    // Check if related data still exists
    console.log('   🔍 Checking if related data was cleaned up...');
    
    const { data: remainingStops, error: stopsError } = await supabase
      .from('intermediate_stops')
      .select('*')
      .eq('route_id', createdIds.transportRoute);
    
    if (stopsError) {
      console.log(`   ❌ Error checking stops: ${stopsError.message}`);
    } else {
      console.log(`   📊 Remaining stops: ${remainingStops.length}`);
    }
    
    const { data: remainingOptions, error: optionsError } = await supabase
      .from('sightseeing_options')
      .select('*')
      .eq('route_id', createdIds.transportRoute);
    
    if (optionsError) {
      console.log(`   ❌ Error checking options: ${optionsError.message}`);
    } else {
      console.log(`   📊 Remaining options: ${remainingOptions.length}`);
    }
    
    return true;
    
  } catch (err) {
    console.error(`   ❌ Exception in cascade delete testing:`, err.message);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Clean up in reverse order of dependencies
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
    transportTypes: false,
    transportRoutes: false,
    intermediateStops: false,
    sightseeingOptions: false,
    relationships: false,
    cascadeDelete: false
  };
  
  // Run all tests
  results.transportTypes = await testTransportTypesCRUD();
  results.transportRoutes = await testTransportRoutesCRUD();
  results.intermediateStops = await testIntermediateStopsCRUD();
  results.sightseeingOptions = await testSightseeingOptionsCRUD();
  results.relationships = await testRelationships();
  results.cascadeDelete = await testCascadeDelete();
  
  // Clean up remaining data
  await cleanup();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All transport tables are working correctly!');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
}

// Run the script
main().catch(console.error);