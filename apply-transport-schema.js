import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applySchema() {
  try {
    // Read the SQL file
    const sql = fs.readFileSync('./transport_routes_schema.sql', 'utf8');
    
    // Execute the SQL directly using the REST API
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.error('Error applying schema:', error);
      
      // Try applying each statement separately
      console.log('Attempting to apply statements individually...');
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim() + ';';
        console.log(`Executing statement ${i+1}/${statements.length}`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { query: stmt });
          if (error) {
            console.error(`Error executing statement ${i+1}:`, error.message);
          } else {
            console.log(`Statement ${i+1} executed successfully`);
          }
        } catch (err) {
          console.error(`Exception executing statement ${i+1}:`, err.message);
        }
      }
    } else {
      console.log('Schema applied successfully!');
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

applySchema();