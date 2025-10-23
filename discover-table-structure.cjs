const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function discoverTableStructure() {
  console.log('🔍 Discovering actual table structures...\n');

  // First, let's get a transport_routes ID to use as a foreign key
  const { data: routeData } = await supabase
    .from('transport_routes')
    .select('id')
    .limit(1);

  const routeId = routeData && routeData.length > 0 ? routeData[0].id : 'test-route-id';
  console.log(`Using route_id: ${routeId}\n`);

  // Test intermediate_stops with basic required fields
  console.log('📋 Testing intermediate_stops structure:');
  console.log('='.repeat(50));

  const stopsTestCases = [
    { route_id: routeId },
    { route_id: routeId, stop_order: 1 },
    { route_id: routeId, stop_order: 1, location_code: 'TEST' },
    { route_id: routeId, stop_order: 1, location_code: 'TEST', location_name: 'Test Location' },
    { route_id: routeId, stop_order: 1, location_code: 'TEST', location_name: 'Test Location', duration: 30 },
    { route_id: routeId, stop_order: 1, location_code: 'TEST', location_name: 'Test Location', duration_minutes: 30 },
  ];

  for (let i = 0; i < stopsTestCases.length; i++) {
    const testCase = stopsTestCases[i];
    console.log(`\nTest ${i + 1}: ${JSON.stringify(testCase)}`);
    
    try {
      const { data, error } = await supabase
        .from('intermediate_stops')
        .insert(testCase)
        .select();

      if (error) {
        console.log(`❌ Error: ${error.message}`);
      } else {
        console.log(`✅ Success! Structure discovered:`, Object.keys(data[0]));
        
        // Clean up
        await supabase
          .from('intermediate_stops')
          .delete()
          .eq('id', data[0].id);
        
        break; // Stop testing once we find a working structure
      }
    } catch (e) {
      console.log(`❌ Exception: ${e.message}`);
    }
  }

  // Test sightseeing_options with basic required fields
  console.log('\n\n📋 Testing sightseeing_options structure:');
  console.log('='.repeat(50));

  const sightseeingTestCases = [
    { route_id: routeId },
    { route_id: routeId, name: 'Test Attraction' },
    { route_id: routeId, name: 'Test Attraction', description: 'Test description' },
    { route_id: routeId, option_name: 'Test Attraction' },
    { route_id: routeId, option_name: 'Test Attraction', description: 'Test description' },
    { route_id: routeId, title: 'Test Attraction' },
    { route_id: routeId, title: 'Test Attraction', description: 'Test description' },
  ];

  for (let i = 0; i < sightseeingTestCases.length; i++) {
    const testCase = sightseeingTestCases[i];
    console.log(`\nTest ${i + 1}: ${JSON.stringify(testCase)}`);
    
    try {
      const { data, error } = await supabase
        .from('sightseeing_options')
        .insert(testCase)
        .select();

      if (error) {
        console.log(`❌ Error: ${error.message}`);
      } else {
        console.log(`✅ Success! Structure discovered:`, Object.keys(data[0]));
        
        // Clean up
        await supabase
          .from('sightseeing_options')
          .delete()
          .eq('id', data[0].id);
        
        break; // Stop testing once we find a working structure
      }
    } catch (e) {
      console.log(`❌ Exception: ${e.message}`);
    }
  }

  console.log('\n✅ Structure discovery complete!');
}

discoverTableStructure().catch(console.error);