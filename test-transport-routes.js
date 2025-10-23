import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test data for transport routes
const testRoutes = [
  {
    route_code: 'TR001',
    route_name: 'Bangkok to Phuket Express',
    country: 'Thailand',
    transfer_type: 'One-Way',
    start_location: 'Bangkok',
    start_location_full_name: 'Bangkok, Thailand',
    start_coordinates: { lat: 13.7563, lng: 100.5018 },
    end_location: 'Phuket',
    end_location_full_name: 'Phuket, Thailand',
    end_coordinates: { lat: 7.8804, lng: 98.3923 },
    distance: 862,
    duration: '12 hours',
    description: 'Comfortable bus journey from Bangkok to Phuket with scenic views',
    notes: 'Air-conditioned bus with refreshments',
    status: 'active',
    enable_sightseeing: true
  },
  {
    route_code: 'TR002',
    route_name: 'Chiang Mai Cultural Tour',
    country: 'Thailand',
    transfer_type: 'Round-Trip',
    start_location: 'Chiang Mai',
    start_location_full_name: 'Chiang Mai, Thailand',
    start_coordinates: { lat: 18.7883, lng: 98.9853 },
    end_location: 'Doi Suthep',
    end_location_full_name: 'Doi Suthep Temple, Chiang Mai, Thailand',
    end_coordinates: { lat: 18.8047, lng: 98.9217 },
    distance: 15,
    duration: '4 hours',
    description: 'Cultural tour to Doi Suthep Temple with traditional stops',
    notes: 'Includes temple entrance fees',
    status: 'active',
    enable_sightseeing: true
  },
  {
    route_code: 'TR003',
    route_name: 'Ayutthaya Historical Journey',
    country: 'Thailand',
    transfer_type: 'Multi-Stop',
    start_location: 'Bangkok',
    start_location_full_name: 'Bangkok, Thailand',
    start_coordinates: { lat: 13.7563, lng: 100.5018 },
    end_location: 'Ayutthaya',
    end_location_full_name: 'Ayutthaya Historical Park, Thailand',
    end_coordinates: { lat: 14.3692, lng: 100.5877 },
    distance: 80,
    duration: '8 hours',
    description: 'Historical tour with multiple temple stops in Ayutthaya',
    notes: 'Professional guide included',
    status: 'active',
    enable_sightseeing: true
  }
];

// Test data for intermediate stops
const testIntermediateStops = [
  // For Bangkok to Phuket route (TR001)
  {
    location_code: 'HUAHIN',
    full_name: 'Hua Hin Rest Stop',
    coordinates: { lat: 12.5664, lng: 99.9581 },
    stop_order: 1
  },
  {
    location_code: 'CHUMPHON',
    full_name: 'Chumphon Junction',
    coordinates: { lat: 10.4930, lng: 99.1800 },
    stop_order: 2
  },
  // For Ayutthaya route (TR003)
  {
    location_code: 'BANGPAIN',
    full_name: 'Bang Pa-In Palace',
    coordinates: { lat: 14.2298, lng: 100.5808 },
    stop_order: 1
  },
  {
    location_code: 'CHAIWAT',
    full_name: 'Wat Chaiwatthanaram',
    coordinates: { lat: 14.3434, lng: 100.5397 },
    stop_order: 2
  }
];

// Test data for sightseeing options
const testSightseeingOptions = [
  // For Bangkok to Phuket route (TR001)
  {
    location: 'Elephant Sanctuary Visit',
    description: 'Ethical elephant sanctuary experience with feeding and bathing',
    adult_price: 1500,
    child_price: 750,
    additional_charges: 200
  },
  {
    location: 'Local Market Tour',
    description: 'Guided tour of traditional Thai markets with food tasting',
    adult_price: 800,
    child_price: 400,
    additional_charges: 100
  },
  // For Chiang Mai route (TR002)
  {
    location: 'Traditional Craft Workshop',
    description: 'Learn traditional Thai handicrafts from local artisans',
    adult_price: 1200,
    child_price: 600,
    additional_charges: 150
  },
  {
    location: 'Temple Blessing Ceremony',
    description: 'Participate in traditional Buddhist blessing ceremony',
    adult_price: 500,
    child_price: 250,
    additional_charges: 50
  },
  // For Ayutthaya route (TR003)
  {
    location: 'Historical Guided Tour',
    description: 'Professional guide explaining the history of ancient Siam',
    adult_price: 1000,
    child_price: 500,
    additional_charges: 100
  },
  {
    location: 'Traditional Boat Ride',
    description: 'Scenic boat ride around the ancient city ruins',
    adult_price: 600,
    child_price: 300,
    additional_charges: 80
  }
];

