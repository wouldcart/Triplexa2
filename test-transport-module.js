import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚌 Inspecting Transport Route Module Schema...\n');

async function inspectTransportRoutesSchema() {
  console.log('📋 Inspecting transport_routes table structure...');
  
  try {
    // First, let's see what columns exist in transport_routes
    const { data: routes, error: routesError } = await supabaseAdmin
      .from('transport_routes')
      .select('*')
      .limit(1);
    
    if (routesError) {
      console.error('❌ Failed to query transport_routes:', routesError.message);
      return;
    }
    
    if (routes && routes.length > 0) {
      console.log('✅ transport_routes table accessible');
      console.log('📊 Available columns:');
      Object.keys(routes[0]).forEach(column => {
        console.log(`  - ${column}: ${typeof routes[0][column]} (${routes[0][column]})`);
      });
    } else {
      console.log('⚠️ transport_routes table is empty');
      
      // Try to get table info from information_schema
      const { data: columns, error: columnsError } = await supabaseAdmin
        .rpc('get_table_columns', { table_name: 'transport_routes' })
        .single();
      
      if (columnsError) {
        console.log('📝 Attempting basic select to understand structure...');
        const { data: emptyData, error: emptyError } = await supabaseAdmin
          .from('transport_routes')
          .select('*')
          .limit(0);
        
        if (emptyError) {
          console.error('❌ Cannot access transport_routes:', emptyError.message);
        } else {
          console.log('✅ transport_routes table exists but is empty');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Schema inspection failed:', error.message);
  }
}

async function testBasicQueries() {
  console.log('\n📋 Testing basic queries without foreign keys...');
  
  try {
    // Test simple select
    console.log('\n🔧 Testing simple select...');
    const { data: simpleRoutes, error: simpleError } = await supabaseAdmin
      .from('transport_routes')
      .select('*')
      .limit(5);
    
    if (simpleError) {
      console.error('❌ Simple select failed:', simpleError.message);
    } else {
      console.log(`✅ Simple select successful: ${simpleRoutes.length} routes found`);
      
      if (simpleRoutes.length > 0) {
        console.log('📊 Sample route data:');
        const route = simpleRoutes[0];
        console.log('Available fields:');
        Object.keys(route).forEach(key => {
          console.log(`  - ${key}: ${route[key]}`);
        });
      }
    }
    
    // Test with common filter conditions
    console.log('\n🔧 Testing with status filter...');
    const { data: activeRoutes, error: activeError } = await supabaseAdmin
      .from('transport_routes')
      .select('*')
      .eq('status', 'active')
      .limit(5);
    
    if (activeError) {
      console.error('❌ Status filter failed:', activeError.message);
    } else {
      console.log(`✅ Status filter successful: ${activeRoutes.length} active routes found`);
    }
    
  } catch (error) {
    console.error('❌ Basic queries failed:', error.message);
  }
}

async function testLocationCodesRelationship() {
  console.log('\n📍 Testing location_codes relationship...');
  
  try {
    // First check what location-related columns exist in transport_routes
    const { data: routes, error: routesError } = await supabaseAdmin
      .from('transport_routes')
      .select('*')
      .limit(1);
    
    if (routesError || !routes || routes.length === 0) {
      console.log('⚠️ Cannot inspect transport_routes for location columns');
      return;
    }
    
    const route = routes[0];
    const locationColumns = Object.keys(route).filter(key => 
      key.includes('location') || key.includes('start') || key.includes('end')
    );
    
    console.log('📊 Location-related columns in transport_routes:');
    locationColumns.forEach(col => {
      console.log(`  - ${col}: ${route[col]}`);
    });
    
    // Try to manually join with location_codes if we find the right columns
    if (locationColumns.length > 0) {
      console.log('\n🔗 Attempting manual join with location_codes...');
      
      // Get all routes first
      const { data: allRoutes, error: allRoutesError } = await supabaseAdmin
        .from('transport_routes')
        .select('*')
        .limit(5);
      
      if (allRoutesError) {
        console.error('❌ Failed to get routes for manual join:', allRoutesError.message);
        return;
      }
      
      // Get all location codes
      const { data: locations, error: locationsError } = await supabaseAdmin
        .from('location_codes')
        .select('*');
      
      if (locationsError) {
        console.error('❌ Failed to get location codes:', locationsError.message);
        return;
      }
      
      console.log(`✅ Manual join data: ${allRoutes.length} routes, ${locations.length} locations`);
      
      // Try to match routes with locations
      if (allRoutes.length > 0 && locations.length > 0) {
        console.log('\n📊 Route-Location matching:');
        allRoutes.forEach((route, index) => {
          console.log(`\nRoute ${index + 1}:`);
          locationColumns.forEach(col => {
            const value = route[col];
            const matchingLocation = locations.find(loc => 
              loc.code === value || loc.full_name === value
            );
            console.log(`  ${col}: ${value} ${matchingLocation ? '✅' : '❌'}`);
          });
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Location relationship test failed:', error.message);
  }
}

async function runSchemaInspection() {
  console.log('🚀 Starting Transport Route Schema Inspection...\n');
  
  await inspectTransportRoutesSchema();
  await testBasicQueries();
  await testLocationCodesRelationship();
  
  console.log('\n🎉 Schema inspection completed!');
  console.log('\n📝 Next steps:');
  console.log('- Check if transport_routes table needs to be populated');
  console.log('- Verify foreign key relationships are properly defined');
  console.log('- Ensure column names match what the application expects');
}

runSchemaInspection();