// Script to execute transport_routes_schema.sql on Supabase
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSchema() {
  try {
    // Read the SQL file
    const schemaPath = path.join(__dirname, 'transport_routes_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing transport_routes_schema.sql on Supabase...');
    
    // Split the SQL into individual statements
    // This is a simple approach - for complex SQL you might need a proper SQL parser
    const statements = schemaSql
      .replace(/--.*$/gm, '') // Remove comments
      .split(';')
      .filter(statement => statement.trim().length > 0);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      console.log(`Executing statement ${i + 1}/${statements.length}`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          console.error('Statement:', statement);
        }
      } catch (err) {
        console.error(`Exception executing statement ${i + 1}:`, err);
        console.error('Statement:', statement);
      }
    }
    
    console.log('Schema execution completed');
  } catch (error) {
    console.error('Error executing schema:', error);
  }
}

executeSchema();