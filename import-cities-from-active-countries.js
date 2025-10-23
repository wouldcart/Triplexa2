#!/usr/bin/env node

// Import city names into database based on active countries
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase configuration: ensure VITE_SUPABASE_URL and service role key are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function loadCitiesData() {
  const filePath = path.resolve(process.cwd(), 'src/pages/inventory/cities/data/cities-import.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Cities import file not found at ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

async function getActiveCountriesMap() {
  const { data, error } = await supabase
    .from('countries')
    .select('id, name, status')
    .eq('status', 'active');

  if (error) throw error;
  const map = new Map();
  (data || []).forEach(c => map.set(c.name, c.id));
  return map;
}

async function getExistingCityPairs() {
  const { data, error } = await supabase
    .from('cities')
    .select('name, country_id');
  if (error) throw error;
  const set = new Set((data || []).map(row => `${row.name}::${row.country_id}`));
  return set;
}

async function run() {
  console.log('🏙️ Importing cities based on active countries...');
  try {
    const cities = await loadCitiesData();
    const activeCountries = await getActiveCountriesMap();
    console.log(`✅ Loaded ${activeCountries.size} active countries`);

    const existingPairs = await getExistingCityPairs();
    console.log(`ℹ️ Found ${existingPairs.size} existing city records`);

    const toInsert = [];
    for (const city of cities) {
      const countryId = activeCountries.get(city.country);
      if (!countryId) {
        console.log(`⏭️ Skipping ${city.name} (${city.country}) - country not active`);
        continue;
      }
      const key = `${city.name}::${countryId}`;
      if (existingPairs.has(key)) {
        console.log(`🔁 Skipping ${city.name} (${city.country}) - already exists`);
        continue;
      }
      toInsert.push({
        name: city.name,
        region: city.region,
        country_id: countryId,
        has_airport: !!city.has_airport,
        is_popular: !!city.is_popular,
        status: city.status === 'disabled' ? 'disabled' : 'active'
      });
    }

    if (toInsert.length === 0) {
      console.log('⚠️ No new cities to insert.');
      process.exit(0);
    }

    console.log(`📥 Inserting ${toInsert.length} cities...`);
    const { data, error } = await supabase
      .from('cities')
      .insert(toInsert)
      .select('id, name, country_id');

    if (error) {
      console.error('❌ Insert failed:', error.message);
      process.exit(1);
    }

    console.log(`✅ Inserted ${data?.length || 0} cities`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Import error:', err.message || err);
    process.exit(1);
  }
}

run();