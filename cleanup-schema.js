import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🧹 Cleaning up Database Schema')
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

async function cleanupSchema() {
  try {
    console.log('\n🔍 Checking for old foreign key constraints...')
    
    // Try to drop any remaining foreign key constraints
    const cleanupQueries = [
      'ALTER TABLE IF EXISTS public.cities DROP CONSTRAINT IF EXISTS cities_country_id_fkey;',
      'ALTER TABLE IF EXISTS public.cities DROP CONSTRAINT IF EXISTS fk_cities_country;',
      'ALTER TABLE IF EXISTS public.cities DROP CONSTRAINT IF EXISTS cities_country_fkey;',
      'DROP INDEX IF EXISTS public.idx_cities_country_id;'
    ]

    for (const query of cleanupQueries) {
      try {
        console.log(`Executing: ${query}`)
        const { error } = await supabase.rpc('exec_sql', { sql: query })
        if (error) {
          console.log(`⚠️ Query failed (expected): ${error.message}`)
        } else {
          console.log('✅ Query executed successfully')
        }
      } catch (err) {
        console.log(`⚠️ Query failed (expected): ${err.message}`)
      }
    }

    console.log('\n🔄 Testing CRUD operations after cleanup...')
    
    // Test CREATE operation
    const testCity = {
      name: `Test City ${Date.now()}`,
      region: 'Test Region',
      country: 'Thailand',
      has_airport: true,
      is_popular: false,
      status: 'active'
    }

    const { data: newCity, error: createError } = await supabase
      .from('cities')
      .insert(testCity)
      .select()
      .single()

    if (createError) {
      console.error('❌ CREATE failed:', createError)
      return
    }

    console.log('✅ CREATE successful:', newCity.name)

    // Test UPDATE operation
    const { data: updatedCity, error: updateError } = await supabase
      .from('cities')
      .update({ region: 'Updated Test Region' })
      .eq('id', newCity.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ UPDATE failed:', updateError)
      return
    }

    console.log('✅ UPDATE successful:', updatedCity.region)

    // Test DELETE operation
    const { error: deleteError } = await supabase
      .from('cities')
      .delete()
      .eq('id', newCity.id)

    if (deleteError) {
      console.error('❌ DELETE failed:', deleteError)
      return
    }

    console.log('✅ DELETE successful')

    console.log('\n🎉 Schema cleanup complete!')
    console.log('✅ All CRUD operations working correctly')

  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

cleanupSchema().catch(console.error)