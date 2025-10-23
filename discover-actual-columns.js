import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function discoverActualColumns() {
  console.log('🔍 Discovering actual transport_routes table columns...\n');

  try {
    // Method 1: Try inserting with minimal data to see what columns exist
    console.log('1. Testing with minimal required fields...');
    
    const minimalRoute = {
      route_code: 'TEST_MINIMAL',
      route_name: 'Test Minimal Route',
      country: 'Test Country'
    };

    const { data: minimalData, error: minimalError } = await supabase
      .from('transport_routes')
      .insert([minimalRoute])
      .select();

    if (minimalError) {
      console.log('❌ Minimal insert failed:', minimalError.message);
      if (minimalError.details) {
        console.log('Details:', minimalError.details);
      }
    } else {
      console.log('✅ Minimal insert successful!');
      console.log('Inserted data structure:', JSON.stringify(minimalData[0], null, 2));
      
      // Clean up
      if (minimalData && minimalData.length > 0) {
        await supabase
          .from('transport_routes')
          .delete()
          .eq('id', minimalData[0].id);
        console.log('🧹 Test data cleaned up');
      }
    }

    // Method 2: Try a select with * to see what columns are returned
    console.log('\n2. Testing select * to discover column structure...');
    
    const { data: selectData, error: selectError } = await supabase
      .from('transport_routes')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('❌ Select failed:', selectError.message);
    } else {
      console.log('✅ Select successful - table structure discovered');
      if (selectData && selectData.length > 0) {
        console.log('Existing row structure:', Object.keys(selectData[0]));
      } else {
        console.log('Table is empty, but select worked - table exists');
      }
    }

    // Method 3: Try inserting with common transport route fields one by one
    console.log('\n3. Testing individual field insertions...');
    
    const fieldsToTest = [
      { route_code: 'TEST_001', route_name: 'Test Route', country: 'UAE' },
      { route_code: 'TEST_002', route_name: 'Test Route 2', country: 'UAE', transfer_type: 'direct' },
      { route_code: 'TEST_003', route_name: 'Test Route 3', country: 'UAE', start_location: 'Start' },
      { route_code: 'TEST_004', route_name: 'Test Route 4', country: 'UAE', end_location: 'End' },
      { route_code: 'TEST_005', route_name: 'Test Route 5', country: 'UAE', description: 'Test description' },
      { route_code: 'TEST_006', route_name: 'Test Route 6', country: 'UAE', distance: 10 },
      { route_code: 'TEST_007', route_name: 'Test Route 7', country: 'UAE', duration: '01:00:00' },
      { route_code: 'TEST_008', route_name: 'Test Route 8', country: 'UAE', cost: 50.00 },
      { route_code: 'TEST_009', route_name: 'Test Route 9', country: 'UAE', base_price: 75.00 }
    ];

    const workingFields = [];
    const failingFields = [];

    for (let i = 0; i < fieldsToTest.length; i++) {
      const testData = fieldsToTest[i];
      const testName = `Test ${i + 1}`;
      
      const { data: testResult, error: testError } = await supabase
        .from('transport_routes')
        .insert([testData])
        .select();

      if (testError) {
        console.log(`   ❌ ${testName} failed: ${testError.message}`);
        failingFields.push({ test: testName, fields: Object.keys(testData), error: testError.message });
      } else {
        console.log(`   ✅ ${testName} succeeded`);
        workingFields.push({ test: testName, fields: Object.keys(testData), data: testResult[0] });
        
        // Clean up
        if (testResult && testResult.length > 0) {
          await supabase
            .from('transport_routes')
            .delete()
            .eq('id', testResult[0].id);
        }
      }
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Working field combinations: ${workingFields.length}`);
    console.log(`❌ Failing field combinations: ${failingFields.length}`);
    
    if (workingFields.length > 0) {
      console.log('\n✅ WORKING FIELDS:');
      workingFields.forEach(item => {
        console.log(`   ${item.test}: [${item.fields.join(', ')}]`);
      });
      
      console.log('\nSample successful record structure:');
      console.log(JSON.stringify(workingFields[workingFields.length - 1].data, null, 2));
    }
    
    if (failingFields.length > 0) {
      console.log('\n❌ FAILING FIELDS:');
      failingFields.forEach(item => {
        console.log(`   ${item.test}: [${item.fields.join(', ')}] - ${item.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the discovery
discoverActualColumns().then(() => {
  console.log('\n🏁 Column discovery complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Discovery failed:', error);
  process.exit(1);
});