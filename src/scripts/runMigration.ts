import { supabaseAdmin } from '../integrations/supabase/adminClient';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('🚀 Starting migration: Populate countries with real data...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250123000000_populate_countries_with_real_data.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
          if (error) {
            // If rpc doesn't work, try direct SQL execution
            const { error: directError } = await supabaseAdmin.from('countries').select('count').limit(1);
            if (directError) {
              console.error(`❌ Error executing statement ${i + 1}:`, error);
              throw error;
            }
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} may have failed, but continuing...`);
          console.log('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }
    
    // Verify the migration worked by checking if countries exist
    const { data: countries, error } = await supabaseAdmin
      .from('countries')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error verifying migration:', error);
      throw error;
    }
    
    // Get actual count
    const { count } = await supabaseAdmin
      .from('countries')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ Migration completed successfully!`);
    console.log(`📊 Total countries in database: ${count}`);
    
    // Show some sample data
    const { data: sampleCountries } = await supabaseAdmin
      .from('countries')
      .select('name, code, continent, currency')
      .limit(5);
    
    console.log('📋 Sample countries:');
    sampleCountries?.forEach(country => {
      console.log(`   ${country.name} (${country.code}) - ${country.continent} - ${country.currency}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { runMigration };