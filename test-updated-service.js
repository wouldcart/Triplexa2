const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTransportService() {
  try {
    console.log('Testing comprehensive transport service...');
    
    // Test creating a route with correct schema
    const testRoute = {
      route_code: 'TEST-' + Date.now(),
      route_name: 'Test Route Updated',
      country: 'India',
      transfer_type: 'One-Way',
      start_location: 'Delhi',
      start_location_full_name: 'New Delhi, India',
      end_location: 'Mumbai',
      end_location_full_name: 'Mumbai, Maharashtra, India',
      distance: 1400,
      duration: '2 hours',
      description: 'Test route description',
      notes: 'Test notes',
      status: 'active',
      enable_sightseeing: true,
      name: 'Delhi to Mumbai Express'
    };
    
    console.log('Creating route with data:', JSON.stringify(testRoute, null, 2));
    
    const { data: route, error } = await supabase
      .from('transport_routes')
      .insert(testRoute)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating route:', error);
      return;
    }
    
    console.log('✅ Route created successfully:', route);
    
    // Test reading the route
    const { data: routes, error: readError } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('id', route.id);
    
    if (readError) {
      console.error('Error reading route:', readError);
      return;
    }
    
    console.log('✅ Route read successfully:', routes[0]);
    
    // Clean up
    await supabase
      .from('transport_routes')
      .delete()
      .eq('id', route.id);
    
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testTransportService();