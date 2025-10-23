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

async function diagnoseTransportRoutes() {
  console.log('🔍 Diagnosing transport_routes table...\n');

  try {
    // 1. Check table structure and existing data
    console.log('1. Checking existing data in transport_routes...');
    const { data: existingRoutes, error: fetchError } = await supabase
      .from('transport_routes')
      .select('*')
      .limit(10);

    if (fetchError) {
      console.error('❌ Error fetching transport_routes:', fetchError);
    } else {
      console.log(`✅ Found ${existingRoutes.length} existing routes`);
      if (existingRoutes.length > 0) {
        console.log('Sample route structure:', JSON.stringify(existingRoutes[0], null, 2));
      }
    }

    // 2. Test basic insert to identify required fields
    console.log('\n2. Testing basic insert to identify constraints...');
    const testRoute = {
      route_code: 'TEST_001',
      route_name: 'Test Route',
      country: 'Test Country',
      transfer_type: 'direct',
      start_location: 'Test Start',
      start_location_full_name: 'Test Start Location Full Name',
      end_location: 'Test End',
      end_location_full_name: 'Test End Location Full Name',
      description: 'Test route description',
      distance: 100,
      estimated_duration: '02:00:00',
      price: 50.00
    };

    const { data: insertData, error: insertError } = await supabase
      .from('transport_routes')
      .insert([testRoute])
      .select();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      console.log('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('✅ Test insert successful:', insertData);
      
      // Clean up test data
      if (insertData && insertData.length > 0) {
        await supabase
          .from('transport_routes')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Test data cleaned up');
      }
    }

    // 3. Check transport_types for valid transfer_type values
    console.log('\n3. Checking transport_types for reference...');
    const { data: transportTypes, error: typesError } = await supabase
      .from('transport_types')
      .select('*');

    if (typesError) {
      console.error('❌ Error fetching transport_types:', typesError);
    } else {
      console.log(`✅ Found ${transportTypes.length} transport types:`);
      transportTypes.forEach(type => {
        console.log(`  - ${type.name} (Category: ${type.category})`);
      });
    }

    // 4. Test with minimal required fields
    console.log('\n4. Testing with minimal required fields...');
    const minimalRoute = {
      route_code: 'MIN_001',
      route_name: 'Minimal Test Route'
    };

    const { data: minimalData, error: minimalError } = await supabase
      .from('transport_routes')
      .insert([minimalRoute])
      .select();

    if (minimalError) {
      console.error('❌ Minimal insert error:', minimalError);
      console.log('This helps identify which fields are truly required');
    } else {
      console.log('✅ Minimal insert successful:', minimalData);
      
      // Clean up
      if (minimalData && minimalData.length > 0) {
        await supabase
          .from('transport_routes')
          .delete()
          .eq('id', minimalData[0].id);
        console.log('🧹 Minimal test data cleaned up');
      }
    }

    // 5. Check for any constraints or triggers
    console.log('\n5. Attempting to get table constraints...');
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          LEFT JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.table_name = 'transport_routes'
            AND tc.table_schema = 'public';
        `
      });

    if (constraintsError) {
      console.log('⚠️ Could not fetch constraints (function may not exist):', constraintsError.message);
    } else {
      console.log('✅ Table constraints:', constraints);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the diagnosis
diagnoseTransportRoutes().then(() => {
  console.log('\n🏁 Diagnosis complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Diagnosis failed:', error);
  process.exit(1);
});