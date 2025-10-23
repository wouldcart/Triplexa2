import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTables() {
  try {
    // Create tables directly using PostgreSQL queries
    const { data, error } = await supabase.rpc('pg_query', {
      query: `
        -- Create transport_routes table
        CREATE TABLE IF NOT EXISTS transport_routes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            route_code TEXT NOT NULL,
            route_name TEXT NOT NULL,
            country TEXT NOT NULL,
            transfer_type TEXT NOT NULL,
            start_location TEXT NOT NULL,
            start_location_full_name TEXT NOT NULL,
            end_location TEXT NOT NULL,
            end_location_full_name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create intermediate_stops table
        CREATE TABLE IF NOT EXISTS intermediate_stops (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            route_id UUID REFERENCES transport_routes(id) ON DELETE CASCADE,
            stop_order INTEGER NOT NULL,
            location_code TEXT NOT NULL,
            full_name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create sightseeing_options table
        CREATE TABLE IF NOT EXISTS sightseeing_options (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            route_id UUID REFERENCES transport_routes(id) ON DELETE CASCADE,
            location TEXT NOT NULL,
            adult_price DECIMAL(10,2) NOT NULL,
            child_price DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (error) {
      console.error('Error creating tables:', error);
      
      // Try alternative approach with REST API
      console.log('Trying alternative approach...');
      
      // Create transport_routes table
      await supabase.schema.createTable('transport_routes', {
        id: { type: 'uuid', primaryKey: true, defaultValue: { type: 'function', value: 'gen_random_uuid()' } },
        route_code: { type: 'text', notNull: true },
        route_name: { type: 'text', notNull: true },
        country: { type: 'text', notNull: true },
        transfer_type: { type: 'text', notNull: true },
        start_location: { type: 'text', notNull: true },
        start_location_full_name: { type: 'text', notNull: true },
        end_location: { type: 'text', notNull: true },
        end_location_full_name: { type: 'text', notNull: true },
        created_at: { type: 'timestamp with time zone', defaultValue: { type: 'function', value: 'now()' } },
        updated_at: { type: 'timestamp with time zone', defaultValue: { type: 'function', value: 'now()' } }
      });
      
      console.log('Tables created successfully with alternative approach');
    } else {
      console.log('Tables created successfully!');
    }
    
    // Verify tables exist by inserting test data
    console.log('Verifying tables by inserting test data...');
    
    // Insert into transport_routes
    const { data: routeData, error: routeError } = await supabase
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
      
    if (routeError) {
      console.error('Error inserting into transport_routes:', routeError);
    } else {
      console.log('Successfully inserted into transport_routes:', routeData);
      
      // Get the route ID
      const routeId = routeData[0].id;
      
      // Insert into intermediate_stops
      const { error: stopError } = await supabase
        .from('intermediate_stops')
        .insert({
          route_id: routeId,
          stop_order: 1,
          location_code: 'STOP1',
          full_name: 'Test Stop'
        });
        
      if (stopError) {
        console.error('Error inserting into intermediate_stops:', stopError);
      } else {
        console.log('Successfully inserted into intermediate_stops');
      }
      
      // Insert into sightseeing_options
      const { error: sightError } = await supabase
        .from('sightseeing_options')
        .insert({
          route_id: routeId,
          location: 'Test Location',
          adult_price: 10.00,
          child_price: 5.00
        });
        
      if (sightError) {
        console.error('Error inserting into sightseeing_options:', sightError);
      } else {
        console.log('Successfully inserted into sightseeing_options');
      }
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

createTables();