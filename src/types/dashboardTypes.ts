
export type DashboardType = 
  | 'operations' 
  | 'sales' 
  | 'content' 
  | 'support' 
  | 'finance';

export interface DashboardPermission {
  id: string;
  name: string;
  description: string;
  dashboardType: DashboardType;
  module: string;
  defaultRoles: string[];
  allowedDepartments?: string[];
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: string;
  permissions: string[];
  data?: any;
}

export interface DashboardConfig {
  type: DashboardType;
  title: string;
  description: string;
  widgets: DashboardWidget[];
  requiredRole: string[];
  requiredDepartment?: string[];
}

export interface DashboardAccessControl {
  dashboardId: string;
  allowedRoles: string[];
  allowedDepartments: string[];
  restrictByDepartment: boolean;
}
