import { useAuth } from '@/contexts/AuthContext';
import { 
  hasModuleAccess, 
  getAccessibleModules, 
  getModulesByCategory,
  ModulePermission 
} from '@/config/moduleAccess';

/**
 * Hook for checking module access permissions
 * Usage: const { canAccess, accessibleModules } = useModuleAccess();
 */
export const useModuleAccess = () => {
  const { user } = useAuth();

  const userRole = user?.role || 'agent';
  const userDepartment = user?.department || '';
  const userPermissions = user?.permissions || [];

  /**
   * Check if current user can access a specific module
   */
  const canAccess = (moduleId: string): boolean => {
    return hasModuleAccess(userRole, userDepartment, userPermissions, moduleId);
  };

  /**
   * Get all modules accessible to current user
   */
  const accessibleModules = getAccessibleModules(userRole, userDepartment, userPermissions);

  /**
   * Get modules by category for current user
   */
  const getAccessibleModulesByCategory = (category: string): ModulePermission[] => {
    return getModulesByCategory(category, userRole, userDepartment, userPermissions);
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasRole = (roles: string | string[]): boolean => {
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes(userRole);
  };

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission) || userPermissions.includes('*');
  };

  /**
   * Check if user belongs to a specific department
   */
  const hasDepartment = (departments: string | string[]): boolean => {
    const deptArray = Array.isArray(departments) ? departments : [departments];
    return deptArray.includes(userDepartment);
  };

  /**
   * Get user role with fallback
   */
  const getUserRole = (): string => userRole;

  /**
   * Get user department with fallback
   */
  const getUserDepartment = (): string => userDepartment;

  /**
   * Get user permissions
   */
  const getUserPermissions = (): string[] => userPermissions;

  return {
    canAccess,
    accessibleModules,
    getAccessibleModulesByCategory,
    hasRole,
    hasPermission,
    hasDepartment,
    getUserRole,
    getUserDepartment,
    getUserPermissions,
    userRole,
    userDepartment,
    userPermissions
  };
};

/**
 * Higher-order component for module access protection
 * Usage: const ProtectedComponent = withModuleAccess(Component, 'module-id');
 */
export const withModuleAccess = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  moduleId: string,
  fallbackComponent?: React.ComponentType
) => {
  return (props: P) => {
    const { canAccess } = useModuleAccess();
    
    if (!canAccess(moduleId)) {
      if (fallbackComponent) {
        return React.createElement(fallbackComponent);
      }
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to access this module.</p>
            <p className="text-sm text-gray-500 mt-2">Contact your administrator for access.</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};