async function insertTestData() {
  console.log('🚀 Starting comprehensive transport routes test data insertion...\n');

  try {
    // Clean up existing test data first
    console.log('🧹 Cleaning up existing test data...');
    
    // Delete in reverse order due to foreign key constraints
    await supabase.from('sightseeing_options').delete().like('route_id', '%');
    await supabase.from('intermediate_stops').delete().like('route_id', '%');
    await supabase.from('transport_routes').delete().in('route_code', ['TR001', 'TR002', 'TR003']);
    
    console.log('✅ Cleanup completed\n');

    // 1. Insert transport routes
    console.log('📍 Inserting transport routes...');
    const { data: routesData, error: routesError } = await supabase
      .from('transport_routes')
      .insert(testRoutes)
      .select();

    if (routesError) {
      console.error('❌ Error inserting routes:', routesError);
      return;
    }

    console.log(`✅ Successfully inserted ${routesData.length} transport routes`);
    routesData.forEach(route => {
      console.log(`   - ${route.route_code}: ${route.route_name}`);
    });

    // 2. Insert intermediate stops for each route
    console.log('\n🛑 Inserting intermediate stops...');
    
    for (const route of routesData) {
      let routeStops = [];
      
      if (route.route_code === 'TR001') {
        // Bangkok to Phuket stops
        routeStops = testIntermediateStops.slice(0, 2).map(stop => ({
          ...stop,
          route_id: route.id
        }));
      } else if (route.route_code === 'TR003') {
        // Ayutthaya stops
        routeStops = testIntermediateStops.slice(2, 4).map(stop => ({
          ...stop,
          route_id: route.id
        }));
      }

      if (routeStops.length > 0) {
        const { data: stopsData, error: stopsError } = await supabase
          .from('intermediate_stops')
          .insert(routeStops)
          .select();

        if (stopsError) {
          console.error(`❌ Error inserting stops for ${route.route_code}:`, stopsError);
        } else {
          console.log(`✅ Inserted ${stopsData.length} stops for ${route.route_code}`);
          stopsData.forEach(stop => {
            console.log(`   - ${stop.stop_name} (${stop.duration})`);
          });
        }
      }
    }

    // 3. Insert sightseeing options for each route
    console.log('\n🎯 Inserting sightseeing options...');
    
    for (const route of routesData) {
      let routeOptions = [];
      
      if (route.route_code === 'TR001') {
        // Bangkok to Phuket options
        routeOptions = testSightseeingOptions.slice(0, 2).map(option => ({
          ...option,
          route_id: route.id
        }));
      } else if (route.route_code === 'TR002') {
        // Chiang Mai options
        routeOptions = testSightseeingOptions.slice(2, 4).map(option => ({
          ...option,
          route_id: route.id
        }));
      } else if (route.route_code === 'TR003') {
        // Ayutthaya options
        routeOptions = testSightseeingOptions.slice(4, 6).map(option => ({
          ...option,
          route_id: route.id
        }));
      }

      if (routeOptions.length > 0) {
        const { data: optionsData, error: optionsError } = await supabase
          .from('sightseeing_options')
          .insert(routeOptions)
          .select();

        if (optionsError) {
          console.error(`❌ Error inserting sightseeing options for ${route.route_code}:`, optionsError);
        } else {
          console.log(`✅ Inserted ${optionsData.length} sightseeing options for ${route.route_code}`);
          optionsData.forEach(option => {
            console.log(`   - ${option.location} (Adult: ฿${option.adult_price}, Child: ฿${option.child_price})`);
          });
        }
      }
    }

    // 4. Verify the complete data
    console.log('\n📊 Verifying complete transport routes data...');
    
    const { data: completeRoutes, error: verifyError } = await supabase
      .from('transport_routes')
      .select(`
        *,
        intermediate_stops(*),
        sightseeing_options(*)
      `)
      .order('route_code');

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError);
      return;
    }

    console.log(`\n🎉 Data verification complete! Found ${completeRoutes.length} complete routes:`);
    
    completeRoutes.forEach(route => {
      console.log(`\n📍 ${route.route_code}: ${route.route_name}`);
      console.log(`   📍 ${route.start_location} → ${route.end_location}`);
      console.log(`   🚌 ${route.transfer_type} | Distance: ${route.distance}km | Duration: ${route.duration}`);
      console.log(`   🛑 Intermediate stops: ${route.intermediate_stops?.length || 0}`);
      console.log(`   🎯 Sightseeing options: ${route.sightseeing_options?.length || 0}`);
      
      if (route.intermediate_stops?.length > 0) {
        route.intermediate_stops.forEach(stop => {
          console.log(`      🛑 ${stop.stop_name} (${stop.duration})`);
        });
      }
      
      if (route.sightseeing_options?.length > 0) {
        route.sightseeing_options.forEach(option => {
          console.log(`      🎯 ${option.location} - ฿${option.adult_price}/฿${option.child_price}`);
        });
      }
    });

    console.log('\n✅ All test data inserted and verified successfully!');
    console.log('\n📈 Summary:');
    console.log(`   - Transport Routes: ${completeRoutes.length}`);
    console.log(`   - Total Intermediate Stops: ${completeRoutes.reduce((sum, route) => sum + (route.intermediate_stops?.length || 0), 0)}`);
    console.log(`   - Total Sightseeing Options: ${completeRoutes.reduce((sum, route) => sum + (route.sightseeing_options?.length || 0), 0)}`);

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the test
insertTestData();