import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useApp } from '@/contexts/AppContext';
import { 
  Shield, Users, Settings, Globe, Search, 
  AlertTriangle, CheckCircle, Save, Undo,
  Eye, EyeOff, Lock, Unlock, BarChart3
} from 'lucide-react';
import { DashboardAccessControl } from '@/types/dashboardTypes';

// Define types for permissions
interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultRoles: string[];
  isSystemCritical?: boolean;
}

interface RolePermissions {
  [role: string]: string[];
}

const AccessControl: React.FC = () => {
  const { currentUser } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('roles');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({
    super_admin: [],
    manager: [],
    staff: [],
    agent: [],
  });

  // Dashboard access control state
  const [dashboardAccess, setDashboardAccess] = useState<DashboardAccessControl[]>([
    {
      dashboardId: 'operations-dashboard',
      allowedRoles: ['super_admin', 'manager'],
      allowedDepartments: ['Operations'],
      restrictByDepartment: true
    },
    {
      dashboardId: 'sales-dashboard',
      allowedRoles: ['super_admin', 'manager'],
      allowedDepartments: ['Sales'],
      restrictByDepartment: true
    },
    {
      dashboardId: 'content-dashboard',
      allowedRoles: ['super_admin', 'manager'],
      allowedDepartments: ['Marketing'],
      restrictByDepartment: true
    },
    {
      dashboardId: 'support-dashboard',
      allowedRoles: ['super_admin', 'manager'],
      allowedDepartments: ['Customer Support'],
      restrictByDepartment: true
    },
    {
      dashboardId: 'finance-dashboard',
      allowedRoles: ['super_admin', 'manager'],
      allowedDepartments: ['Finance'],
      restrictByDepartment: true
    }
  ]);

  // Check if the current user has admin privileges (super_admin or manager)
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'manager';
  
  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Access denied",
        description: "You don't have permission to access this section",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [isAdmin, navigate, toast]);

  // Define available permissions grouped by category
  const allPermissions: Permission[] = [
    // Inventory permissions
    { id: 'inventory.hotels.view', name: 'View Hotels', description: 'Can view hotel listings', category: 'inventory', defaultRoles: ['super_admin', 'manager', 'staff'] },
    { id: 'inventory.hotels.create', name: 'Create Hotels', description: 'Can add new hotels', category: 'inventory', defaultRoles: ['super_admin', 'manager'] },
    { id: 'inventory.hotels.edit', name: 'Edit Hotels', description: 'Can modify hotel information', category: 'inventory', defaultRoles: ['super_admin', 'manager'] },
    { id: 'inventory.hotels.delete', name: 'Delete Hotels', description: 'Can remove hotels', category: 'inventory', defaultRoles: ['super_admin'], isSystemCritical: true },
    { id: 'inventory.packages.view', name: 'View Packages', description: 'Can view travel packages', category: 'inventory', defaultRoles: ['super_admin', 'manager', 'staff', 'agent'] },
    { id: 'inventory.packages.manage', name: 'Manage Packages', description: 'Can add, edit, and delete travel packages', category: 'inventory', defaultRoles: ['super_admin', 'manager'] },
    
    // Queries permissions
    { id: 'queries.view', name: 'View Queries', description: 'Can view customer queries', category: 'queries', defaultRoles: ['super_admin', 'manager', 'staff'] },
    { id: 'queries.create', name: 'Create Queries', description: 'Can create new queries', category: 'queries', defaultRoles: ['super_admin', 'manager', 'staff'] },
    { id: 'queries.assign', name: 'Assign Queries', description: 'Can assign queries to staff', category: 'queries', defaultRoles: ['super_admin', 'manager'] },
    { id: 'queries.resolve', name: 'Resolve Queries', description: 'Can mark queries as resolved', category: 'queries', defaultRoles: ['super_admin', 'manager', 'staff'] },
    
    // Agent permissions
    { id: 'agents.view', name: 'View All Agents', description: 'Can view all agents in the system', category: 'agents', defaultRoles: ['super_admin', 'manager'] },
    { id: 'agents.view.own', name: 'View Own Agents', description: 'Can view agents they created or are assigned to', category: 'agents', defaultRoles: ['staff'] },
    { id: 'agents.create', name: 'Create Agents', description: 'Can create new agents', category: 'agents', defaultRoles: ['super_admin', 'manager', 'staff'] },
    { id: 'agents.edit.own', name: 'Edit Own Agents', description: 'Can edit agents they created or are assigned to', category: 'agents', defaultRoles: ['staff'] },
    { id: 'agents.delete.own', name: 'Delete Own Agents', description: 'Can delete agents they created', category: 'agents', defaultRoles: ['staff'] },
    { id: 'agents.assign.staff', name: 'Assign Staff to Agents', description: 'Can assign other staff members to agents', category: 'agents', defaultRoles: ['super_admin', 'manager', 'staff'] },
    { id: 'agents.manage.all', name: 'Manage All Agents', description: 'Full management access to all agents', category: 'agents', defaultRoles: ['super_admin', 'manager'], isSystemCritical: true },
    
    // Settings permissions
    { id: 'settings.general', name: 'General Settings', description: 'Can modify general settings', category: 'settings', defaultRoles: ['super_admin'], isSystemCritical: true },
    { id: 'settings.access', name: 'Access Control', description: 'Can manage user permissions', category: 'settings', defaultRoles: ['super_admin'], isSystemCritical: true },
    { id: 'settings.languages', name: 'Language Settings', description: 'Can manage languages', category: 'settings', defaultRoles: ['super_admin'] },
    
    // Users permissions
    { id: 'users.view', name: 'View Users', description: 'Can view user list', category: 'users', defaultRoles: ['super_admin', 'manager'] },
    { id: 'users.create', name: 'Create Users', description: 'Can add new users', category: 'users', defaultRoles: ['super_admin'], isSystemCritical: true },
    { id: 'users.edit', name: 'Edit Users', description: 'Can modify user profiles', category: 'users', defaultRoles: ['super_admin'] },
    { id: 'users.delete', name: 'Delete Users', description: 'Can remove users', category: 'users', defaultRoles: ['super_admin'], isSystemCritical: true },
    
    // Dashboard permissions with enhanced descriptions
    { id: 'operations-dashboard', name: 'Operations Dashboard', description: 'Full access to operations executive dashboard', category: 'dashboards', defaultRoles: ['super_admin', 'manager'] },
    { id: 'sales-dashboard', name: 'Sales Dashboard', description: 'Full access to sales executive dashboard', category: 'dashboards', defaultRoles: ['super_admin', 'manager'] },
    { id: 'content-dashboard', name: 'Content Dashboard', description: 'Full access to package & content manager dashboard', category: 'dashboards', defaultRoles: ['super_admin', 'manager'] },
    { id: 'support-dashboard', name: 'Support Dashboard', description: 'Full access to customer support dashboard', category: 'dashboards', defaultRoles: ['super_admin', 'manager'] },
    { id: 'finance-dashboard', name: 'Finance Dashboard', description: 'Full access to finance & accounts dashboard', category: 'dashboards', defaultRoles: ['super_admin', 'manager'] },
  ];

  const categories = [
    { id: 'all', name: 'All Categories', icon: Settings },
    { id: 'inventory', name: 'Inventory', icon: Globe },
    { id: 'queries', name: 'Queries', icon: Users },
    { id: 'agents', name: 'Agents', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'dashboards', name: 'Dashboards', icon: Shield },
  ];

  const roles = [
    { id: 'super_admin', name: 'Super Admin', color: 'bg-red-100 text-red-800' },
    { id: 'manager', name: 'Manager', color: 'bg-blue-100 text-blue-800' },
    { id: 'staff', name: 'Staff', color: 'bg-green-100 text-green-800' },
    { id: 'agent', name: 'Agent', color: 'bg-purple-100 text-purple-800' },
  ];

  const departments = [
    'Operations', 'Sales', 'Marketing', 'Customer Support', 'Finance', 'HR'
  ];

  const dashboards = [
    { id: 'operations-dashboard', name: 'Operations Dashboard', description: 'Manage bookings, inventory, and operations' },
    { id: 'sales-dashboard', name: 'Sales Dashboard', description: 'Track sales metrics and customer queries' },
    { id: 'content-dashboard', name: 'Content Dashboard', description: 'Manage packages and marketing content' },
    { id: 'support-dashboard', name: 'Support Dashboard', description: 'Handle customer support and tickets' },
    { id: 'finance-dashboard', name: 'Finance Dashboard', description: 'Monitor financial reports and accounting' }
  ];

  // Filter permissions based on search and category
  const filteredPermissions = allPermissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || permission.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Initialize permissions on component mount
  useEffect(() => {
    const initialRolePermissions: RolePermissions = {
      super_admin: [], 
      manager: [],
      staff: [],
      agent: []
    };
    
    // Populate with default permissions
    allPermissions.forEach(permission => {
      permission.defaultRoles.forEach(role => {
        if (initialRolePermissions[role]) {
          initialRolePermissions[role].push(permission.id);
        }
      });
    });
    
    setRolePermissions(initialRolePermissions);
  }, []);

  // Toggle permission for a role
  const togglePermission = (role: string, permissionId: string) => {
    setRolePermissions(prev => {
      const updatedPermissions = { ...prev };
      
      if (updatedPermissions[role].includes(permissionId)) {
        updatedPermissions[role] = updatedPermissions[role].filter(id => id !== permissionId);
      } else {
        updatedPermissions[role] = [...updatedPermissions[role], permissionId];
      }
      
      return updatedPermissions;
    });
    
    setHasUnsavedChanges(true);
  };

  // Toggle dashboard role access
  const toggleDashboardRoleAccess = (dashboardId: string, role: string) => {
    setDashboardAccess(prev => {
      const updated = prev.map(dashboard => {
        if (dashboard.dashboardId === dashboardId) {
          const allowedRoles = dashboard.allowedRoles.includes(role)
            ? dashboard.allowedRoles.filter(r => r !== role)
            : [...dashboard.allowedRoles, role];
          return { ...dashboard, allowedRoles };
        }
        return dashboard;
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Toggle dashboard department access
  const toggleDashboardDepartmentAccess = (dashboardId: string, department: string) => {
    setDashboardAccess(prev => {
      const updated = prev.map(dashboard => {
        if (dashboard.dashboardId === dashboardId) {
          const allowedDepartments = dashboard.allowedDepartments.includes(department)
            ? dashboard.allowedDepartments.filter(d => d !== department)
            : [...dashboard.allowedDepartments, department];
          return { ...dashboard, allowedDepartments };
        }
        return dashboard;
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Toggle department restriction
  const toggleDepartmentRestriction = (dashboardId: string) => {
    setDashboardAccess(prev => {
      const updated = prev.map(dashboard => {
        if (dashboard.dashboardId === dashboardId) {
          return { ...dashboard, restrictByDepartment: !dashboard.restrictByDepartment };
        }
        return dashboard;
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Save permissions
  const savePermissions = () => {
    // In a real implementation, you would send this to an API
    console.log('Saving permissions:', rolePermissions);
    console.log('Saving dashboard access:', dashboardAccess);
    
    // Save to localStorage for persistence
    localStorage.setItem('role_permissions', JSON.stringify(rolePermissions));
    localStorage.setItem('dashboard_access_config', JSON.stringify(dashboardAccess));
    
    setHasUnsavedChanges(false);
    
    toast({
      title: "Permissions saved",
      description: "All permission changes have been saved successfully",
    });
  };

  // Reset changes
  const resetChanges = () => {
    const initialRolePermissions: RolePermissions = {
      super_admin: [], 
      manager: [],
      staff: [],
      agent: []
    };
    
    allPermissions.forEach(permission => {
      permission.defaultRoles.forEach(role => {
        if (initialRolePermissions[role]) {
          initialRolePermissions[role].push(permission.id);
        }
      });
    });
    
    setRolePermissions(initialRolePermissions);
    
    // Reset dashboard access
    setDashboardAccess([
      {
        dashboardId: 'operations-dashboard',
        allowedRoles: ['super_admin', 'manager'],
        allowedDepartments: ['Operations'],
        restrictByDepartment: true
      },
      {
        dashboardId: 'sales-dashboard',
        allowedRoles: ['super_admin', 'manager'],
        allowedDepartments: ['Sales'],
        restrictByDepartment: true
      },
      {
        dashboardId: 'content-dashboard',
        allowedRoles: ['super_admin', 'manager'],
        allowedDepartments: ['Marketing'],
        restrictByDepartment: true
      },
      {
        dashboardId: 'support-dashboard',
        allowedRoles: ['super_admin', 'manager'],
        allowedDepartments: ['Customer Support'],
        restrictByDepartment: true
      },
      {
        dashboardId: 'finance-dashboard',
        allowedRoles: ['super_admin', 'manager'],
        allowedDepartments: ['Finance'],
        restrictByDepartment: true
      }
    ]);
    
    setHasUnsavedChanges(false);
    
    toast({
      title: "Changes reset",
      description: "All changes have been reset to default values",
    });
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Access Control</h2>
            <p className="text-muted-foreground">
              Manage user roles and permissions across the system
            </p>
          </div>
          <div className="flex gap-2">
            {hasUnsavedChanges && (
              <Button variant="outline" onClick={resetChanges}>
                <Undo className="h-4 w-4 mr-2" />
                Reset Changes
              </Button>
            )}
            <Button onClick={savePermissions} disabled={!hasUnsavedChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
              <span className="text-amber-800 font-medium">You have unsaved changes</span>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roles" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Roles & Permissions
            </TabsTrigger>
            <TabsTrigger value="dashboards" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard Access
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              System Features
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="roles" className="space-y-6">
            {/* Search and Filter Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Permissions</CardTitle>
                <CardDescription>
                  Search and filter permissions by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search permissions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className="flex items-center"
                      >
                        <category.icon className="h-3 w-3 mr-1" />
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Permissions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Role-Based Permissions Matrix</CardTitle>
                <CardDescription>
                  Configure what each user role can access and modify in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Permission</TableHead>
                        <TableHead className="w-[300px]">Description</TableHead>
                        <TableHead className="w-[100px]">Category</TableHead>
                        {roles.map((role) => (
                          <TableHead key={role.id} className="w-[100px] text-center">
                            <Badge className={role.color}>
                              {role.name}
                            </Badge>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPermissions.map((permission) => (
                        <TableRow key={permission.id} className={permission.isSystemCritical ? 'border-l-4 border-l-red-500' : ''}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {permission.isSystemCritical && (
                                <Lock className="h-4 w-4 text-red-500 mr-2" />
                              )}
                              {permission.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {permission.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {permission.category}
                            </Badge>
                          </TableCell>
                          {roles.map((role) => (
                            <TableCell key={role.id} className="text-center">
                              <Switch
                                checked={rolePermissions[role.id]?.includes(permission.id)}
                                onCheckedChange={() => togglePermission(role.id, permission.id)}
                                disabled={permission.id === 'settings.access' && role.id !== 'super_admin'}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {filteredPermissions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No permissions found matching your search criteria</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 text-red-500 mr-1" />
                      <span>System Critical</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span>Enabled</span>
                    </div>
                  </div>
                  <div className="text-xs">
                    Showing {filteredPermissions.length} of {allPermissions.length} permissions
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Access Control</CardTitle>
                <CardDescription>
                  Configure role and department-based access to executive dashboards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {dashboards.map((dashboard) => {
                    const accessConfig = dashboardAccess.find(d => d.dashboardId === dashboard.id);
                    if (!accessConfig) return null;

                    return (
                      <Card key={dashboard.id} className="border border-gray-200">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                              <CardDescription>{dashboard.description}</CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-muted-foreground">Restrict by Department</span>
                              <Switch
                                checked={accessConfig.restrictByDepartment}
                                onCheckedChange={() => toggleDepartmentRestriction(dashboard.id)}
                              />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Role Access */}
                          <div>
                            <h4 className="font-medium mb-3">Role Access</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {roles.map((role) => (
                                <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <Badge className={role.color} variant="secondary">
                                    {role.name}
                                  </Badge>
                                  <Switch
                                    checked={accessConfig.allowedRoles.includes(role.id)}
                                    onCheckedChange={() => toggleDashboardRoleAccess(dashboard.id, role.id)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Department Access */}
                          {accessConfig.restrictByDepartment && (
                            <div>
                              <h4 className="font-medium mb-3">Department Access</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {departments.map((department) => (
                                  <div key={department} className="flex items-center justify-between p-3 border rounded-lg">
                                    <span className="text-sm font-medium">{department}</span>
                                    <Switch
                                      checked={accessConfig.allowedDepartments.includes(department)}
                                      onCheckedChange={() => toggleDashboardDepartmentAccess(dashboard.id, department)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Access Summary */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h5 className="font-medium text-blue-900 mb-2">Access Summary</h5>
                            <div className="text-sm text-blue-700 space-y-1">
                              <p><strong>Roles:</strong> {accessConfig.allowedRoles.join(', ') || 'None'}</p>
                              {accessConfig.restrictByDepartment && (
                                <p><strong>Departments:</strong> {accessConfig.allowedDepartments.join(', ') || 'None'}</p>
                              )}
                              <p className="text-xs mt-2">
                                {accessConfig.restrictByDepartment 
                                  ? 'Staff users must have both an allowed role AND be in an allowed department to access this dashboard.'
                                  : 'Only role-based restrictions apply. Department restrictions are disabled.'
                                }
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Feature Controls</CardTitle>
                <CardDescription>
                  Enable or disable access to specific system features for all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Globe className="h-5 w-5 text-blue-500" />
                        <div>
                          <h4 className="font-medium">Multi-language Support</h4>
                          <p className="text-sm text-muted-foreground">
                            Allow users to switch between different languages
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Settings className="h-5 w-5 text-green-500" />
                        <div>
                          <h4 className="font-medium">AI Itinerary Builder</h4>
                          <p className="text-sm text-muted-foreground">
                            Enable the AI-powered itinerary creation tool
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-purple-500" />
                        <div>
                          <h4 className="font-medium">API Access</h4>
                          <p className="text-sm text-muted-foreground">
                            Allow integration with external systems via API
                          </p>
                        </div>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Eye className="h-5 w-5 text-orange-500" />
                        <div>
                          <h4 className="font-medium">Export Functionality</h4>
                          <p className="text-sm text-muted-foreground">
                            Enable exporting data to CSV or Excel formats
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-indigo-500" />
                        <div>
                          <h4 className="font-medium">Real-time Collaboration</h4>
                          <p className="text-sm text-muted-foreground">
                            Enable real-time collaboration features
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Lock className="h-5 w-5 text-red-500" />
                        <div>
                          <h4 className="font-medium">Advanced Security</h4>
                          <p className="text-sm text-muted-foreground">
                            Enable two-factor authentication and audit logs
                          </p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Security Notice</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Changes to system features may affect user experience and security. 
                          Review all changes carefully before applying them to production.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default AccessControl;
