import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkMigrations() {
  console.log('🔍 Checking migration status...');
  
  try {
    // Check if schema_migrations table exists
    const { data: tables, error: tablesError } = await adminSupabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'schema_migrations');
    
    if (tablesError) {
      console.log('❌ Error checking tables:', tablesError.message);
      return;
    }
    
    if (tables && tables.length > 0) {
      console.log('✅ schema_migrations table exists');
      
      // Check applied migrations
      const { data: migrations, error: migrationsError } = await adminSupabase
        .from('schema_migrations')
        .select('*')
        .order('version', { ascending: true });
      
      if (migrationsError) {
        console.log('❌ Error fetching migrations:', migrationsError.message);
      } else {
        console.log('\n📋 Applied migrations:');
        migrations.forEach(migration => {
          console.log(`  - ${migration.version}`);
        });
        
        // Check for specific agent-related migrations
        const agentMigrations = migrations.filter(m => 
          m.version.includes('agent') || 
          m.version.includes('20251010')
        );
        
        console.log('\n🤖 Agent-related migrations:');
        agentMigrations.forEach(migration => {
          console.log(`  - ${migration.version}`);
        });
      }
    } else {
      console.log('❌ schema_migrations table does not exist');
    }
    
    // Check if pgcrypto functions exist
    console.log('\n🔧 Checking pgcrypto functions...');
    
    const { data: functions, error: functionsError } = await adminSupabase
      .from('information_schema.routines')
      .select('routine_name, routine_schema')
      .eq('routine_name', 'gen_salt');
    
    if (functionsError) {
      console.log('❌ Error checking functions:', functionsError.message);
    } else if (functions && functions.length > 0) {
      console.log('✅ gen_salt function exists:', functions);
    } else {
      console.log('❌ gen_salt function not found');
    }
    
    // Check available extensions
    console.log('\n📦 Checking extensions...');
    
    const { data: extensions, error: extensionsError } = await adminSupabase
      .from('pg_extension')
      .select('extname, extversion');
    
    if (extensionsError) {
      console.log('❌ Error checking extensions:', extensionsError.message);
    } else {
      console.log('Installed extensions:');
      extensions.forEach(ext => {
        console.log(`  - ${ext.extname} (${ext.extversion})`);
      });
      
      const pgcrypto = extensions.find(ext => ext.extname === 'pgcrypto');
      if (pgcrypto) {
        console.log(`✅ pgcrypto is installed (version ${pgcrypto.extversion})`);
      } else {
        console.log('❌ pgcrypto extension not installed');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking migrations:', error);
  }
}

checkMigrations()
  .then(() => {
    console.log('\n✅ Migration check complete');
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });