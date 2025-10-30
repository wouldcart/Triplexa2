import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const createFunctionSQL = `
  CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
    EXECUTE sql_query;
  END;
  $$;
  GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
`;

async function main() {
  console.log('🔧 Creating exec_sql function via REST /query endpoint...');
  const response = await fetch(`${supabaseUrl}/rest/v1/query`, {
    method: 'POST',
    headers: {
      // Use PostgREST's accepted content type for SQL execution
      'Content-Type': 'application/vnd.pgrst.object+json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Prefer': 'return=minimal'
    },
    // Some PostgREST deployments accept raw SQL string in the body
    body: createFunctionSQL
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('❌ Failed to create exec_sql:', text);
    process.exit(1);
  }

  console.log('✅ exec_sql function created successfully');
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});