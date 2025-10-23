import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedWorkingData() {
  console.log('🌱 Starting to seed working data...');

  try {
    // 1. Seed location_codes (based on actual Supabase types)
    console.log('📍 Seeding location codes...');
    const locationCodes = [
      {
        code: 'NYC',
        full_name: 'New York City',
        category: 'city',
        country: 'United States',
        city: 'New York',
        status: 'active',
        notes: 'Major metropolitan area',
        latitude: 40.7128,
        longitude: -74.0060
      },
      {
        code: 'LAX',
        full_name: 'Los Angeles International Airport',
        category: 'airport',
        country: 'United States',
        city: 'Los Angeles',
        status: 'active',
        notes: 'Major international airport',
        latitude: 33.9425,
        longitude: -118.4081
      },
      {
        code: 'CHI',
        full_name: 'Chicago',
        category: 'city',
        country: 'United States',
        city: 'Chicago',
        status: 'active',
        notes: 'Major city in Illinois',
        latitude: 41.8781,
        longitude: -87.6298
      },
      {
        code: 'MIA',
        full_name: 'Miami',
        category: 'city',
        country: 'United States',
        city: 'Miami',
        status: 'active',
        notes: 'Major city in Florida',
        latitude: 25.7617,
        longitude: -80.1918
      }
    ];

    const { data: locationData, error: locationError } = await supabase
      .from('location_codes')
      .insert(locationCodes)
      .select();

    if (locationError) {
      console.error('❌ Error inserting location codes:', locationError);
    } else {
      console.log(`✅ Successfully inserted ${locationData.length} location codes`);
    }

    // 2. Seed transport_types (based on actual Supabase types)
    console.log('🚗 Seeding transport types...');
    const transportTypes = [
      {
        name: 'Economy Car',
        category: 'car',
        seating_capacity: 4,
        luggage_capacity: 2,
        active: true
      },
      {
        name: 'Luxury SUV',
        category: 'suv',
        seating_capacity: 7,
        luggage_capacity: 5,
        active: true
      },
      {
        name: 'Mini Bus',
        category: 'bus',
        seating_capacity: 15,
        luggage_capacity: 10,
        active: true
      },
      {
        name: 'Private Jet',
        category: 'aircraft',
        seating_capacity: 8,
        luggage_capacity: 20,
        active: true
      }
    ];

    const { data: transportTypeData, error: transportTypeError } = await supabase
      .from('transport_types')
      .insert(transportTypes)
      .select();

    if (transportTypeError) {
      console.error('❌ Error inserting transport types:', transportTypeError);
    } else {
      console.log(`✅ Successfully inserted ${transportTypeData.length} transport types`);
    }

    // 3. Seed transport_routes (using correct column names)
     console.log('🛣️ Seeding transport routes...');
     const transportRoutes = [
        {
          country: 'United States',
          route_name: 'NYC to LAX Express',
          route_code: 'NYC-LAX-001',
          transfer_type: 'One-Way',
          start_location: 'NYC',
          end_location: 'LAX',
          start_location_full_name: 'New York City',
          end_location_full_name: 'Los Angeles International Airport'
        },
        {
          country: 'United States',
          route_name: 'NYC to Chicago via Road',
          route_code: 'NYC-CHI-002',
          transfer_type: 'Round-Trip',
          start_location: 'NYC',
          end_location: 'CHI',
          start_location_full_name: 'New York City',
          end_location_full_name: 'Chicago'
        },
        {
          country: 'United States',
          route_name: 'Miami to NYC',
          route_code: 'MIA-NYC-003',
          transfer_type: 'Multi-Stop',
          start_location: 'MIA',
          end_location: 'NYC',
          start_location_full_name: 'Miami',
          end_location_full_name: 'New York City'
        }
      ];

    const { data: routeData, error: routeError } = await supabase
      .from('transport_routes')
      .insert(transportRoutes)
      .select();

    if (routeError) {
      console.error('❌ Error inserting transport routes:', routeError);
    } else {
      console.log(`✅ Successfully inserted ${routeData.length} transport routes`);
    }

    console.log('🎉 Data seeding completed successfully!');
    
    // Verify the data was inserted
    console.log('\n📊 Verifying inserted data...');
    
    const { data: locationCount } = await supabase
      .from('location_codes')
      .select('*', { count: 'exact' });
    console.log(`📍 Location codes in database: ${locationCount?.length || 0}`);
    
    const { data: transportTypeCount } = await supabase
      .from('transport_types')
      .select('*', { count: 'exact' });
    console.log(`🚗 Transport types in database: ${transportTypeCount?.length || 0}`);
    
    const { data: routeCount } = await supabase
      .from('transport_routes')
      .select('*', { count: 'exact' });
    console.log(`🛣️ Transport routes in database: ${routeCount?.length || 0}`);

  } catch (error) {
    console.error('💥 Unexpected error during seeding:', error);
  }
}

// Run the seeding function
seedWorkingData();