import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Simple Transport Tables Setup');
console.log('================================');
console.log(`📍 URL: ${supabaseUrl}`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBasicConnection() {
  try {
    console.log('\n🧪 Testing basic connection...');
    
    // Try to access any existing table to test connection
    const { data, error } = await supabase
      .from('countries')
      .select('id')
      .limit(1);
    
    if (error && !error.message.includes('does not exist')) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Connection successful!');
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

async function createTransportRoutes() {
  try {
    console.log('\n🚀 Creating transport_routes table...');
    
    // Try to insert a test record to see if table exists
    const { data, error } = await supabase
      .from('transport_routes')
      .insert({
        route_name: 'Test Route',
        origin: 'Test Origin',
        destination: 'Test Destination'
      })
      .select();
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ transport_routes table does not exist');
        return false;
      } else {
        console.log('✅ transport_routes table exists (insert failed due to other reason)');
        console.log('   Error:', error.message);
        return true;
      }
    } else {
      console.log('✅ transport_routes table exists and working');
      // Clean up test record
      if (data && data[0]) {
        await supabase
          .from('transport_routes')
          .delete()
          .eq('id', data[0].id);
      }
      return true;
    }
  } catch (err) {
    console.error('❌ Error with transport_routes:', err.message);
    return false;
  }
}

async function createTransportTypes() {
  try {
    console.log('\n🚀 Checking transport_types table...');
    
    const { data, error } = await supabase
      .from('transport_types')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ transport_types table does not exist');
        return false;
      } else {
        console.log('✅ transport_types table exists');
        console.log('   Current columns accessible via select');
        return true;
      }
    } else {
      console.log('✅ transport_types table exists and accessible');
      return true;
    }
  } catch (err) {
    console.error('❌ Error with transport_types:', err.message);
    return false;
  }
}

async function checkIntermediateStops() {
  try {
    console.log('\n🚀 Checking intermediate_stops table...');
    
    const { data, error } = await supabase
      .from('intermediate_stops')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ intermediate_stops table does not exist');
        return false;
      } else {
        console.log('✅ intermediate_stops table exists');
        return true;
      }
    } else {
      console.log('✅ intermediate_stops table exists and accessible');
      return true;
    }
  } catch (err) {
    console.error('❌ Error with intermediate_stops:', err.message);
    return false;
  }
}

async function checkSightseeingOptions() {
  try {
    console.log('\n🚀 Checking sightseeing_options table...');
    
    const { data, error } = await supabase
      .from('sightseeing_options')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ sightseeing_options table does not exist');
        return false;
      } else {
        console.log('✅ sightseeing_options table exists');
        return true;
      }
    } else {
      console.log('✅ sightseeing_options table exists and accessible');
      return true;
    }
  } catch (err) {
    console.error('❌ Error with sightseeing_options:', err.message);
    return false;
  }
}

async function testTransportTypesColumns() {
  try {
    console.log('\n🔍 Testing transport_types columns...');
    
    // Test inserting with different column combinations
    const testInserts = [
      { type: 'Bus' },
      { type: 'Train', price: 100 },
      { type: 'Car', price: 200, duration: '2 hours' }
    ];
    
    for (const testData of testInserts) {
      const { data, error } = await supabase
        .from('transport_types')
        .insert(testData)
        .select();
      
      if (error) {
        console.log(`   ❌ Insert failed for ${JSON.stringify(testData)}: ${error.message}`);
      } else {
        console.log(`   ✅ Insert successful for ${JSON.stringify(testData)}`);
        // Clean up
        if (data && data[0]) {
          await supabase
            .from('transport_types')
            .delete()
            .eq('id', data[0].id);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error testing transport_types columns:', err.message);
  }
}

async function checkTransportRoutesView() {
  try {
    console.log('\n🔍 Checking transport_routes_view...');
    
    const { data, error } = await supabase
      .from('transport_routes_view')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ transport_routes_view does not exist');
        return false;
      } else {
        console.log('✅ transport_routes_view exists but has issues:', error.message);
        return false;
      }
    } else {
      console.log('✅ transport_routes_view exists and accessible');
      return true;
    }
  } catch (err) {
    console.error('❌ Error with transport_routes_view:', err.message);
    return false;
  }
}

async function main() {
  // Test basic connection
  const connected = await testBasicConnection();
  if (!connected) {
    console.error('❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  // Check all transport tables
  const routesExist = await createTransportRoutes();
  const typesExist = await createTransportTypes();
  const stopsExist = await checkIntermediateStops();
  const sightseeingExist = await checkSightseeingOptions();
  
  // Test transport_types columns if table exists
  if (typesExist) {
    await testTransportTypesColumns();
  }
  
  // Check view
  await checkTransportRoutesView();
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`   transport_routes: ${routesExist ? '✅' : '❌'}`);
  console.log(`   transport_types: ${typesExist ? '✅' : '❌'}`);
  console.log(`   intermediate_stops: ${stopsExist ? '✅' : '❌'}`);
  console.log(`   sightseeing_options: ${sightseeingExist ? '✅' : '❌'}`);
  
  if (routesExist && typesExist && stopsExist && sightseeingExist) {
    console.log('\n🎉 All transport tables exist! Ready for CRUD operations.');
  } else {
    console.log('\n⚠️  Some transport tables are missing. Migration needed.');
  }
}

// Run the script
main().catch(console.error);