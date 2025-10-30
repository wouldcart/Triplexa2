
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: string;
  requiredDepartment?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  requiredPermission,
  requiredDepartment
}) => {
  const { user: currentUser, loading } = useAuth();

  // Helper function to check permissions
  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    
    // Super admin has all permissions
    if (currentUser.role === 'super_admin') return true;
    
    // Check if user has the specific permission
    return currentUser.permissions?.includes(permission) || 
           currentUser.permissions?.includes('*') || 
           false;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If user is not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirement with precise hierarchy
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    const isAdminRoute = allowedRoles.includes('admin');
    const isManagerRoute = allowedRoles.includes('manager');
    const isSuperAdminRoute = allowedRoles.includes('super_admin');

    const role = currentUser.role;

    const hasAccess = (
      // Super admin can access any route listing super_admin or admin or manager
      (role === 'super_admin' && (isSuperAdminRoute || isAdminRoute || isManagerRoute)) ||
      // Admin can access routes that list admin
      (role === 'admin' && isAdminRoute) ||
      // Manager can access routes that list manager
      (role === 'manager' && isManagerRoute) ||
      // Direct match fallback
      allowedRoles.includes(role)
    );

    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check department requirement with dashboard access configuration
  if (requiredDepartment && currentUser.role === 'staff') {
    // Get saved dashboard access configuration
    const savedDashboardAccess = localStorage.getItem('dashboard_access_config');
    let dashboardAccessConfig = [];
    
    if (savedDashboardAccess) {
      try {
        dashboardAccessConfig = JSON.parse(savedDashboardAccess);
      } catch (error) {
        console.error('Error parsing dashboard access config:', error);
      }
    }
    
    // Find matching dashboard configuration
    const dashboardConfig = dashboardAccessConfig.find((config: any) => 
      config.allowedDepartments?.includes(requiredDepartment)
    );
    
    if (dashboardConfig && dashboardConfig.restrictByDepartment) {
      // Check if user's department matches required department
      if (currentUser.department !== requiredDepartment) {
        return <Navigate to="/unauthorized" replace />;
      }
    } else {
      // Fallback to original logic
      if (currentUser.department !== requiredDepartment) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
