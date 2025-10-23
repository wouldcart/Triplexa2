const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function comprehensiveCrudTest() {
  console.log('🚀 Starting Comprehensive CRUD Test for Multi-Stop Transport Routes\n');
  
  let testRouteId = null;
  let testStopIds = [];
  let testSightseeingIds = [];

  try {
    // Step 1: Create a new transport route
    console.log('📍 Step 1: Creating a new transport route...');
    const routeData = {
      route_code: 'TEST-MULTI-001',
      route_name: 'Test Multi-Stop Route',
      country: 'Thailand',
      transfer_type: 'Multi-Stop', // Valid values: 'One-Way', 'Round-Trip', 'Multi-Stop', 'en route'
      start_location: 'BKK',
      start_location_full_name: 'Bangkok Suvarnabhumi Airport',
      start_coordinates: { lat: 13.6900, lng: 100.7501 },
      end_location: 'CNX',
      end_location_full_name: 'Chiang Mai International Airport',
      end_coordinates: { lat: 18.7669, lng: 98.9625 },
      distance: 685,
      duration: '12 hours',
      description: 'Multi-stop route from Bangkok to Chiang Mai with sightseeing options',
      notes: 'Test route for CRUD validation',
      status: 'active',
      enable_sightseeing: true
    };

    const { data: routeResult, error: routeError } = await supabase
      .from('transport_routes')
      .insert(routeData)
      .select()
      .single();

    if (routeError) {
      console.log('❌ Route creation failed:', routeError.message);
      return;
    }

    testRouteId = routeResult.id;
    console.log('✅ Route created successfully:', testRouteId);

    // Step 2: Add intermediate stops
    console.log('\n📍 Step 2: Adding intermediate stops...');
    const stopsData = [
      {
        route_id: testRouteId,
        stop_order: 1,
        location_code: 'AYU',
        full_name: 'Ayutthaya Historical Park',
        coordinates: { lat: 14.3692, lng: 100.5877 }
      },
      {
        route_id: testRouteId,
        stop_order: 2,
        location_code: 'SUK',
        full_name: 'Sukhothai Historical Park',
        coordinates: { lat: 17.0078, lng: 99.7071 }
      },
      {
        route_id: testRouteId,
        stop_order: 3,
        location_code: 'LAM',
        full_name: 'Lampang City Center',
        coordinates: { lat: 18.2932, lng: 99.4889 }
      }
    ];

    for (const stopData of stopsData) {
      const { data: stopResult, error: stopError } = await supabase
        .from('intermediate_stops')
        .insert(stopData)
        .select()
        .single();

      if (stopError) {
        console.log('❌ Stop creation failed:', stopError.message);
        continue;
      }

      testStopIds.push(stopResult.id);
      console.log(`✅ Stop ${stopData.stop_order} created: ${stopResult.full_name}`);
    }

    // Step 3: Add sightseeing options
    console.log('\n📍 Step 3: Adding sightseeing options...');
    const sightseeingData = [
      {
        route_id: testRouteId,
        location: 'Ayutthaya Historical Park',
        description: 'Ancient capital ruins and temples',
        adult_price: 50.00,
        child_price: 25.00,
        additional_charges: 10.00
      },
      {
        route_id: testRouteId,
        location: 'Sukhothai Historical Park',
        description: 'UNESCO World Heritage Site',
        adult_price: 100.00,
        child_price: 50.00,
        additional_charges: 15.00
      },
      {
        route_id: testRouteId,
        location: 'Lampang Horse Carriage Tour',
        description: 'Traditional horse carriage city tour',
        adult_price: 200.00,
        child_price: 100.00,
        additional_charges: 0.00
      }
    ];

    for (const sightData of sightseeingData) {
      const { data: sightResult, error: sightError } = await supabase
        .from('sightseeing_options')
        .insert(sightData)
        .select()
        .single();

      if (sightError) {
        console.log('❌ Sightseeing option creation failed:', sightError.message);
        continue;
      }

      testSightseeingIds.push(sightResult.id);
      console.log(`✅ Sightseeing option created: ${sightResult.location}`);
    }

    // Step 4: Check existing transport types (reference table)
    console.log('\n📍 Step 4: Checking existing transport types (reference table)...');
    const { data: existingTransportTypes, error: typesError } = await supabase
      .from('transport_types')
      .select('*')
      .limit(5);

    if (typesError) {
      console.error('❌ Error fetching transport types:', typesError);
      throw typesError;
    }

    console.log('✅ Available transport types:', existingTransportTypes.map(t => t.name || t.category).join(', '));

    // Step 5: Test reading with relationships
    console.log('\n📍 Step 5: Testing read operations with relationships...');
    
    // Read the complete route with all related data
    const { data: completeRoute, error: readError } = await supabase
      .from('transport_routes')
      .select(`
        *,
        intermediate_stops(*),
        sightseeing_options(*)
      `)
      .eq('id', testRouteId)
      .single();

    if (readError) {
      console.log('❌ Read operation failed:', readError.message);
    } else {
      console.log('✅ Complete route data retrieved:');
      console.log(`   Route: ${completeRoute.route_name}`);
      console.log(`   Intermediate Stops: ${completeRoute.intermediate_stops?.length || 0}`);
      console.log(`   Sightseeing Options: ${completeRoute.sightseeing_options?.length || 0}`);
    }

    // Step 6: Test update operations
    console.log('\n📍 Step 6: Testing update operations...');
    
    // Update route
    const { error: updateRouteError } = await supabase
      .from('transport_routes')
      .update({ 
        description: 'Updated: Multi-stop route from Bangkok to Chiang Mai with enhanced sightseeing options',
        distance: 700
      })
      .eq('id', testRouteId);

    if (updateRouteError) {
      console.log('❌ Route update failed:', updateRouteError.message);
    } else {
      console.log('✅ Route updated successfully');
    }

    // Update a stop
    if (testStopIds.length > 0) {
      const { error: updateStopError } = await supabase
        .from('intermediate_stops')
        .update({ full_name: 'Updated: Ayutthaya Historical Park & Museum' })
        .eq('id', testStopIds[0]);

      if (updateStopError) {
        console.log('❌ Stop update failed:', updateStopError.message);
      } else {
        console.log('✅ Stop updated successfully');
      }
    }

    // Update a sightseeing option
    if (testSightseeingIds.length > 0) {
      const { error: updateSightError } = await supabase
        .from('sightseeing_options')
        .update({ adult_price: 60.00 })
        .eq('id', testSightseeingIds[0]);

      if (updateSightError) {
        console.log('❌ Sightseeing option update failed:', updateSightError.message);
      } else {
        console.log('✅ Sightseeing option updated successfully');
      }
    }

    // Note: transport_types is a reference table, no updates needed for testing

    console.log('\n🎉 All CRUD operations completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log(`   ✅ Route created: ${testRouteId}`);
    console.log(`   ✅ Intermediate stops: ${testStopIds.length}`);
    console.log(`   ✅ Sightseeing options: ${testSightseeingIds.length}`);

    // Note: transport_types is a reference table, no cleanup needed

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  } finally {
    // Step 7: Cleanup test data
    console.log('\n📍 Step 7: Cleaning up test data...');
    
    if (testRouteId) {
      // Delete route (cascade will handle related records)
      const { error: deleteError } = await supabase
        .from('transport_routes')
        .delete()
        .eq('id', testRouteId);

      if (deleteError) {
        console.log('❌ Cleanup failed:', deleteError.message);
      } else {
        console.log('✅ Test data cleaned up successfully');
      }
    }
  }

  console.log('\n✅ Comprehensive CRUD test completed!');
}

comprehensiveCrudTest().catch(console.error);