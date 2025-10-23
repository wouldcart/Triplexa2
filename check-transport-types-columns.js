import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTransportTypesColumns() {
  console.log('🔍 Checking transport_types table columns...\n');
  
  try {
    // Get existing data to see what columns are available
    const { data, error } = await supabase
      .from('transport_types')
      .select('*');
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('✅ Current data in transport_types:');
    console.log('   Number of rows:', data.length);
    
    if (data.length > 0) {
      console.log('   Available columns:', Object.keys(data[0]));
      console.log('   Sample data:', data[0]);
    } else {
      console.log('   No data found, trying to insert minimal data to discover columns...');
      
      // Try inserting with just basic columns
      const testInserts = [
        { type: 'Bus' },
        { id: '123e4567-e89b-12d3-a456-426614174000' },
        { route_id: '123e4567-e89b-12d3-a456-426614174000' }
      ];
      
      for (const testData of testInserts) {
        console.log(`   Testing with:`, testData);
        const { data: insertData, error: insertError } = await supabase
          .from('transport_types')
          .insert(testData)
          .select();
        
        if (insertError) {
          console.log(`   ❌ Error:`, insertError.message);
        } else {
          console.log(`   ✅ Success:`, insertData);
          // Clean up
          await supabase
            .from('transport_types')
            .delete()
            .eq('id', insertData[0].id);
        }
      }
    }
    
  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

checkTransportTypesColumns().catch(console.error);