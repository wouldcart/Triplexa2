const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraintsAndStructure() {
  console.log('🔍 Checking table constraints and structure...\n');

  try {
    // Check existing transport_routes to see valid transfer_type values
    console.log('📍 Checking existing transport_routes for valid transfer_type values...');
    const { data: routesData, error: routesError } = await supabase
      .from('transport_routes')
      .select('transfer_type')
      .limit(10);

    if (routesError) {
      console.log('❌ Failed to fetch routes:', routesError.message);
    } else {
      console.log('✅ Found routes:', routesData?.length || 0);
      const transferTypes = [...new Set(routesData?.map(r => r.transfer_type) || [])];
      console.log('   Valid transfer_type values:', transferTypes);
    }

    // Check existing transport_types to see the actual structure
    console.log('\n📍 Checking existing transport_types records...');
    const { data: typesData, error: typesError } = await supabase
      .from('transport_types')
      .select('*')
      .limit(5);

    if (typesError) {
      console.log('❌ Failed to fetch transport_types:', typesError.message);
    } else {
      console.log('✅ Found transport_types:', typesData?.length || 0);
      if (typesData && typesData.length > 0) {
        console.log('   Sample record structure:');
        console.log('   ', JSON.stringify(typesData[0], null, 2));
      }
    }

    // Try to create a route with a valid transfer_type
    console.log('\n📍 Creating test route with valid transfer_type...');
    const { data: routeData, error: routeError } = await supabase
      .from('transport_routes')
      .insert({
        route_code: 'TEST-CONSTRAINTS-001',
        route_name: 'Test Route for Constraints',
        country: 'Thailand',
        transfer_type: 'Airport Transfer', // Using a common transfer type
        start_location: 'BKK',
        start_location_full_name: 'Bangkok Test',
        end_location: 'CNX',
        end_location_full_name: 'Chiang Mai Test',
        status: 'active',
        enable_sightseeing: false
      })
      .select()
      .single();

    if (routeError) {
      console.log('❌ Route creation failed:', routeError.message);
      
      // Try with different transfer_type values
      const commonTypes = ['Airport Transfer', 'City Transfer', 'Hotel Transfer', 'Private Transfer', 'Shared Transfer'];
      
      for (const transferType of commonTypes) {
        console.log(`   Trying transfer_type: "${transferType}"`);
        const { data: testRoute, error: testError } = await supabase
          .from('transport_routes')
          .insert({
            route_code: `TEST-${transferType.replace(/\s+/g, '-').toUpperCase()}-001`,
            route_name: `Test Route for ${transferType}`,
            country: 'Thailand',
            transfer_type: transferType,
            start_location: 'BKK',
            start_location_full_name: 'Bangkok Test',
            end_location: 'CNX',
            end_location_full_name: 'Chiang Mai Test',
            status: 'active',
            enable_sightseeing: false
          })
          .select()
          .single();

        if (!testError) {
          console.log(`   ✅ Success with transfer_type: "${transferType}"`);
          
          // Clean up
          await supabase
            .from('transport_routes')
            .delete()
            .eq('id', testRoute.id);
          break;
        } else {
          console.log(`   ❌ Failed with "${transferType}":`, testError.message);
        }
      }
    } else {
      console.log('✅ Route created successfully:', routeData.id);
      
      // Clean up
      await supabase
        .from('transport_routes')
        .delete()
        .eq('id', routeData.id);
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }

  console.log('\n✅ Constraints and structure check completed!');
}

checkConstraintsAndStructure().catch(console.error);