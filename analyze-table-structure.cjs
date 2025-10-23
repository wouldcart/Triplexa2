const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function analyzeTableStructure() {
  console.log('🔍 Analyzing transport_routes table structure...\n');
  
  try {
    // Get sample data to understand current structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('transport_routes')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.error('❌ Error fetching sample data:', sampleError);
      return;
    }
    
    const currentFields = sampleData[0] ? Object.keys(sampleData[0]) : [];
    console.log('📊 Current table fields:');
    currentFields.forEach(field => {
      const value = sampleData[0] ? sampleData[0][field] : null;
      const type = typeof value;
      console.log(`  - ${field}: ${type} (${value === null ? 'null' : 'has data'})`);
    });
    
    // Required fields based on specifications
    const requiredFields = {
      // Route Information
      'route_name': 'string - Name of the route',
      'route_code': 'string - Unique identifier code for the route',
      'start_location_code': 'string - Location code for start',
      'end_location_code': 'string - Location code for end',
      'start_location_full_name': 'string - Derived from start_location_code',
      'end_location_full_name': 'string - Derived from end_location_code',
      'distance': 'number - Total route distance',
      'duration': 'string/number - Estimated travel time',
      'enable_sightseeing': 'boolean - Flag for sightseeing availability',
      'description': 'string - Route description',
      
      // Route Details
      'transport_types': 'array - Modes of transportation used',
      'route_segments': 'array - Breakdown of route sections',
      'intermediate_stops': 'array - Waypoints between start and end',
      'transport_entries': 'array - Specific transport details',
      'sightseeing_locations': 'array - Points of interest along route',
      'notes': 'string - Additional information'
    };
    
    console.log('\n📋 Required fields analysis:');
    const missingFields = [];
    const existingFields = [];
    const problematicFields = [];
    
    Object.entries(requiredFields).forEach(([field, description]) => {
      if (currentFields.includes(field)) {
        existingFields.push(field);
        
        // Check if notes field has issues
        if (field === 'notes' && sampleData[0] && sampleData[0][field] === null) {
          problematicFields.push(`${field} - exists but may have data type issues`);
        }
      } else {
        missingFields.push(`${field} - ${description}`);
      }
    });
    
    console.log('\n✅ Existing fields:');
    existingFields.forEach(field => console.log(`  - ${field}`));
    
    if (missingFields.length > 0) {
      console.log('\n❌ Missing fields:');
      missingFields.forEach(field => console.log(`  - ${field}`));
    }
    
    if (problematicFields.length > 0) {
      console.log('\n⚠️  Problematic fields:');
      problematicFields.forEach(field => console.log(`  - ${field}`));
    }
    
    // Check for location resolution capability
    console.log('\n🗺️  Location resolution check:');
    if (currentFields.includes('start_location_code') && currentFields.includes('end_location_code')) {
      console.log('  ✅ Location codes exist - can implement resolution logic');
    } else {
      console.log('  ❌ Location codes missing - need to add these fields');
    }
    
    // Check data types for complex fields
    console.log('\n🔍 Complex field analysis:');
    const complexFields = ['transport_types', 'route_segments', 'intermediate_stops', 'transport_entries', 'sightseeing_locations'];
    
    complexFields.forEach(field => {
      if (currentFields.includes(field) && sampleData[0]) {
        const value = sampleData[0][field];
        console.log(`  - ${field}: ${typeof value} ${Array.isArray(value) ? '(array)' : '(not array)'}`);
      }
    });
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

analyzeTableStructure().then(() => {
  console.log('\n✨ Analysis complete!');
  process.exit(0);
}).catch(console.error);