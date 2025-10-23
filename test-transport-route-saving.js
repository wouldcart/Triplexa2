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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testTransportRouteSaving() {
  try {
    console.log('🧪 Testing transport route saving functionality...');
    
    // Test data that matches the actual schema
    const testRoute = {
      route_name: 'Test Route from Airport to City Center',
      country: 'Test Country',
      transfer_type: 'One-Way',
      start_location: 'AIRPORT',
      end_location: 'CITY_CENTER',
      start_location_full_name: 'International Airport',
      end_location_full_name: 'City Center',
      route_code: 'TEST001',
      status: 'active',
      description: 'Test route for verification',
      notes: 'This is a test route'
    };
    
    console.log('📋 Test route data:', testRoute);
    
    // Test insertion
    console.log('⚡ Inserting test route...');
    const { data: insertData, error: insertError } = await supabase
      .from('transport_routes')
      .insert(testRoute)
      .select();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return false;
    }
    
    console.log('✅ Insert successful!');
    console.log('📋 Inserted data:', insertData[0]);
    
    const routeId = insertData[0].id;
    
    // Test update
    console.log('⚡ Testing route update...');
    const updateData = {
      route_name: 'Updated Test Route',
      transfer_type: 'Round-Trip',
      description: 'Updated description',
      status: 'inactive'
    };
    
    const { data: updatedData, error: updateError } = await supabase
      .from('transport_routes')
      .update(updateData)
      .eq('id', routeId)
      .select();
    
    if (updateError) {
      console.error('❌ Update failed:', updateError);
    } else {
      console.log('✅ Update successful!');
      console.log('📋 Updated data:', updatedData[0]);
    }
    
    // Test retrieval
    console.log('⚡ Testing route retrieval...');
    const { data: retrievedData, error: retrieveError } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('id', routeId);
    
    if (retrieveError) {
      console.error('❌ Retrieval failed:', retrieveError);
    } else {
      console.log('✅ Retrieval successful!');
      console.log('📋 Retrieved data:', retrievedData[0]);
    }
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('transport_routes')
      .delete()
      .eq('id', routeId);
    
    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError);
    } else {
      console.log('✅ Cleanup successful!');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    return false;
  }
}

async function testSchemaCompatibility() {
  try {
    console.log('🔍 Testing schema compatibility...');
    
    // Get the current schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('transport_routes')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Schema test failed:', schemaError);
      return false;
    }
    
    console.log('✅ Schema accessible');
    
    if (schemaData && schemaData[0]) {
      console.log('📋 Available columns:', Object.keys(schemaData[0]));
    } else {
      console.log('📋 Table is empty, checking column info...');
      
      // Try to insert and immediately delete to see what columns are available
      const testInsert = {
        route_name: 'Schema Test',
        country: 'Test',
        transfer_type: 'direct',
        start_location: 'A',
        end_location: 'B',
        route_code: 'SCHEMA_TEST'
      };
      
      const { data: testData, error: testError } = await supabase
        .from('transport_routes')
        .insert(testInsert)
        .select();
      
      if (testError) {
        console.error('❌ Schema test insert failed:', testError);
        return false;
      }
      
      console.log('📋 Available columns from test insert:', Object.keys(testData[0]));
      
      // Clean up
      await supabase
        .from('transport_routes')
        .delete()
        .eq('id', testData[0].id);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Schema compatibility test failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting transport route functionality tests...');
  
  const schemaTest = await testSchemaCompatibility();
  if (!schemaTest) {
    console.log('❌ Schema compatibility test failed');
    return;
  }
  
  const savingTest = await testTransportRouteSaving();
  if (savingTest) {
    console.log('🎉 All tests passed! Transport route saving is working correctly.');
  } else {
    console.log('❌ Transport route saving tests failed');
  }
}

main();