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

async function createExecSqlFunction() {
  try {
    console.log('🔧 Creating exec_sql function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `;
    
    // Use direct SQL execution via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.pgrst.object+json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: createFunctionSQL
    });
    
    if (response.ok) {
      console.log('✅ exec_sql function created successfully');
      return true;
    } else {
      console.log('⚠️  Could not create exec_sql function via REST API');
      return false;
    }
  } catch (error) {
    console.error('❌ Error creating exec_sql function:', error);
    return false;
  }
}

async function addNameColumnDirectly() {
  try {
    console.log('🚀 Adding name column directly...');
    
    // Try direct SQL execution via REST API
    const addColumnSQL = `
      DO $$ 
      BEGIN
        -- Add name column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'transport_routes' 
          AND column_name = 'name'
          AND table_schema = 'public'
        ) THEN
          ALTER TABLE public.transport_routes 
          ADD COLUMN name TEXT NOT NULL DEFAULT '';
          
          COMMENT ON COLUMN public.transport_routes.name 
          IS 'Display name for the transport route (used by frontend)';
          
          -- Update existing records to use route_name as name if name is empty
          UPDATE public.transport_routes 
          SET name = COALESCE(route_name, '') 
          WHERE name = '' OR name IS NULL;
          
          RAISE NOTICE 'Successfully added name column to transport_routes table';
        ELSE
          RAISE NOTICE 'Column name already exists in transport_routes table';
        END IF;
      END $$;
    `;
    
    const response = await fetch(`${supabaseUrl}/rest/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.pgrst.object+json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: addColumnSQL
    });
    
    if (response.ok) {
      console.log('✅ Column added successfully via direct SQL');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Direct SQL failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error adding column directly:', error);
    return false;
  }
}

async function verifyColumn() {
  try {
    console.log('🔍 Verifying name column...');
    
    // Try to select from the table with the name column
    const { data, error } = await supabase
      .from('transport_routes')
      .select('name, route_name')
      .limit(1);
    
    if (error) {
      console.error('❌ Column verification failed:', error);
      return false;
    } else {
      console.log('✅ Column verified successfully!');
      return true;
    }
  } catch (error) {
    console.error('❌ Error verifying column:', error);
    return false;
  }
}

async function testInsertion() {
  try {
    console.log('🧪 Testing data insertion with name column...');
    
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
    
    const { data, error } = await supabase
      .from('transport_routes')
      .insert(testRoute)
      .select();
    
    if (error) {
      console.error('❌ Test insertion failed:', error);
      return false;
    } else {
      console.log('✅ Test insertion successful!');
      
      // Clean up test data
      if (data && data[0]) {
        await supabase
          .from('transport_routes')
          .delete()
          .eq('id', data[0].id);
        console.log('🧹 Test data cleaned up');
      }
      return true;
    }
  } catch (error) {
    console.error('❌ Error testing insertion:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Starting transport_routes schema fix...');
    
    // Try to add the column directly first
    const directSuccess = await addNameColumnDirectly();
    
    if (!directSuccess) {
      // If direct approach fails, try creating the function first
      const functionCreated = await createExecSqlFunction();
      
      if (functionCreated) {
        // Try the migration again
        const migrationPath = path.join(process.cwd(), 'add-name-column-migration.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
        if (error) {
          console.error('❌ Migration with exec_sql failed:', error);
        } else {
          console.log('✅ Migration with exec_sql successful');
        }
      }
    }
    
    // Verify the column exists
    const verified = await verifyColumn();
    
    if (verified) {
      // Test insertion
      await testInsertion();
      console.log('🎉 Schema fix completed successfully!');
    } else {
      console.error('❌ Schema fix failed - column not accessible');
    }
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error);
    process.exit(1);
  }
}

main();