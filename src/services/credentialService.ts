
import { User } from '@/types/User';
import { EnhancedStaffMember } from '@/types/staff';

interface StaffCredentials {
  id: string;
  staffId: string;
  username: string;
  password: string;
  temporaryPassword: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  lastPasswordChange?: string;
}

const CREDENTIALS_STORAGE_KEY = 'staff_credentials';
const AUTH_USERS_KEY = 'auth_users';

export const saveStaffCredentials = (credentials: StaffCredentials): void => {
  try {
    const existing = getStoredCredentials();
    // Check if credentials already exist for this staff member
    const existingIndex = existing.findIndex(cred => cred.staffId === credentials.staffId);
    
    if (existingIndex !== -1) {
      // Update existing credentials
      existing[existingIndex] = credentials;
      console.log('🔄 Updated existing staff credentials:', { staffId: credentials.staffId, username: credentials.username });
    } else {
      // Add new credentials
      existing.push(credentials);
      console.log('➕ Added new staff credentials:', { staffId: credentials.staffId, username: credentials.username });
    }
    
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(existing));
    console.log('💾 Staff credentials saved successfully. Total credentials:', existing.length);
  } catch (error) {
    console.error('❌ Error saving staff credentials:', error);
  }
};

export const getStoredCredentials = (): StaffCredentials[] => {
  try {
    const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    const credentials = stored ? JSON.parse(stored) : [];
    console.log('📋 Retrieved staff credentials:', credentials.length, 'entries');
    return credentials;
  } catch (error) {
    console.error('❌ Error reading staff credentials:', error);
    return [];
  }
};

export const createUserFromStaff = (
  staff: EnhancedStaffMember, 
  username: string, 
  password: string,
  mustChangePassword: boolean = false
): User => {
  const user: User = {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    avatar: staff.avatar || `/avatars/avatar-${Math.floor(Math.random() * 5) + 1}.png`,
    role: mapStaffRoleToUserRole(staff.role, staff.department),
    department: staff.department,
    phone: staff.phone,
    status: staff.status === 'active' ? 'active' : 'inactive',
    position: staff.role,
    workLocation: 'Head Office',
    employeeId: staff.employeeId,
    joinDate: staff.joinDate,
    reportingManager: staff.reportingManager,
    lastLogin: undefined,
    skills: staff.skills,
    certifications: staff.certifications,
    permissions: mapDepartmentToPermissions(staff.department, staff.role),
    languageAccess: true,
    preferredLanguage: 'en'
  };

  return user;
};

const mapStaffRoleToUserRole = (role: string, department: string): string => {
  const roleMap: { [key: string]: string } = {
    'Manager': 'manager',
    'Senior Agent': 'staff',
    'Agent': 'staff',
    'Executive': 'staff',
    'HR Manager': 'hr_manager',
    'Finance Manager': 'finance_manager'
  };

  return roleMap[role] || 'staff';
};

const mapDepartmentToPermissions = (department: string, role: string): string[] => {
  const basePermissions: { [key: string]: string[] } = {
    'Sales': ['queries.view', 'queries.create', 'bookings.view', 'bookings.create'],
    'Operations': ['bookings.*', 'inventory.view', 'vendors.*'],
    'Customer Support': ['agents.*', 'tickets.*', 'communication.*'],
    'Human Resources': ['staff.*', 'hr.*', 'attendance.*', 'payroll.*'],
    'Finance': ['finance.*', 'reports.*', 'commission.*', 'billing.*'],
    'Field Sales': ['leads.*', 'agents.create', 'agents.view', 'territory.*'],
    'Marketing': ['inventory.view', 'queries.view']
  };

  const roleBonus: { [key: string]: string[] } = {
    'Manager': ['manage_staff', 'view_reports', 'manage_queries'],
    'Senior Agent': ['create_proposals', 'view_analytics']
  };

  const permissions = basePermissions[department] || ['queries.view'];
  const additionalPermissions = roleBonus[role] || [];

  return [...permissions, ...additionalPermissions];
};

export const syncStaffWithAuthSystem = (staff: EnhancedStaffMember, username: string, password: string, mustChangePassword: boolean = true): void => {
  try {
    console.log('🔄 Syncing staff with auth system:', { name: staff.name, username, email: staff.email });
    
    // Save credentials
    const credentials: StaffCredentials = {
      id: `cred_${staff.id}`,
      staffId: staff.id,
      username,
      password,
      temporaryPassword: true,
      mustChangePassword,
      createdAt: new Date().toISOString()
    };
    
    saveStaffCredentials(credentials);

    // Create user account
    const user = createUserFromStaff(staff, username, password, mustChangePassword);
    
    // Save to auth system
    const existingUsers = JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || '[]');
    console.log('👥 Existing auth users before sync:', existingUsers.length);
    
    // Check if user already exists
    const existingUserIndex = existingUsers.findIndex((u: User) => u.id === user.id);
    
    if (existingUserIndex !== -1) {
      // Update existing user
      existingUsers[existingUserIndex] = user;
      console.log('🔄 Updated existing auth user:', user.name);
    } else {
      // Add new user
      existingUsers.push(user);
      console.log('➕ Added new auth user:', user.name);
    }
    
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(existingUsers));
    console.log('💾 Auth users saved. Total users:', existingUsers.length);
    
    console.log('✅ Staff synced with auth system successfully:', { 
      staff: staff.name, 
      username,
      email: staff.email,
      canLoginWith: ['username', 'email'],
      userId: user.id,
      status: user.status
    });
  } catch (error) {
    console.error('❌ Error syncing staff with auth system:', error);
  }
};

export const getCredentialsByStaffId = (staffId: string): StaffCredentials | null => {
  const credentials = getStoredCredentials();
  return credentials.find(cred => cred.staffId === staffId) || null;
};
