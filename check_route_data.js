import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzofytokwszfwiupsdvi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNTM0MTEsImV4cCI6MjA3MzkyOTQxMX0.FnTL4m0EmxzlNSRfCD12Gc1_PUpOI4rHvaRemr46CiQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRouteData() {
  try {
    console.log('Checking transport routes data...\n');
    
    const { data: routes, error } = await supabase
      .from('transport_routes')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Error fetching routes:', error);
      return;
    }

    if (!routes || routes.length === 0) {
      console.log('No transport routes found in database.');
      return;
    }

    console.log(`Found ${routes.length} routes. Checking field population:\n`);

    const fieldsToCheck = [
      'start_location_full_name',
      'end_location_full_name', 
      'transport_types',
      'route_segments',
      'intermediate_stops',
      'enable_sightseeing',
      'created_by',
      'updated_by',
      'sightseeing_locations'
    ];

    routes.forEach((route, index) => {
      console.log(`Route ${index + 1} (ID: ${route.id}):`);
      console.log(`  Name: ${route.name || 'N/A'}`);
      
      fieldsToCheck.forEach(field => {
        const value = route[field];
        let status = 'EMPTY';
        
        if (value !== null && value !== undefined) {
          if (typeof value === 'string' && value.trim() !== '') {
            status = 'POPULATED';
          } else if (typeof value === 'boolean') {
            status = 'POPULATED';
          } else if (Array.isArray(value) && value.length > 0) {
            status = 'POPULATED';
          } else if (typeof value === 'object' && Object.keys(value).length > 0) {
            status = 'POPULATED';
          }
        }
        
        console.log(`  ${field}: ${status} ${status === 'POPULATED' ? `(${typeof value})` : ''}`);
      });
      console.log('');
    });

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkRouteData();