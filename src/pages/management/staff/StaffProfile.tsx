import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, User, Target, Clock, Star, Cake } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { getStaffById } from "@/services/staffStorageService";
import { enhancedStaffMembers } from "@/data/departmentData";
import { EnhancedStaffMember } from "@/types/staff";
import { initialCountries } from "@/pages/inventory/countries/data/countryData";
import { format } from "date-fns";
import LoginTracker from "@/components/staff/LoginTracker";
import StaffStatusManager from "@/components/staff/StaffStatusManager";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { getStaffReferralLink, getDeterministicStaffReferralLink } from "@/services/staffReferralService";

const StaffProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [staff, setStaff] = useState<EnhancedStaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStaffActive, setIsStaffActive] = useState(false);
  const [referralLink, setReferralLink] = useState<string>("");

  useEffect(() => {
    const mapProfileToEnhancedStaff = (p: any): EnhancedStaffMember => {
      const today = new Date().toISOString().slice(0, 10);

      const defaultWorkingHours: any = {
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

    const loadStaffProfile = async () => {
      if (!id) return;
      try {
        // Prefer Supabase profile if available
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email, phone, department, role, status, employee_id, created_at, avatar')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          setStaff(mapProfileToEnhancedStaff(data));
          setLoading(false);
          return;
        }

        // Fallback to local and static data
        const localStaff = getStaffById(id);
        if (localStaff) {
          setStaff(localStaff);
        } else {
          const existingStaff = enhancedStaffMembers.find(member => member.id === id);
          setStaff(existingStaff || null);
        }
      } catch (err) {
        console.warn('Error loading staff profile:', err);
        const localStaff = getStaffById(id);
        setStaff(localStaff || enhancedStaffMembers.find(m => m.id === id) || null);
      } finally {
        setLoading(false);
      }
    };

    loadStaffProfile();
  }, [id]);

  useEffect(() => {
    const updateReferral = async () => {
      if (staff?.id) {
        try {
          const link = await getStaffReferralLink(staff.id);
          setReferralLink(link);
        } catch (e) {
          setReferralLink(getDeterministicStaffReferralLink(staff.id));
        }
      }
    };
    updateReferral();
  }, [staff?.id]);

  const getCountryName = (countryId: string) => {
    const country = initialCountries.find(c => c.id === countryId);
    return country ? country.name : `Country ${countryId}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      return dateString;
    }
  };

  const handleStatusUpdate = async (newStatus: 'active' | 'inactive') => {
    if (!staff) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', staff.id);
      if (error) {
        console.warn('Supabase status update failed, applying locally:', error);
      }
      setStaff({ ...staff, status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleLoginStatusChange = (isActive: boolean) => {
    setIsStaffActive(isActive);
  };

  const renderWorkingHours = (workingHours: any) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return days.map(day => {
      const dayData = workingHours[day];
      const dayName = day.charAt(0).toUpperCase() + day.slice(1);
      
      // Handle both legacy and new format
      if (dayData?.shifts && dayData.shifts.length > 0) {
        // New shift-based format
        return (
          <div key={day} className="flex justify-between items-start">
            <span className="capitalize font-medium text-gray-900 dark:text-gray-100">{dayName}</span>
            <div className="text-right">
              {dayData.shifts.map((shift: any, index: number) => (
                <div key={shift.id || index} className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>
                      {shift.label && `${shift.label}: `}
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>
                  {shift.breakStart && shift.breakEnd && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 ml-5">
                      Break: {shift.breakStart} - {shift.breakEnd}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      } else if (dayData?.isWorking && dayData?.startTime && dayData?.endTime) {
        // Legacy format
        return (
          <div key={day} className="flex justify-between items-center">
            <span className="capitalize font-medium text-gray-900 dark:text-gray-100">{dayName}</span>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {dayData.startTime} - {dayData.endTime}
              </span>
            </div>
          </div>
        );
      } else {
        // Not working
        return (
          <div key={day} className="flex justify-between items-center">
            <span className="capitalize font-medium text-gray-900 dark:text-gray-100">{dayName}</span>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Off</span>
            </div>
          </div>
        );
      }
    });
  };

  if (loading) {
    return (
      <PageLayout
        title="Loading..."
        breadcrumbItems={[
          { title: "Home", href: "/" },
          { title: "Staff Management", href: "/management/staff" },
          { title: "Profile", href: "#" },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-900 dark:text-gray-100">Loading staff profile...</div>
        </div>
      </PageLayout>
    );
  }

  if (!staff) {
    return (
      <PageLayout
        title="Staff Not Found"
        breadcrumbItems={[
          { title: "Home", href: "/" },
          { title: "Staff Management", href: "/management/staff" },
          { title: "Profile", href: "#" },
        ]}
      >
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Staff member not found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">The staff member you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/management/staff">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Staff List
            </Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={staff.name}
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Staff Management", href: "/management/staff" },
        { title: staff.name, href: "#" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link to="/management/staff">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Staff List
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/management/staff/edit/${staff.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <Card className="lg:col-span-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={staff.avatar} alt={staff.name} />
                    <AvatarFallback className="text-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {isStaffActive && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{staff.name}</h2>
                  <p className="text-gray-600 dark:text-gray-300">{staff.role}</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge
                      variant={staff.status === "active" ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {staff.status === "active" ? "Active" : staff.status === "inactive" ? "Inactive" : "On Leave"}
                    </Badge>
                    {isStaffActive && (
                      <Badge variant="outline" className="mt-2 border-green-500 text-green-600">
                        Online
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-gray-100">{staff.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-gray-100">{staff.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-gray-100">Employee ID: {staff.employeeId}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-gray-100">Joined: {formatDate(staff.joinDate)}</span>
              </div>
              {staff.dateOfBirth && (
                <div className="flex items-center space-x-2">
                  <Cake className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">DOB: {formatDate(staff.dateOfBirth)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Staff Status Management */}
            <StaffStatusManager 
              staff={staff} 
              onStatusUpdate={handleStatusUpdate}
            />

            {/* Login Tracker */}
            <LoginTracker 
              staffId={staff.id}
              staffName={staff.name}
              onStatusChange={handleLoginStatusChange}
            />

            {/* Staff Referral Link */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Staff Referral Link</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-3">
                  <Input value={referralLink || (staff ? `https://tripoex.com/signup/agent?ref=staff_${staff.id}` : '')} readOnly />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => referralLink && navigator.clipboard.writeText(referralLink)}>Copy</Button>
                    <Button asChild>
                      <a href={referralLink || (staff ? `https://tripoex.com/signup/agent?ref=staff_${staff.id}` : '#')} target="_blank" rel="noopener noreferrer">
                        Open
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Share to onboard new agents.
                </div>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {staff.performance.overall.performanceScore}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Performance Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {staff.performance.daily.customerSatisfaction}/5
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {staff.performance.overall.ranking}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Ranking</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {staff.performance.overall.badges.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Badges</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills & Certifications */}
            {(staff.skills && staff.skills.length > 0) || (staff.certifications && staff.certifications.length > 0) ? (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Skills & Certifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {staff.skills && staff.skills.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {staff.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {staff.certifications && staff.certifications.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Certifications</h4>
                      <div className="flex flex-wrap gap-2">
                        {staff.certifications.map((cert, index) => (
                          <Badge key={index} variant="outline">
                            <Star className="h-3 w-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Operational Countries */}
            {staff.operationalCountries && staff.operationalCountries.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Operational Countries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {staff.operationalCountries.map((countryId) => (
                      <Badge key={countryId} variant="outline">
                        <MapPin className="h-3 w-3 mr-1" />
                        {getCountryName(countryId)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Targets */}
            {staff.targets && staff.targets.length > 0 && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Performance Targets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {staff.targets.map((target) => (
                      <div key={target.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Target className="h-4 w-4 text-blue-500" />
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{target.name}</h4>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {target.period} target
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {target.achieved} / {target.value}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {((target.achieved / target.value) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Working Hours & Shifts */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Working Hours & Shifts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {renderWorkingHours(staff.workingHours)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default StaffProfile;
