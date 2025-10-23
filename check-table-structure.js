import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTableStructure() {
  console.log('🔍 Checking actual table structures...\n');

  const tables = ['transport_routes', 'intermediate_stops', 'transport_types', 'location_codes', 'sightseeing_options'];

  for (const tableName of tables) {
    console.log(`📋 Checking ${tableName} table structure:`);
    
    try {
      // Try to get column information by querying the information_schema
      const { data, error } = await supabase.rpc('get_table_columns', { table_name: tableName });
      
      if (error) {
        console.log(`   ❌ Error getting column info: ${error.message}`);
        
        // Fallback: try to select from the table to see what columns exist
        console.log(`   🔄 Trying fallback method...`);
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (sampleError) {
          console.log(`   ❌ Table query error: ${sampleError.message}`);
        } else {
          if (sampleData && sampleData.length > 0) {
            console.log(`   ✅ Sample data columns:`, Object.keys(sampleData[0]));
          } else {
            console.log(`   ℹ️  Table exists but is empty`);
            
            // Try to get table info another way
            const { data: tableInfo, error: infoError } = await supabase
              .from(tableName)
              .select()
              .limit(0);
              
            if (!infoError) {
              console.log(`   ✅ Table exists and is accessible`);
            }
          }
        }
      } else {
        console.log(`   ✅ Columns:`, data);
      }
    } catch (err) {
      console.log(`   ❌ Unexpected error: ${err.message}`);
    }
    
    console.log('');
  }
}

checkTableStructure().catch(console.error);