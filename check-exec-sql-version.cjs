require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkExecSqlVersion() {
  console.log('🔍 Checking exec_sql function definition...\n');

  try {
    // Get the actual function definition
    const { data: funcData, error: funcError } = await adminClient.rpc('exec_sql', {
      sql: `
        SELECT 
          routine_name,
          routine_type,
          data_type,
          routine_definition,
          security_type
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'exec_sql'
      `
    });

    if (funcError) {
      console.log('❌ Function query failed:', funcError.message);
      return;
    }

    console.log('📋 exec_sql function details:');
    if (funcData && funcData.length > 0) {
      const func = funcData[0];
      console.log(`   Name: ${func.routine_name}`);
      console.log(`   Type: ${func.routine_type}`);
      console.log(`   Return Type: ${func.data_type}`);
      console.log(`   Security: ${func.security_type}`);
      console.log(`   Definition: ${func.routine_definition?.substring(0, 500)}...`);
    } else {
      console.log('   No exec_sql function found');
    }

    // Check parameters
    const { data: paramData, error: paramError } = await adminClient.rpc('exec_sql', {
      sql: `
        SELECT 
          parameter_name,
          data_type,
          parameter_mode
        FROM information_schema.parameters 
        WHERE specific_schema = 'public' 
        AND specific_name IN (
          SELECT specific_name 
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name = 'exec_sql'
        )
        ORDER BY ordinal_position
      `
    });

    if (!paramError && paramData) {
      console.log('\n📋 Function parameters:');
      paramData.forEach(param => {
        console.log(`   ${param.parameter_name}: ${param.data_type} (${param.parameter_mode})`);
      });
    }

    // Try to create a DDL-capable exec_sql function
    console.log('\n🔧 Attempting to create DDL-capable exec_sql function...');
    
    const ddlExecSql = `
      CREATE OR REPLACE FUNCTION public.exec_ddl(sql_query text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_catalog
      AS $$
      BEGIN
        EXECUTE sql_query;
        RETURN 'SUCCESS';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR: ' || SQLERRM;
      END;
      $$;
    `;

    const { data: createData, error: createError } = await adminClient.rpc('exec_sql', {
      sql: ddlExecSql
    });

    if (createError) {
      console.log('❌ DDL function creation failed:', createError.message);
    } else {
      console.log('✅ DDL function created successfully');
      
      // Test the new function
      console.log('\n🧪 Testing DDL function...');
      const { data: testData, error: testError } = await adminClient.rpc('exec_ddl', {
        sql_query: 'SELECT 1 as test'
      });
      
      if (testError) {
        console.log('❌ DDL function test failed:', testError.message);
      } else {
        console.log('✅ DDL function test result:', testData);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkExecSqlVersion();