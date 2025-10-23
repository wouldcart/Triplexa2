import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabasePublishableKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const supabaseRegular = createClient(supabaseUrl, supabasePublishableKey);

console.log('🧪 Starting comprehensive CRUD operations test...\n');

async function testLocationCodesCRUD() {
  console.log('📍 Testing Location Codes CRUD operations...');
  
  // CREATE
  const testLocationCode = {
    code: 'TEST001',
    full_name: 'Test Location',
    category: 'airport',
    country: 'Test Country',
    city: 'Test City',
    status: 'active',
    notes: 'Test location for CRUD operations',
    latitude: 40.7128,
    longitude: -74.0060
  };
  
  const { data: createData, error: createError } = await supabase
    .from('location_codes')
    .insert(testLocationCode)
    .select()
    .single();
    
  if (createError) {
    console.log('❌ CREATE failed:', createError.message);
    return false;
  }
  console.log('✅ CREATE successful:', createData.code);
  
  // READ
  const { data: readData, error: readError } = await supabase
    .from('location_codes')
    .select('*')
    .eq('code', 'TEST001')
    .single();
    
  if (readError) {
    console.log('❌ READ failed:', readError.message);
    return false;
  }
  console.log('✅ READ successful:', readData.full_name);
  
  // UPDATE
  const { data: updateData, error: updateError } = await supabase
    .from('location_codes')
    .update({ full_name: 'Updated Test Location' })
    .eq('code', 'TEST001')
    .select()
    .single();
    
  if (updateError) {
    console.log('❌ UPDATE failed:', updateError.message);
    return false;
  }
  console.log('✅ UPDATE successful:', updateData.full_name);
  
  // DELETE
  const { error: deleteError } = await supabase
    .from('location_codes')
    .delete()
    .eq('code', 'TEST001');
    
  if (deleteError) {
    console.log('❌ DELETE failed:', deleteError.message);
    return false;
  }
  console.log('✅ DELETE successful\n');
  
  return true;
}

async function testTransportTypesCRUD() {
  console.log('🚗 Testing Transport Types CRUD operations...');
  
  // CREATE - using actual schema: name, category, seating_capacity, luggage_capacity
  const testTransportType = {
    name: 'Test Vehicle',
    category: 'bus',
    seating_capacity: 50,
    luggage_capacity: 100,
    active: true
  };
  
  const { data: createData, error: createError } = await supabase
    .from('transport_types')
    .insert(testTransportType)
    .select()
    .single();
    
  if (createError) {
    console.log('❌ CREATE failed:', createError.message);
    return false;
  }
  console.log('✅ CREATE successful:', createData.name);
  
  // READ
  const { data: readData, error: readError } = await supabase
    .from('transport_types')
    .select('*')
    .eq('id', createData.id)
    .single();
    
  if (readError) {
    console.log('❌ READ failed:', readError.message);
    return false;
  }
  console.log('✅ READ successful:', readData.name);
  
  // UPDATE
  const { data: updateData, error: updateError } = await supabase
    .from('transport_types')
    .update({ seating_capacity: 60 })
    .eq('id', createData.id)
    .select()
    .single();
    
  if (updateError) {
    console.log('❌ UPDATE failed:', updateError.message);
    return false;
  }
  console.log('✅ UPDATE successful: seating capacity', updateData.seating_capacity);
  
  // DELETE
  const { error: deleteError } = await supabase
    .from('transport_types')
    .delete()
    .eq('id', createData.id);
    
  if (deleteError) {
    console.log('❌ DELETE failed:', deleteError.message);
    return false;
  }
  console.log('✅ DELETE successful\n');
  
  return true;
}

