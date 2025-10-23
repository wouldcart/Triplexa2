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

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTransportRoutesColumns() {
  console.log('🔍 Testing transport_routes column names...\n');

  // Test different possible column combinations
  const columnTests = [
    // From Supabase types
    ['start_location_code', 'end_location_code'],
    // From direct-tables.sql
    ['start_location', 'end_location'],
    // From transport_routes_schema.sql
    ['start_location', 'end_location'],
    // Other possibilities
    ['from_location', 'to_location'],
    ['origin', 'destination']
  ];

  for (const [startCol, endCol] of columnTests) {
    console.log(`Testing columns: ${startCol}, ${endCol}`);
    
    try {
      const { data, error } = await supabase
        .from('transport_routes')
        .select(`id, route_code, ${startCol}, ${endCol}`)
        .limit(1);

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Success! These columns exist: ${startCol}, ${endCol}`);
        if (data && data.length > 0) {
          console.log(`   📄 Sample data:`, data[0]);
        }
        return { startCol, endCol }; // Return the working column names
      }
    } catch (err) {
      console.log(`   💥 Unexpected error: ${err.message}`);
    }
    
    console.log('');
  }

  // If none worked, let's try to get any data to see what columns are available
  console.log('🔍 Trying to get any data from transport_routes...');
  try {
    const { data, error } = await supabase
      .from('transport_routes')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Success! Sample record:`, data[0]);
      if (data && data.length > 0) {
        console.log(`   🔑 Available columns:`, Object.keys(data[0]));
      }
    }
  } catch (err) {
    console.log(`   💥 Unexpected error: ${err.message}`);
  }

  return null;
}

// Run the test
testTransportRoutesColumns();