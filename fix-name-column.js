import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Connecting to Supabase Database...');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Using Service Role Key: ${supabaseServiceKey ? 'Yes' : 'No'}`);

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql) {
  try {
    // Try using the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql_query: sql })
    });

    if (response.ok) {
      return { success: true, data: await response.json() };
    } else {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function addNameColumnDirectly() {
  try {
    console.log('\n🔧 Adding name column to transport_routes table using direct SQL...');
    
    // Try to add the column using direct SQL execution
    const addColumnSQL = `
      ALTER TABLE public.transport_routes 
      ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
    `;
    
    const result = await executeSQL(addColumnSQL);
    
    if (!result.success) {
      console.error(`❌ Failed to add column: ${result.error}`);
      return false;
    }
    
    console.log('✅ Successfully added name column');
    
    // Update existing records
    const updateSQL = `
      UPDATE public.transport_routes 
      SET name = route_name 
      WHERE name = '' OR name IS NULL;
    `;
    
    const updateResult = await executeSQL(updateSQL);
    
    if (!updateResult.success) {
      console.warn(`⚠️  Update warning: ${updateResult.error}`);
    } else {
      console.log('✅ Updated existing records');
    }
    
    return await testSchema();
    
  } catch (error) {
    console.error('❌ Failed to add name column:', error.message);
    return false;
  }
}

async function testSchema() {
  try {
    console.log('\n🧪 Testing schema...');
    
    // Test if we can select the name column
    const { data, error } = await supabase
      .from('transport_routes')
      .select('name, route_name, route_code')
      .limit(1);
    
    if (error) {
      console.error(`❌ Schema test failed: ${error.message}`);
      return false;
    }
    
    console.log('✅ Schema test passed - name column is accessible');
    
    // Test inserting a sample record
    console.log('\n🧪 Testing data insertion...');
    const testData = {
      route_code: 'TEST001',
      route_name: 'Test Route',
      name: 'Test Route Name',
      country: 'Test Country',
      transfer_type: 'One-Way',
      start_location: 'Test Start',
      start_location_full_name: 'Test Start Location',
      end_location: 'Test End',
      end_location_full_name: 'Test End Location',
      status: 'active'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('transport_routes')
      .insert(testData)
      .select();
    
    if (insertError) {
      console.error(`❌ Insert test failed: ${insertError.message}`);
      return false;
    }
    
    console.log('✅ Insert test passed');
    console.log('Inserted record:', insertData);
    
    // Clean up test record
    if (insertData && insertData.length > 0) {
      await supabase
        .from('transport_routes')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🧹 Test record cleaned up');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Schema test error:', error.message);
    return false;
  }
}

async function createExecSqlFunction() {
  try {
    console.log('\n🔧 Creating exec_sql function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$;
    `;
    
    const result = await executeSQL(createFunctionSQL);
    
    if (result.success) {
      console.log('✅ exec_sql function created successfully');
      return true;
    } else {
      console.log('ℹ️  Could not create exec_sql function, will use alternative method');
      return false;
    }
    
  } catch (err) {
    console.log('ℹ️  Will use alternative method for SQL execution');
    return false;
  }
}

async function main() {
  console.log('🎯 Fix Transport Routes Name Column');
  console.log('===================================');
  
  // First try to create the exec_sql function
  await createExecSqlFunction();
  
  // Then try to add the column
  const success = await addNameColumnDirectly();
  
  if (success) {
    console.log('\n🎉 Successfully added name column to transport_routes table!');
    console.log('✅ The UI can now save route data correctly');
    process.exit(0);
  } else {
    console.log('\n❌ Failed to add name column. Please check the logs above.');
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);