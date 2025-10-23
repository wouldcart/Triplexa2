import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkLocationCodes() {
  try {
    console.log('Checking location_codes table...');
    
    // Simple select to check if table exists and has data
    const { data, error } = await supabase
      .from('location_codes')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('Error accessing location_codes table:', error);
      return;
    }
    
    console.log('Records found:', data.length);
    
    if (data.length > 0) {
      console.log('Sample records:');
      data.forEach((record, index) => {
        console.log(`${index + 1}. Code: ${record.code}, Name: ${record.full_name}, Country: ${record.country}, Status: ${record.status}`);
      });
      
      // Count by country
      const countByCountry = {};
      data.forEach(record => {
        countByCountry[record.country] = (countByCountry[record.country] || 0) + 1;
      });
      
      console.log('\nCountries in sample:');
      Object.entries(countByCountry).forEach(([country, count]) => {
        console.log(`${country}: ${count} records`);
      });
    } else {
      console.log('Table exists but is empty');
    }
    
    // Also check total count
    const { count, error: countError } = await supabase
      .from('location_codes')
      .select('*', { count: 'exact', head: true });
      
    if (!countError) {
      console.log('\nTotal records in table:', count);
    } else {
      console.error('Count error:', countError);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkLocationCodes();