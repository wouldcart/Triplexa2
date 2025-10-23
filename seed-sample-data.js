#!/usr/bin/env node

/**
 * Simple script to add sample data for testing the integrated transport service
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSampleData() {
  console.log('🌱 Seeding sample data for integrated transport service...\n');

  try {
    // 1. Add sample location codes
    console.log('1. Adding location codes...');
    const locationCodes = [
      {
        code: 'BKK-APT',
        full_name: 'Bangkok Suvarnabhumi Airport',
        category: 'Airport',
        country: 'Thailand',
        city: 'Bangkok',
        status: 'active',
        latitude: 13.6900,
        longitude: 100.7501
      },
      {
        code: 'BKK-HTL',
        full_name: 'Bangkok Hotel Area',
        category: 'Hotel',
        country: 'Thailand',
        city: 'Bangkok',
        status: 'active',
        latitude: 13.7563,
        longitude: 100.5018
      },
      {
        code: 'PTY-HTL',
        full_name: 'Pattaya Hotel Area',
        category: 'Hotel',
        country: 'Thailand',
        city: 'Pattaya',
        status: 'active',
        latitude: 12.9236,
        longitude: 100.8825
      },
      {
        code: 'HKT-APT',
        full_name: 'Phuket International Airport',
        category: 'Airport',
        country: 'Thailand',
        city: 'Phuket',
        status: 'active',
        latitude: 8.1132,
        longitude: 98.3169
      }
    ];

    // Check existing location codes first
    const { data: existingLocations } = await supabase
      .from('location_codes')
      .select('code');
    
    const existingCodes = new Set(existingLocations?.map(l => l.code) || []);

    for (const location of locationCodes) {
      if (existingCodes.has(location.code)) {
        console.log(`⏭️  Skipping existing location: ${location.code}`);
        continue;
      }

      const { error } = await supabase
        .from('location_codes')
        .insert(location);
      
      if (error) {
        console.error(`Error adding location ${location.code}:`, error.message);
      } else {
        console.log(`✅ Added location: ${location.code} - ${location.full_name}`);
      }
    }

    // 2. Add sample transport routes
    console.log('\n2. Adding transport routes...');
    
    // Check existing routes first
    const { data: existingRoutes } = await supabase
      .from('transport_routes')
      .select('route_code');
    
    const existingRouteCodes = new Set(existingRoutes?.map(r => r.route_code) || []);

    const routes = [
      {
        route_code: 'BKK-PTY-001',
        route_name: 'Bangkok Airport to Pattaya',
        country: 'Thailand',
        transfer_type: 'One-Way',
        start_location: 'BKK-APT',
        start_location_full_name: 'Bangkok Suvarnabhumi Airport',
        end_location: 'PTY-HTL',
        end_location_full_name: 'Pattaya Hotel Area',
        distance: 150,
        duration: '2h 30m',
        description: 'Direct transfer from Bangkok Airport to Pattaya hotels',
        status: 'active',
        enable_sightseeing: false
      },
      {
        route_code: 'BKK-HKT-001',
        route_name: 'Bangkok to Phuket',
        country: 'Thailand',
        transfer_type: 'One-Way',
        start_location: 'BKK-HTL',
        start_location_full_name: 'Bangkok Hotel Area',
        end_location: 'HKT-APT',
        end_location_full_name: 'Phuket International Airport',
        distance: 840,
        duration: '1h 30m',
        description: 'Flight from Bangkok to Phuket',
        status: 'active',
        enable_sightseeing: true
      }
    ];

    const insertedRoutes = [];
    for (const route of routes) {
      if (existingRouteCodes.has(route.route_code)) {
        console.log(`⏭️  Skipping existing route: ${route.route_code}`);
        // Get the existing route for later use
        const { data: existingRoute } = await supabase
          .from('transport_routes')
          .select('*')
          .eq('route_code', route.route_code)
          .single();
        if (existingRoute) insertedRoutes.push(existingRoute);
        continue;
      }

      const { data, error } = await supabase
        .from('transport_routes')
        .insert(route)
        .select()
        .single();
      
      if (error) {
        console.error(`Error adding route ${route.route_code}:`, error.message);
        console.log('This might be due to RLS policies. Continuing with existing data...');
      } else {
        console.log(`✅ Added route: ${route.route_code} - ${route.route_name}`);
        insertedRoutes.push(data);
      }
    }

    console.log(`\n📊 Summary: Found ${insertedRoutes.length} routes to work with`);

    // If we have routes, continue with related data
    if (insertedRoutes.length > 0) {
      // 3. Add intermediate stops
      console.log('\n3. Adding intermediate stops...');
      const route1 = insertedRoutes.find(r => r.route_code === 'BKK-PTY-001');
      if (route1) {
        const { data: existingStops } = await supabase
          .from('intermediate_stops')
          .select('*')
          .eq('route_id', route1.id);

        if (!existingStops || existingStops.length === 0) {
          const stops = [
            {
              route_id: route1.id,
              stop_order: 1,
              location_code: 'BKK-HTL',
              full_name: 'Bangkok Hotel Area'
            }
          ];

          for (const stop of stops) {
            const { error } = await supabase
              .from('intermediate_stops')
              .insert(stop);
            
            if (error) {
              console.error(`Error adding stop:`, error.message);
            } else {
              console.log(`✅ Added intermediate stop: ${stop.full_name}`);
            }
          }
        } else {
          console.log(`⏭️  Route ${route1.route_code} already has ${existingStops.length} stops`);
        }
      }

      // 4. Add transport types
      console.log('\n4. Adding transport types...');
      for (const route of insertedRoutes) {
        const { data: existingTypes } = await supabase
          .from('transport_types')
          .select('*')
          .eq('route_id', route.id);

        if (!existingTypes || existingTypes.length === 0) {
          const transportTypes = route.route_code === 'BKK-PTY-001' ? [
            {
              route_id: route.id,
              type: 'Private Car',
              seating_capacity: 3,
              luggage_capacity: 2,
              duration: '2h 30m',
              price: 2500.00,
              notes: 'Comfortable private transfer'
            },
            {
              route_id: route.id,
              type: 'Minivan',
              seating_capacity: 9,
              luggage_capacity: 6,
              duration: '2h 45m',
              price: 3500.00,
              notes: 'Spacious minivan for groups'
            }
          ] : [
            {
              route_id: route.id,
              type: 'Flight',
              seating_capacity: 180,
              luggage_capacity: 1,
              duration: '1h 30m',
              price: 4500.00,
              notes: 'Domestic flight'
            }
          ];

          for (const transportType of transportTypes) {
            const { error } = await supabase
              .from('transport_types')
              .insert(transportType);
            
            if (error) {
              console.error(`Error adding transport type:`, error.message);
            } else {
              console.log(`✅ Added transport type: ${transportType.type} for ${route.route_code}`);
            }
          }
        } else {
          console.log(`⏭️  Route ${route.route_code} already has ${existingTypes.length} transport types`);
        }
      }

      // 5. Add sightseeing options
      console.log('\n5. Adding sightseeing options...');
      const route2 = insertedRoutes.find(r => r.route_code === 'BKK-HKT-001');
      if (route2) {
        const { data: existingOptions } = await supabase
          .from('sightseeing_options')
          .select('*')
          .eq('route_id', route2.id);

        if (!existingOptions || existingOptions.length === 0) {
          const sightseeingOptions = [
            {
              route_id: route2.id,
              location: 'Phi Phi Islands',
              description: 'Day trip to beautiful Phi Phi Islands',
              adult_price: 1200.00,
              child_price: 800.00,
              additional_charges: 200.00
            },
            {
              route_id: route2.id,
              location: 'Big Buddha',
              description: 'Visit the iconic Big Buddha statue',
              adult_price: 500.00,
              child_price: 300.00,
              additional_charges: 0.00
            }
          ];

          for (const option of sightseeingOptions) {
            const { error } = await supabase
              .from('sightseeing_options')
              .insert(option);
            
            if (error) {
              console.error(`Error adding sightseeing option:`, error.message);
            } else {
              console.log(`✅ Added sightseeing option: ${option.location}`);
            }
          }
        } else {
          console.log(`⏭️  Route ${route2.route_code} already has ${existingOptions.length} sightseeing options`);
        }
      }
    }

    console.log('\n🎉 Sample data seeding completed!');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.log('Continuing to test with existing data...');
  }
}

// Run the seeding
seedSampleData();