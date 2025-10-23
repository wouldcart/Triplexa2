const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xzofytokwszfwiupsdvi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotesField() {
  console.log('🔍 Testing notes field in transport_routes table...\n');

  try {
    // 1. Check table schema for notes field
    console.log('1. Checking table schema for notes field...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('transport_routes')
      .select('notes')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError.message);
      return;
    }
    console.log('✅ Notes field exists in schema');

    // 2. Check existing notes data
    console.log('\n2. Checking existing notes data...');
    const { data: existingData, error: existingError } = await supabase
      .from('transport_routes')
      .select('id, route_name, notes')
      .not('notes', 'is', null)
      .limit(5);
    
    if (existingError) {
      console.error('❌ Failed to fetch existing notes:', existingError.message);
    } else {
      console.log(`✅ Found ${existingData.length} routes with notes data:`);
      existingData.forEach(route => {
        console.log(`   - Route ${route.id} (${route.route_name}): ${typeof route.notes} - "${route.notes}"`);
      });
    }

    // 3. Test inserting a route with notes
    console.log('\n3. Testing notes field insertion...');
    const testRoute = {
      country: 'TEST',
      transfer_type: 'bus',
      start_location: 'Test Start',
      end_location: 'Test End',
      name: 'Test Route for Notes',
      route_name: 'Test Route for Notes',
      status: 'active',
      notes: 'This is a test note to verify the notes field works correctly. It contains special characters: áéíóú, 中文, 🚌'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('transport_routes')
      .insert(testRoute)
      .select('id, route_name, notes')
      .single();

    if (insertError) {
      console.error('❌ Failed to insert test route with notes:', insertError.message);
    } else {
      console.log('✅ Successfully inserted test route with notes:');
      console.log(`   - Route ID: ${insertData.id}`);
      console.log(`   - Notes type: ${typeof insertData.notes}`);
      console.log(`   - Notes content: "${insertData.notes}"`);

      // 4. Test updating notes
      console.log('\n4. Testing notes field update...');
      const updatedNotes = 'Updated notes with more content: JSON-like data {"key": "value", "array": [1,2,3]}';
      
      const { data: updateData, error: updateError } = await supabase
        .from('transport_routes')
        .update({ notes: updatedNotes })
        .eq('id', insertData.id)
        .select('id, notes')
        .single();

      if (updateError) {
        console.error('❌ Failed to update notes:', updateError.message);
      } else {
        console.log('✅ Successfully updated notes:');
        console.log(`   - Notes type: ${typeof updateData.notes}`);
        console.log(`   - Notes content: "${updateData.notes}"`);
      }

      // 5. Clean up test data
      console.log('\n5. Cleaning up test data...');
      const { error: deleteError } = await supabase
        .from('transport_routes')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        console.error('❌ Failed to delete test route:', deleteError.message);
      } else {
        console.log('✅ Test route deleted successfully');
      }
    }

    // 6. Test different data types for notes
    console.log('\n6. Testing different data types for notes field...');
    
    const testCases = [
      { name: 'String', value: 'Simple string note' },
      { name: 'JSON String', value: '{"type": "json", "data": [1,2,3]}' },
      { name: 'Long Text', value: 'A'.repeat(1000) },
      { name: 'Unicode', value: 'Unicode test: 🌍 中文 العربية русский' },
      { name: 'Empty String', value: '' },
    ];

    for (const testCase of testCases) {
      const testRoute = {
        country: 'TEST',
        transfer_type: 'bus',
        start_location: 'Test Start',
        end_location: 'Test End',
        name: `Test ${testCase.name}`,
        route_name: `Test ${testCase.name}`,
        status: 'active',
        notes: testCase.value
      };

      const { data, error } = await supabase
        .from('transport_routes')
        .insert(testRoute)
        .select('id, notes')
        .single();

      if (error) {
        console.error(`❌ Failed to insert ${testCase.name}:`, error.message);
      } else {
        console.log(`✅ ${testCase.name}: Inserted successfully (length: ${testCase.value.length})`);
        
        // Clean up
        await supabase.from('transport_routes').delete().eq('id', data.id);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n🏁 Notes field testing completed!');
}

testNotesField();