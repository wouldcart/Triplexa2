
/**
 * Test User Credentials for Tripoex Application
 * 
 * This file contains all test user login credentials organized by role and department
 * for comprehensive testing of the application's functionality.
 */

export interface TestCredential {
  username: string;
  password: string;
  name: string;
  role: string;
  department: string;
  description: string;
  testScenarios: string[];
}

export const testCredentials: TestCredential[] = [
  // ADMINISTRATIVE USERS
  {
    username: 'superadmin',
    password: 'super123',
    name: 'Super Administrator',
    role: 'super_admin',
    department: 'Administration',
    description: 'Full system access - all modules and administrative functions',
    testScenarios: [
      'Complete system administration',
      'User management across all roles',
      'System settings and configuration',
      'All module access and permissions',
      'Data import/export functionality'
    ]
  },
  {
    username: 'manager',
    password: 'manager123',
    name: 'John Manager',
    role: 'manager',
    department: 'Operations',
    description: 'Management level access with team oversight capabilities',
    testScenarios: [
      'Team management and supervision',
      'Booking and inventory management',
      'Staff performance monitoring',
      'Query assignment and workflow',
      'Operational reporting and analytics'
    ]
  },
  {
    username: 'hr_manager',
    password: 'hr123',
    name: 'HR Manager',
    role: 'hr_manager',
    department: 'Human Resources',
    description: 'Human resources management with staff and payroll access',
    testScenarios: [
      'Staff management and profiles',
      'Attendance and leave management',
      'Payroll processing and salary structures',
      'HR analytics and reporting',
      'Employee onboarding/offboarding'
    ]
  },

  // FINANCIAL USERS
  {
    username: 'finance_manager',
    password: 'finance123',
    name: 'Finance Manager',
    role: 'finance_manager',
    department: 'Finance',
    description: 'Financial management with billing and commission tracking',
    testScenarios: [
      'Financial reporting and analytics',
      'Commission management and tracking',
      'Budget management and control',
      'Billing and payment processing',
      'Financial compliance monitoring'
    ]
  },

  // SALES TEAM USERS
  {
    username: 'staff_sales',
    password: 'staff123',
    name: 'Sarah Sales',
    role: 'staff',
    department: 'Sales',
    description: 'Senior sales executive with full sales module access',
    testScenarios: [
      'Query creation and management',
      'Proposal creation and sending',
      'Booking management and processing',
      'Customer relationship management',
      'Sales performance tracking'
    ]
  },
  {
    username: 'junior_sales',
    password: 'junior123',
    name: 'Junior Sales Staff',
    role: 'staff',
    department: 'Sales',
    description: 'Junior sales executive with limited permissions',
    testScenarios: [
      'Basic query handling and creation',
      'Limited booking view access',
      'Learning and development features',
      'Supervised sales activities',
      'Performance improvement tracking'
    ]
  },
  {
    username: 'field_sales',
    password: 'field123',
    name: 'Field Sales Executive',
    role: 'staff',
    department: 'Field Sales',
    description: 'Field sales with agent acquisition and territory management',
    testScenarios: [
      'Lead generation and management',
      'Agent acquisition and onboarding',
      'Territory management and planning',
      'Relationship building with agents',
      'Field sales reporting and analytics'
    ]
  },

  // OPERATIONS TEAM USERS
  {
    username: 'ops_staff',
    password: 'ops123',
    name: 'Operations Staff',
    role: 'staff',
    department: 'Operations',
    description: 'Operations executive with booking and service delivery focus',
    testScenarios: [
      'Booking management and coordination',
      'Vendor coordination and management',
      'Service delivery and quality control',
      'Inventory management support',
      'Operational efficiency monitoring'
    ]
  },

  // SUPPORT TEAM USERS
  {
    username: 'support_agent',
    password: 'support123',
    name: 'Customer Support Agent',
    role: 'staff',
    department: 'Customer Support',
    description: 'Customer support with agent management and ticket handling',
    testScenarios: [
      'Agent support and communication',
      'Ticket management and resolution',
      'Customer service excellence',
      'CRM management and updates',
      'Support analytics and reporting'
    ]
  },

  // MARKETING TEAM USERS
  {
    username: 'staff_marketing',
    password: 'staff123',
    name: 'Mike Marketing',
    role: 'staff',
    department: 'Marketing',
    description: 'Marketing specialist with limited system access',
    testScenarios: [
      'Marketing content management',
      'Analytics and reporting view',
      'Inventory viewing for marketing',
      'Limited query access',
      'Campaign performance tracking'
    ]
  },

  // AGENT USERS
  {
    username: 'agent_company',
    password: 'agent123',
    name: 'Dream Tours Agency',
    role: 'agent',
    department: 'External',
    description: 'Standard travel agent with booking and query creation access',
    testScenarios: [
      'Query creation and management',
      'Booking creation and processing',
      'Customer management',
      'Commission tracking',
      'Agent performance monitoring'
    ]
  },
  {
    username: 'premium_agent',
    password: 'premium123',
    name: 'Premium Travel Agency',
    role: 'agent',
    department: 'External',
    description: 'Premium agent with enhanced features and flat commission structure',
    testScenarios: [
      'Premium service features',
      'High-value booking management',
      'VIP customer handling',
      'Enhanced commission structure',
      'Luxury travel specialization'
    ]
  },

  // GENERAL USERS
  {
    username: 'user',
    password: 'user123',
    name: 'Regular User',
    role: 'user',
    department: 'General',
    description: 'Basic user with minimal system access',
    testScenarios: [
      'Limited query viewing',
      'Basic system navigation',
      'Profile management',
      'Restricted access testing',
      'User experience evaluation'
    ]
  },

  // INACTIVE/SPECIAL USERS
  {
    username: 'inactive_user',
    password: 'inactive123',
    name: 'Inactive User',
    role: 'staff',
    department: 'Sales',
    description: 'Inactive user for testing access restrictions and security',
    testScenarios: [
      'Access restriction testing',
      'Inactive user handling',
      'Security compliance',
      'Login attempt monitoring',
      'Account reactivation process'
    ]
  }
];

