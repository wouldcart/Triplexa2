
import { User } from '@/types/User';
import { getStoredCredentials } from '@/services/credentialService';

// Helper function to get permissions based on role
const getPermissionsByRole = (role: string): string[] => {
  const rolePermissions: { [key: string]: string[] } = {
    'super_admin': ['*'], // All permissions
    'manager': ['queries.*', 'bookings.*', 'inventory.view', 'vendors.*', 'staff.view', 'reports.*'],
    'hr_manager': ['staff.*', 'hr.*', 'attendance.*', 'payroll.*', 'queries.view'],
    'staff': ['queries.view', 'bookings.view'],
    'sales_agent': ['queries.view', 'queries.create', 'bookings.view', 'bookings.create'],
    'agent': ['queries.view', 'bookings.view']
  };
  
  return rolePermissions[role] || ['queries.view'];
};

export const users: User[] = [
  {
    id: '1',
    name: 'Super Administrator',
    email: 'superadmin@tripoex.com',
    avatar: '/avatars/superadmin.jpg',
    role: 'super_admin',
    department: 'Administration',
    phone: '+1-555-0001',
    status: 'active',
    position: 'System Administrator',
    workLocation: 'Head Office',
    employeeId: 'EMP001',
    joinDate: '2023-01-01',
    reportingManager: 'CEO',
    lastLogin: '2024-12-10 09:30:00',
    skills: ['System Administration', 'Database Management', 'Security'],
    certifications: ['AWS Certified', 'Security+'],
    permissions: ['*'],
    languageAccess: true,
    preferredLanguage: 'en',
    personalInfo: {
      dateOfBirth: '1985-05-15',
      address: '123 Admin Street, Tech City',
      nationality: 'USA',
      languages: ['English', 'Spanish']
    },
    emergencyContact: {
      name: 'Jane Administrator',
      phone: '+1-555-0002',
      relationship: 'Spouse'
    },
    workSchedule: {
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '08:00',
      endTime: '17:00',
      timezone: 'UTC-5'
    }
  },
  {
    id: '2',
    name: 'John Manager',
    email: 'manager@tripoex.com',
    avatar: '/avatars/manager.jpg',
    role: 'manager',
    department: 'Operations',
    phone: '+1-555-0010',
    status: 'active',
    position: 'Operations Manager',
    workLocation: 'Head Office',
    employeeId: 'EMP002',
    joinDate: '2023-02-15',
    reportingManager: 'Super Administrator',
    lastLogin: '2024-12-10 08:45:00',
    skills: ['Team Management', 'Operations', 'Strategic Planning'],
    certifications: ['PMP', 'Lean Six Sigma'],
    permissions: ['bookings.*', 'inventory.*', 'staff.view', 'queries.*'],
    languageAccess: true,
    preferredLanguage: 'en'
  },
  {
    id: '3',
    name: 'Sarah Sales',
    email: 'staff_sales@tripoex.com',
    avatar: '/avatars/sarah.jpg',
    role: 'staff',
    department: 'Sales',
    phone: '+1-555-0020',
    status: 'active',
    position: 'Senior Sales Executive',
    workLocation: 'Head Office',
    employeeId: 'EMP003',
    joinDate: '2023-03-01',
    reportingManager: 'John Manager',
    lastLogin: '2024-12-10 09:15:00',
    skills: ['Sales', 'Customer Relations', 'Product Knowledge'],
    certifications: ['Sales Professional'],
    permissions: ['bookings.view', 'bookings.create', 'queries.view', 'queries.create'],
    languageAccess: true,
    preferredLanguage: 'en'
  },
  {
    id: '4',
    name: 'Mike Marketing',
    email: 'staff_marketing@tripoex.com',
    avatar: '/avatars/mike.jpg',
    role: 'staff',
    department: 'Marketing',
    phone: '+1-555-0030',
    status: 'active',
    position: 'Marketing Specialist',
    workLocation: 'Head Office',
    employeeId: 'EMP004',
    joinDate: '2023-04-15',
    reportingManager: 'John Manager',
    lastLogin: '2024-12-09 16:30:00',
    skills: ['Digital Marketing', 'Content Creation', 'Analytics'],
    certifications: ['Google Analytics', 'HubSpot'],
    permissions: ['inventory.view', 'queries.view'],
    languageAccess: false,
    preferredLanguage: 'en'
  },
  {
    id: '5',
    name: 'Dream Tours Agency',
    email: 'agent_company@tripoex.com',
    avatar: '/avatars/agent.jpg',
    role: 'agent',
    department: 'External',
    phone: '+1-555-0040',
    status: 'active',
    position: 'Travel Agent',
    workLocation: 'Remote',
    employeeId: 'AGT001',
    joinDate: '2023-05-01',
    reportingManager: 'John Manager',
    lastLogin: '2024-12-10 07:20:00',
    skills: ['Travel Planning', 'Customer Service', 'Destination Knowledge'],
    certifications: ['IATA', 'Travel Agent Certification'],
    permissions: ['bookings.view', 'bookings.create', 'queries.view', 'queries.create'],
    languageAccess: true,
    preferredLanguage: 'en',
    companyInfo: {
      companyName: 'Dream Tours & Travel',
      registrationNumber: 'REG-DT-2023-001',
      businessType: 'Travel Agency',
      contractStartDate: '2023-05-01',
      contractEndDate: '2024-05-01'
    }
  },
  {
    id: '6',
    name: 'Regular User',
    email: 'user@tripoex.com',
    avatar: '/avatars/user.jpg',
    role: 'user',
    department: 'General',
    phone: '+1-555-0050',
    status: 'active',
    position: 'User',
    workLocation: 'Various',
    employeeId: 'USR001',
    joinDate: '2023-06-01',
    reportingManager: 'John Manager',
    lastLogin: '2024-12-09 14:15:00',
    skills: ['Basic Computer Skills'],
    certifications: [],
    permissions: ['queries.view'],
    languageAccess: false,
    preferredLanguage: 'en'
  },
  {
    id: '7',
    name: 'HR Manager',
    email: 'hr_manager@tripoex.com',
    avatar: '/avatars/hr.jpg',
    role: 'hr_manager',
    department: 'Human Resources',
    phone: '+1-555-0060',
    status: 'active',
    position: 'HR Manager',
    workLocation: 'Head Office',
    employeeId: 'HR001',
    joinDate: '2023-01-15',
    reportingManager: 'Super Administrator',
    lastLogin: '2024-12-10 08:00:00',
    skills: ['HR Management', 'Recruitment', 'Employee Relations', 'Payroll'],
    certifications: ['SHRM-CP', 'PHR'],
    permissions: ['staff.*', 'hr.*', 'attendance.*', 'payroll.*'],
    languageAccess: true,
    preferredLanguage: 'en',
    personalInfo: {
      dateOfBirth: '1980-03-20',
      address: '456 HR Lane, Business District',
      nationality: 'USA',
      languages: ['English', 'French']
    },
    emergencyContact: {
      name: 'Robert HR',
      phone: '+1-555-0061',
      relationship: 'Spouse'
    },
    workSchedule: {
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '08:30',
      endTime: '17:30',
      timezone: 'UTC-5'
    }
  },
  // NEW TEST USERS FOR COMPREHENSIVE TESTING
  {
    id: '8',
    name: 'Finance Manager',
    email: 'finance_manager@tripoex.com',
    avatar: '/avatars/finance.jpg',
    role: 'finance_manager',
    department: 'Finance',
    phone: '+1-555-0070',
    status: 'active',
    position: 'Finance Manager',
    workLocation: 'Head Office',
    employeeId: 'FIN001',
    joinDate: '2023-02-01',
    reportingManager: 'Super Administrator',
    lastLogin: '2024-12-10 08:30:00',
    skills: ['Financial Analysis', 'Budget Management', 'Commission Tracking', 'Reporting'],
    certifications: ['CPA', 'Financial Management'],
    permissions: ['finance.*', 'reports.*', 'commission.*', 'billing.*'],
    languageAccess: true,
    preferredLanguage: 'en'
  },
  {
    id: '9',
    name: 'Operations Staff',
    email: 'ops_staff@tripoex.com',
    avatar: '/avatars/operations.jpg',
    role: 'staff',
    department: 'Operations',
    phone: '+1-555-0080',
    status: 'active',
    position: 'Operations Executive',
    workLocation: 'Head Office',
    employeeId: 'OPS001',
    joinDate: '2023-04-01',
    reportingManager: 'John Manager',
    lastLogin: '2024-12-10 09:00:00',
    skills: ['Booking Management', 'Vendor Coordination', 'Service Delivery', 'Quality Control'],
    certifications: ['Operations Management'],
    permissions: ['bookings.*', 'vendors.*', 'services.*', 'inventory.view'],
    languageAccess: true,
    preferredLanguage: 'en'
  },
  {
    id: '10',
    name: 'Customer Support Agent',
    email: 'support_agent@tripoex.com',
    avatar: '/avatars/support.jpg',
    role: 'staff',
    department: 'Customer Support',
    phone: '+1-555-0090',
    status: 'active',
    position: 'Support Agent',
    workLocation: 'Head Office',
    employeeId: 'SUP001',
    joinDate: '2023-05-15',
    reportingManager: 'John Manager',
    lastLogin: '2024-12-10 08:15:00',
    skills: ['Customer Service', 'Problem Resolution', 'Communication', 'CRM Management'],
    certifications: ['Customer Service Excellence'],
    permissions: ['agents.*', 'tickets.*', 'communication.*', 'queries.view'],
    languageAccess: true,
    preferredLanguage: 'en'
  },
  {
    id: '11',
    name: 'Field Sales Executive',
    email: 'field_sales@tripoex.com',
    avatar: '/avatars/field-sales.jpg',
    role: 'staff',
    department: 'Field Sales',
    phone: '+1-555-0100',
    status: 'active',
    position: 'Field Sales Executive',
    workLocation: 'Field',
    employeeId: 'FS001',
    joinDate: '2023-06-15',
    reportingManager: 'John Manager',
    lastLogin: '2024-12-09 17:30:00',
    skills: ['Lead Generation', 'Agent Acquisition', 'Territory Management', 'Relationship Building'],
    certifications: ['Field Sales Professional'],
    permissions: ['leads.*', 'agents.create', 'agents.view', 'territory.*'],
    languageAccess: true,
    preferredLanguage: 'en'
  },
  {
    id: '12',
    name: 'Junior Sales Staff',
    email: 'junior_sales@tripoex.com',
    avatar: '/avatars/junior-sales.jpg',
    role: 'staff',
    department: 'Sales',
    phone: '+1-555-0110',
    status: 'active',
    position: 'Junior Sales Executive',
    workLocation: 'Head Office',
    employeeId: 'JS001',
    joinDate: '2023-08-01',
    reportingManager: 'Sarah Sales',
    lastLogin: '2024-12-10 09:45:00',
    skills: ['Basic Sales', 'Lead Qualification', 'Customer Support'],
    certifications: ['Sales Fundamentals'],
    permissions: ['queries.view', 'queries.create', 'bookings.view'],
    languageAccess: false,
    preferredLanguage: 'en'
  },
  {
    id: '13',
    name: 'Inactive User',
    email: 'inactive_user@tripoex.com',
    avatar: '/avatars/inactive.jpg',
    role: 'staff',
    department: 'Sales',
    phone: '+1-555-0120',
    status: 'inactive',
    position: 'Sales Executive',
    workLocation: 'Head Office',
    employeeId: 'INA001',
    joinDate: '2023-03-15',
    reportingManager: 'Sarah Sales',
    lastLogin: '2024-11-15 10:30:00',
    skills: ['Sales', 'Customer Relations'],
    certifications: [],
    permissions: [],
    languageAccess: false,
    preferredLanguage: 'en'
  },
  {
    id: '14',
    name: 'Premium Travel Agency',
    email: 'premium_agent@tripoex.com',
    avatar: '/avatars/premium-agent.jpg',
    role: 'agent',
    department: 'External',
    phone: '+1-555-0130',
    status: 'active',
    position: 'Premium Travel Agent',
    workLocation: 'Remote',
    employeeId: 'AGT002',
    joinDate: '2023-07-01',
    reportingManager: 'John Manager',
    lastLogin: '2024-12-10 06:45:00',
    skills: ['Luxury Travel', 'VIP Services', 'High-Value Bookings', 'Destination Expertise'],
    certifications: ['IATA', 'Luxury Travel Specialist', 'Premium Service'],
    permissions: ['bookings.*', 'queries.*', 'premium.*', 'vip.*'],
    languageAccess: true,
    preferredLanguage: 'en',
    companyInfo: {
      companyName: 'Premium Travel Solutions',
      registrationNumber: 'REG-PTS-2023-002',
      businessType: 'Luxury Travel Agency',
      contractStartDate: '2023-07-01',
      contractEndDate: '2024-07-01',
      commissionStructure: {
        tiers: [
          { min: 0, max: 50000, rate: 20 },
          { min: 50001, max: 100000, rate: 25 },
          { min: 100001, max: 999999, rate: 30 }
        ]
      }
    }
  }
];

