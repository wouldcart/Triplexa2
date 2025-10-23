const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function examineFullSchema() {
  console.log('🔍 Examining Full Database Schema for Transport Tables...\n');

  const tables = [
    'transport_routes',
    'intermediate_stops', 
    'sightseeing_options',
    'transport_types',
    'location_codes'
  ];

  for (const tableName of tables) {
    console.log(`\n📋 Table: ${tableName}`);
    console.log('='.repeat(50));

    try {
      // Get sample data to understand structure
      const { data: sampleData, error: dataError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (dataError) {
        console.log(`❌ Error accessing ${tableName}:`, dataError.message);
        
        // Check if table exists by trying a count query
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.log(`❌ Table ${tableName} does not exist or is not accessible`);
        } else {
          console.log(`✅ Table ${tableName} exists but has access restrictions`);
        }
        continue;
      }

      // Get record count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      console.log(`📊 Total Records: ${count || 0}`);

      if (sampleData && sampleData.length > 0) {
        console.log('\n📊 Table Structure (from sample data):');
        const sample = sampleData[0];
        Object.keys(sample).forEach(key => {
          const value = sample[key];
          const type = typeof value;
          const isNull = value === null;
          console.log(`  - ${key}: ${isNull ? 'NULL' : type} ${isNull ? '' : `(example: ${JSON.stringify(value)})`}`);
        });

        console.log('\n📈 Sample Record:');
        console.log(JSON.stringify(sample, null, 2));
      } else {
        console.log('  ✅ Table exists but contains no data');
        
        // Try to get structure by inserting and rolling back
        console.log('  📝 Attempting to determine structure...');
      }

    } catch (error) {
      console.log(`❌ Error examining ${tableName}:`, error.message);
    }
  }

  // Test specific queries for known tables
  console.log('\n🧪 Testing Specific Table Operations:');
  console.log('='.repeat(50));

  // Test transport_routes
  try {
    const { data, error } = await supabase
      .from('transport_routes')
      .select('id, route_code, transfer_type, start_location, end_location')
      .limit(1);
    
    if (!error) {
      console.log('✅ transport_routes: Accessible with basic fields');
    } else {
      console.log('❌ transport_routes error:', error.message);
    }
  } catch (e) {
    console.log('❌ transport_routes exception:', e.message);
  }

  // Test intermediate_stops
  try {
    const { data, error } = await supabase
      .from('intermediate_stops')
      .select('*')
      .limit(1);
    
    if (!error) {
      console.log('✅ intermediate_stops: Accessible');
      if (data && data.length > 0) {
        console.log('  Structure:', Object.keys(data[0]));
      }
    } else {
      console.log('❌ intermediate_stops error:', error.message);
    }
  } catch (e) {
    console.log('❌ intermediate_stops exception:', e.message);
  }

  // Test sightseeing_options
  try {
    const { data, error } = await supabase
      .from('sightseeing_options')
      .select('*')
      .limit(1);
    
    if (!error) {
      console.log('✅ sightseeing_options: Accessible');
      if (data && data.length > 0) {
        console.log('  Structure:', Object.keys(data[0]));
      }
    } else {
      console.log('❌ sightseeing_options error:', error.message);
    }
  } catch (e) {
    console.log('❌ sightseeing_options exception:', e.message);
  }

  console.log('\n✅ Schema examination complete!');
}

examineFullSchema().catch(console.error);