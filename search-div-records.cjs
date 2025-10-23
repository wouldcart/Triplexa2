require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function searchDivRecords() {
  console.log('🔍 Searching for records containing "div" patterns...\n');

  try {
    // Search in all text fields for "div" pattern
    const { data: routes, error } = await supabase
      .from('transport_routes')
      .select('*')
      .or(`name.ilike.%div%,route_name.ilike.%div%,notes.ilike.%div%,start_location.ilike.%div%,end_location.ilike.%div%,start_location_full_name.ilike.%div%,end_location_full_name.ilike.%div%`);

    if (error) {
      console.error('❌ Error searching records:', error);
      return;
    }

    console.log(`📊 Found ${routes.length} records containing "div" pattern:`);
    
    if (routes.length === 0) {
      console.log('No records found containing "div" pattern in text fields.');
      
      // Let's also search in JSON fields (vehicle_types)
      console.log('\n🔍 Searching in JSON fields...');
      
      const { data: jsonRoutes, error: jsonError } = await supabase
        .from('transport_routes')
        .select('*')
        .not('vehicle_types', 'is', null);

      if (jsonError) {
        console.error('❌ Error searching JSON fields:', jsonError);
        return;
      }

      console.log(`📊 Found ${jsonRoutes.length} records with vehicle_types data:`);
      
      // Check each record for "div" in JSON fields
      const divInJson = jsonRoutes.filter(route => {
        const jsonStr = JSON.stringify(route);
        return jsonStr.toLowerCase().includes('div');
      });

      console.log(`📊 Found ${divInJson.length} records containing "div" in JSON data:`);
      
      if (divInJson.length > 0) {
        divInJson.forEach((route, index) => {
          console.log(`\n${index + 1}. Route: "${route.name}" (ID: ${route.id})`);
          console.log(`   Vehicle Types:`, route.vehicle_types);
          console.log(`   Route Name:`, route.route_name);
          console.log(`   Notes:`, route.notes);
        });
      }
    } else {
      routes.forEach((route, index) => {
        console.log(`\n${index + 1}. Route: "${route.name}" (ID: ${route.id})`);
        console.log(`   Start Location: ${route.start_location}`);
        console.log(`   End Location: ${route.end_location}`);
        console.log(`   Route Name: ${route.route_name}`);
        console.log(`   Notes: ${route.notes}`);
        console.log(`   Vehicle Types:`, route.vehicle_types);
      });
    }

    // Also search for any records that might have HTML-like content
    console.log('\n🔍 Searching for HTML-like patterns...');
    
    const { data: htmlRoutes, error: htmlError } = await supabase
      .from('transport_routes')
      .select('*')
      .or(`name.ilike.%<%,route_name.ilike.%<%,notes.ilike.%<%`);

    if (!htmlError && htmlRoutes.length > 0) {
      console.log(`📊 Found ${htmlRoutes.length} records with HTML-like patterns:`);
      htmlRoutes.forEach((route, index) => {
        console.log(`\n${index + 1}. Route: "${route.name}" (ID: ${route.id})`);
        console.log(`   Contains HTML-like content`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

searchDivRecords().then(() => {
  console.log('\n✅ Search complete');
});