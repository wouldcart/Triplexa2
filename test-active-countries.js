import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testActiveCountries() {
  console.log('📋 Testing Active Countries from Supabase...');
  
  try {
    const { data: activeCountries, error } = await supabase
      .from('countries')
      .select('*')
      .eq('status', 'active')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching active countries:', error.message);
      return;
    }
    
    console.log(`✅ Successfully fetched ${activeCountries.length} active countries`);
    activeCountries.forEach(country => {
      console.log(`   - ${country.name} (${country.code})`);
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testActiveCountries();