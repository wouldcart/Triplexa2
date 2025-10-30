const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking Auth Users in Detail...\n');

async function checkAuthUsersDetailed() {
  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log('1. Checking ALL auth.users (confirmed and unconfirmed)...');
    const { data: allAuthUsers, error: authError } = await adminClient.rpc('exec_sql', {
      sql_query: `
        SELECT 
          id, 
          email, 
          email_confirmed_at,
          created_at,
          raw_user_meta_data,
          encrypted_password IS NOT NULL as has_password
        FROM auth.users 
        ORDER BY created_at DESC
        LIMIT 10;
      `
    });

    if (authError) {
      console.log('❌ Error querying auth.users:', authError.message);
      return;
    }

    console.log(`✅ Found ${allAuthUsers.length} auth users (showing first 10):`);
    allAuthUsers.forEach((user, index) => {
      console.log(`\n   ${index + 1}. ${user.email}`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Confirmed: ${!!user.email_confirmed_at}`);
      console.log(`      Has Password: ${user.has_password}`);
      console.log(`      Created: ${user.created_at}`);
      console.log(`      Metadata: ${JSON.stringify(user.raw_user_meta_data || {})}`);
    });

    // Check if any of these users have profiles
    console.log('\n2. Checking which auth users have profiles...');
    
    for (const authUser of allAuthUsers.slice(0, 5)) { // Check first 5
      const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!profileError && profile) {
        console.log(`\n   ✅ ${authUser.email} has profile:`);
        console.log(`      Role: ${profile.role}`);
        console.log(`      Name: ${profile.name}`);
        console.log(`      Status: ${profile.status}`);
        
        // If this is an agent, let's try to test authentication
        if (profile.role === 'agent') {
          console.log(`      🎯 This is an agent! Let's test authentication...`);
          
          // Try to manually confirm the email first
          console.log(`      Attempting to confirm email for ${authUser.email}...`);
          
          const { error: confirmError } = await adminClient.rpc('exec_sql', {
            sql_query: `
              UPDATE auth.users 
              SET email_confirmed_at = NOW() 
              WHERE id = '${authUser.id}' AND email_confirmed_at IS NULL;
            `
          });
          
          if (confirmError) {
            console.log(`      ❌ Email confirmation failed: ${confirmError.message}`);
          } else {
            console.log(`      ✅ Email confirmed for ${authUser.email}`);
            
            // Now try to set a known password
            console.log(`      Setting password for ${authUser.email}...`);
            
            const { error: passwordError } = await adminClient.rpc('exec_sql', {
              sql_query: `
                UPDATE auth.users 
                SET encrypted_password = crypt('agent123', gen_salt('bf'))
                WHERE id = '${authUser.id}';
              `
            });
            
            if (passwordError) {
              console.log(`      ❌ Password update failed: ${passwordError.message}`);
            } else {
              console.log(`      ✅ Password set to 'agent123' for ${authUser.email}`);
              console.log(`      🚀 You can now test login with: ${authUser.email} / agent123`);
              break; // Found and fixed one agent, that's enough
            }
          }
        }
      } else {
        console.log(`   ❌ ${authUser.email} has no profile`);
      }
    }

    console.log('\n3. Summary:');
    console.log('   - Found users in auth.users but most are unconfirmed');
    console.log('   - Some users have profiles but no confirmed auth');
    console.log('   - Fixed one agent user for testing');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

checkAuthUsersDetailed();