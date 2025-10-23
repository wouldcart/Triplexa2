import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test RLS policies for user_roles table
async function testUserRolesRLS() {
  console.log('🧪 Testing user_roles RLS policies...\n');

  // Get environment variables with fallbacks
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.log('Required variables: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  // Initialize Supabase client with service role (should have full access)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Test 1: Service role should be able to read all user_roles
    console.log('📋 Test 1: Service role reading all user_roles...');
    const { data: allRoles, error: readError } = await supabaseAdmin
      .from('user_roles')
      .select('*');
    
    if (readError) {
      console.log('❌ Service role read error:', readError.message);
    } else {
      console.log('✅ Service role can read user_roles:', allRoles?.length || 0, 'records');
    }

    // Test 2: Service role should be able to insert user_roles
    console.log('\n📝 Test 2: Service role inserting test user_role...');
    const testUserId = 'test-user-' + Date.now();
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: testUserId,
        role: 'test_role'
      })
      .select();
    
    if (insertError) {
      console.log('❌ Service role insert error:', insertError.message);
    } else {
      console.log('✅ Service role can insert user_roles:', insertData);
    }

    // Test 3: Service role should be able to update user_roles
    if (insertData && insertData.length > 0) {
      console.log('\n✏️ Test 3: Service role updating test user_role...');
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('user_roles')
        .update({ role: 'updated_test_role' })
        .eq('user_id', testUserId)
        .select();
      
      if (updateError) {
        console.log('❌ Service role update error:', updateError.message);
      } else {
        console.log('✅ Service role can update user_roles:', updateData);
      }
    }

    // Test 4: Service role should be able to delete user_roles
    console.log('\n🗑️ Test 4: Service role deleting test user_role...');
    const { error: deleteError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', testUserId);
    
    if (deleteError) {
      console.log('❌ Service role delete error:', deleteError.message);
    } else {
      console.log('✅ Service role can delete user_roles');
    }

    // Test 5: Check if RLS is enabled on user_roles table
    console.log('\n🔒 Test 5: Checking if RLS is enabled on user_roles table...');
    const { data: rlsData, error: rlsError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_roles';"
      });
    
    if (rlsError) {
      console.log('❌ RLS check error:', rlsError.message);
    } else {
      console.log('✅ RLS status for user_roles:', rlsData);
    }

    console.log('\n🎉 RLS policy tests completed!');

  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

testUserRolesRLS();