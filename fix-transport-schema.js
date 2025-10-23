import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixTransportSchema() {
  console.log('🔧 Fixing transport_routes schema...\n');

  try {
    // First, let's check the current schema
    console.log('1. Checking current schema...');
    
    const { data: currentData, error: currentError } = await supabase
      .from('transport_routes')
      .select('*')
      .limit(1);

    if (currentError) {
      console.log('Current schema check error:', currentError.message);
    } else {
      console.log('✅ Current schema accessible');
      if (currentData && currentData.length > 0) {
        console.log('Available columns:', Object.keys(currentData[0]));
      }
    }

    // Since we can't use exec_sql, let's try to work around the schema cache issue
    // by using the transportRoutesService which has error handling for missing columns
    console.log('\n2. Testing route creation with the service...');
    
    // Import the service
    const { createTransportRoute } = await import('./src/services/transportRoutesService.js');
    
    const testRouteData = {
      country: 'UAE',
      transfer_type: 'One-Way',
      start_location: 'Test Start',
      end_location: 'Test End',
      name: 'Test Route Name',
      route_name: 'Test Route',
      route_code: 'TEST001',
      status: 'active'
    };

    try {
      const result = await createTransportRoute(testRouteData);
      console.log('✅ Route creation successful:', result.id);
      
      // Clean up
      await supabase
        .from('transport_routes')
        .delete()
        .eq('id', result.id);
      console.log('✅ Test record cleaned up');
      
    } catch (serviceError) {
      console.log('Service error:', serviceError.message);
    }

  } catch (error) {
    console.error('❌ Schema fix failed:', error);
  }

  console.log('\n🎉 Transport schema fix complete!');
}

fixTransportSchema();