// Helper functions for test credentials
export const getCredentialsByRole = (role: string): TestCredential[] => {
  return testCredentials.filter(cred => cred.role === role);
};

export const getCredentialsByDepartment = (department: string): TestCredential[] => {
  return testCredentials.filter(cred => cred.department === department);
};

export const getAllTestCredentials = (): TestCredential[] => {
  return testCredentials;
};

// Quick reference for developers
export const quickTestAccess = {
  admin: { username: 'superadmin', password: 'super123' },
  manager: { username: 'manager', password: 'manager123' },
  sales: { username: 'staff_sales', password: 'staff123' },
  agent: { username: 'agent_company', password: 'agent123' },
  hr: { username: 'hr_manager', password: 'hr123' },
  finance: { username: 'finance_manager', password: 'finance123' },
  support: { username: 'support_agent', password: 'support123' },
  operations: { username: 'ops_staff', password: 'ops123' },
  inactive: { username: 'inactive_user', password: 'inactive123' }
};

// Test scenarios by functionality
export const testScenariosByModule = {
  userManagement: ['superadmin', 'hr_manager', 'manager'],
  agentManagement: ['superadmin', 'manager', 'support_agent', 'field_sales'],
  queryManagement: ['superadmin', 'manager', 'staff_sales', 'junior_sales', 'agent_company', 'premium_agent'],
  bookingManagement: ['superadmin', 'manager', 'staff_sales', 'ops_staff', 'agent_company', 'premium_agent'],
  inventoryManagement: ['superadmin', 'manager', 'ops_staff'],
  financialManagement: ['superadmin', 'finance_manager', 'manager'],
  hrManagement: ['superadmin', 'hr_manager'],
  reporting: ['superadmin', 'manager', 'finance_manager', 'hr_manager'],
  systemSettings: ['superadmin'],
  customerSupport: ['superadmin', 'manager', 'support_agent']
};
