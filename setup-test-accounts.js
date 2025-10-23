import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://xzofytokwszfwiupsdvi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNTM0MTEsImV4cCI6MjA3MzkyOTQxMX0.FnTL4m0EmxzlNSRfCD12Gc1_PUpOI4rHvaRemr46CiQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test accounts data
const testAccounts = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'admin@triplexa.com',
    name: 'Super Admin',
    role: 'super_admin',
    company_name: 'TripleXA',
    department: 'Administration',
    position: 'System Administrator',
    status: 'active'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'manager@triplexa.com',
    name: 'John Manager',
    role: 'manager',
    company_name: 'TripleXA',
    department: 'Operations',
    position: 'Operations Manager',
    status: 'active'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'sales@triplexa.com',
    name: 'Jane Sales',
    role: 'sales',
    company_name: 'TripleXA',
    department: 'Sales',
    position: 'Sales Representative',
    status: 'active'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'agent@triplexa.com',
    name: 'Mike Agent',
    role: 'agent',
    company_name: 'Travel Agency Inc',
    department: 'Travel Services',
    position: 'Travel Agent',
    status: 'active'
  }
];

async function createTestAccounts() {
  console.log('Creating test accounts in Supabase...');
  
  try {
    // First, check if accounts already exist
    const { data: existingAccounts, error: checkError } = await supabase
      .from('profiles')
      .select('email')
      .in('email', testAccounts.map(acc => acc.email));
    
    if (checkError) {
      console.error('Error checking existing accounts:', checkError);
      return;
    }
    
    const existingEmails = existingAccounts?.map(acc => acc.email) || [];
    const newAccounts = testAccounts.filter(acc => !existingEmails.includes(acc.email));
    
    if (newAccounts.length === 0) {
      console.log('All test accounts already exist!');
      return;
    }
    
    // Insert new accounts
    const { data, error } = await supabase
      .from('profiles')
      .insert(newAccounts)
      .select();
    
    if (error) {
      console.error('Error creating test accounts:', error);
      return;
    }
    
    console.log(`Successfully created ${newAccounts.length} test accounts:`);
    newAccounts.forEach(account => {
      console.log(`- ${account.name} (${account.email}) - Role: ${account.role}`);
    });
    
    console.log('\nTest accounts created successfully!');
    console.log('You can now use these credentials to test the login functionality.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
createTestAccounts();