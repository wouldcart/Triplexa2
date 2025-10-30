require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWithDebugLogs() {
  console.log('🧪 Testing trigger with debug logging...\n');

  try {
    // Clear existing debug logs
    console.log('1. Clearing existing debug logs...');
    const { error: clearError } = await supabase
      .from('debug_logs')
      .delete()
      .neq('id', 0); // Delete all rows

    if (clearError) {
      console.error('❌ Error clearing logs:', clearError);
    } else {
      console.log('✅ Debug logs cleared');
    }

    // Create a test user with metadata
    const testEmail = `test-debug-${Date.now()}@example.com`;
    const testMetadata = {
      name: 'John Doe',
      phone: '+1234567890',
      company_name: 'Test Company',
      role: 'Manager',
      department: 'Engineering',
      position: 'Senior Developer'
    };

    console.log('\n2. Creating test user with metadata:', testMetadata);
    
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

    // Wait for the trigger to execute
    console.log('\n3. Waiting for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check debug logs
    console.log('\n4. Checking debug logs...');
    const { data: logs, error: logsError } = await supabase
      .from('debug_logs')
      .select('*')
      .order('created_at', { ascending: true });

    if (logsError) {
      console.error('❌ Error fetching logs:', logsError);
    } else {
      console.log('📋 Debug logs:');
      logs.forEach((log, index) => {
        console.log(`\n--- Log ${index + 1} ---`);
        console.log('Message:', log.message);
        console.log('Data:', JSON.stringify(log.data, null, 2));
        console.log('Time:', log.created_at);
      });
    }

    // Check if profile was created
    console.log('\n5. Checking created profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
    } else {
      console.log('📊 Profile created:');
      console.log('  - ID:', profile.id);
      console.log('  - Name:', profile.name);
      console.log('  - Phone:', profile.phone);
      console.log('  - Company:', profile.company_name);
      console.log('  - Role:', profile.role);
      console.log('  - Department:', profile.department);
      console.log('  - Position:', profile.position);
    }

    // Clean up - delete the test user (but keep logs for analysis)
    console.log('\n6. Cleaning up test user...');
    try {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
      
      if (deleteError) {
        console.error('❌ Error deleting user:', deleteError);
      } else {
        console.log('✅ Test user deleted successfully');
      }
    } catch (deleteErr) {
      console.error('❌ Error during cleanup:', deleteErr);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testWithDebugLogs();