async function testTransportRoutesCRUD() {
  console.log('🛣️ Testing Transport Routes CRUD operations...');
  
  // CREATE
  const testTransportRoute = {
    country: 'Test Country',
    route_name: 'Test Route',
    route_code: 'TEST-ROUTE-001',
    transfer_type: 'One-Way',
    start_location: 'TEST_START',
    end_location: 'TEST_END',
    start_location_full_name: 'Test Start Location',
    end_location_full_name: 'Test End Location',
    status: 'active'
  };
  
  const { data: createData, error: createError } = await supabase
    .from('transport_routes')
    .insert(testTransportRoute)
    .select()
    .single();
    
  if (createError) {
    console.log('❌ CREATE failed:', createError.message);
    return false;
  }
  console.log('✅ CREATE successful:', createData.route_code);
  
  // READ
  const { data: readData, error: readError } = await supabase
    .from('transport_routes')
    .select('*')
    .eq('route_code', 'TEST-ROUTE-001')
    .single();
    
  if (readError) {
    console.log('❌ READ failed:', readError.message);
    return false;
  }
  console.log('✅ READ successful:', readData.route_name);
  
  // UPDATE
  const { data: updateData, error: updateError } = await supabase
    .from('transport_routes')
    .update({ route_name: 'Updated Test Route' })
    .eq('route_code', 'TEST-ROUTE-001')
    .select()
    .single();
    
  if (updateError) {
    console.log('❌ UPDATE failed:', updateError.message);
    return false;
  }
  console.log('✅ UPDATE successful:', updateData.route_name);
  
  // DELETE
  const { error: deleteError } = await supabase
    .from('transport_routes')
    .delete()
    .eq('route_code', 'TEST-ROUTE-001');
    
  if (deleteError) {
    console.log('❌ DELETE failed:', deleteError.message);
    return false;
  }
  console.log('✅ DELETE successful\n');
  
  return true;
}

async function testRelatedTablesOperations() {
  console.log('📝 Testing related tables (intermediate_stops, sightseeing_options)...');
  
  // Get a test route
  const { data: routeData } = await supabase
    .from('transport_routes')
    .select('id, route_code')
    .limit(1)
    .single();
    
  if (!routeData) {
    console.log('❌ No transport routes found for testing');
    return false;
  }
  
  // Test intermediate_stops table operations
  console.log('🛑 Testing intermediate_stops CRUD...');
  
  // CREATE intermediate stop
  const { data: stopData, error: stopError } = await supabase
    .from('intermediate_stops')
    .insert({
      route_id: routeData.id,
      location_code: 'TEST-STOP',
      full_name: 'Test Stop Location',
      stop_order: 1,
      coordinates: { lat: 28.6139, lng: 77.2090 }
    })
    .select()
    .single();
    
  if (stopError) {
    console.log('❌ Intermediate stop CREATE failed:', stopError.message);
    return false;
  }
  console.log('✅ Intermediate stop created:', stopData.location_code);
  
  // Test sightseeing_options table operations
  console.log('🎯 Testing sightseeing_options CRUD...');
  
  // CREATE sightseeing option
  const { data: sightseeingData, error: sightseeingError } = await supabase
    .from('sightseeing_options')
    .insert({
      route_id: routeData.id,
      location: 'Test Museum',
      adult_price: 500,
      child_price: 250,
      additional_charges: 50
    })
    .select()
    .single();
    
  if (sightseeingError) {
    console.log('❌ Sightseeing option CREATE failed:', sightseeingError.message);
    return false;
  }
  console.log('✅ Sightseeing option created:', sightseeingData.location);
  
  // READ related data
  const { data: relatedData, error: relatedError } = await supabase
    .from('transport_routes')
    .select(`
      id, route_code,
      intermediate_stops(*),
      sightseeing_options(*)
    `)
    .eq('id', routeData.id)
    .single();
    
  if (relatedError) {
    console.log('❌ Related data read failed:', relatedError.message);
    return false;
  }
  
  console.log('✅ Related data read successfully');
  console.log('  - Intermediate stops:', relatedData.intermediate_stops?.length || 0, 'entries');
  console.log('  - Sightseeing options:', relatedData.sightseeing_options?.length || 0, 'entries');
  
  // Cleanup test data
  await supabase.from('intermediate_stops').delete().eq('id', stopData.id);
  await supabase.from('sightseeing_options').delete().eq('id', sightseeingData.id);
  
  return true;
}

