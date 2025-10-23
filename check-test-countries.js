import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTestCountries() {
  try {
    console.log('🔍 Checking for existing test countries...');
    
    // Check for countries with test names
    const { data: testCountries, error } = await supabase
      .from('countries')
      .select('id, name, code, created_at')
      .or('name.ilike.%Test Country CRUD%,name.ilike.%Updated Test Country CRUD%');
    
    if (error) {
      console.error('❌ Error fetching test countries:', error);
      return;
    }
    
    if (testCountries && testCountries.length > 0) {
      console.log(`📊 Found ${testCountries.length} test countries:`);
      testCountries.forEach((country, index) => {
        console.log(`  ${index + 1}. ID: ${country.id}, Name: "${country.name}", Code: ${country.code}, Created: ${country.created_at}`);
      });
      
      // Clean them up
      console.log('\n🧹 Cleaning up test countries...');
      const { error: deleteError } = await supabase
        .from('countries')
        .delete()
        .in('id', testCountries.map(c => c.id));
      
      if (deleteError) {
        console.error('❌ Error deleting test countries:', deleteError);
      } else {
        console.log('✅ Successfully cleaned up all test countries');
      }
    } else {
      console.log('✅ No test countries found in database');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTestCountries();
