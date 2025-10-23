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

async function checkSchemaConstraints() {
  console.log('🔍 Checking schema constraints for transport_routes...\n');

  try {
    // Method 1: Try to query information_schema for constraints
    console.log('1. Attempting to query constraint information...');
    
    const constraintQuery = `
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        cc.check_clause,
        kcu.column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.check_constraints cc 
        ON tc.constraint_name = cc.constraint_name
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'transport_routes'
        AND tc.table_schema = 'public'
      ORDER BY tc.constraint_type, tc.constraint_name;
    `;

    const { data: constraints, error: constraintError } = await supabase.rpc('exec_sql', {
      sql: constraintQuery
    });

    if (constraintError) {
      console.log('❌ Constraint query failed:', constraintError.message);
      
      // Try alternative approach using pg_constraint
      console.log('\n2. Trying alternative constraint query...');
      
      const altQuery = `
        SELECT 
          conname as constraint_name,
          contype as constraint_type,
          pg_get_constraintdef(oid) as constraint_definition
        FROM pg_constraint 
        WHERE conrelid = 'public.transport_routes'::regclass;
      `;

      const { data: altConstraints, error: altError } = await supabase.rpc('exec_sql', {
        sql: altQuery
      });

      if (altError) {
        console.log('❌ Alternative constraint query failed:', altError.message);
      } else {
        console.log('✅ Alternative constraint query succeeded:');
        console.log(JSON.stringify(altConstraints, null, 2));
      }
    } else {
      console.log('✅ Constraint query succeeded:');
      console.log(JSON.stringify(constraints, null, 2));
    }

    // Method 2: Check the table structure
    console.log('\n3. Checking table structure...');
    
    const structureQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'transport_routes' 
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    const { data: structure, error: structureError } = await supabase.rpc('exec_sql', {
      sql: structureQuery
    });

    if (structureError) {
      console.log('❌ Structure query failed:', structureError.message);
    } else {
      console.log('✅ Table structure:');
      console.log(JSON.stringify(structure, null, 2));
    }

    // Method 3: Try some enum-like values that might be valid
    console.log('\n4. Testing potential enum values...');
    
    const potentialValues = [
      'pickup', 'dropoff', 'roundtrip', 'oneway', 'return',
      'airport_transfer', 'city_transfer', 'intercity',
      'shared', 'private', 'group',
      'standard', 'premium', 'economy', 'luxury',
      'scheduled', 'on_demand', 'charter',
      'land', 'sea', 'air',
      'domestic', 'international',
      'inbound', 'outbound',
      'arrival', 'departure'
    ];

    let validValues = [];

    for (const value of potentialValues) {
      const testData = {
        route_code: `TEST_${value.toUpperCase()}`,
        route_name: `Test Route ${value}`,
        country: 'UAE',
        transfer_type: value,
        start_location: 'Test Start',
        start_location_full_name: 'Test Start Full',
        end_location: 'Test End',
        end_location_full_name: 'Test End Full'
      };

      const { data: testResult, error: testError } = await supabase
        .from('transport_routes')
        .insert([testData])
        .select();

      if (!testError) {
        console.log(`   ✅ VALID: "${value}"`);
        validValues.push(value);
        
        // Clean up successful test
        if (testResult && testResult.length > 0) {
          await supabase
            .from('transport_routes')
            .delete()
            .eq('id', testResult[0].id);
        }
      } else if (testError.code === '23514') {
        console.log(`   ❌ Invalid: "${value}"`);
      } else {
        console.log(`   ⚠️ Other error for "${value}": ${testError.message}`);
      }
    }

    if (validValues.length > 0) {
      console.log(`\n🎉 Found ${validValues.length} valid transfer_type values:`, validValues);
      
      // Create sample data with the first valid value
      const validType = validValues[0];
      console.log(`\n📝 Creating sample routes with transfer_type: "${validType}"`);
      
      const sampleRoutes = [
        {
          route_code: 'ROUTE_001',
          route_name: 'Dubai Airport to Downtown',
          country: 'UAE',
          transfer_type: validType,
          start_location: 'Dubai International Airport',
          start_location_full_name: 'Dubai International Airport (DXB)',
          end_location: 'Downtown Dubai',
          end_location_full_name: 'Downtown Dubai - Burj Khalifa Area',
          description: 'Express transfer from airport to downtown',
          distance: 15
        },
        {
          route_code: 'ROUTE_002',
          route_name: 'Marina to Mall of Emirates',
          country: 'UAE',
          transfer_type: validType,
          start_location: 'Dubai Marina',
          start_location_full_name: 'Dubai Marina - JBR Area',
          end_location: 'Mall of Emirates',
          end_location_full_name: 'Mall of Emirates - Ski Dubai',
          description: 'Shopping and entertainment route',
          distance: 12
        },
        {
          route_code: 'ROUTE_003',
          route_name: 'Abu Dhabi City Tour',
          country: 'UAE',
          transfer_type: validType,
          start_location: 'Abu Dhabi Airport',
          start_location_full_name: 'Abu Dhabi International Airport (AUH)',
          end_location: 'Sheikh Zayed Grand Mosque',
          end_location_full_name: 'Sheikh Zayed Grand Mosque - Cultural Site',
          description: 'Cultural and sightseeing route',
          distance: 35
        }
      ];

      let successCount = 0;
      for (let i = 0; i < sampleRoutes.length; i++) {
        const route = sampleRoutes[i];
        const { data: routeData, error: routeError } = await supabase
          .from('transport_routes')
          .insert([route])
          .select();

        if (routeError) {
          console.log(`   ❌ Route ${i + 1} failed: ${routeError.message}`);
        } else {
          console.log(`   ✅ Route ${i + 1} created: ${route.route_code}`);
          successCount++;
        }
      }

      console.log(`\n📊 Successfully created ${successCount}/${sampleRoutes.length} sample routes`);
      
      // Final verification
      const { data: finalData, error: finalError } = await supabase
        .from('transport_routes')
        .select('route_code, route_name, transfer_type, start_location, end_location, distance')
        .order('route_code');

      if (finalError) {
        console.log('❌ Final verification failed:', finalError.message);
      } else {
        console.log(`\n✅ Final verification: ${finalData.length} routes in database`);
        finalData.forEach(route => {
          console.log(`   ${route.route_code}: ${route.start_location} → ${route.end_location} (${route.transfer_type}, ${route.distance}km)`);
        });
      }
    } else {
      console.log('\n❌ No valid transfer_type values found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the schema check
checkSchemaConstraints().then(() => {
  console.log('\n🏁 Schema constraint check complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Schema check failed:', error);
  process.exit(1);
});