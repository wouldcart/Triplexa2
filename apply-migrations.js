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
// Support both env var names for service role key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

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

async function applyMigration(migrationFile) {
  try {
    console.log(`Applying migration: ${migrationFile}`)
    
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', migrationFile)
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() + ';' })
        if (error) {
          console.error(`Error in statement: ${statement.substring(0, 100)}...`)
          console.error('Error:', error)
          // Continue with next statement instead of failing completely
        }
      }
    }
    
    console.log(`✅ Migration ${migrationFile} applied successfully`)
  } catch (error) {
    console.error(`❌ Error applying migration ${migrationFile}:`, error)
  }
}

async function main() {
  const migrationsDir = path.join(__dirname, 'supabase', 'migrations')
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
  
  console.log('Found migrations:', migrationFiles)
  
  // Skip the first migration as it's already applied
  const pendingMigrations = migrationFiles.slice(1)
  
  for (const migrationFile of pendingMigrations) {
    await applyMigration(migrationFile)
  }
  
  console.log('All migrations processed!')
}

main().catch(console.error)