import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAgentRecords() {
  console.log('🔍 Checking agent records in remote Supabase...\n');

  try {
    // Check agents table records
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (agentsError) {
      console.error('❌ Error fetching agents:', agentsError);
      return;
    }

    console.log(`📊 Found ${agents?.length || 0} agent records in agents table:`);
    
    if (agents && agents.length > 0) {
      agents.forEach((agent, index) => {
        console.log(`\n🔸 Agent ${index + 1}:`);
        console.log(`   ID: ${agent.id}`);
        console.log(`   Name: ${agent.name || 'NOT SET'}`);
        console.log(`   Email: ${agent.email || 'NOT SET'}`);
        console.log(`   Agency Name: ${agent.agency_name || 'NOT SET'}`);
        console.log(`   Business Phone: ${agent.business_phone || 'NOT SET'}`);
        console.log(`   City: ${agent.city || 'NOT SET'}`);
        console.log(`   Country: ${agent.country || 'NOT SET'}`);
        console.log(`   Type: ${agent.type || 'NOT SET'}`);
        console.log(`   Business Address: ${agent.business_address || 'NOT SET'}`);
        console.log(`   Specializations: ${JSON.stringify(agent.specializations) || 'NOT SET'}`);
        console.log(`   Status: ${agent.status}`);
        console.log(`   Created: ${agent.created_at}`);
      });
    } else {
      console.log('   No agent records found.');
    }

    // Check profiles table records
    console.log('\n' + '='.repeat(60));
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'agent')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`📊 Found ${profiles?.length || 0} agent profiles in profiles table:`);
    
    if (profiles && profiles.length > 0) {
      profiles.forEach((profile, index) => {
        console.log(`\n🔸 Profile ${index + 1}:`);
        console.log(`   ID: ${profile.id}`);
        console.log(`   Name: ${profile.name || 'NOT SET'}`);
        console.log(`   Email: ${profile.email || 'NOT SET'}`);
        console.log(`   Company Name: ${profile.company_name || 'NOT SET'}`);
        console.log(`   Phone: ${profile.phone || 'NOT SET'}`);
        console.log(`   Role: ${profile.role}`);
        console.log(`   Created: ${profile.created_at}`);
      });
    } else {
      console.log('   No agent profiles found.');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY:');
    console.log(`   Agents table: ${agents?.length || 0} records`);
    console.log(`   Profiles table (agents): ${profiles?.length || 0} records`);
    
    if ((agents?.length || 0) !== (profiles?.length || 0)) {
      console.log('⚠️  WARNING: Mismatch between agents and profiles count!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAgentRecords();