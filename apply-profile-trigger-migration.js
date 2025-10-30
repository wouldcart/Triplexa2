import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

// Create admin client
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🚀 Applying profile creation trigger migration...\n')

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250102_update_profile_creation_trigger.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📖 Migration file loaded successfully')
    console.log('File path:', migrationPath)

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.match(/^(BEGIN|COMMIT)$/i))

    console.log(`\n📝 Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (statement.trim().length === 0) continue

      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
      console.log(`SQL: ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`)

      try {
        const { data, error } = await adminSupabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message)
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message)
        // Try alternative approach for this statement
        try {
          const { data, error } = await adminSupabase
            .from('_migrations')
            .insert({ statement: statement, executed_at: new Date().toISOString() })
          
          if (!error) {
            console.log(`✅ Statement ${i + 1} logged for manual execution`)
          }
        } catch (logErr) {
          console.log(`⚠️  Could not log statement ${i + 1} for manual execution`)
        }
      }
    }

    console.log('\n🔍 Verifying trigger installation...')

    // Check if the function exists
    const { data: functionData, error: functionError } = await adminSupabase
      .rpc('check_function_exists', { function_name: 'handle_new_user' })

    if (functionError) {
      console.log('⚠️  Could not verify function existence via RPC')
    } else {
      console.log('✅ Function verification completed')
    }

    // Check if the trigger exists by trying to query information_schema
    try {
      const { data: triggerData, error: triggerError } = await adminSupabase
        .from('information_schema.triggers')
        .select('trigger_name')
        .eq('trigger_name', 'on_auth_user_created')

      if (triggerError) {
        console.log('⚠️  Could not verify trigger via information_schema')
      } else if (triggerData && triggerData.length > 0) {
        console.log('✅ Trigger "on_auth_user_created" found')
      } else {
        console.log('⚠️  Trigger "on_auth_user_created" not found')
      }
    } catch (err) {
      console.log('⚠️  Could not access information_schema for trigger verification')
    }

    console.log('\n📋 Migration application completed!')
    console.log('Note: If any statements failed, you may need to apply them manually via the Supabase dashboard.')
    console.log('The migration file is located at:', migrationPath)

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n💡 Manual application required:')
    console.log('1. Open the Supabase dashboard')
    console.log('2. Go to the SQL editor')
    console.log('3. Copy and paste the migration file content')
    console.log('4. Execute the SQL statements')
  }
}

// Run the migration
applyMigration()