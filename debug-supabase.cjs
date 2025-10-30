const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugSupabase() {
  console.log('🔍 Debugging Supabase Connection...');
  console.log('📝 Supabase URL:', supabaseUrl);
  console.log('📝 Service Role Key:', supabaseServiceKey ? 'Present' : 'Missing');
  
  // Get actual profile data
  console.log('\n📋 Getting profile data...');
  try {
    const { data: profiles, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .limit(10);
    
    if (profileError) {
      console.error('❌ Error accessing profiles:', profileError.message);
    } else {
      console.log(`✅ Found ${profiles.length} profiles:`);
      profiles.forEach((profile, index) => {
        console.log(`  ${index + 1}. ID: ${profile.id}, Email: ${profile.email}, Status: ${profile.status}, Role: ${profile.role}`);
      });
    }
  } catch (error) {
    console.error('❌ Unexpected error accessing profiles:', error);
  }
  
  // Get auth users
  console.log('\n📋 Getting auth users...');
  try {
    const { data: authUsers, error: authError } = await adminSupabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error accessing auth users:', authError.message);
    } else {
      console.log(`✅ Found ${authUsers.users.length} auth users:`);
      authUsers.users.slice(0, 10).forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}, Email: ${user.email}, Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      });
    }
  } catch (error) {
    console.error('❌ Unexpected error accessing auth users:', error);
  }
}

debugSupabase();