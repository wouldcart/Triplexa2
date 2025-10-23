const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTransportTypesTable() {
  console.log('🔍 Checking transport_types table structure and existence...\n');

  try {
    // Test 1: Check if table exists by trying to select from it
    console.log('📍 Test 1: Checking if transport_types table exists...');
    const { data: existsData, error: existsError } = await supabase
      .from('transport_types')
      .select('*')
      .limit(1);

    if (existsError) {
      console.log('❌ Table access failed:', existsError.message);
      return;
    } else {
      console.log('✅ Table exists and is accessible');
      console.log('   Current records:', existsData?.length || 0);
    }

    // Test 2: Try to insert a minimal record to see what columns are required
    console.log('\n📍 Test 2: Testing minimal insert to discover required columns...');
    const { data: insertData, error: insertError } = await supabase
      .from('transport_types')
      .insert({
        type: 'Test Type'
      })
      .select()
      .single();

    if (insertError) {
      console.log('❌ Minimal insert failed:', insertError.message);
      console.log('   This helps us understand required columns');
    } else {
      console.log('✅ Minimal insert succeeded:', insertData);
      
      // Clean up the test record
      await supabase
        .from('transport_types')
        .delete()
        .eq('id', insertData.id);
      console.log('   Test record cleaned up');
    }

    // Test 3: Try to insert with all expected columns
    console.log('\n📍 Test 3: Testing full insert with all expected columns...');
    
    // First, create a test route to reference
    const { data: routeData, error: routeError } = await supabase
      .from('transport_routes')
      .insert({
        route_code: 'TEST-TYPES-001',
        route_name: 'Test Route for Types',
        country: 'Thailand',
        transfer_type: 'Test',
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
      console.log('❌ Test route creation failed:', routeError.message);
      return;
    }

    console.log('✅ Test route created:', routeData.id);

    // Now try to insert transport type with all columns
    const { data: fullInsertData, error: fullInsertError } = await supabase
      .from('transport_types')
      .insert({
        route_id: routeData.id,
        type: 'Test Bus',
        seating_capacity: 24,
        luggage_capacity: 48,
        duration: '10 hours',
        price: 1500.00,
        notes: 'Test transport type'
      })
      .select()
      .single();

    if (fullInsertError) {
      console.log('❌ Full insert failed:', fullInsertError.message);
    } else {
      console.log('✅ Full insert succeeded:', fullInsertData);
      
      // Test reading with relationship
      console.log('\n📍 Test 4: Testing relationship query...');
      const { data: relationData, error: relationError } = await supabase
        .from('transport_routes')
        .select(`
          *,
          transport_types(*)
        `)
        .eq('id', routeData.id)
        .single();

      if (relationError) {
        console.log('❌ Relationship query failed:', relationError.message);
      } else {
        console.log('✅ Relationship query succeeded');
        console.log('   Transport types found:', relationData.transport_types?.length || 0);
      }
    }

    // Clean up test data
    console.log('\n📍 Cleaning up test data...');
    await supabase
      .from('transport_routes')
      .delete()
      .eq('id', routeData.id);
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }

  console.log('\n✅ Transport types table check completed!');
}

checkTransportTypesTable().catch(console.error);