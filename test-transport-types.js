// Test script to verify CRUD operations for transport_types table
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Get Supabase credentials from .env file
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are defined');
  process.exit(1);
}

console.log('🔍 Testing Transport Types CRUD Operations');
console.log('==========================================');
console.log(`📍 Supabase URL: ${supabaseUrl}`);

// Create Supabase client with service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test data
const testType = {
  name: `Test Vehicle ${Date.now()}`,
  category: 'Van',
  seating_capacity: 8,
  luggage_capacity: 4,
  active: true
};

// Run tests
async function runTests() {
  let createdTypeId = null;
  
  try {
    // 1. CREATE - Test inserting a new transport type
    console.log('\n📝 Testing CREATE operation...');
    const { data: createData, error: createError } = await supabase
      .from('transport_types')
      .insert([testType])
      .select()
      .single();
    
    if (createError) {
      throw new Error(`Create operation failed: ${createError.message}`);
    }
    
    createdTypeId = createData.id;
    console.log(`✅ Successfully created transport type with ID: ${createdTypeId}`);
    console.log(createData);
    
    // 2. READ - Test reading the created transport type
    console.log('\n📖 Testing READ operation...');
    const { data: readData, error: readError } = await supabase
      .from('transport_types')
      .select('*')
      .eq('id', createdTypeId)
      .single();
    
    if (readError) {
      throw new Error(`Read operation failed: ${readError.message}`);
    }
    
    console.log('✅ Successfully read transport type:');
    console.log(readData);
    
    // 3. UPDATE - Test updating the transport type
    console.log('\n🔄 Testing UPDATE operation...');
    const updatePayload = {
      name: `${testType.name} (Updated)`,
      seating_capacity: 10,
      active: false
    };
    
    const { data: updateData, error: updateError } = await supabase
      .from('transport_types')
      .update(updatePayload)
      .eq('id', createdTypeId)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Update operation failed: ${updateError.message}`);
    }
    
    console.log('✅ Successfully updated transport type:');
    console.log(updateData);
    
    // 4. DELETE - Test deleting the transport type
    console.log('\n🗑️ Testing DELETE operation...');
    const { error: deleteError } = await supabase
      .from('transport_types')
      .delete()
      .eq('id', createdTypeId);
    
    if (deleteError) {
      throw new Error(`Delete operation failed: ${deleteError.message}`);
    }
    
    console.log(`✅ Successfully deleted transport type with ID: ${createdTypeId}`);
    
    // Verify deletion
    const { data: verifyData, error: verifyError } = await supabase
      .from('transport_types')
      .select('*')
      .eq('id', createdTypeId);
    
    if (verifyError) {
      throw new Error(`Verification failed: ${verifyError.message}`);
    }
    
    if (verifyData.length === 0) {
      console.log('✅ Verified deletion - record no longer exists');
    } else {
      console.log('⚠️ Record still exists after deletion attempt');
    }
    
    console.log('\n🎉 All CRUD operations completed successfully!');
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    
    // Cleanup if test fails but ID was created
    if (createdTypeId) {
      console.log('\n🧹 Cleaning up test data...');
      await supabase
        .from('transport_types')
        .delete()
        .eq('id', createdTypeId);
    }
  }
}

// Execute tests
runTests();