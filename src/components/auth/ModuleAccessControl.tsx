import React from 'react';
import { Navigate } from 'react-router-dom';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Unlock, Shield, AlertTriangle } from 'lucide-react';

/**
 * Enhanced ProtectedRoute component with module access control
 * Usage: <ProtectedModule moduleId="queries">{children}</ProtectedModule>
 */
interface ProtectedModuleProps {
  children: React.ReactNode;
  moduleId: string;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}

export const ProtectedModule: React.FC<ProtectedModuleProps> = ({ 
  children, 
  moduleId, 
  fallback,
  showAccessDenied = true 
}) => {
  const { canAccess } = useModuleAccess();
  const hasAccess = canAccess(moduleId);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showAccessDenied) {
      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardContent className="p-6 text-center">
            <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-lg mb-2">Access Denied</CardTitle>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this module.
            </p>
            <Badge variant="outline" className="text-xs">
              Required: {moduleId}
            </Badge>
          </CardContent>
        </Card>
      );
    }

    return null;
  }

  return <>{children}</>;
};

/**
 * Module access checker component for conditional rendering
 * Usage: <ModuleAccess moduleId="queries" render={({hasAccess}) => hasAccess ? <Component/> : <Alternative/>} />
 */
interface ModuleAccessProps {
  moduleId: string;
  render: (props: { hasAccess: boolean; userRole: string; userPermissions: string[] }) => React.ReactNode;
}

export const ModuleAccess: React.FC<ModuleAccessProps> = ({ moduleId, render }) => {
  const { canAccess, getUserRole, getUserPermissions } = useModuleAccess();
  const hasAccess = canAccess(moduleId);
  const userRole = getUserRole();
  const userPermissions = getUserPermissions();

  return <>{render({ hasAccess, userRole, userPermissions })}</>;
};

/**
 * Module permission badge showing access level
 * Usage: <ModulePermissionBadge moduleId="queries" />
 */
interface ModulePermissionBadgeProps {
  moduleId: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ModulePermissionBadge: React.FC<ModulePermissionBadgeProps> = ({ 
  moduleId, 
  showIcon = true, 
  size = 'md' 
}) => {
  const { canAccess } = useModuleAccess();
  const hasAccess = canAccess(moduleId);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  return (
    <Badge 
      variant={hasAccess ? 'success' : 'destructive'}
      className={sizeClasses[size]}
    >
      {showIcon && (hasAccess ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />)}
      {hasAccess ? 'Access Granted' : 'Access Denied'}
    </Badge>
  );
};

/**
 * Access control alert for modules with restricted access
 * Usage: <AccessControlAlert moduleId="queries" />
 */
interface AccessControlAlertProps {
  moduleId: string;
  type?: 'info' | 'warning' | 'error';
  className?: string;
}

export const AccessControlAlert: React.FC<AccessControlAlertProps> = ({ 
  moduleId, 
  type = 'info', 
  className = '' 
}) => {
  const { canAccess } = useModuleAccess();
  const hasAccess = canAccess(moduleId);

  if (hasAccess) return null;

  const alertConfig = {
    info: {
      icon: Shield,
      title: 'Restricted Access',
      description: 'This module requires special permissions.',
      variant: 'default'
    },
    warning: {
      icon: AlertTriangle,
      title: 'Access Warning',
      description: 'You may not have full access to all features.',
      variant: 'warning'
    },
    error: {
      icon: Lock,
      title: 'Access Denied',
      description: 'You do not have permission to access this module.',
      variant: 'destructive'
    }
  };

  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <Alert variant={config.variant as any} className={className}>
      <Icon className="h-4 w-4" />
      <AlertDescription>
        <strong>{config.title}:</strong> {config.description} 
        <Badge variant="outline" className="ml-2 text-xs">
          Module: {moduleId}
        </Badge>
      </AlertDescription>
    </Alert>
  );
};

/**
 * Example usage in components:
 * 
 * 1. Basic module protection:
 * ```tsx
 * import { ProtectedModule } from '@/components/auth/ModuleAccessControl';
 * 
 * function QueriesPage() {
 *   return (
 *     <ProtectedModule moduleId="queries">
 *       <QueryList />
 *     </ProtectedModule>
 *   );
 * }
 * ```
 * 
 * 2. Conditional rendering based on access:
 * ```tsx
 * import { ModuleAccess } from '@/components/auth/ModuleAccessControl';
 * 
 * function Dashboard() {
 *   return (
 *     <div>
 *       <ModuleAccess 
 *         moduleId="sales-reports" 
 *         render={({hasAccess}) => 
 *           hasAccess ? <SalesReport /> : <BasicReport />
 *         } 
 *       />
 *     </div>
 *   );
 * }
 * ```
 * 
 * 3. Show access status:
 * ```tsx
 * import { ModulePermissionBadge } from '@/components/auth/ModuleAccessControl';
 * 
 * function SettingsPage() {
 *   return (
 *     <div>
 *       <h2>Settings <ModulePermissionBadge moduleId="settings" /></h2>
 *       {/* settings content */}
 *     </div>
 *   );
 * }
 * ```
 * 
 * 4. Show access warnings:
 * ```tsx
 * import { AccessControlAlert } from '@/components/auth/ModuleAccessControl';
 * 
 * function AdminPanel() {
 *   return (
 *     <div>
 *       <AccessControlAlert moduleId="admin-panel" type="warning" />
 *       {/* admin panel content */}
 *     </div>
 *   );
 * }
 * ```
 */

export default {
  ProtectedModule,
  ModuleAccess,
  ModulePermissionBadge,
  AccessControlAlert
};