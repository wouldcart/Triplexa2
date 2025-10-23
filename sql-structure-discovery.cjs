const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sqlStructureDiscovery() {
  console.log('🔍 Using SQL to discover table structures...\n');

  // Use raw SQL to get table structure
  const tables = ['intermediate_stops', 'sightseeing_options'];

  for (const tableName of tables) {
    console.log(`📋 Table: ${tableName}`);
    console.log('='.repeat(50));

    try {
      // Get column information using SQL
      const { data, error } = await supabase.rpc('sql', {
        query: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
            AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

      if (error) {
        console.log(`❌ SQL Error: ${error.message}`);
        
        // Try alternative approach using pg_catalog
        const { data: pgData, error: pgError } = await supabase.rpc('sql', {
          query: `
            SELECT 
              a.attname as column_name,
              pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
              a.attnotnull as not_null,
              pg_catalog.pg_get_expr(d.adbin, d.adrelid) as default_value
            FROM pg_catalog.pg_attribute a
            LEFT JOIN pg_catalog.pg_attrdef d ON (a.attrelid, a.attnum) = (d.adrelid, d.adnum)
            WHERE a.attrelid = '${tableName}'::regclass
              AND a.attnum > 0 
              AND NOT a.attisdropped
            ORDER BY a.attnum;
          `
        });

        if (pgError) {
          console.log(`❌ PG Catalog Error: ${pgError.message}`);
        } else {
          console.log('✅ Structure from pg_catalog:');
          pgData?.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.not_null ? '(NOT NULL)' : '(NULLABLE)'} ${col.default_value ? `DEFAULT: ${col.default_value}` : ''}`);
          });
        }
      } else {
        console.log('✅ Structure from information_schema:');
        data?.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'} ${col.column_default ? `DEFAULT: ${col.column_default}` : ''}`);
        });
      }

    } catch (e) {
      console.log(`❌ Exception: ${e.message}`);
    }

    console.log(''); // Add spacing
  }

  // Try a different approach - check if these tables might have been created with specific schemas
  console.log('🔍 Checking for table creation scripts or migrations...\n');
  
  // Look for any migration files or SQL files that might contain the table definitions
  try {
    const fs = require('fs');
    const path = require('path');
    
    const searchDirs = [
      '/Users/arg/Triplexa2/triplexa/supabase/migrations',
      '/Users/arg/Triplexa2/triplexa/database-functions',
      '/Users/arg/Triplexa2/triplexa'
    ];

    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        console.log(`📁 Checking directory: ${dir}`);
        const files = fs.readdirSync(dir);
        const sqlFiles = files.filter(f => f.endsWith('.sql'));
        
        for (const file of sqlFiles) {
          const filePath = path.join(dir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          
          if (content.includes('intermediate_stops') || content.includes('sightseeing_options')) {
            console.log(`  ✅ Found reference in: ${file}`);
            
            // Extract relevant lines
            const lines = content.split('\n');
            const relevantLines = lines.filter(line => 
              line.toLowerCase().includes('intermediate_stops') || 
              line.toLowerCase().includes('sightseeing_options') ||
              (line.includes('CREATE TABLE') && (
                lines[lines.indexOf(line) + 1]?.includes('intermediate_stops') ||
                lines[lines.indexOf(line) + 1]?.includes('sightseeing_options')
              ))
            );
            
            if (relevantLines.length > 0) {
              console.log(`    Relevant content:`);
              relevantLines.slice(0, 10).forEach(line => {
                console.log(`      ${line.trim()}`);
              });
            }
          }
        }
      }
    }
  } catch (e) {
    console.log(`❌ File search error: ${e.message}`);
  }

  console.log('\n✅ SQL structure discovery complete!');
}

sqlStructureDiscovery().catch(console.error);