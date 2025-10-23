import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTables() {
  try {
    // Create transport_routes table
    console.log('Creating transport_routes table...');
    const { data: routesData, error: routesError } = await supabase
      .from('transport_routes')
      .insert({
        route_code: 'TEST',
        route_name: 'Test Route',
        country: 'Test Country',
        transfer_type: 'One-Way',
        start_location: 'Start',
        start_location_full_name: 'Start Location',
        end_location: 'End',
        end_location_full_name: 'End Location'
      })
      .select();
    
    console.log(routesError ? 'Error creating transport_routes: ' + routesError.message : 'transport_routes table verified');
    
    // Create intermediate_stops table
    console.log('Creating intermediate_stops table...');
    const { data: stopsData, error: stopsError } = await supabase
      .from('intermediate_stops')
      .insert({
        route_id: '00000000-0000-0000-0000-000000000000',
        stop_order: 1,
        location_code: 'STOP1',
        full_name: 'Test Stop'
      })
      .select();
    
    console.log(stopsError ? 'Error creating intermediate_stops: ' + stopsError.message : 'intermediate_stops table verified');
    
    // Create sightseeing_options table
    console.log('Creating sightseeing_options table...');
    const { data: sightseeingData, error: sightseeingError } = await supabase
      .from('sightseeing_options')
      .insert({
        route_id: '00000000-0000-0000-0000-000000000000',
        location: 'Test Location',
        adult_price: 10.00,
        child_price: 5.00
      })
      .select();
    
    console.log(sightseeingError ? 'Error creating sightseeing_options: ' + sightseeingError.message : 'sightseeing_options table verified');
    
    console.log('Verification complete!');
  } catch (err) {
    console.error('Exception:', err);
  }
}

createTables();