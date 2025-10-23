import { createClient } from '@supabase/supabase-js';
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

async function addNameColumn() {
  try {
    console.log('🚀 Attempting to add name column to transport_routes...');
    
    // First, let's check the current schema
    console.log('🔍 Checking current schema...');
    
    const { data: currentData, error: currentError } = await supabase
      .from('transport_routes')
      .select('*')
      .limit(1);
    
    if (currentError) {
      console.error('❌ Error accessing transport_routes:', currentError);
      return false;
    }
    
    console.log('✅ Current transport_routes accessible');
    if (currentData && currentData[0]) {
      console.log('📋 Current columns:', Object.keys(currentData[0]));
    }
    
    // Check if name column already exists
    if (currentData && currentData[0] && 'name' in currentData[0]) {
      console.log('✅ Name column already exists!');
      return true;
    }
    
    // Try to use the SQL editor endpoint with proper headers
    console.log('⚡ Adding name column via SQL...');
    
    const sql = `ALTER TABLE public.transport_routes ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';`;
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
      console.log('⚠️  exec_sql not available, trying alternative approach...');
      
      // Alternative: Try to create a simple function that adds the column
      const createAndExecute = `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'transport_routes' 
            AND column_name = 'name'
            AND table_schema = 'public'
          ) THEN
            ALTER TABLE public.transport_routes ADD COLUMN name TEXT NOT NULL DEFAULT '';
            RAISE NOTICE 'Added name column to transport_routes';
          ELSE
            RAISE NOTICE 'Name column already exists';
          END IF;
        END
        $$;
      `;
      
      // Try using a different endpoint
      const altResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: createAndExecute })
      });
      
      if (!altResponse.ok) {
        console.log('⚠️  Alternative approach also failed');
        console.log('💡 Manual intervention required - please run this SQL in Supabase SQL Editor:');
        console.log('');
        console.log('ALTER TABLE public.transport_routes ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT \'\';');
        console.log('');
        return false;
      }
    }
    
    // Wait a moment for the schema to update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify the column was added
    console.log('🔍 Verifying column addition...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('transport_routes')
      .select('name')
      .limit(1);
    
    if (verifyError) {
      console.error('❌ Column verification failed:', verifyError);
      return false;
    }
    
    console.log('✅ Name column added and verified!');
    return true;
    
  } catch (error) {
    console.error('❌ Error adding name column:', error);
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
      console.log('📋 Inserted data:', data[0]);
      
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
  console.log('🚀 Starting simple column addition...');
  
  const success = await addNameColumn();
  
  if (success) {
    await testInsertion();
    console.log('🎉 Column addition completed successfully!');
  } else {
    console.log('❌ Column addition failed');
    console.log('');
    console.log('📝 Manual steps required:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Run this SQL:');
    console.log('   ALTER TABLE public.transport_routes ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT \'\';');
    console.log('3. Run the transport route saving test again');
  }
}

main();