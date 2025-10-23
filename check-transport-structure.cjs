require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function checkTransportRoutesStructure() {
  try {
    console.log('🔍 Checking transport_routes table structure...\n');
    
    // Get a sample record to see all columns
    const { data, error } = await supabase
      .from('transport_routes')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('📋 Transport Routes columns and sample data:');
      Object.keys(data[0]).forEach(key => {
        const value = data[0][key];
        const type = typeof value;
        let displayValue = value;
        
        if (type === 'object' && value !== null) {
          displayValue = JSON.stringify(value);
        }
        
        console.log(`  - ${key}: ${type} = ${displayValue}`);
      });
    } else {
      console.log('📋 No data found in transport_routes table');
    }
    
    // Also check if there are any records at all
    const { count } = await supabase
      .from('transport_routes')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Total records in transport_routes: ${count}`);
    
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

checkTransportRoutesStructure();