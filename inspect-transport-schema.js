import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Transport Tables Schema Inspector');
console.log('===================================');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectTableSchema(tableName) {
  try {
    console.log(`\n📋 Inspecting ${tableName} schema...`);
    
    // Try to get table info using information_schema
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: tableName });
    
    if (error) {
      console.log(`   ❌ RPC failed: ${error.message}`);
      
      // Alternative: Try to select with wildcard and see what we get
      const { data: selectData, error: selectError } = await supabase
        .from(tableName)
        .select('*')
        .limit(0); // Get structure without data
      
      if (selectError) {
        console.log(`   ❌ Select failed: ${selectError.message}`);
      } else {
        console.log(`   ✅ Table accessible but no column info available`);
      }
    } else {
      console.log(`   ✅ Columns found:`, data);
    }
    
    // Try inserting with minimal data to see what columns are required
    console.log(`   🧪 Testing minimal insert...`);
    const { data: insertData, error: insertError } = await supabase
      .from(tableName)
      .insert({})
      .select();
    
    if (insertError) {
      console.log(`   📝 Insert error reveals schema: ${insertError.message}`);
    } else {
      console.log(`   ✅ Empty insert succeeded`);
      // Clean up
      if (insertData && insertData[0]) {
        await supabase
          .from(tableName)
          .delete()
          .eq('id', insertData[0].id);
      }
    }
    
  } catch (err) {
    console.error(`❌ Error inspecting ${tableName}:`, err.message);
  }
}

async function createGetColumnsFunction() {
  try {
    console.log('\n🔧 Creating helper function to get table columns...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
      RETURNS TABLE(column_name text, data_type text, is_nullable text)
      LANGUAGE sql
      AS $$
        SELECT 
          column_name::text,
          data_type::text,
          is_nullable::text
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position;
      $$;
    `;
    
    const { data, error } = await supabase.rpc('exec', { sql: createFunctionSQL });
    
    if (error) {
      console.log(`   ❌ Function creation failed: ${error.message}`);
    } else {
      console.log(`   ✅ Helper function created`);
    }
    
  } catch (err) {
    console.log(`   ❌ Function creation error: ${err.message}`);
  }
}

async function getTableColumnsDirectly(tableName) {
  try {
    console.log(`\n🔍 Getting ${tableName} columns directly...`);
    
    // Use a direct SQL query to get column information
    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `;
    
    // Try using the SQL editor approach
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql_query: query })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ Columns for ${tableName}:`, result);
    } else {
      console.log(`   ❌ Direct query failed: ${response.statusText}`);
    }
    
  } catch (err) {
    console.error(`❌ Error getting columns for ${tableName}:`, err.message);
  }
}

async function testActualColumns() {
  try {
    console.log('\n🧪 Testing actual column existence...');
    
    // Test transport_routes columns
    const routeTests = [
      { id: 'test-id' },
      { route_name: 'Test Route' },
      { origin: 'Test Origin' },
      { destination: 'Test Destination' },
      { name: 'Test Name' }, // Alternative column name
      { from_location: 'Test From' }, // Alternative column name
      { to_location: 'Test To' } // Alternative column name
    ];
    
    console.log('\n   Testing transport_routes columns:');
    for (const test of routeTests) {
      const { data, error } = await supabase
        .from('transport_routes')
        .insert(test)
        .select();
      
      if (error) {
        console.log(`     ❌ ${Object.keys(test)[0]}: ${error.message}`);
      } else {
        console.log(`     ✅ ${Object.keys(test)[0]}: EXISTS`);
        // Clean up
        if (data && data[0]) {
          await supabase
            .from('transport_routes')
            .delete()
            .eq('id', data[0].id);
        }
      }
    }
    
    // Test transport_types columns
    const typeTests = [
      { type: 'Bus' },
      { transport_type: 'Train' },
      { name: 'Car' },
      { price: 100 },
      { cost: 200 },
      { duration: '2 hours' }
    ];
    
    console.log('\n   Testing transport_types columns:');
    for (const test of typeTests) {
      const { data, error } = await supabase
        .from('transport_types')
        .insert(test)
        .select();
      
      if (error) {
        console.log(`     ❌ ${Object.keys(test)[0]}: ${error.message}`);
      } else {
        console.log(`     ✅ ${Object.keys(test)[0]}: EXISTS`);
        // Clean up
        if (data && data[0]) {
          await supabase
            .from('transport_types')
            .delete()
            .eq('id', data[0].id);
        }
      }
    }
    
  } catch (err) {
    console.error('❌ Error testing columns:', err.message);
  }
}

async function main() {
  // Create helper function
  await createGetColumnsFunction();
  
  // Inspect each table
  const tables = ['transport_routes', 'transport_types', 'intermediate_stops', 'sightseeing_options'];
  
  for (const table of tables) {
    await inspectTableSchema(table);
    await getTableColumnsDirectly(table);
  }
  
  // Test actual column existence
  await testActualColumns();
  
  console.log('\n🎯 Schema inspection completed!');
}

// Run the script
main().catch(console.error);