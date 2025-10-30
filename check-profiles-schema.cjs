require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkProfilesSchema() {
  console.log('🔍 Checking profiles table schema...\n');

  try {
    // Get table schema using information_schema
    const { data: schemaData, error: schemaError } = await adminSupabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError);
    } else {
      console.log('✅ Profiles table schema:');
      schemaData.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // Also check what columns we can actually insert into
    console.log('\n📋 Testing column access...');
    
    // Create a test user to see what columns work
    const testEmail = `schema-test-${Date.now()}@example.com`;
    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: { test: 'value' }
    });

    if (userError) {
      console.error('❌ Test user creation failed:', userError);
      return;
    }

    const testUserId = userData.user.id;
    console.log('✅ Test user created');

    // Try updating with correct column name
    const { data: updateData, error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        name: 'Test Name',
        phone: '+1234567890',
        company_name: 'Test Company', // Using company_name instead of company
        role: 'agent',
        department: 'Test Dept',
        position: 'Test Position',
        updated_at: new Date().toISOString()
      })
      .eq('id', testUserId);

    if (updateError) {
      console.error('❌ Profile update failed:', updateError);
    } else {
      console.log('✅ Profile update successful with correct column names');
    }

    // Check the updated profile
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (profileError) {
      console.error('❌ Profile check failed:', profileError);
    } else {
      console.log('✅ Updated profile:', JSON.stringify(profileData, null, 2));
    }

    // Cleanup
    await adminSupabase.from('profiles').delete().eq('id', testUserId);
    await adminSupabase.auth.admin.deleteUser(testUserId);
    console.log('✅ Test user cleaned up');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkProfilesSchema().catch(console.error);