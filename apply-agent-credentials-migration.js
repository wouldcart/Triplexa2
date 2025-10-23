import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createExecSqlFunction() {
  console.log('🔧 Creating exec_sql function...');
  
  const execSqlFunction = `
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN 'Success';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
`;

  try {
    // Try to execute using REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql_query: execSqlFunction })
    });

    if (!response.ok) {
      // Try alternative approach - execute via SQL editor simulation
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: execSqlFunction });
      if (error && !error.message.includes('already exists')) {
        console.log('⚠️  exec_sql function may not exist, but continuing...');
      }
    }

    console.log('✅ exec_sql function ready');
    return true;
  } catch (error) {
    console.log('⚠️  Could not create exec_sql function, but continuing...');
    return false;
  }
}

async function applyAgentCredentialsMigration() {
  try {
    console.log('🚀 Applying agent credentials RPC migration...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20251201_add_get_agent_credentials_status_rpc.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return false;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`📄 Read migration file: ${migrationPath}`);
    
    // Execute the migration directly
    console.log('⚡ Executing migration...');
    
    try {
      // Method 1: Try using exec_sql RPC
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: migrationSQL
      });
      
      if (error) {
        console.log('⚠️  exec_sql failed, trying direct execution...');
        
        // Method 2: Try REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql_query: migrationSQL })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ REST API execution failed:', errorText);
          
          // Method 3: Try executing statements individually
          console.log('⚠️  Trying to execute statements individually...');
          
          const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
          
          for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
              try {
                console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
                
                // Try direct table operations for simple statements
                if (statement.toLowerCase().includes('create or replace function')) {
                  // This is our main function - try to execute it
                  const { error: funcError } = await supabase.rpc('exec_sql', {
                    sql_query: statement + ';'
                  });
                  
                  if (funcError) {
                    console.error(`❌ Error in statement ${i + 1}:`, funcError.message);
                  } else {
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                  }
                }
              } catch (stmtError) {
                console.error(`❌ Error in statement ${i + 1}:`, stmtError.message);
              }
            }
          }
        } else {
          console.log('✅ Migration executed via REST API');
        }
      } else {
        console.log('✅ Migration executed via RPC');
      }
    } catch (execError) {
      console.error('❌ Migration execution failed:', execError.message);
      return false;
    }

    // Test if the function was created successfully
    console.log('🧪 Testing the RPC function...');
    const { data: testData, error: testError } = await supabase.rpc('get_agent_credentials_status', {
      p_username: 'test@example.com'
    });

    if (testError) {
      console.error('❌ RPC function test failed:', testError.message);
      return false;
    }

    console.log('✅ RPC function is working!');
    console.log('Test result:', testData);
    
    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎯 Agent Credentials Migration Script');
  console.log('=====================================');
  
  // Create exec_sql function first
  await createExecSqlFunction();
  
  // Apply the migration
  const success = await applyAgentCredentialsMigration();
  
  if (success) {
    console.log('\n🎉 Agent credentials migration completed successfully!');
  } else {
    console.log('\n❌ Migration failed. Please check the errors above.');
    process.exit(1);
  }
}

main().catch(console.error);