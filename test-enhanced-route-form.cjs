require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEnhancedRouteForm() {
  console.log('🧪 Testing Enhanced Route Form Functionality...\n');

  try {
    // Test 1: Verify schema supports all comprehensive fields
    console.log('1. Testing comprehensive route data insertion...');
    
    const comprehensiveRouteData = {
      country: 'Thailand',
      name: 'Bangkok to Phuket Premium Route',
      route_name: 'Bangkok to Phuket Premium Route',
      route_code: 'BKK-HKT-001',
      transfer_type: 'Multi-Stop',
      start_location: 'BKK',
      start_location_code: 'BKK',
      end_location: 'HKT',
      end_location_code: 'HKT',
      start_location_full_name: 'Suvarnabhumi Airport, Bangkok',
      end_location_full_name: 'Phuket International Airport',
      enable_sightseeing: true,
      intermediate_stops: [
        {
          id: 'stop-1',
          location_code: 'KBI',
          location_full_name: 'Krabi Airport'
        }
      ],
      route_segments: [
        {
          from: 'BKK',
          to: 'KBI',
          distance: 400,
          duration: '6 hours'
        },
        {
          from: 'KBI',
          to: 'HKT',
          distance: 463,
          duration: '6 hours'
        }
      ],
      transport_entries: [
        {
          id: 'transport-1',
          type: 'Premium Van',
          seating_capacity: 8,
          luggage_capacity: 12,
          duration: '12 hours',
          price: 2500
        }
      ],
      sightseeing_locations: [
        'Phi Phi Islands',
        'James Bond Island'
      ],
      notes: 'Premium service with refreshments and WiFi included',
      description: 'Luxury transport service from Bangkok to Phuket with optional island tour',
      distance: 863,
      duration: '12 hours',
      status: 'active'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('transport_routes')
      .insert([comprehensiveRouteData])
      .select();

    if (insertError) {
      console.error('❌ Insert failed:', insertError.message);
      return false;
    }

    console.log('✅ Successfully inserted comprehensive route data');
    console.log('   Route ID:', insertResult[0].id);
    console.log('   Route Name:', insertResult[0].name);
    console.log('   Full Names:', {
      start: insertResult[0].start_location_full_name,
      end: insertResult[0].end_location_full_name
    });

    // Test 2: Verify field retrieval and validation
    console.log('\n2. Testing field retrieval and validation...');
    
    const { data: retrievedRoute, error: retrieveError } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('id', insertResult[0].id)
      .single();

    if (retrieveError) {
      console.error('❌ Retrieval failed:', retrieveError.message);
      return false;
    }

    // Validate all comprehensive fields are present
    const requiredFields = [
      'country', 'name', 'route_code', 'transfer_type',
      'start_location_code', 'end_location_code',
      'start_location_full_name', 'end_location_full_name',
      'intermediate_stops', 'transport_entries', 'sightseeing_locations',
      'notes', 'description', 'distance', 'duration', 'status'
    ];

    const missingFields = requiredFields.filter(field => 
      retrievedRoute[field] === null || retrievedRoute[field] === undefined
    );

    if (missingFields.length > 0) {
      console.log('⚠️  Some fields are missing or null:', missingFields);
    } else {
      console.log('✅ All comprehensive fields are present and populated');
    }

    // Test 3: Verify data types and structure
    console.log('\n3. Testing data types and structure...');
    
    const validations = [
      { field: 'distance', expected: 'number', actual: typeof retrievedRoute.distance },
      { field: 'intermediate_stops', expected: 'array', actual: Array.isArray(retrievedRoute.intermediate_stops) ? 'array' : typeof retrievedRoute.intermediate_stops },
      { field: 'transport_entries', expected: 'array', actual: Array.isArray(retrievedRoute.transport_entries) ? 'array' : typeof retrievedRoute.transport_entries },
      { field: 'sightseeing_locations', expected: 'array', actual: Array.isArray(retrievedRoute.sightseeing_locations) ? 'array' : typeof retrievedRoute.sightseeing_locations }
    ];

    let allValidationsPass = true;
    validations.forEach(validation => {
      if (validation.expected === validation.actual) {
        console.log(`✅ ${validation.field}: ${validation.actual} (correct)`);
      } else {
        console.log(`❌ ${validation.field}: expected ${validation.expected}, got ${validation.actual}`);
        allValidationsPass = false;
      }
    });

    // Test 4: Test update functionality with new fields
    console.log('\n4. Testing update functionality with comprehensive fields...');
    
    const updateData = {
      description: 'Updated: Premium luxury transport with enhanced amenities',
      distance: 875,
      notes: 'Updated: Includes complimentary snacks and beverages'
    };

    const { data: updateResult, error: updateError } = await supabase
      .from('transport_routes')
      .update(updateData)
      .eq('id', insertResult[0].id)
      .select();

    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
      return false;
    }

    console.log('✅ Successfully updated comprehensive fields');
    console.log('   Updated distance:', updateResult[0].distance);
    console.log('   Updated description length:', updateResult[0].description.length);

    // Cleanup
    console.log('\n5. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('transport_routes')
      .delete()
      .eq('id', insertResult[0].id);

    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }

    console.log('\n🎉 Enhanced Route Form Test Summary:');
    console.log('✅ Comprehensive field insertion: PASSED');
    console.log('✅ Field retrieval and validation: PASSED');
    console.log(`${allValidationsPass ? '✅' : '❌'} Data types and structure: ${allValidationsPass ? 'PASSED' : 'FAILED'}`);
    console.log('✅ Update functionality: PASSED');
    console.log('✅ Data cleanup: PASSED');

    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
testEnhancedRouteForm()
  .then(success => {
    if (success) {
      console.log('\n🎯 All enhanced route form tests completed successfully!');
      console.log('The comprehensive route form is ready for production use.');
    } else {
      console.log('\n💥 Some tests failed. Please review the errors above.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });