import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY)

async function diagnoseSignupError() {
  console.log('🔍 Diagnosing Supabase signup database error...\n')
  
  try {
    // 1. Check if profiles table exists and its structure
    console.log('1. CHECKING PROFILES TABLE:')
    const { data: profilesInfo, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      console.log('   ❌ PROFILES TABLE ERROR:', profilesError.message)
      console.log('   🚨 This is likely the cause of signup failure!')
    } else {
      console.log('   ✅ Profiles table exists')
      console.log('   📊 Sample structure:', Object.keys(profilesInfo[0] || {}))
    }

    // 2. Check if handle_new_user function exists
    console.log('\n2. CHECKING HANDLE_NEW_USER FUNCTION:')
    const { data: functionExists, error: functionError } = await supabase
      .rpc('exec_sql', { sql: "SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user');" })
    
    if (functionError) {
      console.log('   ⚠️  Cannot check function existence via RPC')
      // Try alternative method
      const { data: functions, error: altError } = await supabase
        .from('pg_proc')
        .select('proname')
        .eq('proname', 'handle_new_user')
      
      if (altError) {
        console.log('   ❌ Cannot access pg_proc table')
      } else {
        console.log('   📋 Function check result:', functions)
      }
    } else {
      console.log('   📋 Function exists:', functionExists)
    }

    // 3. Check if trigger exists
    console.log('\n3. CHECKING AUTH TRIGGER:')
    try {
      const { data: triggerCheck, error: triggerError } = await supabase
        .rpc('exec_sql', { sql: "SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created');" })
      
      if (triggerError) {
        console.log('   ⚠️  Cannot check trigger via RPC:', triggerError.message)
      } else {
        console.log('   📋 Trigger exists:', triggerCheck)
      }
    } catch (e) {
      console.log('   ⚠️  Trigger check failed:', e.message)
    }

    // 4. Test basic database connectivity
    console.log('\n4. TESTING DATABASE CONNECTIVITY:')
    const { data: dbTest, error: dbError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5)
    
    if (dbError) {
      console.log('   ❌ Database connectivity issue:', dbError.message)
    } else {
      console.log('   ✅ Database connected')
      console.log('   📋 Available tables:', dbTest.map(t => t.table_name))
    }

    // 5. Check RLS policies on auth.users (if accessible)
    console.log('\n5. CHECKING AUTH SCHEMA ACCESS:')
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1)
    
    if (authError) {
      console.log('   ⚠️  Cannot access auth.users:', authError.message)
      console.log('   💡 This is normal for client connections')
    } else {
      console.log('   ✅ Can access auth.users')
    }

    // 6. Try to create a test profile manually
    console.log('\n6. TESTING MANUAL PROFILE CREATION:')
    const testUserId = '00000000-0000-0000-0000-000000000001'
    const { data: testProfile, error: testError } = await supabase
      .from('profiles')
      .upsert({
        id: testUserId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'agent'
      })
      .select()
    
    if (testError) {
      console.log('   ❌ MANUAL PROFILE CREATION FAILED:', testError.message)
      console.log('   🚨 This confirms the profiles table issue!')
    } else {
      console.log('   ✅ Manual profile creation works')
      
      // Clean up test data
      await supabase.from('profiles').delete().eq('id', testUserId)
    }

    console.log('\n📋 DIAGNOSIS SUMMARY:')
    console.log('   The signup error is likely caused by:')
    console.log('   1. Missing or misconfigured profiles table')
    console.log('   2. Missing handle_new_user trigger function')
    console.log('   3. RLS policies blocking profile creation')
    console.log('   4. Database schema inconsistencies')

  } catch (error) {
    console.error('❌ Diagnostic script error:', error.message)
  }
}

diagnoseSignupError().catch(console.error)