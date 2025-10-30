import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

// Create admin client
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function diagnoseProfileCreation() {
  console.log('🔍 Diagnosing profile creation...\n')

  try {
    // Check recent users in auth.users
    console.log('📋 Checking recent auth.users...')
    const { data: authUsers, error: authError } = await adminSupabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Failed to fetch auth users:', authError.message)
      return
    }

    console.log(`Found ${authUsers.users.length} total users`)
    
    // Show recent test users
    const testUsers = authUsers.users.filter(user => 
      user.email.includes('test-profile-') || user.email.includes('test-admin-')
    ).slice(-5)

    console.log(`\n📝 Recent test users (${testUsers.length}):`)
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Created: ${user.created_at}`)
      console.log(`   Metadata: ${JSON.stringify(user.user_metadata, null, 2)}`)
      console.log(`   Raw metadata: ${JSON.stringify(user.raw_user_meta_data, null, 2)}`)
      console.log('')
    })

    // Check all profiles
    console.log('📋 Checking all profiles...')
    const { data: allProfiles, error: profilesError } = await adminSupabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (profilesError) {
      console.error('❌ Failed to fetch profiles:', profilesError.message)
    } else {
      console.log(`Found ${allProfiles.length} profiles`)
      allProfiles.forEach((profile, index) => {
        console.log(`${index + 1}. ID: ${profile.id}`)
        console.log(`   Name: ${profile.name}`)
        console.log(`   Email: ${profile.email}`)
        console.log(`   Role: ${profile.role}`)
        console.log(`   Department: ${profile.department}`)
        console.log(`   Created: ${profile.created_at}`)
        console.log('')
      })
    }

    // Check for specific test user profiles
    if (testUsers.length > 0) {
      console.log('🔍 Checking profiles for test users...')
      for (const user of testUsers) {
        const { data: userProfiles, error: userProfileError } = await adminSupabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)

        if (userProfileError) {
          console.error(`❌ Error fetching profile for ${user.email}:`, userProfileError.message)
        } else {
          console.log(`Profile for ${user.email}: ${userProfiles.length} records found`)
          if (userProfiles.length > 0) {
            userProfiles.forEach(profile => {
              console.log(`  - Role: ${profile.role}, Department: ${profile.department}`)
            })
          }
        }
      }
    }

    // Check agents table
    console.log('\n📋 Checking agents table...')
    const { data: allAgents, error: agentsError } = await adminSupabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (agentsError) {
      console.error('❌ Failed to fetch agents:', agentsError.message)
    } else {
      console.log(`Found ${allAgents.length} agents`)
      allAgents.forEach((agent, index) => {
        console.log(`${index + 1}. ID: ${agent.id}`)
        console.log(`   User ID: ${agent.user_id}`)
        console.log(`   Name: ${agent.name}`)
        console.log(`   Email: ${agent.email}`)
        console.log(`   Status: ${agent.status}`)
        console.log('')
      })
    }

    // Check if trigger exists
    console.log('🔍 Checking trigger existence...')
    try {
      const { data: triggerCheck, error: triggerError } = await adminSupabase
        .rpc('check_trigger_exists', { trigger_name: 'on_auth_user_created' })
      
      if (triggerError) {
        console.log('⚠️  Could not check trigger existence via RPC')
      } else {
        console.log('✅ Trigger check completed')
      }
    } catch (err) {
      console.log('⚠️  Could not check trigger existence')
    }

    console.log('\n🎯 Diagnosis completed!')

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message)
  }
}

// Run the diagnosis
diagnoseProfileCreation()