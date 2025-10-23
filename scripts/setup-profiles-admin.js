import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration with service role key (bypasses RLS)
const supabaseUrl = 'https://xzofytokwszfwiupsdvi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
  console.log('🚀 Setting up test profiles with admin privileges...');

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

    // Get or create auth users
    console.log('👤 Getting/creating auth users...');
    const createdUsers = [];
    
    for (const profile of testProfiles) {
      console.log(`Processing user: ${profile.email}`);
      
      // First try to get existing user
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error(`❌ Error listing users:`, listError);
        continue;
      }
      
      const existingUser = existingUsers.users.find(user => user.email === profile.email);
      
      if (existingUser) {
        console.log(`✅ Found existing auth user: ${profile.email} with ID: ${existingUser.id}`);
        
        // Update password for existing user to ensure it matches expected password
        const password = profile.role === 'super_admin' ? 'admin123' :
                        profile.role === 'manager' ? 'manager123' :
                        profile.role === 'sales' ? 'sales123' :
                        profile.role === 'agent' ? 'agent123' : 'password123';
        
        const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password: password
        });
        
        if (updateError) {
          console.log(`⚠️ Warning: Could not update password for ${profile.email}:`, updateError.message);
        } else {
          console.log(`✅ Updated password for ${profile.email}`);
        }
        
        // Update profile with the existing user ID
        const updatedProfile = {
          ...profile,
          id: existingUser.id
        };
        
        createdUsers.push(updatedProfile);
      } else {
        // Create user in auth.users table if it doesn't exist
        // Set password based on role for easy testing
        const password = profile.role === 'super_admin' ? 'admin123' :
                        profile.role === 'manager' ? 'manager123' :
                        profile.role === 'sales' ? 'sales123' :
                        profile.role === 'agent' ? 'agent123' : 'password123';
        
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: profile.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            name: profile.name,
            role: profile.role
          }
        });

        if (authError) {
          console.error(`❌ Error creating auth user for ${profile.email}:`, authError);
          continue;
        }

        console.log(`✅ Created new auth user: ${profile.email} with ID: ${authUser.user.id}`);
        
        // Update profile with the actual user ID from auth
        const updatedProfile = {
          ...profile,
          id: authUser.user.id
        };
        
        createdUsers.push(updatedProfile);
      }
    }

    if (createdUsers.length === 0) {
      console.error('❌ No users were created successfully');
      return;
    }

    // Upsert profiles using service role (idempotent, avoids PK conflicts with triggers)
    console.log('📝 Upserting test profiles...');
    const { data, error } = await supabase
      .from('profiles')
      .upsert(createdUsers, { onConflict: 'id' })
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
    const userRoles = createdUsers.map(profile => ({
      user_id: profile.id,
      role: profile.role,
      permissions: getPermissionsByRole(profile.role)
    }));

    // Clean up existing user roles
    const { error: deleteRolesError } = await supabase
      .from('user_roles')
      .delete()
      .in('user_id', createdUsers.map(p => p.id));

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
      rolesData.forEach(role => {
        console.log(`   - User: ${role.user_id} - Role: ${role.role}`);
      });
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
  const rolePermissions = {
    'super_admin': ['*'],
    'manager': ['bookings.*', 'inventory.*', 'staff.view', 'queries.*'],
    'hr_manager': ['staff.*', 'hr.*', 'attendance.*', 'payroll.*'],
    'finance_manager': ['finance.*', 'reports.*', 'billing.*'],
    'staff': ['queries.view', 'queries.create', 'bookings.view', 'bookings.create'],
    'sales': ['queries.view', 'queries.create', 'bookings.view', 'bookings.create'],
    'agent': ['queries.view', 'bookings.view', 'queries.create']
  };
  
  return rolePermissions[role] || ['queries.view'];
}

setupProfiles();