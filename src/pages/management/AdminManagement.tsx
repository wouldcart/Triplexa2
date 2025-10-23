import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { 
  Search, 
  Users, 
  UserPlus, 
  Shield,
  ShieldCheck,
  UserCheck,
  Mail,
  Phone
} from "lucide-react";
import PageLayout from "../../components/layout/PageLayout";
import { User } from "@/types/User";
import { toast } from "../../hooks/use-toast";
import { useApp } from "../../contexts/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

// Import users from authData
import { users } from "../../data/authData";

const AdminManagement: React.FC = () => {
  const { currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // New user form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "manager",
    department: "",
    phone: "",
    status: "active",
    password: "",
    confirmPassword: ""
  });

  // Load admin users on component mount
  useEffect(() => {
    // Filter users with admin roles (super_admin, manager, hr_manager)
    const admins = users.filter(user => 
      user.role === 'super_admin' || 
      user.role === 'manager' || 
      user.role === 'hr_manager'
    );
    setAdminUsers(admins);
  }, []);

  // Check if current user is super admin
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const filteredAdmins = adminUsers.filter(admin => {
    const matchesSearch = 
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRoleFilter = filterRole === "all" || admin.role === filterRole;
    const matchesStatusFilter = filterStatus === "all" || admin.status === filterStatus;
    
    return matchesSearch && matchesRoleFilter && matchesStatusFilter;
  });

  const handleCreateUser = () => {
    // Validate form
    if (!newUser.name || !newUser.email || !newUser.role || !newUser.department) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      toast({
        title: "Password Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    // Create new user (in a real app, this would be an API call)
    const newAdminUser: User = {
      id: `admin-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as 'super_admin' | 'manager' | 'hr_manager',
      department: newUser.department,
      phone: newUser.phone,
      status: newUser.status as 'active' | 'inactive',
      avatar: '/avatars/default.jpg',
      position: newUser.role === 'super_admin' ? 'System Administrator' : 
               newUser.role === 'hr_manager' ? 'HR Manager' : 'Department Manager',
      permissions: newUser.role === 'super_admin' ? ['*'] : 
                  newUser.role === 'hr_manager' ? ['staff.*', 'hr.*'] : 
                  ['department.*', 'staff.view'],
      workLocation: 'Head Office',
      employeeId: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
      joinDate: new Date().toISOString().split('T')[0]
    };

    // Add to state
    setAdminUsers([...adminUsers, newAdminUser]);
    
    // Close dialog and reset form
    setIsCreateDialogOpen(false);
    setNewUser({
      name: "",
      email: "",
      role: "manager",
      department: "",
      phone: "",
      status: "active",
      password: "",
      confirmPassword: ""
    });

    toast({
      title: "Success",
      description: "Admin user created successfully",
      variant: "default"
    });
  };

  const handleEditUser = () => {
    if (!selectedUser) return;

    // Update user in state
    const updatedAdmins = adminUsers.map(admin => 
      admin.id === selectedUser.id ? selectedUser : admin
    );
    
    setAdminUsers(updatedAdmins);
    setIsEditDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Admin user updated successfully",
      variant: "default"
    });
  };

  const handleStatusChange = (userId: string, newStatus: 'active' | 'inactive') => {
    // Update user status
    const updatedAdmins = adminUsers.map(admin => 
      admin.id === userId ? {...admin, status: newStatus} : admin
    );
    
    setAdminUsers(updatedAdmins);
    
    toast({
      title: "Status Updated",
      description: `User status changed to ${newStatus}`,
      variant: "default"
    });
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  // Get counts for stats
  const superAdminCount = adminUsers.filter(admin => admin.role === 'super_admin').length;
  const managerCount = adminUsers.filter(admin => admin.role === 'manager').length;
  const hrManagerCount = adminUsers.filter(admin => admin.role === 'hr_manager').length;
  const activeCount = adminUsers.filter(admin => admin.status === 'active').length;

  return (
    <PageLayout>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Admin Management</h2>
            <p className="text-muted-foreground">
              Manage super admin and manager accounts with role-based permissions
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" asChild className="justify-start">
              <Link to="/management/staff">
                <Users className="mr-2 h-4 w-4" />
                Staff Management
              </Link>
            </Button>
            <Button variant="default" className="justify-start">
              <Shield className="mr-2 h-4 w-4" />
              Admin Management
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">Total Admins</CardTitle>
                <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{adminUsers.length}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  Admin users
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">Super Admins</CardTitle>
                <ShieldCheck className="h-3 w-3 md:h-4 md:w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-purple-600">{superAdminCount}</div>
                <p className="text-xs text-muted-foreground">Full system access</p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">Managers</CardTitle>
                <Shield className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-blue-600">{managerCount + hrManagerCount}</div>
                <p className="text-xs text-muted-foreground">Department managers</p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">Active</CardTitle>
                <UserCheck className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-green-600">{activeCount}</div>
                <p className="text-xs text-muted-foreground">Active accounts</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64 md:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search admins..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[120px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="all">All Roles</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="manager">Manager</option>
                      <option value="hr_manager">HR Manager</option>
                    </select>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[100px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                
                {isSuperAdmin && (
                  <Button 
                    className="w-full sm:w-auto"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Add Admin User</span>
                    <span className="sm:hidden">Add Admin</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Admin Users Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
            {filteredAdmins.map((admin) => (
              <Card key={admin.id} className="hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600">
                <CardHeader className="pb-3">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={admin.avatar} alt={admin.name} />
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium">
                        {admin.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {admin.name}
                      </CardTitle>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{admin.position}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{admin.department}</p>
                    </div>
                    <div>
                      <Badge 
                        className={`
                          ${admin.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}
                        `}
                      >
                        {admin.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Role:</span>
                      <Badge 
                        className={`
                          ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' : 
                            admin.role === 'hr_manager' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}
                        `}
                      >
                        {admin.role === 'super_admin' ? 'Super Admin' : 
                         admin.role === 'hr_manager' ? 'HR Manager' : 'Manager'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Employee ID:</span>
                      <span className="font-medium font-mono text-gray-900 dark:text-gray-100">{admin.employeeId}</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Join Date:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{admin.joinDate}</span>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 text-xs text-gray-500 dark:text-gray-400 pt-1">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{admin.email}</span>
                      </div>
                      {admin.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{admin.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {isSuperAdmin && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-xs"
                            onClick={() => openEditDialog(admin)}
                          >
                            Edit
                          </Button>
                          {admin.id !== currentUser?.id && (
                            <Button 
                              variant={admin.status === 'active' ? 'destructive' : 'default'} 
                              size="sm" 
                              className="flex-1 text-xs"
                              onClick={() => handleStatusChange(
                                admin.id, 
                                admin.status === 'active' ? 'inactive' : 'active'
                              )}
                            >
                              {admin.status === 'active' ? 'Deactivate' : 'Activate'}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAdmins.length === 0 && (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="text-center py-8 md:py-12">
                <Shield className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No admin users found</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
                  {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                    ? "Try adjusting your search criteria" 
                    : "Get started by adding your first admin user"}
                </p>
                {isSuperAdmin && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Admin User
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Admin Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Admin User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value) => setNewUser({...newUser, role: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="hr_manager">HR Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={newUser.department}
                  onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={newUser.status} 
                  onValueChange={(value) => setNewUser({...newUser, status: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateUser}>Create Admin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Admin User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select 
                    value={selectedUser.role} 
                    onValueChange={(value: any) => setSelectedUser({...selectedUser, role: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="hr_manager">HR Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Label htmlFor="edit-department">Department</Label>
                  <Input
                    id="edit-department"
                    value={selectedUser.department}
                    onChange={(e) => setSelectedUser({...selectedUser, department: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={selectedUser.phone || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={selectedUser.status} 
                    onValueChange={(value: any) => setSelectedUser({...selectedUser, status: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default AdminManagement;