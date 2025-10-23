import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTables() {
  try {
    // Create transport_routes table
    console.log('Creating transport_routes table...');
    const { error: routesError } = await supabase.from('transport_routes').insert({
      id: '00000000-0000-0000-0000-000000000000',
      route_code: 'TEMP',
      route_name: 'Temporary Route',
      country: 'Test',
      transfer_type: 'One-Way',
      start_location: 'Start',
      start_location_full_name: 'Start Location',
      end_location: 'End',
      end_location_full_name: 'End Location'
    }).select();
    
    if (routesError) {
      console.error('Error creating transport_routes:', routesError.message);
    } else {
      console.log('transport_routes table created successfully');
    }

    // Create intermediate_stops table
    console.log('Creating intermediate_stops table...');
    const { error: stopsError } = await supabase.from('intermediate_stops').insert({
      id: '00000000-0000-0000-0000-000000000000',
      route_id: '00000000-0000-0000-0000-000000000000',
      stop_order: 1,
      location_code: 'STOP1',
      full_name: 'Stop 1'
    }).select();
    
    if (stopsError) {
      console.error('Error creating intermediate_stops:', stopsError.message);
    } else {
      console.log('intermediate_stops table created successfully');
    }

    // Create sightseeing_options table
    console.log('Creating sightseeing_options table...');
    const { error: sightseeingError } = await supabase.from('sightseeing_options').insert({
      id: '00000000-0000-0000-0000-000000000000',
      route_id: '00000000-0000-0000-0000-000000000000',
      location: 'Sight 1',
      adult_price: 10.00,
      child_price: 5.00
    }).select();
    
    if (sightseeingError) {
      console.error('Error creating sightseeing_options:', sightseeingError.message);
    } else {
      console.log('sightseeing_options table created successfully');
    }

    // Clean up test data
    console.log('Cleaning up test data...');
    await supabase.from('sightseeing_options').delete().eq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('intermediate_stops').delete().eq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('transport_routes').delete().eq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('All done!');
  } catch (err) {
    console.error('Exception:', err);
  }
}

createTables();