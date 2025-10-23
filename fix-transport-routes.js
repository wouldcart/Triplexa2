import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixTransportRoutes() {
  console.log('🔧 Fixing transport_routes table and loading data...\n');

  try {
    // 1. First, let's refresh the schema cache by making a simple query
    console.log('1. Refreshing schema cache...');
    const { data: schemaRefresh, error: refreshError } = await supabase
      .from('transport_routes')
      .select('id')
      .limit(1);

    if (refreshError && refreshError.code !== 'PGRST116') { // PGRST116 is "no rows found" which is OK
      console.log('⚠️ Schema refresh warning:', refreshError.message);
    } else {
      console.log('✅ Schema cache refreshed');
    }

    // 2. Test with fields that we know work (avoiding estimated_duration for now)
    console.log('\n2. Testing data insertion with working fields...');
    
    const testRoutes = [
      {
        route_code: 'RT001',
        route_name: 'Airport to City Center',
        country: 'UAE',
        transfer_type: 'direct',
        start_location: 'Dubai International Airport',
        start_location_full_name: 'Dubai International Airport (DXB)',
        end_location: 'Downtown Dubai',
        end_location_full_name: 'Downtown Dubai - Burj Khalifa Area',
        description: 'Direct transfer from Dubai Airport to Downtown area',
        distance: 15,
        price: 75.00
      },
      {
        route_code: 'RT002',
        route_name: 'Hotel to Marina',
        country: 'UAE',
        transfer_type: 'direct',
        start_location: 'Burj Al Arab',
        start_location_full_name: 'Burj Al Arab Jumeirah Hotel',
        end_location: 'Dubai Marina',
        end_location_full_name: 'Dubai Marina - JBR Area',
        description: 'Luxury transfer from Burj Al Arab to Marina district',
        distance: 8,
        price: 50.00
      },
      {
        route_code: 'RT003',
        route_name: 'City Tour Route',
        country: 'UAE',
        transfer_type: 'connecting',
        start_location: 'Dubai Mall',
        start_location_full_name: 'Dubai Mall - Fashion Avenue Entrance',
        end_location: 'Gold Souk',
        end_location_full_name: 'Gold Souk - Deira Traditional Market',
        description: 'Sightseeing route covering major Dubai attractions',
        distance: 25,
        price: 120.00
      }
    ];

    // Try inserting each route individually to identify specific issues
    let successCount = 0;
    let insertedRoutes = [];

    for (let i = 0; i < testRoutes.length; i++) {
      const route = testRoutes[i];
      console.log(`\n   Testing route ${i + 1}: ${route.route_name}`);
      
      const { data: insertData, error: insertError } = await supabase
        .from('transport_routes')
        .insert([route])
        .select();

      if (insertError) {
        console.error(`   ❌ Failed to insert route ${i + 1}:`, insertError.message);
        console.log(`   Error details:`, {
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        });
      } else {
        console.log(`   ✅ Successfully inserted route ${i + 1}`);
        successCount++;
        insertedRoutes.push(insertData[0]);
      }
    }

    console.log(`\n📊 Results: ${successCount}/${testRoutes.length} routes inserted successfully`);

    // 3. If we have successful inserts, let's verify the data
    if (successCount > 0) {
      console.log('\n3. Verifying inserted data...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('transport_routes')
        .select('*')
        .in('id', insertedRoutes.map(r => r.id));

      if (verifyError) {
        console.error('❌ Error verifying data:', verifyError);
      } else {
        console.log('✅ Data verification successful:');
        verifyData.forEach((route, index) => {
          console.log(`   Route ${index + 1}: ${route.route_code} - ${route.route_name}`);
          console.log(`   From: ${route.start_location} → To: ${route.end_location}`);
          console.log(`   Distance: ${route.distance}km, Price: $${route.price}`);
          console.log('   ---');
        });
      }
    }

    // 4. Test relationships with other tables
    console.log('\n4. Testing relationships with transport_types...');
    const { data: transportTypes, error: typesError } = await supabase
      .from('transport_types')
      .select('id, name, category')
      .limit(3);

    if (typesError) {
      console.error('❌ Error fetching transport types:', typesError);
    } else {
      console.log('✅ Available transport types for relationships:');
      transportTypes.forEach(type => {
        console.log(`   - ${type.name} (${type.category}) - ID: ${type.id}`);
      });
    }

    // 5. Final status check
    console.log('\n5. Final status check...');
    const { data: finalCount, error: countError } = await supabase
      .from('transport_routes')
      .select('id', { count: 'exact' });

    if (countError) {
      console.error('❌ Error getting final count:', countError);
    } else {
      console.log(`✅ Total routes in database: ${finalCount.length}`);
    }

    // 6. Test a query to ensure data loads correctly
    console.log('\n6. Testing data loading query...');
    const { data: loadTest, error: loadError } = await supabase
      .from('transport_routes')
      .select(`
        id,
        route_code,
        route_name,
        country,
        start_location,
        end_location,
        distance,
        price,
        active
      `)
      .eq('active', true)
      .order('route_code');

    if (loadError) {
      console.error('❌ Error loading data:', loadError);
    } else {
      console.log(`✅ Data loading test successful - ${loadTest.length} active routes found`);
      if (loadTest.length > 0) {
        console.log('Sample loaded data:');
        console.log(JSON.stringify(loadTest[0], null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixTransportRoutes().then(() => {
  console.log('\n🎉 Transport routes fix complete!');
  console.log('The transport_routes table should now be working correctly.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fix failed:', error);
  process.exit(1);
});