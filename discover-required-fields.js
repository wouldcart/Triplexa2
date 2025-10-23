import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Discovering Required Fields for transport_routes');
console.log('=================================================');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function discoverRequiredFields() {
  console.log('\n🚗 Systematically discovering transport_routes required fields...');
  
  // Start with known required fields and add more based on errors
  const baseData = {
    route_code: 'DISCOVER001',
    route_name: 'Discovery Route',
    country: 'US'
  };
  
  console.log('   🧪 Testing with base data:', baseData);
  
  let { data, error } = await supabase
    .from('transport_routes')
    .insert(baseData)
    .select();
  
  if (error) {
    console.log(`   📝 Error: ${error.message}`);
    
    // Extract the missing field from the error message
    const match = error.message.match(/null value in column "([^"]+)"/);
    if (match) {
      const missingField = match[1];
      console.log(`   🎯 Missing required field: ${missingField}`);
      
      // Try with common values for different field types
      const testValues = {
        transfer_type: 'direct',
        transport_type: 'bus',
        status: 'active',
        active: true,
        price: 0,
        duration: '2 hours',
        distance: 100,
        from_city: 'City A',
        to_city: 'City B',
        departure_time: '09:00',
        arrival_time: '11:00'
      };
      
      if (testValues[missingField]) {
        const extendedData = { ...baseData, [missingField]: testValues[missingField] };
        console.log(`   🔄 Retrying with ${missingField}: ${testValues[missingField]}`);
        
        const { data: retryData, error: retryError } = await supabase
          .from('transport_routes')
          .insert(extendedData)
          .select();
        
        if (retryError) {
          console.log(`   📝 Still error: ${retryError.message}`);
          
          // Check for another missing field
          const nextMatch = retryError.message.match(/null value in column "([^"]+)"/);
          if (nextMatch) {
            const nextMissingField = nextMatch[1];
            console.log(`   🎯 Next missing field: ${nextMissingField}`);
            
            if (testValues[nextMissingField]) {
              const finalData = { ...extendedData, [nextMissingField]: testValues[nextMissingField] };
              console.log(`   🔄 Final attempt with both fields...`);
              
              const { data: finalRetryData, error: finalRetryError } = await supabase
                .from('transport_routes')
                .insert(finalData)
                .select();
              
              if (finalRetryError) {
                console.log(`   📝 Final error: ${finalRetryError.message}`);
              } else {
                console.log(`   ✅ SUCCESS! Required fields discovered:`, Object.keys(finalData));
                console.log(`   📊 Created record:`, finalRetryData[0]);
                
                // Clean up
                await supabase.from('transport_routes').delete().eq('id', finalRetryData[0].id);
                console.log(`   🧹 Cleaned up test record`);
                
                return finalData;
              }
            }
          }
        } else {
          console.log(`   ✅ SUCCESS! Required fields:`, Object.keys(extendedData));
          console.log(`   📊 Created record:`, retryData[0]);
          
          // Clean up
          await supabase.from('transport_routes').delete().eq('id', retryData[0].id);
          console.log(`   🧹 Cleaned up test record`);
          
          return extendedData;
        }
      }
    }
  } else {
    console.log(`   ✅ SUCCESS with base data!`);
    console.log(`   📊 Created record:`, data[0]);
    
    // Clean up
    await supabase.from('transport_routes').delete().eq('id', data[0].id);
    console.log(`   🧹 Cleaned up test record`);
    
    return baseData;
  }
  
  return null;
}

async function testCompleteSchema() {
  console.log('\n🧪 Testing complete schema with discovered fields...');
  
  // Based on the discovery, create a complete test
  const completeData = {
    route_code: 'COMPLETE001',
    route_name: 'Complete Test Route',
    country: 'US',
    transfer_type: 'direct'
  };
  
  try {
    const { data, error } = await supabase
      .from('transport_routes')
      .insert(completeData)
      .select();
    
    if (error) {
      console.log(`   ❌ Still failing: ${error.message}`);
      return false;
    }
    
    console.log(`   ✅ Complete schema works!`);
    console.log(`   📊 Record:`, data[0]);
    
    // Test update
    const { data: updateData, error: updateError } = await supabase
      .from('transport_routes')
      .update({ route_name: 'Updated Complete Test Route' })
      .eq('id', data[0].id)
      .select();
    
    if (updateError) {
      console.log(`   ❌ Update failed: ${updateError.message}`);
    } else {
      console.log(`   ✅ Update successful`);
    }
    
    // Clean up
    await supabase.from('transport_routes').delete().eq('id', data[0].id);
    console.log(`   🧹 Cleaned up test record`);
    
    return true;
    
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function main() {
  const discoveredSchema = await discoverRequiredFields();
  
  if (discoveredSchema) {
    console.log('\n🎯 Discovered Schema:');
    console.log('=====================');
    Object.entries(discoveredSchema).forEach(([field, value]) => {
      console.log(`   ${field}: ${value} (${typeof value})`);
    });
    
    const success = await testCompleteSchema();
    
    if (success) {
      console.log('\n🎉 transport_routes schema fully discovered and working!');
    }
  } else {
    console.log('\n❌ Could not discover complete schema');
  }
}

// Run the script
main().catch(console.error);