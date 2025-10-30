require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testActualTriggerFunctionality() {
  console.log('🧪 Testing actual trigger functionality...\n');

  try {
    // Create a test user with metadata
    const testEmail = `test-trigger-${Date.now()}@example.com`;
    const testMetadata = {
      name: 'John Doe',
      phone: '+1234567890',
      company_name: 'Test Company',
      role: 'Manager',
      department: 'Engineering',
      position: 'Senior Developer'
    };

    console.log('📝 Creating test user with metadata:', testMetadata);
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      user_metadata: testMetadata
    });

    if (authError) {
      console.error('❌ Error creating user:', authError);
      return;
    }

    console.log('✅ User created with ID:', authData.user.id);
    console.log('📋 User metadata stored:', authData.user.user_metadata);

    // Wait a moment for the trigger to execute
    console.log('⏳ Waiting for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if profile was created by the trigger
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
    } else {
      console.log('📊 Profile created by trigger:');
      console.log('  - ID:', profile.id);
      console.log('  - Name:', profile.name);
      console.log('  - Phone:', profile.phone);
      console.log('  - Company:', profile.company_name);
      console.log('  - Role:', profile.role);
      console.log('  - Department:', profile.department);
      console.log('  - Position:', profile.position);
      console.log('  - Created at:', profile.created_at);
      console.log('  - Updated at:', profile.updated_at);

      // Check if metadata was extracted correctly
      const metadataExtracted = profile.name || profile.phone || profile.company_name || 
                               profile.role || profile.department || profile.position;
      
      if (metadataExtracted) {
        console.log('✅ SUCCESS: Trigger extracted metadata correctly!');
      } else {
        console.log('❌ FAILURE: Trigger did not extract metadata');
      }
    }

    // Test the get_or_create_profile_for_current_user function
    console.log('\n🔧 Testing get_or_create_profile_for_current_user function...');
    
    const { data: functionResult, error: functionError } = await supabase
      .rpc('get_or_create_profile_for_current_user');

    if (functionError) {
      console.error('❌ Function error:', functionError);
    } else {
      console.log('✅ Function executed successfully');
      console.log('📋 Function result:', functionResult);
    }

    // Clean up - delete the test user
    console.log('\n🗑️ Cleaning up test user...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
    
    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError);
    } else {
      console.log('✅ Test user deleted successfully');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testActualTriggerFunctionality();