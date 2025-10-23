
import { useApp } from "@/contexts/AppContext";

export function useAccessControl() {
  const { currentUser, hasPermission } = useApp();
  
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isManager = currentUser?.role === 'manager';
  const isStaff = currentUser?.role === 'staff';
  const isAgent = currentUser?.role === 'agent';
  const isUser = currentUser?.role === 'user';
  
  // Super admin and manager have identical access to all modules
  const isAdmin = isSuperAdmin || isManager;
  
  // Managers now have the same permissions as super admins
  const hasAdminAccess = isSuperAdmin || isManager;
  
  const canAccessModule = (module: string): boolean => {
    if (!currentUser) return false;
    
    // Super admin and manager have identical access to all modules
    if (hasAdminAccess) return true;
    
    // Staff can now access agents module with full CRUD permissions
    if (module === 'agents' && isStaff) return true;
    
    // Get saved dashboard access configuration from localStorage (in real app, this would come from API)
    const savedDashboardAccess = localStorage.getItem('dashboard_access_config');
    let dashboardAccessConfig = [];
    
    if (savedDashboardAccess) {
      try {
        dashboardAccessConfig = JSON.parse(savedDashboardAccess);
      } catch (error) {
        console.error('Error parsing dashboard access config:', error);
      }
    }
    
    // Check dashboard-specific access
    const dashboardConfig = dashboardAccessConfig.find((config: any) => config.dashboardId === module);
    if (dashboardConfig) {
      // Check role access
      if (!dashboardConfig.allowedRoles.includes(currentUser.role)) {
        return false;
      }
      
      // Check department access if restrictions are enabled
      if (dashboardConfig.restrictByDepartment && currentUser.role === 'staff') {
        if (!currentUser.department || !dashboardConfig.allowedDepartments.includes(currentUser.department)) {
          return false;
        }
      }
      
      return true;
    }
    
    // Module-specific access control based on user permissions and department
    const modulePermissions: Record<string, string[]> = {
      'hr-dashboard': ['staff.manage', 'hr.view'],
      'staff-management': ['staff.view', 'staff.manage'],
      'payroll': ['payroll.view', 'payroll.manage'],
      'attendance': ['attendance.view', 'staff.view'],
      'leave-management': ['leave.manage', 'staff.manage'],
      'salary-structure': ['payroll.manage', 'finance.manage'],
      'queries': ['queries.view'],
      'bookings': ['bookings.view'],
      'inventory': ['inventory.view'],
      'agents': ['agents.view', 'staff.manage', 'agents.create', 'agents.edit', 'agents.delete'], // Enhanced agent permissions for staff
      'reports': ['reports.view'],
      'settings': ['settings.view'],
      'access-control': ['settings.access'],
      'language-settings': ['settings.languages'],
      'api-settings': ['settings.api'],
      'query-assignment': ['queries.assign', 'staff.manage'],
      'proposal-management': ['queries.edit', 'proposals.manage'],
      'bulk-operations': ['admin.bulk'],
      // dashboard permissions with fallback logic
      'operations-dashboard': ['dashboard.operations', 'bookings.view'],
      'sales-dashboard': ['dashboard.sales', 'queries.view'],
      'content-dashboard': ['dashboard.content', 'inventory.view'],
      'support-dashboard': ['dashboard.support', 'tickets.view'],
      'finance-dashboard': ['dashboard.finance', 'finance.view']
    };
    
    const requiredPermissions = modulePermissions[module] || [];
    
    // For staff users, also check department-specific access (fallback when no dashboard config)
    if (isStaff && currentUser.department && !dashboardConfig) {
      const departmentDashboards: Record<string, string[]> = {
        'Operations': ['operations-dashboard'],
        'Sales': ['sales-dashboard'],
        'Marketing': ['content-dashboard'],
        'Customer Support': ['support-dashboard'],
        'Support': ['support-dashboard'],
        'Finance': ['finance-dashboard']
      };
      
      const allowedDashboards = departmentDashboards[currentUser.department] || [];
      if (allowedDashboards.includes(module)) {
        return true;
      }
    }
    
    return requiredPermissions.some(permission => hasPermission(permission));
  };

  // Department-specific access for staff
  const canAccessDepartmentFeature = (feature: string): boolean => {
    if (!currentUser || !isStaff) return false;
    if (hasAdminAccess) return true;

    const department = currentUser.department;
    if (!department) return false;

    const departmentFeatures: Record<string, string[]> = {
      "Sales": [
        "customer-management", "query-handling", "booking-creation",
        "sales-reports", "commission-tracking", "agent-management" // Added agent management for sales
      ],
      "Marketing": [
        "package-creation", "content-management", "campaign-management",
        "marketing-reports", "social-media"
      ],
      "Operations": [
        "inventory-management", "supplier-management", "logistics",
        "operations-reports", "quality-control"
      ],
      "HR": [
        "employee-management", "payroll", "attendance", "leave-management",
        "performance-tracking", "recruitment"
      ],
      "Finance": [
        "financial-reports", "budget-management", "invoice-management",
        "payment-processing", "audit-trails"
      ],
      "Field Sales": [
        "agent-acquisition", "lead-generation", "territory-management",
        "agent-management", "commission-tracking" // Added agent management for field sales
      ],
      "Customer Support": [
        "agent-support", "ticket-management", "communication",
        "agent-management" // Added agent management for support
      ]
    };

    const allowedFeatures = departmentFeatures[department] || [];
    return allowedFeatures.includes(feature);
  };

  // Check if user can perform specific action - managers have same access as super admins
  const canPerformAction = (action: string, context?: string): boolean => {
    if (!currentUser) return false;
    if (hasAdminAccess) return true; // Both super admin and manager

    // Staff can only edit their own profile
    if (action === 'edit-profile' && context) {
      return context === currentUser.id;
    }

    // Agent can only view their own data
    if (isAgent && action.includes('view') && context) {
      return context === currentUser.id;
    }

    return hasPermission(action);
  };

  // Enhanced agent-specific access control methods for staff users
  const canManageAgent = (agentId: number, action: 'view' | 'edit' | 'delete' | 'assign'): boolean => {
    if (!currentUser) return false;
    
    // Admin users have full access
    if (hasAdminAccess) return true;
    
    // Staff users have enhanced permissions for agent management
    if (isStaff) {
      // Check if staff created this agent or is assigned to it
      const agents = JSON.parse(localStorage.getItem('agents') || '[]');
      const agent = agents.find((a: any) => a.id === agentId);
      
      if (!agent) return false;
      
      const isCreator = agent.createdBy?.staffId === parseInt(currentUser.id);
      const isAssigned = agent.staffAssignments?.some((assignment: any) => 
        assignment.staffId === parseInt(currentUser.id)
      );
      
      // Staff can perform most actions on agents they created or are assigned to
      if (isCreator || isAssigned) {
        switch (action) {
          case 'view':
            return true; // Staff can view any agent they created or are assigned to
          case 'edit':
            return true; // Staff can edit agents they created or are assigned to
          case 'delete':
            return isCreator && hasPermission('agents.delete.own'); // Only creator can delete
          case 'assign':
            return isCreator && hasPermission('agents.assign.staff'); // Only creator can assign staff
          default:
            return false;
        }
      }
      
      // Additional check for department-specific access
      if (canAccessDepartmentFeature('agent-management')) {
        return action === 'view' || action === 'edit'; // Department-based access for view/edit
      }
    }
    
    return false;
  };

  const getAccessibleAgents = (allAgents: any[]): any[] => {
    if (!currentUser) return [];
    
    // Admin users see all agents
    if (hasAdminAccess) return allAgents;
    
    // Staff users see agents they created, are assigned to, or have department access to
    if (isStaff) {
      return allAgents.filter(agent => {
        const isCreator = agent.createdBy?.staffId === parseInt(currentUser.id);
        const isAssigned = agent.staffAssignments?.some((assignment: any) => 
          assignment.staffId === parseInt(currentUser.id)
        );
        
        // Allow access if creator, assigned, or has department-level access
        return isCreator || isAssigned || canAccessDepartmentFeature('agent-management');
      });
    }
    
    return [];
  };

  const canCreateAgent = (): boolean => {
    if (!currentUser) return false;
    // Staff users can now create agents
    return hasAdminAccess || (isStaff && (hasPermission('agents.create') || canAccessDepartmentFeature('agent-management')));
  };

  // Enhanced staff capabilities for agent management
  const staffAgentCapabilities = {
    canCreateAgent: canCreateAgent(),
    canViewAgents: isStaff && (canAccessModule('agents') || canAccessDepartmentFeature('agent-management')),
    canEditAgents: isStaff && (hasPermission('agents.edit') || canAccessDepartmentFeature('agent-management')),
    canDeleteOwnAgents: isStaff && hasPermission('agents.delete.own'),
    canAssignStaff: isStaff && hasPermission('agents.assign.staff'),
    canResetPasswords: isStaff && hasPermission('agents.reset.password'),
    canTrackActivity: isStaff && hasPermission('agents.track.activity'),
    defaultActiveStatus: isStaff // Staff-created agents default to active
  };

  // Manager-specific capabilities (same as super admin)
  const managerCapabilities = {
    canAssignQueries: hasAdminAccess,
    canApproveProposals: hasAdminAccess,
    canManageStaff: hasAdminAccess,
    canViewReports: hasAdminAccess,
    canAccessSettings: hasAdminAccess,
    canBulkOperations: hasAdminAccess,
    canManageAgents: hasAdminAccess,
    canAccessFinancials: hasAdminAccess
  };

  return {
    isSuperAdmin,
    isManager,
    isStaff,
    isAgent,
    isUser,
    isAdmin,
    hasAdminAccess,
    hasPermission,
    canAccessModule,
    canAccessDepartmentFeature,
    canPerformAction,
    managerCapabilities,
    staffAgentCapabilities,
    currentUserRole: currentUser?.role || 'guest',
    currentUserDepartment: currentUser?.department,
    // Enhanced agent-specific methods
    canManageAgent,
    getAccessibleAgents,
    canCreateAgent
  };
}
