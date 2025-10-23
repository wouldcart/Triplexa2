import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkActualSchema() {
  console.log('🔍 Checking actual database schema...\n');

  const tablesToCheck = [
    'transport_routes',
    'location_codes', 
    'transport_types',
    'intermediate_stops',
    'sightseeing_options'
  ];

  for (const tableName of tablesToCheck) {
    console.log(`📋 Table: ${tableName}`);
    
    try {
      // Query information_schema to get column information
      const { data, error } = await supabase
        .rpc('sql', {
          query: `
            SELECT 
              column_name,
              data_type,
              is_nullable,
              column_default
            FROM information_schema.columns 
            WHERE table_name = '${tableName}' 
              AND table_schema = 'public'
            ORDER BY ordinal_position;
          `
        });

      if (error) {
        console.log(`   ❌ Error querying schema: ${error.message}`);
        
        // Fallback: try to get column info by attempting a select
        const { data: fallbackData, error: fallbackError } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);
          
        if (fallbackError) {
          console.log(`   ❌ Fallback failed: ${fallbackError.message}`);
        } else {
          console.log(`   ✅ Table exists (fallback check successful)`);
        }
      } else if (data && data.length > 0) {
        console.log(`   ✅ Columns found:`);
        data.forEach(col => {
          console.log(`      • ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ', NOT NULL' : ''})`);
        });
      } else {
        console.log(`   ⚠️  No columns found or table doesn't exist`);
      }
    } catch (err) {
      console.log(`   💥 Unexpected error: ${err.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
}

// Run the schema check
checkActualSchema();