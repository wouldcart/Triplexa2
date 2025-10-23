import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://xzofytokwszfwiupsdvi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNTM0MTEsImV4cCI6MjA3MzkyOTQxMX0.FnTL4m0EmxzlNSRfCD12Gc1_PUpOI4rHvaRemr46CiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAgentCreation() {
  const agentEmail = `test-agent-${Date.now()}@gmail.com`;
  const agentPassword = 'password123';

  console.log(`🚀 Starting agent creation test for ${agentEmail}...`);

  try {
    // 1. Sign up the new agent
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: agentEmail,
      password: agentPassword,
    });

    if (signUpError) {
      console.error('❌ Agent signup failed:', signUpError.message);
      return;
    }

    if (!signUpData.user) {
        console.error('❌ Agent signup failed: no user created');
        return;
    }

    console.log(`✅ Agent signed up successfully: ${signUpData.user.id}`);

    // 2. Verify profile creation
    const userId = signUpData.user.id;
    let profile = null;

    // Retry logic to handle potential replication delay
    for (let i = 0; i < 5; i++) {
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError && profileError.code !== 'PGRST116') { // Ignore 'not found' errors for retries
            console.error('❌ Error fetching profile:', profileError.message);
            return;
        }

        if (profileData) {
            profile = profileData;
            break;
        }

        console.log('... Waiting for profile creation, retrying...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }


    if (profile) {
      console.log('✅ Profile created successfully:');
      console.log(profile);
    } else {
      console.error('❌ Profile was not created for the new agent.');
    }

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  }

  console.log('\n🎉 Agent creation test completed!');
}

// Run the script
testAgentCreation().catch(console.error);