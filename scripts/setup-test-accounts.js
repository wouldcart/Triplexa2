import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://xzofytokwszfwiupsdvi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNTM0MTEsImV4cCI6MjA3MzkyOTQxMX0.FnTL4m0EmxzlNSRfCD12Gc1_PUpOI4rHvaRemr46CiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test accounts to create
const testAccounts = [
  {
    email: 'superadmin@tripoex.com',
    password: 'super123',
    userData: {
      name: 'Super Administrator',
      role: 'super_admin',
      department: 'Administration',
      phone: '+1-555-0001',
      status: 'active',
      position: 'System Administrator',
      work_location: 'Head Office',
      employee_id: 'EMP001',
      join_date: '2023-01-01',
      reporting_manager: 'CEO',
      skills: ['System Administration', 'Database Management', 'Security'],
      certifications: ['AWS Certified', 'Security+'],
      permissions: ['*'],
      language_access: true,
      preferred_language: 'en'
    }
  },
  {
    email: 'manager@tripoex.com',
    password: 'manager123',
    userData: {
      name: 'John Manager',
      role: 'manager',
      department: 'Operations',
      phone: '+1-555-0010',
      status: 'active',
      position: 'Operations Manager',
      work_location: 'Head Office',
      employee_id: 'EMP002',
      join_date: '2023-02-15',
      reporting_manager: 'Super Administrator',
      skills: ['Team Management', 'Operations', 'Strategic Planning'],
      certifications: ['PMP', 'Lean Six Sigma'],
      permissions: ['bookings.*', 'inventory.*', 'staff.view', 'queries.*'],
      language_access: true,
      preferred_language: 'en'
    }
  },
  {
    email: 'staff_sales@tripoex.com',
    password: 'staff123',
    userData: {
      name: 'Sarah Sales',
      role: 'staff',
      department: 'Sales',
      phone: '+1-555-0020',
      status: 'active',
      position: 'Senior Sales Executive',
      work_location: 'Head Office',
      employee_id: 'EMP003',
      join_date: '2023-03-01',
      reporting_manager: 'John Manager',
      skills: ['Sales', 'Customer Relations', 'Product Knowledge'],
      certifications: ['Sales Professional'],
      permissions: ['bookings.view', 'bookings.create', 'queries.view', 'queries.create'],
      language_access: true,
      preferred_language: 'en'
    }
  },
  {
    email: 'agent_company@tripoex.com',
    password: 'agent123',
    userData: {
      name: 'Dream Tours Agency',
      role: 'agent',
      department: 'External',
      phone: '+1-555-0040',
      status: 'active',
      position: 'Travel Agent',
      work_location: 'Remote',
      employee_id: 'AGT001',
      join_date: '2023-05-01',
      reporting_manager: 'John Manager',
      skills: ['Travel Planning', 'Customer Service', 'Destination Knowledge'],
      certifications: ['IATA', 'Travel Agent Certification'],
      permissions: ['bookings.view', 'bookings.create', 'queries.view', 'queries.create'],
      language_access: true,
      preferred_language: 'en'
    }
  },
  {
    email: 'user@tripoex.com',
    password: 'user123',
    userData: {
      name: 'Regular User',
      role: 'user',
      department: 'General',
      phone: '+1-555-0050',
      status: 'active',
      position: 'User',
      work_location: 'Various',
      employee_id: 'USR001',
      join_date: '2023-06-01',
      reporting_manager: 'John Manager',
      skills: ['Basic Computer Skills'],
      certifications: [],
      permissions: ['queries.view'],
      language_access: false,
      preferred_language: 'en'
    }
  }
];

async function createTestAccounts() {
  console.log('🚀 Starting test account creation...');
  
  for (const account of testAccounts) {
    try {
      console.log(`\n📧 Creating account for ${account.email}...`);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          emailRedirectTo: undefined // Skip email confirmation for test accounts
        }
      });
      
      if (authError) {
        console.error(`❌ Auth error for ${account.email}:`, authError.message);
        continue;
      }
      
      if (authData.user) {
        console.log(`✅ Auth user created: ${authData.user.id}`);
        
        // Create user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            auth_id: authData.user.id,
            ...account.userData
          })
          .select()
          .single();
        
        if (userError) {
          console.error(`❌ User profile error for ${account.email}:`, userError.message);
        } else {
          console.log(`✅ User profile created: ${userData.name}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Unexpected error for ${account.email}:`, error);
    }
  }
  
  console.log('\n🎉 Test account creation completed!');
}

// Run the script
createTestAccounts().catch(console.error);