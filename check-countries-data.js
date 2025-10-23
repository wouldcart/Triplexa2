import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCountriesData() {
  console.log('📊 Checking Countries Data...\n');
  
  try {
    const { data: countries, error } = await supabase
      .from('countries')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log(`Found ${countries.length} countries in database:\n`);
    
    countries.forEach((country, index) => {
      console.log(`${index + 1}. ${country.name} (${country.code})`);
      console.log(`   Default Currency: ${country.currency} (${country.currency_symbol})`);
      
      if (country.pricing_currency_override) {
        console.log(`   🔄 Override: ${country.pricing_currency} (${country.pricing_currency_symbol})`);
      } else {
        console.log(`   ✅ Using default currency`);
      }
      console.log('');
    });
    
    const overrideCount = countries.filter(c => c.pricing_currency_override).length;
    console.log(`\n📈 Summary:`);
    console.log(`   Total countries: ${countries.length}`);
    console.log(`   With currency overrides: ${overrideCount}`);
    console.log(`   Using default currency: ${countries.length - overrideCount}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkCountriesData();
