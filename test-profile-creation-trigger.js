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

// Create admin client for testing
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testProfileCreationTrigger() {
  console.log('🧪 Testing profile creation trigger...\n')

  try {
    // Test data for user creation
    const testEmail = `test-profile-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    const testMetadata = {
      name: 'John Doe',
      role: 'agent',
      department: 'sales',
      phone: '+1234567890',
      position: 'Senior Sales Agent',
      employee_id: 'EMP001',
      company_name: 'Test Company',
      avatar: 'https://example.com/avatar.jpg',
      preferred_language: 'en',
      country: 'USA',
      city: 'New York',
      status: 'active',
      must_change_password: false
    }

    console.log('📝 Creating user with comprehensive metadata...')
    console.log('Email:', testEmail)
    console.log('Metadata:', JSON.stringify(testMetadata, null, 2))

    // Create user with metadata
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      user_metadata: testMetadata,
      email_confirm: true
    })

    if (authError) {
      console.error('❌ Failed to create user:', authError.message)
      return
    }

    console.log('✅ User created successfully')
    console.log('User ID:', authData.user.id)

    // Wait a moment for trigger to execute
    console.log('\n⏳ Waiting for trigger to execute...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if profile was created
    console.log('\n🔍 Checking profile creation...')
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('❌ Failed to fetch profile:', profileError.message)
    } else if (profileData) {
      console.log('✅ Profile created successfully!')
      console.log('Profile data:')
      console.log('- ID:', profileData.id)
      console.log('- Name:', profileData.name)
      console.log('- Email:', profileData.email)
      console.log('- Role:', profileData.role)
      console.log('- Department:', profileData.department)
      console.log('- Phone:', profileData.phone)
      console.log('- Position:', profileData.position)
      console.log('- Employee ID:', profileData.employee_id)
      console.log('- Company:', profileData.company_name)
      console.log('- Status:', profileData.status)
      console.log('- Language:', profileData.preferred_language)
      console.log('- Country:', profileData.country)
      console.log('- City:', profileData.city)
      console.log('- Must change password:', profileData.must_change_password)
    } else {
      console.log('❌ No profile found for user')
    }

    // Check if agent record was created (since role is 'agent')
    console.log('\n🔍 Checking agent record creation...')
    const { data: agentData, error: agentError } = await adminSupabase
      .from('agents')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()

    if (agentError) {
      console.error('❌ Failed to fetch agent:', agentError.message)
    } else if (agentData) {
      console.log('✅ Agent record created successfully!')
      console.log('Agent data:')
      console.log('- ID:', agentData.id)
      console.log('- User ID:', agentData.user_id)
      console.log('- Name:', agentData.name)
      console.log('- Email:', agentData.email)
      console.log('- Agency:', agentData.agency_name)
      console.log('- Phone:', agentData.business_phone)
      console.log('- Status:', agentData.status)
      console.log('- City:', agentData.city)
      console.log('- Country:', agentData.country)
    } else {
      console.log('❌ No agent record found for user')
    }

    // Test with different role (non-agent)
    console.log('\n\n📝 Testing with non-agent role...')
    const testEmail2 = `test-admin-${Date.now()}@example.com`
    const testMetadata2 = {
      name: 'Jane Smith',
      role: 'admin',
      department: 'management',
      phone: '+1987654321',
      position: 'System Administrator',
      employee_id: 'EMP002',
      company_name: 'Test Company',
      status: 'active'
    }

    console.log('Email:', testEmail2)
    console.log('Metadata:', JSON.stringify(testMetadata2, null, 2))

    const { data: authData2, error: authError2 } = await adminSupabase.auth.admin.createUser({
      email: testEmail2,
      password: testPassword,
      user_metadata: testMetadata2,
      email_confirm: true
    })

    if (authError2) {
      console.error('❌ Failed to create second user:', authError2.message)
      return
    }

    console.log('✅ Second user created successfully')
    console.log('User ID:', authData2.user.id)

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check profile creation
    const { data: profileData2, error: profileError2 } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', authData2.user.id)
      .single()

    if (profileError2) {
      console.error('❌ Failed to fetch second profile:', profileError2.message)
    } else if (profileData2) {
      console.log('✅ Second profile created successfully!')
      console.log('- Role:', profileData2.role)
      console.log('- Department:', profileData2.department)
    }

    // Check that no agent record was created for non-agent role
    const { data: agentData2, error: agentError2 } = await adminSupabase
      .from('agents')
      .select('*')
      .eq('user_id', authData2.user.id)
      .single()

    if (agentError2 && agentError2.code === 'PGRST116') {
      console.log('✅ Correctly no agent record created for non-agent role')
    } else if (agentData2) {
      console.log('⚠️  Agent record was created for non-agent role (unexpected)')
    }

    console.log('\n🎉 Profile creation trigger test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testProfileCreationTrigger()