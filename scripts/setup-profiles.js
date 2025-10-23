import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://xzofytokwszfwiupsdvi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2Z5dG9rd3N6ZndpdXBzZHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNTM0MTEsImV4cCI6MjA3MzkyOTQxMX0.FnTL4m0EmxzlNSRfCD12Gc1_PUpOI4rHvaRemr46CiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test accounts to create in profiles table
const testProfiles = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'admin@triplexa.com',
    name: 'Super Admin',
    role: 'super_admin',
    company_name: 'TripleXA',
    department: 'Administration',
    position: 'System Administrator',
    status: 'active',
    phone: '+1-555-0001',
    employee_id: 'EMP001'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'manager@triplexa.com',
    name: 'John Manager',
    role: 'manager',
    company_name: 'TripleXA',
    department: 'Operations',
    position: 'Operations Manager',
    status: 'active',
    phone: '+1-555-0010',
    employee_id: 'EMP002'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'sales@triplexa.com',
    name: 'Jane Sales',
    role: 'sales',
    company_name: 'TripleXA',
    department: 'Sales',
    position: 'Sales Representative',
    status: 'active',
    phone: '+1-555-0020',
    employee_id: 'EMP003'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'agent@triplexa.com',
    name: 'Mike Agent',
    role: 'agent',
    company_name: 'Travel Agency Inc',
    department: 'Travel Services',
    position: 'Travel Agent',
    status: 'active',
    phone: '+1-555-0030',
    employee_id: 'EMP004'
  }
];

async function setupProfiles() {
  console.log('🚀 Setting up test profiles...');

  try {
    // First, delete any existing test profiles to avoid conflicts
    console.log('🧹 Cleaning up existing test profiles...');
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .in('email', testProfiles.map(p => p.email));

    if (deleteError) {
      console.log('⚠️ Warning during cleanup:', deleteError.message);
    }

    // Upsert profiles idempotently (in case triggers or prior runs created them)
    console.log('📝 Upserting test profiles...');
    const { data, error } = await supabase
      .from('profiles')
      .upsert(testProfiles, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error inserting profiles:', error);
      return;
    }

    console.log('✅ Successfully created profiles:');
    data.forEach(profile => {
      console.log(`   - ${profile.name} (${profile.email}) - Role: ${profile.role}`);
    });

    // Also create corresponding user_roles entries
    console.log('🔐 Setting up user roles...');
    const userRoles = testProfiles.map(profile => ({
      user_id: profile.id,
      role: profile.role,
      permissions: getPermissionsByRole(profile.role)
    }));

    // Clean up existing user roles
    const { error: deleteRolesError } = await supabase
      .from('user_roles')
      .delete()
      .in('user_id', testProfiles.map(p => p.id));

    if (deleteRolesError) {
      console.log('⚠️ Warning during user roles cleanup:', deleteRolesError.message);
    }

    // Insert new user roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .insert(userRoles)
      .select();

    if (rolesError) {
      console.error('❌ Error inserting user roles:', rolesError);
    } else {
      console.log('✅ Successfully created user roles');
    }

    console.log('\n🎉 Test accounts setup completed!');
    console.log('\nYou can now login with:');
    console.log('- admin@triplexa.com / admin123');
    console.log('- manager@triplexa.com / manager123');
    console.log('- sales@triplexa.com / sales123');
    console.log('- agent@triplexa.com / agent123');

  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

function getPermissionsByRole(role) {
  const permissions = {
    'super_admin': ['*'],
    'manager': ['bookings.*', 'inventory.*', 'staff.view', 'queries.*'],
    'sales': ['bookings.view', 'bookings.create', 'queries.view', 'queries.create'],
    'agent': ['bookings.view', 'queries.view', 'queries.create']
  };
  
  return permissions[role] || [];
}

// Run the setup
setupProfiles();