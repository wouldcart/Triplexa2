import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCitiesTable() {
  console.log('Checking cities table...');
  
  try {
    // Check if cities table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('cities')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('Cities table already exists!');
      return true;
    }

    if (checkError && checkError.code === '42P01') {
      console.log('Cities table does not exist. Creating it now...');
      return false;
    }

    console.log('Cities table check completed');
    return true;
  } catch (err) {
    console.error('Error:', err);
    return false;
  }
}

async function createCitiesTableManually() {
  console.log('Creating cities table manually...');
  
  try {
    // Use a workaround to create the table by using raw SQL through a function
    // This is a simplified approach that should work
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: `
          CREATE TABLE IF NOT EXISTS public.cities (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              country_id INTEGER NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
              region TEXT NOT NULL,
              has_airport BOOLEAN DEFAULT false,
              is_popular BOOLEAN DEFAULT false,
              status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Allow all operations on cities" ON public.cities;
          CREATE POLICY "Allow all operations on cities" ON public.cities
              FOR ALL USING (true) WITH CHECK (true);
              
          CREATE INDEX IF NOT EXISTS idx_cities_country_id ON public.cities(country_id);
          CREATE INDEX IF NOT EXISTS idx_cities_status ON public.cities(status);
          CREATE INDEX IF NOT EXISTS idx_cities_is_popular ON public.cities(is_popular);
          CREATE INDEX IF NOT EXISTS idx_cities_has_airport ON public.cities(has_airport);
          CREATE INDEX IF NOT EXISTS idx_cities_name ON public.cities(name);
        `
      })
    });

    if (!response.ok) {
      console.log('Direct SQL execution not available. Table needs to be created manually.');
      console.log('Please execute the SQL in create-cities-sql.sql file in Supabase SQL Editor.');
      return false;
    }

    console.log('Cities table created successfully!');
    return true;
  } catch (err) {
    console.log('Direct SQL execution not available. Table needs to be created manually.');
    console.log('Please execute the SQL in create-cities-sql.sql file in Supabase SQL Editor.');
    return false;
  }
}

async function insertInitialCityData() {
  console.log('Inserting initial city data...');
  
  try {
    // Get country IDs first
    const { data: countries, error: countryError } = await supabase
      .from('countries')
      .select('id, code')
      .in('code', ['TH', 'AE']);

    if (countryError) {
      console.error('Error fetching countries:', countryError);
      return false;
    }

    const thailandId = countries.find(c => c.code === 'TH')?.id;
    const uaeId = countries.find(c => c.code === 'AE')?.id;

    if (!thailandId || !uaeId) {
      console.error('Could not find Thailand or UAE in countries table');
      return false;
    }

    // Insert cities
    const cities = [
      // Thailand cities
      { name: 'Bangkok', country_id: thailandId, region: 'Central', has_airport: true, is_popular: true, status: 'active' },
      { name: 'Phuket', country_id: thailandId, region: 'South', has_airport: true, is_popular: true, status: 'active' },
      { name: 'Chiang Mai', country_id: thailandId, region: 'North', has_airport: true, is_popular: true, status: 'active' },
      { name: 'Pattaya', country_id: thailandId, region: 'East', has_airport: false, is_popular: true, status: 'active' },
      { name: 'Hua Hin', country_id: thailandId, region: 'Central', has_airport: false, is_popular: false, status: 'active' },
      { name: 'Krabi', country_id: thailandId, region: 'South', has_airport: true, is_popular: true, status: 'active' },
      { name: 'Koh Samui', country_id: thailandId, region: 'South', has_airport: true, is_popular: true, status: 'active' },
      { name: 'Koh Phangan', country_id: thailandId, region: 'South', has_airport: false, is_popular: false, status: 'active' },
      { name: 'Phi Phi Islands', country_id: thailandId, region: 'South', has_airport: false, is_popular: true, status: 'active' },
      { name: 'Koh Yao Yai', country_id: thailandId, region: 'South', has_airport: false, is_popular: false, status: 'active' },
      { name: 'Rayong', country_id: thailandId, region: 'East', has_airport: false, is_popular: false, status: 'active' },
      { name: 'Kanchanaburi', country_id: thailandId, region: 'West', has_airport: false, is_popular: false, status: 'active' },
      { name: 'Ayutthaya', country_id: thailandId, region: 'Central', has_airport: false, is_popular: false, status: 'active' },
      
      // UAE cities
      { name: 'Dubai', country_id: uaeId, region: 'Dubai', has_airport: true, is_popular: true, status: 'active' },
      { name: 'Abu Dhabi', country_id: uaeId, region: 'Abu Dhabi', has_airport: true, is_popular: false, status: 'active' },
      { name: 'Sharjah', country_id: uaeId, region: 'Sharjah', has_airport: true, is_popular: false, status: 'disabled' },
      { name: 'Ajman', country_id: uaeId, region: 'Ajman', has_airport: false, is_popular: false, status: 'disabled' },
      { name: 'Fujairah', country_id: uaeId, region: 'Fujairah', has_airport: true, is_popular: false, status: 'active' },
      { name: 'Ras Al Khaimah', country_id: uaeId, region: 'Ras Al Khaimah', has_airport: true, is_popular: false, status: 'active' },
      { name: 'Umm Al Quwain', country_id: uaeId, region: 'Umm Al Quwain', has_airport: false, is_popular: false, status: 'active' }
    ];

    const { data, error } = await supabase
      .from('cities')
      .insert(cities);

    if (error) {
      console.error('Error inserting cities:', error);
      return false;
    }

    console.log('Initial city data inserted successfully!');
    return true;
  } catch (err) {
    console.error('Error:', err);
    return false;
  }
}

async function main() {
  console.log('Starting cities table setup...');
  
  const tableExists = await checkCitiesTable();
  if (!tableExists) {
    console.log('Attempting to create cities table...');
    const tableCreated = await createCitiesTableManually();
    if (!tableCreated) {
      console.error('Failed to create cities table automatically.');
      console.log('Please manually execute the SQL in create-cities-sql.sql file in Supabase SQL Editor.');
      process.exit(1);
    }
  }

  const dataInserted = await insertInitialCityData();
  if (!dataInserted) {
    console.error('Failed to insert initial city data');
    process.exit(1);
  }

  console.log('Cities table setup completed successfully!');
  process.exit(0);
}

main();