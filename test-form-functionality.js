const { createClient } = require('@supabase/supabase-js');

// Environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Testing Transport Route Form Schema Compatibility...\n');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSchema() {
  try {
    // Test minimal route creation with all required fields
    const testData = {
      route_name: 'Schema Test Route',
      route_code: 'SCHEMA001',
      name: 'Test Display Name',
      country: 'Japan',
      transfer_type: 'One-Way',
      start_location: 'NRT',
      start_location_full_name: 'Narita Airport',
      end_location: 'HND',
      end_location_full_name: 'Haneda Airport',
      distance: 65,
      duration: '1h 30m',
      description: 'Test description',
      notes: 'Test notes',
      status: 'active',
      enable_sightseeing: false
    };

    console.log('📝 Creating test route...');
    const { data, error } = await supabase
      .from('transport_routes')
      .insert([testData])
      .select()
      .single();

    if (error) {
      console.error('❌ Schema Error:', error.message);
      return false;
    }

    console.log('✅ Route created successfully!');
    console.log('📋 Fields verified:', Object.keys(data).join(', '));

    // Clean up
    await supabase.from('transport_routes').delete().eq('id', data.id);
    console.log('🧹 Test data cleaned up');
    
    return true;
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return false;
  }
}

testSchema().then(success => {
  if (success) {
    console.log('\n🎉 Schema compatibility test PASSED!');
    console.log('✅ Form is ready for use with updated fields.');
  } else {
    console.log('\n❌ Schema compatibility test FAILED!');
  }
  process.exit(success ? 0 : 1);
});