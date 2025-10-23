import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Static data from cityData.ts
const staticCities = [
  { id: '1', name: 'Bangkok', country: 'Thailand', region: 'Central', hasAirport: true, isPopular: true, status: 'active' },
  { id: '2', name: 'Chiang Mai', country: 'Thailand', region: 'Northern', hasAirport: true, isPopular: true, status: 'active' },
  { id: '3', name: 'Phuket', country: 'Thailand', region: 'Southern', hasAirport: true, isPopular: true, status: 'active' },
  { id: '4', name: 'Pattaya', country: 'Thailand', region: 'Eastern', hasAirport: false, isPopular: true, status: 'active' },
  { id: '5', name: 'Krabi', country: 'Thailand', region: 'Southern', hasAirport: true, isPopular: false, status: 'active' },
  { id: '6', name: 'Hua Hin', country: 'Thailand', region: 'Central', hasAirport: false, isPopular: false, status: 'active' },
  { id: '7', name: 'Koh Samui', country: 'Thailand', region: 'Southern', hasAirport: true, isPopular: true, status: 'active' },
  { id: '8', name: 'Ayutthaya', country: 'Thailand', region: 'Central', hasAirport: false, isPopular: false, status: 'active' },
  { id: '9', name: 'Kanchanaburi', country: 'Thailand', region: 'Western', hasAirport: false, isPopular: false, status: 'active' },
  { id: '10', name: 'Sukhothai', country: 'Thailand', region: 'Northern', hasAirport: true, isPopular: false, status: 'active' },
  { id: '11', name: 'Dubai', country: 'United Arab Emirates', region: 'Dubai', hasAirport: true, isPopular: true, status: 'active' },
  { id: '12', name: 'Abu Dhabi', country: 'United Arab Emirates', region: 'Abu Dhabi', hasAirport: true, isPopular: true, status: 'active' },
  { id: '13', name: 'Sharjah', country: 'United Arab Emirates', region: 'Sharjah', hasAirport: true, isPopular: false, status: 'active' },
  { id: '14', name: 'Ajman', country: 'United Arab Emirates', region: 'Ajman', hasAirport: false, isPopular: false, status: 'active' },
  { id: '15', name: 'Fujairah', country: 'United Arab Emirates', region: 'Fujairah', hasAirport: true, isPopular: false, status: 'active' },
  { id: '16', name: 'Ras Al Khaimah', country: 'United Arab Emirates', region: 'Ras Al Khaimah', hasAirport: true, isPopular: false, status: 'active' },
  { id: '17', name: 'Umm Al Quwain', country: 'United Arab Emirates', region: 'Umm Al Quwain', hasAirport: false, isPopular: false, status: 'active' },
  { id: '18', name: 'Al Ain', country: 'United Arab Emirates', region: 'Abu Dhabi', hasAirport: true, isPopular: false, status: 'active' },
  { id: '19', name: 'Khor Fakkan', country: 'United Arab Emirates', region: 'Sharjah', hasAirport: false, isPopular: false, status: 'active' },
  { id: '20', name: 'Dibba', country: 'United Arab Emirates', region: 'Fujairah', hasAirport: false, isPopular: false, status: 'active' }
];

async function compareCitiesData() {
  console.log('Fetching cities from database...');
  
  try {
    const { data: dbCities, error } = await supabase
      .from('cities')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching cities:', error);
      return;
    }

    console.log(`Database has ${dbCities.length} cities`);
    console.log(`Static data has ${staticCities.length} cities`);
    
    // Check which cities from static data are missing in database
    const dbCityNames = dbCities.map(city => city.name.toLowerCase());
    const missingCities = staticCities.filter(staticCity => 
      !dbCityNames.includes(staticCity.name.toLowerCase())
    );

    console.log('\nMissing cities from database:');
    missingCities.forEach(city => {
      console.log(`- ${city.name}, ${city.country}`);
    });

    // Check which cities in database are not in static data
    const staticCityNames = staticCities.map(city => city.name.toLowerCase());
    const extraCities = dbCities.filter(dbCity => 
      !staticCityNames.includes(dbCity.name.toLowerCase())
    );

    console.log('\nExtra cities in database (not in static data):');
    extraCities.forEach(city => {
      console.log(`- ${city.name}, ${city.country}`);
    });

    // If there are missing cities, prepare them for insertion
    if (missingCities.length > 0) {
      console.log('\nPreparing to insert missing cities...');
      
      const citiesToInsert = missingCities.map(city => ({
        name: city.name,
        country: city.country,
        region: city.region,
        has_airport: city.hasAirport,
        is_popular: city.isPopular,
        status: city.status
      }));

      const { data: insertedCities, error: insertError } = await supabase
        .from('cities')
        .insert(citiesToInsert)
        .select();

      if (insertError) {
        console.error('Error inserting cities:', insertError);
      } else {
        console.log(`Successfully inserted ${insertedCities.length} cities`);
      }
    }

    // Final count
    const { data: finalCities, error: finalError } = await supabase
      .from('cities')
      .select('*');

    if (!finalError) {
      console.log(`\nFinal database count: ${finalCities.length} cities`);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

async function main() {
  await compareCitiesData();
  process.exit(0);
}

main();