const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking Existing Agent Users...\n');

async function checkExistingAgents() {
  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log('1. Checking auth.users table...');
    const { data: authUsers, error: authError } = await adminClient.rpc('exec_sql', {
      sql_query: `
        SELECT id, email, email_confirmed_at, created_at, raw_user_meta_data
        FROM auth.users 
        ORDER BY created_at DESC;
      `
    });

    if (authError) {
      console.log('❌ Error querying auth.users:', authError.message);
    } else {
      console.log(`✅ Found ${authUsers.length} users in auth.users:`);
      authUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
        console.log(`      Confirmed: ${!!user.email_confirmed_at}`);
        console.log(`      Metadata: ${JSON.stringify(user.raw_user_meta_data || {})}`);
        console.log('');
      });
    }

    console.log('2. Checking profiles table...');
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.log('❌ Error querying profiles:', profilesError.message);
    } else {
      console.log(`✅ Found ${profiles.length} profiles:`);
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.email} (${profile.role})`);
        console.log(`      Name: ${profile.name}`);
        console.log(`      ID: ${profile.id}`);
        console.log(`      Department: ${profile.department}`);
        console.log(`      Status: ${profile.status}`);
        console.log('');
      });
    }

    console.log('3. Checking agents table...');
    const { data: agents, error: agentsError } = await adminClient
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (agentsError) {
      console.log('❌ Error querying agents:', agentsError.message);
    } else {
      console.log(`✅ Found ${agents.length} agents:`);
      agents.forEach((agent, index) => {
        console.log(`   ${index + 1}. ${agent.email} (${agent.status})`);
        console.log(`      Name: ${agent.name}`);
        console.log(`      ID: ${agent.id}`);
        console.log(`      Department: ${agent.department}`);
        console.log('');
      });
    }

    console.log('4. Checking agent_credentials table...');
    const { data: credentials, error: credentialsError } = await adminClient
      .from('agent_credentials')
      .select('*')
      .order('created_at', { ascending: false });

    if (credentialsError) {
      console.log('❌ Error querying agent_credentials:', credentialsError.message);
    } else {
      console.log(`✅ Found ${credentials.length} agent credentials:`);
      credentials.forEach((cred, index) => {
        console.log(`   ${index + 1}. Username: ${cred.username}`);
        console.log(`      Agent ID: ${cred.agent_id}`);
        console.log(`      Is Temporary: ${cred.is_temporary}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

checkExistingAgents();