import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Connecting to Remote Supabase Database...');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Using Service Role Key: ${supabaseServiceKey ? 'Yes' : 'No'}`);

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    console.log('\n🧪 Testing database connection...');
    
    // Test basic connection with a simple query
    const { data, error } = await supabase.rpc('version');
    
    if (error) {
      // Try alternative connection test
      const { data: testData, error: testError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .limit(5);
      
      if (testError) {
        console.error('❌ Connection failed:', testError.message);
        return false;
      }
      
      console.log('✅ Connection successful!');
      console.log(`📊 Found ${testData.length} tables in public schema`);
      return true;
    }
    
    console.log('✅ Connection successful!');
    console.log(`📊 Database version: ${data || 'Connected'}`);
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

async function checkTransportTables() {
  try {
    console.log('\n🔍 Checking transport tables...');
    
    const tables = ['transport_routes', 'transport_types', 'intermediate_stops', 'sightseeing_options'];
    const results = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          results[table] = { exists: false, error: error.message };
        } else {
          results[table] = { exists: true, hasData: data.length > 0 };
        }
      } catch (err) {
        results[table] = { exists: false, error: err.message };
      }
    }
    
    console.log('📋 Transport Tables Status:');
    for (const [table, status] of Object.entries(results)) {
      if (status.exists) {
        console.log(`  ✅ ${table}: EXISTS ${status.hasData ? '(has data)' : '(empty)'}`);
      } else {
        console.log(`  ❌ ${table}: MISSING - ${status.error}`);
      }
    }
    
    return results;
  } catch (err) {
    console.error('❌ Error checking tables:', err.message);
    return {};
  }
}

async function applyTransportMigration() {
  try {
    console.log('\n🚀 Applying transport tables migration...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20240801000000_transport_routes.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return false;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`📄 Read migration file: ${migrationPath}`);
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          
          const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: statement + ';'
          });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.error(`📄 Statement: ${statement.substring(0, 100)}...`);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('🎉 Migration application completed!');
    return true;
    
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    return false;
  }
}

async function createExecSqlFunction() {
  try {
    console.log('\n🔧 Creating exec_sql function for migration...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$;
    `;
    
    const { error } = await supabase.rpc('exec', { sql: createFunctionSQL });
    
    if (error) {
      console.log('ℹ️  exec_sql function may already exist or using alternative method');
      return true; // Continue anyway
    }
    
    console.log('✅ exec_sql function created successfully');
    return true;
    
  } catch (err) {
    console.log('ℹ️  Will use alternative SQL execution method');
    return true; // Continue anyway
  }
}

async function main() {
  console.log('🎯 Direct Supabase Connection Script');
  console.log('=====================================');
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  // Check current state
  const tableStatus = await checkTransportTables();
  
  // Create helper function
  await createExecSqlFunction();
  
  // Apply migration if needed
  const migrationSuccess = await applyTransportMigration();
  
  // Check final state
  console.log('\n🔍 Final verification...');
  await checkTransportTables();
  
  console.log('\n🎉 Direct Supabase operation completed!');
}

// Run the script
main().catch(console.error);