import { supabase } from '@/lib/supabaseClient';

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  console.log('🔐 Authentication attempt:', { username, hasPassword: !!password });
  
  // First try to authenticate with database profiles
  try {
    // Check if input is email format
    const isEmail = username.includes('@');
    const email = isEmail ? username : `${username}@triplexa.com`;
    
    // Query profiles table directly for email-based authentication
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .eq('status', 'active')
      .single();
    
    if (profileError) {
      console.log('Profile lookup error:', profileError.message);
    } else if (profileData) {
      console.log('✅ Profile found for email:', email);
      
      // For now, we'll use simple password matching since we don't have password hashing set up
      // In production, you would hash the password and compare with stored hash
      const testPasswords: Record<string, string> = {
        'admin@triplexa.com': 'admin123',
        'manager@triplexa.com': 'manager123',
        'sales@triplexa.com': 'sales123',
        'agent@triplexa.com': 'agent123'
      };
      
      if (testPasswords[email] === password) {
        console.log('✅ Database user authenticated:', profileData.name);
        
        // Convert database profile to our User type
        return {
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          avatar: '/avatars/default.jpg',
          role: profileData.role,
          department: profileData.department || 'General',
          phone: profileData.phone || '',
          status: (profileData.status as 'active' | 'inactive' | 'suspended') || 'active',
          position: profileData.position || 'User',
          workLocation: 'Head Office',
          employeeId: profileData.employee_id || '',
          joinDate: profileData.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          reportingManager: '',
          lastLogin: new Date().toISOString(),
          skills: [],
          certifications: [],
          permissions: getPermissionsByRole(profileData.role),
          languageAccess: ['super_admin', 'manager'].includes(profileData.role),
          preferredLanguage: 'en'
        };
      } else {
        console.log('❌ Invalid password for email:', email);
      }
    }
  } catch (err) {
    console.error('Database authentication error:', err);
  }
  
  // Fallback authentication when database is not available
  // First check database user credentials (for when Supabase is down)
  const testPasswords: Record<string, string> = {
    'admin@triplexa.com': 'admin123',
    'manager@triplexa.com': 'manager123',
    'sales@triplexa.com': 'sales123',
    'agent@triplexa.com': 'agent123'
  };

  // Check if this is a database user trying to login when Supabase is down
  const isEmail = username.includes('@');
  const email = isEmail ? username : `${username}@triplexa.com`;
  
  if (testPasswords[email] === password) {
    console.log('✅ Database user authenticated via fallback:', email);
    
    // Create a user object for database users when Supabase is down
    const databaseUserMap: Record<string, Partial<User>> = {
      'admin@triplexa.com': {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Super Admin',
        email: 'admin@triplexa.com',
        role: 'super_admin',
        department: 'Administration',
        position: 'System Administrator',
        phone: '+1-555-0001',
        employeeId: 'EMP001'
      },
      'manager@triplexa.com': {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'John Manager',
        email: 'manager@triplexa.com',
        role: 'manager',
        department: 'Operations',
        position: 'Operations Manager',
        phone: '+1-555-0010',
        employeeId: 'EMP002'
      },
      'sales@triplexa.com': {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Jane Sales',
        email: 'sales@triplexa.com',
        role: 'sales',
        department: 'Sales',
        position: 'Sales Representative',
        phone: '+1-555-0020',
        employeeId: 'EMP003'
      },
      'agent@triplexa.com': {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Mike Agent',
        email: 'agent@triplexa.com',
        role: 'agent',
        department: 'Travel Services',
        position: 'Travel Agent',
        phone: '+1-555-0030',
        employeeId: 'EMP004'
      }
    };

    const userData = databaseUserMap[email];
    if (userData) {
      return {
        id: userData.id!,
        name: userData.name!,
        email: userData.email!,
        avatar: '/avatars/default.jpg',
        role: userData.role!,
        department: userData.department!,
        phone: userData.phone!,
        status: 'active' as const,
        position: userData.position!,
        workLocation: 'Head Office',
        employeeId: userData.employeeId!,
        joinDate: new Date().toISOString().split('T')[0],
        reportingManager: '',
        lastLogin: new Date().toISOString(),
        skills: [],
        certifications: [],
        permissions: getPermissionsByRole(userData.role!),
        languageAccess: ['super_admin', 'manager'].includes(userData.role!),
        preferredLanguage: 'en'
      };
    }
  }

  // Fallback to hardcoded credentials for testing
  const credentials: Record<string, string> = {
    'superadmin': 'super123',
    'manager': 'manager123',
    'staff_sales': 'staff123',
    'staff_marketing': 'staff123',
    'agent_company': 'agent123',
    'user': 'user123',
    'hr_manager': 'hr123',
    'finance_manager': 'finance123',
    'ops_staff': 'ops123',
    'support_agent': 'support123',
    'field_sales': 'field123',
    'junior_sales': 'junior123',
    'inactive_user': 'inactive123',
    'premium_agent': 'premium123'
  };

  // Check hardcoded credentials as fallback
  if (credentials[username] === password) {
    const user = users.find(user => 
      user.email.startsWith(username) || 
      user.email === `${username}@tripoex.com`
    );
    if (user) {
      console.log('✅ Hardcoded user authenticated:', user.name);
      return user;
    }
  }

  // Check email-based login for hardcoded users
  const userByEmail = users.find(user => user.email === username);
  if (userByEmail && credentials[userByEmail.email.split('@')[0]] === password) {
    console.log('✅ Hardcoded user authenticated by email:', userByEmail.name);
    return userByEmail;
  }

  // Check agent credentials from agent authentication system
  console.log('🔍 Checking agent credentials...');
  try {
    const agentCredentials = JSON.parse(localStorage.getItem('agent_credentials') || '[]');
    const agentCredential = agentCredentials.find((cred: any) => 
      cred.username === username || cred.email === username
    );
    
    if (agentCredential && agentCredential.password === password) {
      console.log('🎯 Found matching agent credential');
      
      // Get agent details
      const agents = JSON.parse(localStorage.getItem('agents') || '[]');
      const agent = agents.find((a: any) => a.id.toString() === agentCredential.agentId);
      
      if (agent && agent.status === 'active') {
        // Convert agent to user format for authentication
        const agentUser: User = {
          id: agent.id.toString(),
          name: agent.name,
          email: agent.email,
          avatar: agent.profileImage || '/avatars/agent.jpg',
          role: 'agent',
          department: 'External',
          phone: agent.contact?.phone || '',
          status: 'active',
          position: 'Travel Agent',
          workLocation: 'Remote',
          employeeId: `AGT${agent.id.toString().padStart(3, '0')}`,
          joinDate: agent.joinDate || new Date().toISOString().split('T')[0],
          reportingManager: agent.createdBy?.staffName || 'System',
          lastLogin: new Date().toISOString(),
          skills: ['Travel Planning', 'Customer Service'],
          certifications: [],
          permissions: ['bookings.view', 'bookings.create', 'queries.view', 'queries.create'],
          languageAccess: true,
          preferredLanguage: 'en',
          companyInfo: agent.type === 'company' ? {
            companyName: agent.company || agent.name,
            registrationNumber: `REG-${agent.id}`,
            businessType: 'Travel Agency',
            contractStartDate: agent.joinDate || new Date().toISOString().split('T')[0],
            contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          } : undefined
        };
        
        console.log('✅ Agent authenticated successfully:', agentUser.name);
        return agentUser;
      }
    }
  } catch (error) {
    console.error('❌ Error checking agent credentials:', error);
  }

  // Check dynamically created staff credentials
  console.log('🔍 Checking dynamic staff credentials...');
  const staffCredentials = getStoredCredentials();
  console.log('📋 Available staff credentials:', staffCredentials.map(c => ({ username: c.username, staffId: c.staffId })));
  
  // First try username-based login
  const matchingCredential = staffCredentials.find(cred => cred.username === username);
  
  if (matchingCredential) {
    console.log('🎯 Found matching credential by username:', matchingCredential.username);
    if (matchingCredential.password === password) {
      console.log('✅ Password matches, looking for user account...');
      
      // Get the corresponding user from auth_users storage
      try {
        const authUsers = JSON.parse(localStorage.getItem('auth_users') || '[]');
        console.log('👥 Available auth users:', authUsers.map((u: User) => ({ id: u.id, name: u.name, email: u.email, status: u.status })));
        
        const staffUser = authUsers.find((user: User) => user.id === matchingCredential.staffId);
        if (staffUser) {
          console.log('👤 Found staff user:', { name: staffUser.name, status: staffUser.status });
          if (staffUser.status === 'active') {
            console.log('✅ Staff user authenticated successfully');
            return staffUser;
          } else {
            console.log('❌ Staff user is not active:', staffUser.status);
          }
        } else {
          console.log('❌ No auth user found for staff ID:', matchingCredential.staffId);
        }
      } catch (error) {
        console.error('❌ Error retrieving staff user:', error);
      }
    } else {
      console.log('❌ Password does not match');
    }
  }

  // Try email-based login for dynamically created staff
  console.log('🔍 Trying email-based login for dynamic staff...');
  try {
    const authUsers = JSON.parse(localStorage.getItem('auth_users') || '[]');
    
    // Find user by email
    const staffUserByEmail = authUsers.find((user: User) => user.email === username);
    if (staffUserByEmail) {
      console.log('📧 Found user by email:', staffUserByEmail.name);
      
      // Find corresponding credential by staff ID
      const staffCredential = staffCredentials.find(cred => cred.staffId === staffUserByEmail.id);
      if (staffCredential) {
        console.log('🔑 Found credential for email user');
        if (staffCredential.password === password && staffUserByEmail.status === 'active') {
          console.log('✅ Email-based staff authentication successful');
          return staffUserByEmail;
        } else {
          console.log('❌ Email-based auth failed:', { 
            passwordMatch: staffCredential.password === password,
            isActive: staffUserByEmail.status === 'active' 
          });
        }
      } else {
        console.log('❌ No credential found for email user');
      }
    } else {
      console.log('❌ No user found with email:', username);
    }
  } catch (error) {
    console.error('❌ Error checking staff email login:', error);
  }

  console.log('❌ Authentication failed for:', username);
  return null;
};

export const getUserById = (id: string): User | null => {
  return users.find(user => user.id === id) || null;
};

export const getAllUsers = (): User[] => {
  return users;
};
