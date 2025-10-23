import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Starting migration: Add name column to transport_routes...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'add-name-column-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Read migration file successfully');
    
    // Execute the migration as a single block
    console.log('⚡ Executing migration...');
    
    // Try using the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: migrationSQL })
    });
    
    if (!response.ok) {
      // Fallback to supabase client
      const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
      if (error) {
        console.error('❌ Migration failed:', error);
        throw error;
      }
    }
    
    console.log('✅ Migration executed successfully!');
    
    // Verify the migration worked
    console.log('🔍 Verifying migration...');
    
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'transport_routes')
      .eq('table_schema', 'public')
      .eq('column_name', 'name');
    
    if (columnError) {
      console.log('⚠️  Could not verify column via information_schema, trying direct query...');
      
      // Try a direct query to see if the column exists
      const { data: testData, error: testError } = await supabase
        .from('transport_routes')
        .select('name')
        .limit(1);
      
      if (testError) {
        console.error('❌ Column verification failed:', testError);
      } else {
        console.log('✅ Column exists and is accessible!');
      }
    } else {
      console.log('✅ Column verified in schema:', columns);
    }
    
    // Test inserting data with the name column
    console.log('🧪 Testing data insertion...');
    
    const testRoute = {
      name: 'Test Route Name',
      route_name: 'Test Route',
      origin: 'Test Origin',
      destination: 'Test Destination',
      country: 'Test Country',
      transfer_type: 'direct',
      start_location: 'Test Start',
      start_location_full_name: 'Test Start Full',
      end_location: 'Test End',
      end_location_full_name: 'Test End Full',
      route_code: 'TEST001'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('transport_routes')
      .insert(testRoute)
      .select();
    
    if (insertError) {
      console.error('❌ Test insertion failed:', insertError);
    } else {
      console.log('✅ Test insertion successful:', insertData);
      
      // Clean up test data
      if (insertData && insertData[0]) {
        await supabase
          .from('transport_routes')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Test data cleaned up');
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();