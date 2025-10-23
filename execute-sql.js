import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Service Key exists:', !!supabaseServiceKey)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testConnection() {
  try {
    console.log('Testing connection...')
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Connection test failed:', error)
      return false
    }
    
    console.log('✅ Connection successful!')
    console.log('Sample data:', data)
    return true
  } catch (error) {
    console.error('❌ Connection failed:', error)
    return false
  }
}

async function listTables() {
  try {
    // Check what tables exist by trying to query them
    const tables = ['countries', 'profiles', 'user_roles', 'app_settings', 'managed_agents']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ Table '${table}' does not exist or has issues:`, error.message)
        } else {
          console.log(`✅ Table '${table}' exists and accessible`)
          if (data && data.length > 0) {
            console.log(`   Sample columns:`, Object.keys(data[0]).join(', '))
          }
        }
      } catch (err) {
        console.log(`❌ Table '${table}' error:`, err.message)
      }
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

async function testCRUDOperations() {
  console.log('\n🧪 Testing CRUD operations...')
  
  try {
    // Test app_settings table CRUD (should have fewer constraints)
    console.log('\nTesting app_settings table:')
    
    // Create a test setting
    const testId = crypto.randomUUID()
    const { data: insertData, error: insertError } = await supabase
      .from('app_settings')
      .insert({
        id: testId,
        category: 'test',
        setting_key: 'test_setting',
        setting_value: 'test_value',
        description: 'Test setting for CRUD operations',
        data_type: 'string',
        is_required: false,
        is_active: true
      })
      .select()
    
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message)
    } else {
      console.log('✅ Insert successful')
      
      // Read the setting
      const { data: readData, error: readError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'test_setting')
        .single()
      
      if (readError) {
        console.log('❌ Read failed:', readError.message)
      } else {
        console.log('✅ Read successful')
        
        // Update the setting
        const { data: updateData, error: updateError } = await supabase
          .from('app_settings')
          .update({ setting_value: 'updated_test_value' })
          .eq('setting_key', 'test_setting')
          .select()
        
        if (updateError) {
          console.log('❌ Update failed:', updateError.message)
        } else {
          console.log('✅ Update successful')
          
          // Delete the setting
          const { error: deleteError } = await supabase
            .from('app_settings')
            .delete()
            .eq('setting_key', 'test_setting')
          
          if (deleteError) {
            console.log('❌ Delete failed:', deleteError.message)
          } else {
            console.log('✅ Delete successful')
          }
        }
      }
    }
    
    // Test RLS bypass by checking if we can read data
    console.log('\nTesting RLS bypass:')
    const { data: rlsData, error: rlsError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (rlsError) {
      console.log('❌ RLS test failed:', rlsError.message)
    } else {
      console.log('✅ RLS bypassed successfully - can access profiles table')
    }
    
  } catch (error) {
    console.error('CRUD test error:', error)
  }
}

async function main() {
  const connected = await testConnection()
  if (connected) {
    await listTables()
    await testCRUDOperations()
  }
}

main().catch(console.error)