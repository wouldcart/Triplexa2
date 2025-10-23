import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function analyzeTransportRoutes() {
  console.log('🔍 Analyzing transport_routes table...\n');

  try {
    // 1. Get table schema information
    console.log('📋 Table Schema Analysis:');
    console.log('=' .repeat(50));
    
    const { data: schemaData, error: schemaError } = await supabase
      .from('transport_routes')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Schema query error:', schemaError);
      return;
    }

    if (schemaData && schemaData.length > 0) {
      const sampleRecord = schemaData[0];
      console.log('Available columns:');
      Object.keys(sampleRecord).forEach((key, index) => {
        const value = sampleRecord[key];
        const type = typeof value;
        const isNull = value === null;
        console.log(`${index + 1}. ${key}: ${isNull ? 'null' : type} ${isNull ? '' : `(${JSON.stringify(value).substring(0, 50)}${JSON.stringify(value).length > 50 ? '...' : ''})`}`);
      });
    }

    // 2. Get total count
    const { count, error: countError } = await supabase
      .from('transport_routes')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Count query error:', countError);
      return;
    }

    console.log(`\n📊 Total records: ${count}`);

    // 3. Analyze status field values
    console.log('\n🔄 Status Field Analysis:');
    console.log('=' .repeat(50));
    
    const { data: statusData, error: statusError } = await supabase
      .from('transport_routes')
      .select('id, name, status')
      .order('created_at', { ascending: false });
    
    if (statusError) {
      console.error('❌ Status query error:', statusError);
      return;
    }

    if (statusData) {
      const statusCounts = {};
      statusData.forEach(record => {
        const status = record.status;
        const statusType = typeof status;
        const statusKey = `${status} (${statusType})`;
        statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
      });

      console.log('Status value distribution:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count} records`);
      });

      console.log('\nFirst 5 records with status:');
      statusData.slice(0, 5).forEach((record, index) => {
        console.log(`${index + 1}. ID: ${record.id}, Name: "${record.name}", Status: ${JSON.stringify(record.status)} (${typeof record.status})`);
      });
    }

    // 4. Analyze vehicle_types and route structure
    console.log('\n🛑 Vehicle Types Analysis:');
    console.log('=' .repeat(50));
    
    const { data: stopsData, error: stopsError } = await supabase
      .from('transport_routes')
      .select('id, name, vehicle_types, route_name, distance, duration')
      .not('vehicle_types', 'is', null)
      .limit(5);
    
    if (stopsError) {
      console.error('❌ Vehicle types query error:', stopsError);
    } else if (stopsData && stopsData.length > 0) {
      console.log(`Found ${stopsData.length} records with vehicle_types data:`);
      stopsData.forEach((record, index) => {
        console.log(`\n${index + 1}. Route: "${record.name}" (ID: ${record.id})`);
        console.log(`   Vehicle Types: ${JSON.stringify(record.vehicle_types, null, 2)}`);
        if (record.route_name) {
          console.log(`   Route Name: ${record.route_name}`);
        }
        if (record.distance) {
          console.log(`   Distance: ${record.distance} km`);
        }
        if (record.duration) {
          console.log(`   Duration: ${record.duration}`);
        }
      });
    } else {
      console.log('No records found with vehicle_types data');
    }

    // 5. Analyze timestamps and route status
    console.log('\n👤 Route Tracking Analysis:');
    console.log('=' .repeat(50));
    
    const { data: userTrackingData, error: userError } = await supabase
      .from('transport_routes')
      .select('id, name, status, enable_sightseeing, created_at, updated_at')
      .limit(5);
    
    if (userError) {
      console.error('❌ Route tracking query error:', userError);
    } else if (userTrackingData) {
      console.log('Route tracking fields analysis:');
      userTrackingData.forEach((record, index) => {
        console.log(`\n${index + 1}. Route: "${record.name}" (ID: ${record.id})`);
        console.log(`   Status: ${record.status || 'null'}`);
        console.log(`   Sightseeing Enabled: ${record.enable_sightseeing || false}`);
        console.log(`   Created At: ${record.created_at}`);
        console.log(`   Updated At: ${record.updated_at}`);
      });

      // Check route status distribution
      const activeRoutes = userTrackingData.filter(r => r.status === 'active').length;
      const sightseeingEnabled = userTrackingData.filter(r => r.enable_sightseeing).length;
      
      console.log(`\n📈 Route status summary:`);
      console.log(`   Active routes: ${activeRoutes}/${userTrackingData.length}`);
      console.log(`   Sightseeing enabled: ${sightseeingEnabled}/${userTrackingData.length}`);
    }

    // 6. Get specific records that might contain div references
    console.log('\n🔍 Searching for records with specific patterns:');
    console.log('=' .repeat(50));
    
    const { data: searchData, error: searchError } = await supabase
      .from('transport_routes')
      .select('*')
      .or('name.ilike.%div%,notes.ilike.%div%,route_name.ilike.%div%')
      .limit(10);
    
    if (searchError) {
      console.error('❌ Search query error:', searchError);
    } else if (searchData && searchData.length > 0) {
      console.log(`Found ${searchData.length} records containing 'div':`);
      searchData.forEach((record, index) => {
        console.log(`\n${index + 1}. Route: "${record.name}" (ID: ${record.id})`);
        console.log(`   Country: ${record.country}`);
        console.log(`   Transfer Type: ${record.transfer_type}`);
        console.log(`   Status: ${JSON.stringify(record.status)}`);
        if (record.notes) console.log(`   Notes: ${record.notes}`);
        if (record.route_name) console.log(`   Route Name: ${record.route_name}`);
      });
    } else {
      console.log('No records found containing "div" pattern');
    }

    // 7. Sample complete record for reference
    console.log('\n📄 Sample Complete Record:');
    console.log('=' .repeat(50));
    
    const { data: sampleData, error: sampleError } = await supabase
      .from('transport_routes')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Sample query error:', sampleError);
    } else if (sampleData && sampleData.length > 0) {
      console.log('Complete record structure:');
      console.log(JSON.stringify(sampleData[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

// Run the analysis
analyzeTransportRoutes()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });