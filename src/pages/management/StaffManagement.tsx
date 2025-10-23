import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  UserPlus, 
  Building2,
  TrendingUp,
  UserCheck,
  UserX,
  Coffee,
  Mail,
  Phone,
  Building,
  CheckCircle,
  XCircle,
  Trash2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageLayout from "@/components/layout/PageLayout";
import { enhancedStaffMembers } from "@/data/departmentData";
import { EnhancedStaffMember } from "@/types/staff";
import { getStoredStaff, updateStaffMember } from "@/services/staffStorageService";
import { initialCountries } from "@/pages/inventory/countries/data/countryData";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const StaffManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [staffData, setStaffData] = useState<EnhancedStaffMember[]>([]);

  // Load staff data on component mount
  useEffect(() => {
    // Map a Supabase profiles row to EnhancedStaffMember with safe defaults
    const mapProfileToEnhancedStaff = (p: any): EnhancedStaffMember => {
      const today = new Date().toISOString().slice(0, 10);
      const defaultWorkingHours = {
        monday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
        tuesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
        wednesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
        thursday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
        friday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
        saturday: { isWorking: false },
        sunday: { isWorking: false },
      };

      const defaultPerformance = {
        daily: {
          date: today,
          tasksCompleted: 0,
          responseTime: 0,
          customerSatisfaction: 0,
        },
        monthly: {
          month: today.slice(0, 7),
          totalTasks: 0,
          averageResponseTime: 0,
          averageCustomerSatisfaction: 0,
          targetAchievement: 0,
        },
        quarterly: {
          quarter: `Q${Math.floor((new Date().getMonth() / 3) + 1)}-${new Date().getFullYear()}`,
          performanceRating: 0,
          goalsAchieved: 0,
          totalGoals: 0,
          growthPercentage: 0,
        },
        overall: {
          totalExperience: '0 years',
          performanceScore: 0,
          ranking: 0,
          badges: [],
        },
      };

      const status = ['active', 'inactive', 'on-leave'].includes(p?.status) ? p.status : 'active';

      return {
        id: p.id,
        name: p.name || (p.email ? String(p.email).split('@')[0] : 'Staff Member'),
        email: p.email || '',
        phone: p.phone || '',
        department: p.department || 'General',
        role: p.role || 'staff',
        status,
        avatar: p.avatar || undefined,
        joinDate: (p.created_at ? String(p.created_at).slice(0, 10) : today),
        dateOfBirth: undefined,
        skills: [],
        certifications: [],
        performance: defaultPerformance,
        targets: [],
        permissions: [],
        workingHours: defaultWorkingHours,
        reportingManager: undefined,
        teamMembers: undefined,
        employeeId: p.employee_id || '',
        operationalCountries: [],
        salaryStructure: undefined,
        leaveBalance: undefined,
        attendanceRecord: undefined,
      };
    };

    const loadStaffData = async () => {
      const storedStaff = getStoredStaff();
      let supabaseStaff: EnhancedStaffMember[] = [];

      try {
        if (supabase) {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email, phone, department, role, status, employee_id, created_at, avatar')
            .eq('role', 'staff');

          if (error) {
            console.warn('Supabase profiles fetch failed, falling back to local sources:', error);
          } else if (data && Array.isArray(data)) {
            supabaseStaff = data.map(mapProfileToEnhancedStaff);
          }
        }
      } catch (err) {
        console.warn('Error fetching staff profiles from Supabase:', err);
      }

      // If we have Supabase staff, prefer those and merge local stored entries; otherwise include sample data
      const allStaff = supabaseStaff.length > 0
        ? [...supabaseStaff, ...storedStaff]
        : [...enhancedStaffMembers, ...storedStaff];

      setStaffData(allStaff);
    };

    loadStaffData();
    // Listen for localStorage changes to update staff data
    const handleStorageChange = () => {
      loadStaffData();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const filteredStaff = staffData.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || staff.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const activeStaff = staffData.filter(staff => staff.status === "active").length;
  const onLeaveStaff = staffData.filter(staff => staff.status === "on-leave").length;
  const inactiveStaff = staffData.filter(staff => staff.status === "inactive").length;

  const handleStatusUpdate = async (staffId: string, newStatus: 'active' | 'inactive') => {
    try {
      const staffMember = staffData.find(staff => staff.id === staffId);
      
      // Update in Supabase if available
      if (supabase) {
        const { error: supabaseError } = await supabase
          .from('profiles')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', staffId);

        if (supabaseError) {
          console.warn('Supabase update failed, using local storage:', supabaseError);
        } else {
          console.log(`Staff ${staffMember?.name} status updated in Supabase to: ${newStatus}`);
        }
      }
      
      // Update the staff member status in local storage as fallback
      updateStaffMember(staffId, { status: newStatus });
      
      // Update local state
      setStaffData(prevData => 
        prevData.map(staff => 
          staff.id === staffId ? { ...staff, status: newStatus } : staff
        )
      );

      toast({
        title: "Status Updated",
        description: `${staffMember?.name} is now ${newStatus}`,
      });

      console.log(`Staff ${staffMember?.name} status updated to: ${newStatus}`);
    } catch (error) {
      console.error('Error updating staff status:', error);
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      const staffMember = staffData.find(staff => staff.id === staffId);
      
      // Delete from Supabase if available
      if (supabase) {
        const { error: supabaseError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', staffId);

        if (supabaseError) {
          console.warn('Supabase delete failed:', supabaseError);
        } else {
          console.log(`Staff ${staffMember?.name} deleted from Supabase`);
        }
      }
      
      // Remove from local state
      setStaffData(prevData => prevData.filter(staff => staff.id !== staffId));

      toast({
        title: "Staff Deleted",
        description: `${staffMember?.name} has been removed`,
      });

      console.log(`Staff ${staffMember?.name} deleted`);
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast({
        title: "Error",
        description: "Failed to delete staff member",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "on-leave":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <UserCheck className="h-3 w-3 text-green-600" />;
      case "inactive":
        return <UserX className="h-3 w-3 text-red-600" />;
      case "on-leave":
        return <Coffee className="h-3 w-3 text-orange-600" />;
      default:
        return <Users className="h-3 w-3 text-gray-600" />;
    }
  };

  // Function to get country name by ID
  const getCountryNameById = (countryId: string) => {
    const country = initialCountries.find(c => c.id === countryId);
    return country ? country.name : countryId;
  };

  return (
    <PageLayout
      title="Staff Management"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Management", href: "/management" },
        { title: "Staff Management", href: "/management/staff" },
      ]}
    >
      <div className="space-y-4 md:space-y-6">
        {/* Staff Management Heading */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">Staff Management</h1>
              <p className="text-sm md:text-base text-blue-700 dark:text-blue-300">Manage your team members, track performance, and oversee operations</p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-600 dark:text-blue-400" />
              <Building2 className="h-6 w-6 md:h-8 md:w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
          <Button variant="default" className="justify-start">
            <Users className="mr-2 h-4 w-4" />
            Staff Members
          </Button>
          <Button variant="outline" asChild className="justify-start">
            <Link to="/management/staff/departments">
              <Building className="mr-2 h-4 w-4" />
              Departments
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">Total Staff</CardTitle>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{staffData.length}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                Total members
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">Active</CardTitle>
              <UserCheck className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-green-600">{activeStaff}</div>
              <p className="text-xs text-muted-foreground">Currently working</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">On Leave</CardTitle>
              <Coffee className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-orange-600">{onLeaveStaff}</div>
              <p className="text-xs text-muted-foreground">Away</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">Inactive</CardTitle>
              <UserX className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-red-600">{inactiveStaff}</div>
              <p className="text-xs text-muted-foreground">Not active</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <div className="flex flex-1 gap-2 sm:gap-3 max-w-full sm:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[100px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on-leave">On Leave</option>
              </select>
            </div>
            
            <Button asChild className="w-full sm:w-auto">
              <Link to="/management/staff/add">
                <UserPlus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Staff Member</span>
                <span className="sm:hidden">Add Staff</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Staff Grid - Improved responsive layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
          {filteredStaff.map((staff) => (
            <Card key={staff.id} className="hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600">
              <CardHeader className="pb-3">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={staff.avatar} alt={staff.name} />
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium">
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {staff.name}
                    </CardTitle>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{staff.role}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{staff.department}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge 
                      variant={getStatusBadgeVariant(staff.status)} 
                      className={`flex items-center gap-1 text-xs shrink-0 ${
                        staff.status === 'active' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700' :
                        staff.status === 'inactive' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700' :
                        'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700'
                      }`}
                    >
                      {getStatusIcon(staff.status)}
                      <span className="hidden sm:inline font-medium">
                        {staff.status === "on-leave" ? "On Leave" : staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                      </span>
                    </Badge>
                    {staff.status !== "on-leave" && (
                      <div className="flex gap-1">
                        <Select
                          value={staff.status}
                          onValueChange={(value: 'active' | 'inactive') => handleStatusUpdate(staff.id, value)}
                        >
                          <SelectTrigger className="w-20 h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active" className="text-xs">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                Active
                              </div>
                            </SelectItem>
                            <SelectItem value="inactive" className="text-xs">
                              <div className="flex items-center gap-1">
                                <XCircle className="h-3 w-3 text-gray-500" />
                                Inactive
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStaff(staff.id)}
                          className="h-6 w-6 p-0 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Employee ID:</span>
                    <span className="font-medium font-mono text-gray-900 dark:text-gray-100">{staff.employeeId}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Join Date:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{staff.joinDate}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Performance:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {staff.performance.overall.performanceScore}
                    </span>
                  </div>
                  
                  {/* Contact Info - Mobile friendly */}
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 text-xs text-gray-500 dark:text-gray-400 pt-1">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{staff.email}</span>
                    </div>
                    {staff.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{staff.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Operational Countries */}
                  {staff.operationalCountries && staff.operationalCountries.length > 0 && (
                    <div className="mt-3">
                      <span className="text-xs text-gray-600 dark:text-gray-300">Operational Countries:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {staff.operationalCountries.slice(0, 2).map((countryId) => (
                          <Badge key={countryId} variant="outline" className="text-xs">
                            {getCountryNameById(countryId)}
                          </Badge>
                        ))}
                        {staff.operationalCountries.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{staff.operationalCountries.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <Button variant="outline" size="sm" asChild className="flex-1 text-xs">
                      <Link to={`/management/staff/profile/${staff.id}`}>
                        View Profile
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1 text-xs">
                      <Link to={`/management/staff/edit/${staff.id}`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="text-center py-8 md:py-12">
              <Users className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No staff members found</h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
                {searchTerm ? "Try adjusting your search criteria" : "Get started by adding your first team member"}
              </p>
              <Button asChild>
                <Link to="/management/staff/add">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Staff Member
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default StaffManagement;
