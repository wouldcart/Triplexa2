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
import { supabase, adminSupabase, isAdminClientConfigured } from "@/lib/supabaseClient";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "../../hooks/use-toast";
import { useApp } from "../../contexts/AppContext";

// Import users from authData
// Removed mock data; now using Supabase profiles

type ProfileRow = Tables<'profiles'>;
type AdminProfile = {
  id: ProfileRow['id'];
  name: ProfileRow['name'];
  email: ProfileRow['email'];
  role: 'super_admin' | 'manager' | 'hr_manager';
  department: string; // default to empty string when null
  phone?: ProfileRow['phone'];
  status?: 'active' | 'inactive' | 'suspended';
  position?: ProfileRow['position'];
  created_at?: ProfileRow['created_at'];
  updated_at?: ProfileRow['updated_at'];
};

const AdminManagement: React.FC = () => {
  const { currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [adminUsers, setAdminUsers] = useState<AdminProfile[]>([]);

  // Load admin users on component mount
  useEffect(() => {
    const loadAdmins = async () => {
      try {
        let { data, error } = await supabase
          .from('profiles')
          .select('id,name,email,role,department,phone,status,position,created_at,updated_at')
          .in('role', ['super_admin', 'manager', 'hr_manager']);
        // If RLS blocks or other error, try admin client when configured
        if (error) {
          if (isAdminClientConfigured) {
            const adminRes = await adminSupabase
              .from('profiles')
              .select('id,name,email,role,department,phone,status,position,created_at,updated_at')
              .in('role', ['super_admin', 'manager', 'hr_manager']);
            if (adminRes.error) {
              throw adminRes.error;
            }
            data = adminRes.data as any[];
          } else {
            throw error;
          }
        }

        // Map rows defensively to our AdminProfile shape
        const admins: AdminProfile[] = (data || []).map((row: any) => {
          const r = row as ProfileRow;
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            role: (r.role as AdminProfile['role']) ?? 'manager',
            department: r.department ?? '',
            phone: r.phone ?? undefined,
            status: (r.status as AdminProfile['status']) ?? undefined,
            position: r.position ?? undefined,
            created_at: r.created_at ?? undefined,
            updated_at: r.updated_at ?? undefined,
          };
        });

        setAdminUsers(admins);
      } catch (e) {
        toast({
          title: 'Load failed',
          description: 'Unable to load admin users.',
          variant: 'destructive'
        });
      }
    };
    loadAdmins();
  }, []);

  // Check if current user is super admin
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const filteredAdmins = adminUsers.filter(admin => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (admin.name ?? '').toLowerCase().includes(term) ||
      (admin.email ?? '').toLowerCase().includes(term) ||
      (admin.department ?? '').toLowerCase().includes(term);
    
    const matchesRoleFilter = filterRole === "all" || admin.role === filterRole;
    const matchesStatusFilter = filterStatus === "all" || admin.status === filterStatus;
    
    return matchesSearch && matchesRoleFilter && matchesStatusFilter;
  });

  // Local create/edit/status actions removed; use Role Manager for admin ops

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
              <Link to="/management/admin/role-manager">
                <Shield className="mr-2 h-4 w-4" />
                Role Manager
              </Link>
            </Button>
            <Button variant="default" className="justify-start">
              <ShieldCheck className="mr-2 h-4 w-4" />
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
                  <Button className="w-full sm:w-auto" asChild>
                    <Link to="/management/admin/role-manager">
                      <Shield className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Go to Role Manager</span>
                      <span className="sm:hidden">Role Manager</span>
                    </Link>
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
                      <AvatarImage src={'/placeholder.svg'} alt={admin.name} />
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium">
                        {(admin.name ?? '').split(' ').map(n => n?.[0] ?? '').join('') || 'U'}
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
                      <span className="text-gray-600 dark:text-gray-300">Created:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{admin.created_at ? new Date(admin.created_at).toLocaleDateString() : '—'}</span>
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
                    
                    {/* Actions are managed in Role Manager page */}
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
                    : "Manage admin roles from the Role Manager page"}
                </p>
                {isSuperAdmin && (
                  <Button asChild>
                    <Link to="/management/admin/role-manager">
                      <Shield className="mr-2 h-4 w-4" />
                      Go to Role Manager
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {/* Actions and creation/edit now managed on Role Manager page */}
    </PageLayout>
  );
};

export default AdminManagement;