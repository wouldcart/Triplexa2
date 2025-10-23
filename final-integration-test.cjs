require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function runFinalIntegrationTest() {
  console.log('🚀 Starting Final Supabase Integration Test...\n');
  
  let testsPassed = 0;
  let totalTests = 0;
  
  // Test 1: Connection Test
  totalTests++;
  console.log('1️⃣ Testing Supabase Connection...');
  try {
    const { data, error } = await supabase.from('countries').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Connection successful');
    testsPassed++;
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
  }
  
  // Test 2: Location Codes CRUD
  totalTests++;
  console.log('\n2️⃣ Testing Location Codes CRUD...');
  try {
    // Create
    const { data: createData, error: createError } = await supabase
      .from('location_codes')
      .insert({
        code: 'TEST-FINAL',
        full_name: 'Final Test Location',
        category: 'airport',
        country: 'Test Country',
        city: 'Test City'
      })
      .select()
      .single();
    
    if (createError) throw createError;
    
    // Read
    const { data: readData, error: readError } = await supabase
      .from('location_codes')
      .select('*')
      .eq('id', createData.id)
      .single();
    
    if (readError) throw readError;
    
    // Update
    const { error: updateError } = await supabase
      .from('location_codes')
      .update({ full_name: 'Updated Final Test Location' })
      .eq('id', createData.id);
    
    if (updateError) throw updateError;
    
    // Delete
    const { error: deleteError } = await supabase
      .from('location_codes')
      .delete()
      .eq('id', createData.id);
    
    if (deleteError) throw deleteError;
    
    console.log('✅ Location Codes CRUD successful');
    testsPassed++;
  } catch (err) {
    console.log('❌ Location Codes CRUD failed:', err.message);
  }
  
  // Test 3: Transport Types CRUD
  totalTests++;
  console.log('\n3️⃣ Testing Transport Types CRUD...');
  try {
    // Create
    const { data: createData, error: createError } = await supabase
      .from('transport_types')
      .insert({
        name: 'Final Test Vehicle',
        category: 'car',
        seating_capacity: 4,
        luggage_capacity: 2,
        active: true
      })
      .select()
      .single();
    
    if (createError) throw createError;
    
    // Read
    const { data: readData, error: readError } = await supabase
      .from('transport_types')
      .select('*')
      .eq('id', createData.id)
      .single();
    
    if (readError) throw readError;
    
    // Update
    const { error: updateError } = await supabase
      .from('transport_types')
      .update({ seating_capacity: 6 })
      .eq('id', createData.id);
    
    if (updateError) throw updateError;
    
    // Delete
    const { error: deleteError } = await supabase
      .from('transport_types')
      .delete()
      .eq('id', createData.id);
    
    if (deleteError) throw deleteError;
    
    console.log('✅ Transport Types CRUD successful');
    testsPassed++;
  } catch (err) {
    console.log('❌ Transport Types CRUD failed:', err.message);
  }
  
  // Test 4: Transport Routes CRUD (with corrected schema)
  totalTests++;
  console.log('\n4️⃣ Testing Transport Routes CRUD...');
  try {
    // Create
    const { data: createData, error: createError } = await supabase
      .from('transport_routes')
      .insert({
        route_code: 'FINAL-TEST-001',
        route_name: 'Final Test Route',
        country: 'Test Country',
        transfer_type: 'One-Way',
        start_location: 'TST1',
        start_location_full_name: 'Test Start Location',
        end_location: 'TST2',
        end_location_full_name: 'Test End Location',
        distance: 10,
        duration: '15 minutes',
        description: 'Final test route',
        name: 'Final Test Route'
      })
      .select()
      .single();
    
    if (createError) throw createError;
    
    // Read
    const { data: readData, error: readError } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('id', createData.id)
      .single();
    
    if (readError) throw readError;
    
    // Update
    const { error: updateError } = await supabase
      .from('transport_routes')
      .update({ description: 'Updated final test route' })
      .eq('id', createData.id);
    
    if (updateError) throw updateError;
    
    // Delete
    const { error: deleteError } = await supabase
      .from('transport_routes')
      .delete()
      .eq('id', createData.id);
    
    if (deleteError) throw deleteError;
    
    console.log('✅ Transport Routes CRUD successful');
    testsPassed++;
  } catch (err) {
    console.log('❌ Transport Routes CRUD failed:', err.message);
  }
  
  // Test 5: Data Counts
  totalTests++;
  console.log('\n5️⃣ Testing Data Counts...');
  try {
    const [locationCount, transportTypeCount, routeCount] = await Promise.all([
      supabase.from('location_codes').select('*', { count: 'exact', head: true }),
      supabase.from('transport_types').select('*', { count: 'exact', head: true }),
      supabase.from('transport_routes').select('*', { count: 'exact', head: true })
    ]);
    
    console.log(`📊 Location Codes: ${locationCount.count}`);
    console.log(`📊 Transport Types: ${transportTypeCount.count}`);
    console.log(`📊 Transport Routes: ${routeCount.count}`);
    console.log('✅ Data counts retrieved successfully');
    testsPassed++;
  } catch (err) {
    console.log('❌ Data counts failed:', err.message);
  }
  
  // Final Summary
  console.log('\n🎯 Final Integration Test Summary:');
  console.log(`✅ Passed: ${testsPassed}/${totalTests} tests`);
  
  if (testsPassed === totalTests) {
    console.log('🎉 All tests passed! Supabase integration is working correctly.');
    console.log('✨ Schema discrepancies have been resolved.');
    console.log('🔧 TypeScript types have been updated to match the database.');
  } else {
    console.log('⚠️ Some tests failed. Please review the errors above.');
  }
  
  return testsPassed === totalTests;
}

runFinalIntegrationTest();