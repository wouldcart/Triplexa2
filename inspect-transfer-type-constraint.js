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

async function inspectTransferTypeConstraint() {
  console.log('🔍 Inspecting transfer_type constraint...\n');

  try {
    // Method 1: Check if there are any existing routes with transfer_type values
    console.log('1. Checking for existing routes with transfer_type values...');
    
    const { data: existingRoutes, error: existingError } = await supabase
      .from('transport_routes')
      .select('transfer_type')
      .not('transfer_type', 'is', null);

    if (existingError) {
      console.log('❌ Error checking existing routes:', existingError.message);
    } else {
      console.log(`Found ${existingRoutes.length} existing routes with transfer_type`);
      if (existingRoutes.length > 0) {
        const uniqueTypes = [...new Set(existingRoutes.map(r => r.transfer_type))];
        console.log('Existing transfer_type values:', uniqueTypes);
      }
    }

    // Method 2: Try to get constraint information using a different approach
    console.log('\n2. Attempting to query constraint information...');
    
    // Try using the PostgREST API to get table info
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });

    if (response.ok) {
      console.log('✅ PostgREST API accessible');
    }

    // Method 3: Try inserting with NULL transfer_type to see the constraint error
    console.log('\n3. Testing with NULL transfer_type to see constraint details...');
    
    const testWithNull = {
      route_code: 'NULL_TEST',
      route_name: 'Null Transfer Type Test',
      country: 'UAE',
      start_location: 'Test Start',
      start_location_full_name: 'Test Start Full',
      end_location: 'Test End',
      end_location_full_name: 'Test End Full'
      // Deliberately omitting transfer_type
    };

    const { data: nullTest, error: nullError } = await supabase
      .from('transport_routes')
      .insert([testWithNull])
      .select();

    if (nullError) {
      console.log('❌ NULL test error:', nullError.message);
      console.log('Error details:', nullError);
    } else {
      console.log('✅ NULL test succeeded (unexpected)');
      // Clean up if successful
      if (nullTest && nullTest.length > 0) {
        await supabase
          .from('transport_routes')
          .delete()
          .eq('id', nullTest[0].id);
      }
    }

    // Method 4: Try some transport-type related values
    console.log('\n4. Testing transport-type related values...');
    
    const transportTypeValues = [
      'Ferry', 'Sedan', 'SUV', 'Van', 'Minibus', 'Speedboat', 'SIC'
    ];

    for (const typeValue of transportTypeValues) {
      const testData = {
        route_code: `TYPE_${typeValue.toUpperCase()}`,
        route_name: `Test Route ${typeValue}`,
        country: 'UAE',
        transfer_type: typeValue,
        start_location: 'Test Start',
        start_location_full_name: 'Test Start Full',
        end_location: 'Test End',
        end_location_full_name: 'Test End Full'
      };

      const { data: typeTest, error: typeError } = await supabase
        .from('transport_routes')
        .insert([testData])
        .select();

      if (!typeError) {
        console.log(`   ✅ SUCCESS: "${typeValue}" is a valid transfer_type!`);
        
        // Clean up successful test
        if (typeTest && typeTest.length > 0) {
          await supabase
            .from('transport_routes')
            .delete()
            .eq('id', typeTest[0].id);
        }
        
        // Found a valid value, let's use it to create sample data
        console.log(`\n🎉 Found valid transfer_type: "${typeValue}"`);
        console.log('Creating sample routes with this value...');
        
        const sampleRoutes = [
          {
            route_code: 'SAMPLE_001',
            route_name: 'Dubai Airport to Downtown',
            country: 'UAE',
            transfer_type: typeValue,
            start_location: 'Dubai International Airport',
            start_location_full_name: 'Dubai International Airport (DXB)',
            end_location: 'Downtown Dubai',
            end_location_full_name: 'Downtown Dubai - Burj Khalifa Area',
            description: 'Express transfer from airport to downtown',
            distance: 15
          },
          {
            route_code: 'SAMPLE_002',
            route_name: 'Marina to Mall of Emirates',
            country: 'UAE',
            transfer_type: typeValue,
            start_location: 'Dubai Marina',
            start_location_full_name: 'Dubai Marina - JBR Area',
            end_location: 'Mall of Emirates',
            end_location_full_name: 'Mall of Emirates - Ski Dubai',
            description: 'Shopping and entertainment route',
            distance: 12
          }
        ];

        let successCount = 0;
        for (let i = 0; i < sampleRoutes.length; i++) {
          const route = sampleRoutes[i];
          const { data: sampleData, error: sampleError } = await supabase
            .from('transport_routes')
            .insert([route])
            .select();

          if (sampleError) {
            console.log(`   ❌ Sample route ${i + 1} failed: ${sampleError.message}`);
          } else {
            console.log(`   ✅ Sample route ${i + 1} created: ${route.route_code}`);
            successCount++;
          }
        }

        console.log(`\n📊 Created ${successCount}/${sampleRoutes.length} sample routes successfully`);
        
        // Verify the data
        const { data: verifyData, error: verifyError } = await supabase
          .from('transport_routes')
          .select('route_code, route_name, transfer_type, start_location, end_location')
          .order('route_code');

        if (verifyError) {
          console.log('❌ Verification failed:', verifyError.message);
        } else {
          console.log(`\n✅ Verification: ${verifyData.length} total routes in database`);
          verifyData.forEach(route => {
            console.log(`   ${route.route_code}: ${route.start_location} → ${route.end_location} (${route.transfer_type})`);
          });
        }
        
        return; // Exit early since we found a working value
      } else if (typeError.code === '23514') {
        console.log(`   ❌ Invalid: "${typeValue}"`);
      } else {
        console.log(`   ⚠️ Other error for "${typeValue}": ${typeError.message}`);
      }
    }

    console.log('\n❌ No valid transfer_type values found in transport types');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the inspection
inspectTransferTypeConstraint().then(() => {
  console.log('\n🏁 Transfer type constraint inspection complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Inspection failed:', error);
  process.exit(1);
});