async function testAppSettingsCRUD() {
  console.log('⚙️ Testing App Settings CRUD operations...');
  
  // Test with regular client first
  console.log('\n🔧 Testing with REGULAR client...');
  const testSetting = {
    category: 'Test Category',
    setting_key: 'test_crud_setting',
    setting_value: 'test_value',
    description: 'Test setting for CRUD operations',
    data_type: 'text',
    is_required: false,
    is_active: true
  };
  
  try {
    // CREATE with regular client
    const { data: createData, error: createError } = await supabaseRegular
      .from('app_settings')
      .insert(testSetting)
      .select()
      .single();
      
    if (createError) {
      console.log('❌ Regular client CREATE failed:', createError.message);
      
      // Try with admin client
      console.log('\n🔧 Trying with ADMIN client...');
      const { data: adminCreateData, error: adminCreateError } = await supabase
        .from('app_settings')
        .insert(testSetting)
        .select()
        .single();
        
      if (adminCreateError) {
        console.log('❌ Admin client CREATE also failed:', adminCreateError.message);
        return false;
      }
      console.log('✅ Admin client CREATE successful');
      
      // Continue with admin client for other operations
      const { data: readData, error: readError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'test_crud_setting')
        .single();
        
      if (readError) {
        console.log('❌ READ failed:', readError.message);
        return false;
      }
      console.log('✅ READ successful');
      
      // UPDATE
      const { data: updateData, error: updateError } = await supabase
        .from('app_settings')
        .update({ setting_value: 'updated_test_value' })
        .eq('id', adminCreateData.id)
        .select()
        .single();
        
      if (updateError) {
        console.log('❌ UPDATE failed:', updateError.message);
        return false;
      }
      console.log('✅ UPDATE successful');
      
      // DELETE
      const { error: deleteError } = await supabase
        .from('app_settings')
        .delete()
        .eq('id', adminCreateData.id);
        
      if (deleteError) {
        console.log('❌ DELETE failed:', deleteError.message);
        return false;
      }
      console.log('✅ DELETE successful');
      
    } else {
      console.log('✅ Regular client CREATE successful');
      
      // Continue with regular client
      const { data: readData, error: readError } = await supabaseRegular
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'test_crud_setting')
        .single();
        
      if (readError) {
        console.log('❌ READ failed:', readError.message);
        return false;
      }
      console.log('✅ READ successful');
      
      // UPDATE
      const { data: updateData, error: updateError } = await supabaseRegular
        .from('app_settings')
        .update({ setting_value: 'updated_test_value' })
        .eq('id', createData.id)
        .select()
        .single();
        
      if (updateError) {
        console.log('❌ UPDATE failed:', updateError.message);
        return false;
      }
      console.log('✅ UPDATE successful');
      
      // DELETE
      const { error: deleteError } = await supabaseRegular
        .from('app_settings')
        .delete()
        .eq('id', createData.id);
        
      if (deleteError) {
        console.log('❌ DELETE failed:', deleteError.message);
        return false;
      }
      console.log('✅ DELETE successful');
    }
    
    console.log('🎉 App Settings CRUD test completed successfully!');
    return true;
    
  } catch (error) {
    console.log('❌ App Settings CRUD test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Running all CRUD tests...\n');
  
  const results = await Promise.allSettled([
    testAppSettingsCRUD(),
    testLocationCodesCRUD(),
    testTransportTypesCRUD(),
    testTransportRoutesCRUD(),
    testRelatedTablesOperations()
  ]);
  
  console.log('\n📊 Test Results Summary:');
  results.forEach((result, index) => {
    const testNames = ['App Settings', 'Location Codes', 'Transport Types', 'Transport Routes', 'Related Tables'];
    if (result.status === 'fulfilled') {
      console.log(`✅ ${testNames[index]}: ${result.value ? 'PASSED' : 'FAILED'}`);
    } else {
      console.log(`❌ ${testNames[index]}: ERROR - ${result.reason}`);
    }
  });
  
  console.log('\n🎉 All CRUD tests completed!');
}

runAllTests().catch(console.error);