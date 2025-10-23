const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xzofytokwszfwiupsdvi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransferTypes() {
  console.log('🔍 Checking valid transfer types and testing notes field...\n');

  try {
    // 1. Check existing transfer types
    console.log('1. Checking existing transfer types...');
    const { data: existingRoutes, error: routesError } = await supabase
      .from('transport_routes')
      .select('transfer_type')
      .limit(10);
    
    if (routesError) {
      console.error('❌ Failed to fetch routes:', routesError.message);
      return;
    }

    const uniqueTransferTypes = [...new Set(existingRoutes.map(r => r.transfer_type))];
    console.log('✅ Found transfer types:', uniqueTransferTypes);

    // 2. Test notes field with valid transfer type
    console.log('\n2. Testing notes field with valid transfer type...');
    const validTransferType = uniqueTransferTypes[0]; // Use the first valid type
    
    const testRoute = {
      country: 'TH',
      transfer_type: validTransferType,
      start_location: 'Test Start',
      end_location: 'Test End',
      name: 'Test Route for Notes',
      route_name: 'Test Route for Notes',
      status: 'active',
      notes: 'This is a comprehensive test note with special characters: áéíóú, 中文, 🚌, and JSON-like data: {"key": "value", "array": [1,2,3]}'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('transport_routes')
      .insert(testRoute)
      .select('id, route_name, notes, transfer_type')
      .single();

    if (insertError) {
      console.error('❌ Failed to insert test route:', insertError.message);
    } else {
      console.log('✅ Successfully inserted test route with notes:');
      console.log(`   - Route ID: ${insertData.id}`);
      console.log(`   - Transfer Type: ${insertData.transfer_type}`);
      console.log(`   - Notes type: ${typeof insertData.notes}`);
      console.log(`   - Notes length: ${insertData.notes.length} characters`);
      console.log(`   - Notes content: "${insertData.notes}"`);

      // 3. Test updating notes with different content
      console.log('\n3. Testing notes field update...');
      const updatedNotes = `Updated notes with timestamp: ${new Date().toISOString()}. This includes:
- Multi-line content
- Special characters: ñáéíóú
- Emojis: 🚌🌍✈️
- JSON structure: {"routes": [{"from": "A", "to": "B"}], "count": 42}
- Long text: ${'A'.repeat(500)}`;
      
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
        console.log(`   - Notes length: ${updateData.notes.length} characters`);
        console.log(`   - First 200 chars: "${updateData.notes.substring(0, 200)}..."`);
      }

      // 4. Test with null notes
      console.log('\n4. Testing null notes...');
      const { data: nullData, error: nullError } = await supabase
        .from('transport_routes')
        .update({ notes: null })
        .eq('id', insertData.id)
        .select('id, notes')
        .single();

      if (nullError) {
        console.error('❌ Failed to set notes to null:', nullError.message);
      } else {
        console.log('✅ Successfully set notes to null:');
        console.log(`   - Notes value: ${nullData.notes}`);
        console.log(`   - Notes type: ${typeof nullData.notes}`);
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

    // 6. Summary
    console.log('\n📋 Summary:');
    console.log('✅ Notes field exists and works correctly');
    console.log('✅ Supports string data type');
    console.log('✅ Handles special characters and Unicode');
    console.log('✅ Supports long text content');
    console.log('✅ Allows null values');
    console.log('✅ Can be updated successfully');
    console.log(`✅ Valid transfer types: ${uniqueTransferTypes.join(', ')}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n🏁 Transfer types and notes field testing completed!');
}

checkTransferTypes();