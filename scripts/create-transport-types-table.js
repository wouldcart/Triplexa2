import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTransportTypesTable() {
  try {
    console.log('Creating transport_types table...');
    
    // Since we can't create tables via PostgREST, let's insert default data
    // and assume the table exists or will be created manually
    
    // First, let's try to insert some default data
    const defaultData = [
      { name: 'Sedan', category: 'Economy', seating_capacity: 3, luggage_capacity: 2, active: true },
      { name: 'SUV', category: 'Standard', seating_capacity: 5, luggage_capacity: 3, active: true },
      { name: 'Van', category: 'Premium', seating_capacity: 9, luggage_capacity: 5, active: true },
      { name: 'Minibus', category: 'Standard', seating_capacity: 15, luggage_capacity: 8, active: true },
      { name: 'Coach', category: 'Standard', seating_capacity: 40, luggage_capacity: 20, active: true },
      { name: 'Ferry', category: 'Economy', seating_capacity: 100, luggage_capacity: 50, active: true },
      { name: 'Speedboat', category: 'Premium', seating_capacity: 12, luggage_capacity: 6, active: true },
      { name: 'Luxury Van', category: 'Luxury', seating_capacity: 8, luggage_capacity: 4, active: true }
    ];
    
    console.log('⚠️  Note: The transport_types table needs to be created manually in Supabase SQL Editor');
    console.log('Please run the SQL from create_transport_types_table.sql in your Supabase dashboard');
    console.log('');
    console.log('For now, let\'s test the connection and proceed with the component enhancement...');
    
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('countries')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection test failed:', testError);
    } else {
      console.log('✅ Supabase connection successful');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
createTransportTypesTable();