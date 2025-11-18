// Module Access Control Configuration
// This file defines which roles can access which modules and their specific permissions

export interface ModulePermission {
  moduleId: string;
  moduleName: string;
  category: string;
  requiredRoles: string[];
  requiredPermissions?: string[];
  requiredDepartment?: string[];
  description: string;
}

export interface ModuleAccessConfig {
  modules: ModulePermission[];
  roleHierarchy: { [key: string]: number };
}

export const moduleAccessConfig: ModuleAccessConfig = {
  // Role hierarchy - lower number = higher access level
  roleHierarchy: {
    super_admin: 1,
    manager: 2,
    admin: 3,
    staff: 4,
    agent: 5,
    user: 6
  },

  modules: [
    // Dashboard Modules
    {
      moduleId: 'dashboard',
      moduleName: 'Main Dashboard',
      category: 'Dashboard',
      requiredRoles: ['super_admin', 'manager', 'admin', 'staff', 'agent'],
      description: 'Access to main dashboard'
    },
    {
      moduleId: 'agent-dashboard',
      moduleName: 'Agent Dashboard',
      category: 'Dashboard',
      requiredRoles: ['agent'],
      description: 'Agent-specific dashboard'
    },
    {
      moduleId: 'manager-dashboard',
      moduleName: 'Manager Dashboard',
      category: 'Dashboard',
      requiredRoles: ['super_admin', 'manager'],
      description: 'Management dashboard with team overview'
    },
    {
      moduleId: 'operations-dashboard',
      moduleName: 'Operations Dashboard',
      category: 'Dashboard',
      requiredRoles: ['super_admin', 'manager'],
      requiredDepartment: ['Operations'],
      description: 'Operations department dashboard'
    },
    {
      moduleId: 'sales-dashboard',
      moduleName: 'Sales Dashboard',
      category: 'Dashboard',
      requiredRoles: ['super_admin', 'manager'],
      requiredDepartment: ['Sales'],
      description: 'Sales department dashboard'
    },

    // Query Management Modules
    {
      moduleId: 'queries',
      moduleName: 'Query Management',
      category: 'Queries',
      requiredRoles: ['super_admin', 'manager', 'admin', 'staff', 'agent'],
      description: 'View and manage customer queries'
    },
    {
      moduleId: 'create-query',
      moduleName: 'Create Query',
      category: 'Queries',
      requiredRoles: ['super_admin', 'manager', 'admin', 'staff', 'agent'],
      description: 'Create new customer queries'
    },
    {
      moduleId: 'query-details',
      moduleName: 'Query Details',
      category: 'Queries',
      requiredRoles: ['super_admin', 'manager', 'admin', 'staff', 'agent'],
      description: 'View detailed query information'
    },
    {
      moduleId: 'assign-queries',
      moduleName: 'Assign Queries',
      category: 'Queries',
      requiredRoles: ['super_admin', 'manager', 'admin'],
      description: 'Assign queries to team members'
    },

    // Proposal Modules
    {
      moduleId: 'proposals',
      moduleName: 'Proposal Management',
      category: 'Proposals',
      requiredRoles: ['super_admin', 'manager', 'admin', 'staff', 'agent'],
      description: 'Create and manage travel proposals'
    },
    {
      moduleId: 'advanced-proposal',
      moduleName: 'Advanced Proposal Builder',
      category: 'Proposals',
      requiredRoles: ['super_admin', 'manager', 'admin', 'staff', 'agent'],
      description: 'Advanced proposal creation tools'
    },
    {
      moduleId: 'proposal-builder',
      moduleName: 'Proposal Builder',
      category: 'Proposals',
      requiredRoles: ['super_admin', 'manager', 'admin', 'staff', 'agent'],
      description: 'Basic proposal creation'
    },

    // Booking Modules
    {
      moduleId: 'bookings',
      moduleName: 'Booking Management',
      category: 'Bookings',
      requiredRoles: ['super_admin', 'manager', 'admin', 'staff', 'agent'],
      description: 'Manage customer bookings'
    },
    {
      moduleId: 'itinerary-builder',
      moduleName: 'Itinerary Builder',
      category: 'Bookings',
      requiredRoles: ['super_admin', 'manager', 'admin', 'staff', 'agent'],
      description: 'Create travel itineraries'
    },

    // Inventory Modules
    {
      moduleId: 'inventory',
      moduleName: 'Inventory Management',
      category: 'Inventory',
      requiredRoles: ['super_admin', 'manager', 'admin'],
      description: 'Manage travel inventory'
    },
    {
      moduleId: 'hotels',
      moduleName: 'Hotel Management',
      category: 'Inventory',
      requiredRoles: ['super_admin', 'manager', 'admin'],
      description: 'Manage hotel inventory'
    },
    {
      moduleId: 'transport',
      moduleName: 'Transport Management',
      category: 'Inventory',
      requiredRoles: ['super_admin', 'manager', 'admin'],
      description: 'Manage transport inventory'
    },
    {
      moduleId: 'restaurants',
      moduleName: 'Restaurant Management',
      category: 'Inventory',
      requiredRoles: ['super_admin', 'manager', 'admin'],
      description: 'Manage restaurant inventory'
    },

    // Sales Modules
    {
      moduleId: 'sales-enquiries',
      moduleName: 'Sales Enquiries',
      category: 'Sales',
      requiredRoles: ['super_admin', 'manager'],
      requiredDepartment: ['Sales'],
      description: 'Sales team enquiry management'
    },
    {
      moduleId: 'sales-bookings',
      moduleName: 'Sales Bookings',
      category: 'Sales',
      requiredRoles: ['super_admin', 'manager'],
      requiredDepartment: ['Sales'],
      description: 'Sales team booking management'
    },
    {
      moduleId: 'sales-agents',
      moduleName: 'Sales Agents',
      category: 'Sales',
      requiredRoles: ['super_admin', 'manager'],
      requiredDepartment: ['Sales'],
      description: 'Sales agent management'
    },
    {
      moduleId: 'sales-reports',
      moduleName: 'Sales Reports',
      category: 'Sales',
      requiredRoles: ['super_admin', 'manager'],
      requiredDepartment: ['Sales'],
      description: 'Sales performance reports'
    },

    // Management Modules
    {
      moduleId: 'agent-management',
      moduleName: 'Agent Management',
      category: 'Management',
      requiredRoles: ['super_admin', 'manager', 'admin'],
      description: 'Manage travel agents'
    },
    {
      moduleId: 'staff-management',
      moduleName: 'Staff Management',
      category: 'Management',
      requiredRoles: ['super_admin', 'manager'],
      description: 'Manage staff members'
    },
    {
      moduleId: 'departments',
      moduleName: 'Department Management',
      category: 'Management',
      requiredRoles: ['super_admin', 'manager'],
      description: 'Manage departments'
    },
    {
      moduleId: 'hr-management',
      moduleName: 'HR Management',
      category: 'Management',
      requiredRoles: ['super_admin', 'manager'],
      description: 'Human resources management'
    },

    // HR Sub-modules
    {
      moduleId: 'payroll',
      moduleName: 'Payroll Management',
      category: 'HR',
      requiredRoles: ['super_admin', 'manager'],
      requiredPermissions: ['hr_payroll_access'],
      description: 'Manage employee payroll'
    },
    {
      moduleId: 'leaves',
      moduleName: 'Leave Management',
      category: 'HR',
      requiredRoles: ['super_admin', 'manager'],
      requiredPermissions: ['hr_leaves_access'],
      description: 'Manage employee leaves'
    },
    {
      moduleId: 'attendance',
      moduleName: 'Attendance Management',
      category: 'HR',
      requiredRoles: ['super_admin', 'manager'],
      requiredPermissions: ['hr_attendance_access'],
      description: 'Track employee attendance'
    },
    {
      moduleId: 'salary-structure',
      moduleName: 'Salary Structure',
      category: 'HR',
      requiredRoles: ['super_admin', 'manager'],
      requiredPermissions: ['hr_salary_access'],
      description: 'Manage salary structures'
    },

    // Settings Modules
    {
      moduleId: 'settings',
      moduleName: 'Settings',
      category: 'Settings',
      requiredRoles: ['super_admin', 'manager', 'admin'],
      description: 'General settings access'
    },
    {
      moduleId: 'general-settings',
      moduleName: 'General Settings',
      category: 'Settings',
      requiredRoles: ['super_admin', 'manager', 'admin'],
      description: 'General platform settings'
    },
    {
      moduleId: 'account-settings',
      moduleName: 'Account Settings',
      category: 'Settings',
      requiredRoles: ['super_admin', 'manager', 'admin', 'staff', 'agent'],
      description: 'User account settings'
    },
    {
      moduleId: 'api-settings',
      moduleName: 'API Settings',
      category: 'Settings',
      requiredRoles: ['super_admin', 'manager'],
      description: 'API integration settings'
    },
    {
      moduleId: 'access-control',
      moduleName: 'Access Control',
      category: 'Settings',
      requiredRoles: ['super_admin', 'manager'],
      description: 'Manage user roles and permissions'
    },
    {
      moduleId: 'pricing-settings',
      moduleName: 'Pricing Settings',
      category: 'Settings',
      requiredRoles: ['super_admin', 'manager'],
      description: 'Manage pricing configurations'
    },
    {
      moduleId: 'email-templates',
      moduleName: 'Email Templates',
      category: 'Settings',
      requiredRoles: ['super_admin', 'manager', 'admin'],
      description: 'Manage email templates'
    },
    {
      moduleId: 'sms-settings',
      moduleName: 'SMS Settings',
      category: 'Settings',
      requiredRoles: ['super_admin', 'manager'],
      description: 'SMS and OTP settings'
    },
    {
      moduleId: 'language-manager',
      moduleName: 'Language Manager',
      category: 'Settings',
      requiredRoles: ['super_admin', 'manager'],
      description: 'Manage platform languages'
    },
    {
      moduleId: 'translation-tool',
      moduleName: 'Translation Tool',
      category: 'Settings',
      requiredRoles: ['super_admin', 'manager'],
      description: 'Manage translations'
    },

    // Reports Modules
    {
      moduleId: 'reports',
      moduleName: 'Reports',
      category: 'Reports',
      requiredRoles: ['super_admin', 'manager', 'admin'],
      description: 'Access to reports'
    },
    {
      moduleId: 'universal-reports',
      moduleName: 'Universal Reports',
      category: 'Reports',
      requiredRoles: ['super_admin', 'manager'],
      description: 'Generate custom reports'
    },

    // Communication Modules
    {
      moduleId: 'email-communications',
      moduleName: 'Email Communications',
      category: 'Communications',
      requiredRoles: ['super_admin', 'manager', 'admin'],
      description: 'Marketing email communications'
    },
    {
      moduleId: 'followups',
      moduleName: 'Follow-ups',
      category: 'Communications',
      requiredRoles: ['super_admin', 'manager', 'admin', 'staff', 'agent'],
      description: 'Customer follow-up management'
    },

    // Traveler Modules (Customer Portal)
    {
      moduleId: 'traveler-portal',
      moduleName: 'Traveler Portal',
      category: 'Traveler',
      requiredRoles: ['user'],
      description: 'Customer/traveler portal access'
    },
    {
      moduleId: 'traveler-dashboard',
      moduleName: 'Traveler Dashboard',
      category: 'Traveler',
      requiredRoles: ['user'],
      description: 'Customer dashboard'
    },
    {
      moduleId: 'traveler-itinerary',
      moduleName: 'Traveler Itinerary',
      category: 'Traveler',
      requiredRoles: ['user'],
      description: 'Customer itinerary access'
    },
    {
      moduleId: 'traveler-history',
      moduleName: 'Traveler History',
      category: 'Traveler',
      requiredRoles: ['user'],
      description: 'Customer booking history'
    },

    // AI Assistant Module
    {
      moduleId: 'ai-assistant',
      moduleName: 'AI Assistant',
      category: 'AI & Automation',
      requiredRoles: ['super_admin', 'manager', 'admin', 'staff', 'agent'],
      description: 'Access to AI chat assistant'
    },
    {
      moduleId: 'ai-settings',
      moduleName: 'AI Settings',
      category: 'AI & Automation',
      requiredRoles: ['super_admin', 'manager'],
      description: 'Configure AI providers and settings'
    }
  ]
};

