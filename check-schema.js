import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Checking Database Schema')
console.log('=' .repeat(40))

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkSchema() {
  try {
    // Check cities table structure
    console.log('\n📋 Cities table structure:')
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('*')
      .limit(1)
    
    if (citiesError) {
      console.error('❌ Error fetching cities:', citiesError)
    } else if (cities && cities.length > 0) {
      console.log('✅ Cities columns:', Object.keys(cities[0]))
      console.log('Sample city:', cities[0])
    }

    // Check countries table structure
    console.log('\n📋 Countries table structure:')
    const { data: countries, error: countriesError } = await supabase
      .from('countries')
      .select('*')
      .limit(1)
    
    if (countriesError) {
      console.error('❌ Error fetching countries:', countriesError)
    } else if (countries && countries.length > 0) {
      console.log('✅ Countries columns:', Object.keys(countries[0]))
      console.log('Sample country:', countries[0])
    }

    // Try to check foreign key constraints using SQL
    console.log('\n🔗 Checking foreign key constraints:')
    const { data: constraints, error: constraintsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'cities';
      `
    })

    if (constraintsError) {
      console.log('⚠️ Could not check constraints via RPC:', constraintsError.message)
    } else {
      console.log('✅ Foreign key constraints:', constraints)
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

checkSchema().catch(console.error)