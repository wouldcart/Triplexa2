#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Checking Cities Table Schema');
console.log('===============================\n');

async function checkTableSchema() {
  try {
    // Get a sample record to see the actual structure
    console.log('📋 Sample cities record:');
    const { data: sampleCity, error: sampleError } = await supabase
      .from('cities')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error fetching sample:', sampleError.message);
    } else if (sampleCity && sampleCity.length > 0) {
      console.log('✅ Sample record structure:');
      console.log(JSON.stringify(sampleCity[0], null, 2));
      console.log('\n📊 Available columns:');
      Object.keys(sampleCity[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof sampleCity[0][key]} (${sampleCity[0][key] === null ? 'null' : sampleCity[0][key]})`);
      });
    } else {
      console.log('⚠️  No cities found in table');
    }
    
    // Check countries table too
    console.log('\n📋 Sample countries record:');
    const { data: sampleCountry, error: countryError } = await supabase
      .from('countries')
      .select('*')
      .limit(1);
    
    if (countryError) {
      console.error('❌ Error fetching countries sample:', countryError.message);
    } else if (sampleCountry && sampleCountry.length > 0) {
      console.log('✅ Sample country record structure:');
      console.log(JSON.stringify(sampleCountry[0], null, 2));
      console.log('\n📊 Available columns:');
      Object.keys(sampleCountry[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof sampleCountry[0][key]} (${sampleCountry[0][key] === null ? 'null' : sampleCountry[0][key]})`);
      });
    } else {
      console.log('⚠️  No countries found in table');
    }
    
    // Try to get cities with country information
    console.log('\n🔗 Testing cities with country join:');
    const { data: citiesWithCountries, error: joinError } = await supabase
      .from('cities')
      .select(`
        *,
        countries(*)
      `)
      .limit(1);
    
    if (joinError) {
      console.error('❌ Join error:', joinError.message);
    } else {
      console.log('✅ Join successful');
      if (citiesWithCountries && citiesWithCountries.length > 0) {
        console.log('Sample joined record:');
        console.log(JSON.stringify(citiesWithCountries[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('💥 Schema check failed:', error.message);
  }
}

checkTableSchema();