import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Discovering Actual Transport Schema');
console.log('====================================');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function discoverTransportRoutesSchema() {
  console.log('\n🚗 Discovering transport_routes schema...');
  
  // Based on error: requires route_code
  const testData = {
    route_code: 'TEST001',
    // Try other common columns
  };
  
  try {
    const { data, error } = await supabase
      .from('transport_routes')
      .insert(testData)
      .select();
    
    if (error) {
      console.log(`   📝 Error: ${error.message}`);
      
      // Try with more fields based on common patterns
      const testData2 = {
        route_code: 'TEST002',
        route_name: 'Test Route',
        from_city: 'City A',
        to_city: 'City B',
        distance: 100,
        estimated_duration: '2 hours'
      };
      
      const { data: data2, error: error2 } = await supabase
        .from('transport_routes')
        .insert(testData2)
        .select();
      
      if (error2) {
        console.log(`   📝 Error 2: ${error2.message}`);
      } else {
        console.log(`   ✅ Success with:`, testData2);
        console.log(`   📊 Returned data:`, data2);
        
        // Clean up
        if (data2 && data2[0]) {
          await supabase
            .from('transport_routes')
            .delete()
            .eq('id', data2[0].id);
        }
      }
    } else {
      console.log(`   ✅ Success with minimal data:`, testData);
      console.log(`   📊 Returned data:`, data);
      
      // Clean up
      if (data && data[0]) {
        await supabase
          .from('transport_routes')
          .delete()
          .eq('id', data[0].id);
      }
    }
  } catch (err) {
    console.error(`   ❌ Exception:`, err.message);
  }
}

async function discoverTransportTypesSchema() {
  console.log('\n🚌 Discovering transport_types schema...');
  
  // Based on error: requires category, has name
  const testData = {
    category: 'bus',
    name: 'City Bus'
  };
  
  try {
    const { data, error } = await supabase
      .from('transport_types')
      .insert(testData)
      .select();
    
    if (error) {
      console.log(`   📝 Error: ${error.message}`);
      
      // Try with more fields
      const testData2 = {
        category: 'train',
        name: 'Express Train',
        description: 'Fast train service',
        base_price: 50.00,
        price_per_km: 0.15
      };
      
      const { data: data2, error: error2 } = await supabase
        .from('transport_types')
        .insert(testData2)
        .select();
      
      if (error2) {
        console.log(`   📝 Error 2: ${error2.message}`);
      } else {
        console.log(`   ✅ Success with:`, testData2);
        console.log(`   📊 Returned data:`, data2);
        
        // Clean up
        if (data2 && data2[0]) {
          await supabase
            .from('transport_types')
            .delete()
            .eq('id', data2[0].id);
        }
      }
    } else {
      console.log(`   ✅ Success with minimal data:`, testData);
      console.log(`   📊 Returned data:`, data);
      
      // Clean up
      if (data && data[0]) {
        await supabase
          .from('transport_types')
          .delete()
          .eq('id', data[0].id);
      }
    }
  } catch (err) {
    console.error(`   ❌ Exception:`, err.message);
  }
}

async function discoverIntermediateStopsSchema() {
  console.log('\n🛑 Discovering intermediate_stops schema...');
  
  // First create a transport route to reference
  const routeData = {
    route_code: 'TEST_ROUTE_001'
  };
  
  try {
    const { data: routeResult, error: routeError } = await supabase
      .from('transport_routes')
      .insert(routeData)
      .select();
    
    if (routeError) {
      console.log(`   📝 Cannot create test route: ${routeError.message}`);
      return;
    }
    
    const routeId = routeResult[0].id;
    console.log(`   ✅ Created test route with ID: ${routeId}`);
    
    const testData = {
      route_id: routeId,
      stop_name: 'Test Stop',
      stop_order: 1
    };
    
    const { data, error } = await supabase
      .from('intermediate_stops')
      .insert(testData)
      .select();
    
    if (error) {
      console.log(`   📝 Error: ${error.message}`);
      
      // Try with more fields
      const testData2 = {
        route_id: routeId,
        stop_name: 'Test Stop 2',
        stop_order: 2,
        city: 'Test City',
        arrival_time: '10:00',
        departure_time: '10:15'
      };
      
      const { data: data2, error: error2 } = await supabase
        .from('intermediate_stops')
        .insert(testData2)
        .select();
      
      if (error2) {
        console.log(`   📝 Error 2: ${error2.message}`);
      } else {
        console.log(`   ✅ Success with:`, testData2);
        console.log(`   📊 Returned data:`, data2);
      }
    } else {
      console.log(`   ✅ Success with minimal data:`, testData);
      console.log(`   📊 Returned data:`, data);
    }
    
    // Clean up route and stops
    await supabase.from('intermediate_stops').delete().eq('route_id', routeId);
    await supabase.from('transport_routes').delete().eq('id', routeId);
    
  } catch (err) {
    console.error(`   ❌ Exception:`, err.message);
  }
}

async function discoverSightseeingOptionsSchema() {
  console.log('\n🏛️ Discovering sightseeing_options schema...');
  
  // First create a transport route to reference
  const routeData = {
    route_code: 'TEST_ROUTE_002'
  };
  
  try {
    const { data: routeResult, error: routeError } = await supabase
      .from('transport_routes')
      .insert(routeData)
      .select();
    
    if (routeError) {
      console.log(`   📝 Cannot create test route: ${routeError.message}`);
      return;
    }
    
    const routeId = routeResult[0].id;
    console.log(`   ✅ Created test route with ID: ${routeId}`);
    
    const testData = {
      route_id: routeId,
      option_name: 'Test Sightseeing',
      description: 'Test description'
    };
    
    const { data, error } = await supabase
      .from('sightseeing_options')
      .insert(testData)
      .select();
    
    if (error) {
      console.log(`   📝 Error: ${error.message}`);
      
      // Try with more fields
      const testData2 = {
        route_id: routeId,
        option_name: 'Test Museum',
        description: 'A test museum',
        price: 25.00,
        duration: '2 hours',
        location: 'City Center'
      };
      
      const { data: data2, error: error2 } = await supabase
        .from('sightseeing_options')
        .insert(testData2)
        .select();
      
      if (error2) {
        console.log(`   📝 Error 2: ${error2.message}`);
      } else {
        console.log(`   ✅ Success with:`, testData2);
        console.log(`   📊 Returned data:`, data2);
      }
    } else {
      console.log(`   ✅ Success with minimal data:`, testData);
      console.log(`   📊 Returned data:`, data);
    }
    
    // Clean up route and options
    await supabase.from('sightseeing_options').delete().eq('route_id', routeId);
    await supabase.from('transport_routes').delete().eq('id', routeId);
    
  } catch (err) {
    console.error(`   ❌ Exception:`, err.message);
  }
}

async function testExistingData() {
  console.log('\n📊 Checking existing data...');
  
  const tables = ['transport_routes', 'transport_types', 'intermediate_stops', 'sightseeing_options'];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(3);
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: ${count} rows`);
        if (data && data.length > 0) {
          console.log(`      Sample data:`, data[0]);
        }
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ${err.message}`);
    }
  }
}

async function main() {
  await testExistingData();
  await discoverTransportRoutesSchema();
  await discoverTransportTypesSchema();
  await discoverIntermediateStopsSchema();
  await discoverSightseeingOptionsSchema();
  
  console.log('\n🎯 Schema discovery completed!');
}

// Run the script
main().catch(console.error);