import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabasePublishableKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.log('Required variables:');
  console.log('- VITE_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Found' : '❌ Missing');
  console.log('- VITE_SUPABASE_PUBLISHABLE_KEY:', supabasePublishableKey ? '✅ Found' : '❌ Missing');
  process.exit(1);
}

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabasePublishableKey); // Regular client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey); // Admin client

console.log('🔗 Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Testing both regular and admin clients\n');

async function testSupabaseConnection() {
  try {
    console.log('📋 Testing app_settings Table (406 Error Investigation)...');
    
    // Test 1: Check if app_settings table exists using admin client
    console.log('\n1️⃣ Testing app_settings table existence with ADMIN client...');
    try {
      const { data: tableCheck, error: tableError } = await supabaseAdmin
        .from('app_settings')
        .select('count(*)', { count: 'exact', head: true });
      
      if (tableError) {
        console.error('❌ Admin Client - Table Check Error:', tableError.message);
        console.error('❌ Error Code:', tableError.code);
        console.error('❌ Error Details:', tableError.details);
        console.error('❌ Error Hint:', tableError.hint);
      } else {
        console.log('✅ Admin client - app_settings table exists');
        console.log('📊 Table accessible with admin client');
      }
    } catch (err) {
      console.error('❌ Admin Client - Exception:', err.message);
    }
    
    // Test 2: Check if app_settings table exists using regular client
    console.log('\n2️⃣ Testing app_settings table existence with REGULAR client...');
    try {
      const { data: tableCheck, error: tableError } = await supabase
        .from('app_settings')
        .select('count(*)', { count: 'exact', head: true });
      
      if (tableError) {
        console.error('❌ Regular Client - Table Check Error:', tableError.message);
        console.error('❌ Error Code:', tableError.code);
        console.error('❌ Error Details:', tableError.details);
        console.error('❌ Error Hint:', tableError.hint);
        
        // Check if this is the 406 error we're looking for
        if (tableError.code === '406' || tableError.message.includes('Not Acceptable')) {
          console.log('🎯 Found the 406 error! This is likely due to RLS policies.');
        }
      } else {
        console.log('✅ Regular client - app_settings table exists and accessible');
        console.log('📊 Table accessible with regular client');
      }
    } catch (err) {
      console.error('❌ Regular Client - Exception:', err.message);
    }
    
    // Test 3: Try to query specific brand_tagline setting with admin client
    console.log('\n3️⃣ Testing brand_tagline query with ADMIN client...');
    try {
      const { data: settingsAdmin, error: adminError } = await supabaseAdmin
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'brand_tagline');
      
      if (adminError) {
        console.error('❌ Admin Client - brand_tagline Error:', adminError.message);
        console.error('❌ Error Code:', adminError.code);
      } else {
        console.log('✅ Admin client successfully queried brand_tagline');
        console.log('📊 Data:', settingsAdmin);
      }
    } catch (err) {
      console.error('❌ Admin Client - brand_tagline Exception:', err.message);
    }
    
    // Test 4: Try to query specific brand_tagline setting with regular client
    console.log('\n4️⃣ Testing brand_tagline query with REGULAR client...');
    try {
      const { data: settingsRegular, error: regularError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'brand_tagline');
      
      if (regularError) {
        console.error('❌ Regular Client - brand_tagline Error:', regularError.message);
        console.error('❌ Error Code:', regularError.code);
        
        // Check if this is the 406 error
        if (regularError.code === '406' || regularError.message.includes('Not Acceptable')) {
          console.log('🎯 Confirmed: 406 error occurs with regular client on brand_tagline query');
          console.log('💡 This suggests RLS (Row Level Security) is blocking access');
        }
      } else {
        console.log('✅ Regular client successfully queried brand_tagline');
        console.log('📊 Data:', settingsRegular);
      }
    } catch (err) {
      console.error('❌ Regular Client - brand_tagline Exception:', err.message);
    }
    
    // Test 5: Check RLS policies on app_settings table
    console.log('\n5️⃣ Checking RLS policies on app_settings table...');
    try {
      const { data: policies, error: policyError } = await supabaseAdmin
        .rpc('get_table_policies', { table_name: 'app_settings' });
      
      if (policyError) {
        console.log('ℹ️ Could not retrieve RLS policies (this is normal if function doesn\'t exist)');
      } else {
        console.log('📋 RLS Policies found:', policies);
      }
    } catch (err) {
      console.log('ℹ️ RLS policy check not available');
    }
    
    // Test 6: Test transport_routes table for comparison
    console.log('\n6️⃣ Testing transport_routes table for comparison...');
    try {
      const { data: routes, error: routesError } = await supabase
        .from('transport_routes')
        .select('*')
        .limit(1);
      
      if (routesError) {
        console.error('❌ transport_routes Error:', routesError.message);
        console.error('❌ Error Code:', routesError.code);
      } else {
        console.log('✅ transport_routes table accessible with regular client');
        console.log('📊 Found routes:', routes.length);
      }
    } catch (err) {
      console.error('❌ transport_routes Exception:', err.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 Supabase connection tests completed!');
      console.log('\n📝 Summary:');
      console.log('- If 406 errors occurred with regular client but not admin client,');
      console.log('  this indicates RLS policies are blocking access');
      console.log('- The AppSettingsService should automatically fall back to localStorage');
      console.log('- Transport routes should work normally as they use admin client');
    } else {
      console.log('\n❌ Some tests failed');
    }
  })
  .catch(error => {
    console.error('\n💥 Test suite failed:', error.message);
  });