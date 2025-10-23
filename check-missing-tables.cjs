const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMissingTables() {
  console.log('🔍 Investigating intermediate_stops and sightseeing_options tables...\n');

  // Test intermediate_stops structure
  console.log('📋 Testing intermediate_stops table:');
  console.log('='.repeat(40));

  try {
    // Try to insert a test record to understand the structure
    const { data, error } = await supabase
      .from('intermediate_stops')
      .insert({
        route_id: 'test-route-id',
        stop_order: 1,
        location_code: 'TEST',
        location_name: 'Test Location',
        arrival_time: '10:00',
        departure_time: '10:30',
        duration_minutes: 30
      })
      .select();

    if (error) {
      console.log('❌ Insert error (reveals structure):', error.message);
      
      // Try with minimal data
      const { data: minData, error: minError } = await supabase
        .from('intermediate_stops')
        .insert({})
        .select();
      
      if (minError) {
        console.log('❌ Minimal insert error:', minError.message);
      }
    } else {
      console.log('✅ Insert successful:', data);
      
      // Clean up the test record
      if (data && data.length > 0) {
        await supabase
          .from('intermediate_stops')
          .delete()
          .eq('id', data[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }

  // Test sightseeing_options structure
  console.log('\n📋 Testing sightseeing_options table:');
  console.log('='.repeat(40));

  try {
    // Try to insert a test record to understand the structure
    const { data, error } = await supabase
      .from('sightseeing_options')
      .insert({
        route_id: 'test-route-id',
        option_name: 'Test Attraction',
        description: 'Test description',
        duration_minutes: 60,
        cost: 25.00,
        category: 'cultural'
      })
      .select();

    if (error) {
      console.log('❌ Insert error (reveals structure):', error.message);
      
      // Try with minimal data
      const { data: minData, error: minError } = await supabase
        .from('sightseeing_options')
        .insert({})
        .select();
      
      if (minError) {
        console.log('❌ Minimal insert error:', minError.message);
      }
    } else {
      console.log('✅ Insert successful:', data);
      
      // Clean up the test record
      if (data && data.length > 0) {
        await supabase
          .from('sightseeing_options')
          .delete()
          .eq('id', data[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }

  // Check if these might be views or have RLS policies
  console.log('\n🔒 Testing table access permissions:');
  console.log('='.repeat(40));

  try {
    const { count: stopsCount, error: stopsError } = await supabase
      .from('intermediate_stops')
      .select('*', { count: 'exact', head: true });

    console.log(`intermediate_stops count: ${stopsCount}, error: ${stopsError?.message || 'none'}`);

    const { count: sightseeingCount, error: sightseeingError } = await supabase
      .from('sightseeing_options')
      .select('*', { count: 'exact', head: true });

    console.log(`sightseeing_options count: ${sightseeingCount}, error: ${sightseeingError?.message || 'none'}`);

  } catch (e) {
    console.log('❌ Access test exception:', e.message);
  }

  console.log('\n✅ Investigation complete!');
}

checkMissingTables().catch(console.error);