// Helper functions for access control
export const hasModuleAccess = (
  userRole: string,
  userDepartment: string,
  userPermissions: string[],
  moduleId: string
): boolean => {
  const module = moduleAccessConfig.modules.find(m => m.moduleId === moduleId);
  if (!module) return false;

  // Check role hierarchy
  const userRoleLevel = moduleAccessConfig.roleHierarchy[userRole] || 999;
  const requiredRoleLevels = module.requiredRoles.map(role => moduleAccessConfig.roleHierarchy[role] || 999);
  const minRequiredLevel = Math.min(...requiredRoleLevels);

  if (userRoleLevel > minRequiredLevel) return false;

  // Check specific permissions if required
  if (module.requiredPermissions) {
    const hasPermission = module.requiredPermissions.some(permission => 
      userPermissions.includes(permission) || userPermissions.includes('*')
    );
    if (!hasPermission) return false;
  }

  // Check department restrictions if required
  if (module.requiredDepartment) {
    if (!module.requiredDepartment.includes(userDepartment)) return false;
  }

  return true;
};

export const getAccessibleModules = (
  userRole: string,
  userDepartment: string,
  userPermissions: string[]
): ModulePermission[] => {
  return moduleAccessConfig.modules.filter(module => 
    hasModuleAccess(userRole, userDepartment, userPermissions, module.moduleId)
  );
};

export const getModulesByCategory = (
  category: string,
  userRole: string,
  userDepartment: string,
  userPermissions: string[]
): ModulePermission[] => {
  return moduleAccessConfig.modules.filter(module => 
    module.category === category && 
    hasModuleAccess(userRole, userDepartment, userPermissions, module.moduleId)
  );
};

export const getModuleCategories = (): string[] => {
  const categories = [...new Set(moduleAccessConfig.modules.map(m => m.category))];
  return categories.sort();
};