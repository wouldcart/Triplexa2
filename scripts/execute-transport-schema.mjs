// Execute Transport Routes Schema on Supabase
// This script uses the Supabase REST API to execute SQL statements

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
  process.exit(1);
}

// Path to SQL file
const sqlFilePath = path.resolve(__dirname, '../supabase/migrations/20240801000000_transport_routes.sql');

// Function to execute SQL via REST API
async function executeSql(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SQL execution failed: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error executing SQL: ${error.message}`);
    throw error;
  }
}

// Alternative function to execute SQL via REST API if exec_sql RPC doesn't exist
async function executeSqlDirect(sql) {
  try {
    // Split the SQL into individual statements
    const statements = sql
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/--.*$/gm, '') // Remove -- comments
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}`);
      
      try {
        // Try using the exec_sql RPC function first
        await executeSql(stmt);
        console.log(`Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.error(`Failed to execute statement ${i + 1}: ${error.message}`);
        
        // If we get here, the exec_sql function might not exist
        // We'll need to use the Supabase CLI or create the exec_sql function
        console.error('Consider using the Supabase CLI to apply migrations instead:');
        console.error('npx supabase db push');
        
        // Exit with error
        process.exit(1);
      }
    }

    console.log('All SQL statements executed successfully');
    return { success: true };
  } catch (error) {
    console.error(`Error executing SQL directly: ${error.message}`);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log(`Reading SQL file: ${sqlFilePath}`);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL statements...');
    await executeSqlDirect(sqlContent);
    
    console.log('Transport routes schema applied successfully!');
  } catch (error) {
    console.error(`Failed to apply schema: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();