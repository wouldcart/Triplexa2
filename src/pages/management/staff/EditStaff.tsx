
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Save, X, Plus, Trash2, Target, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import PageLayout from '@/components/layout/PageLayout';
import { EnhancedStaffMember, Target as TargetType } from '@/types/staff';
import { departments } from '@/data/departmentData';
import { toast } from '@/hooks/use-toast';
import EmployeeCodeField from '@/components/staff/EmployeeCodeField';
import OperationalCountriesSelector from '@/components/staff/OperationalCountriesSelector';
import ReportingManagerSelector from '@/components/staff/ReportingManagerSelector';
import TargetSettings from '@/components/staff/TargetSettings';
import WorkingHoursSection from '@/components/staff/WorkingHoursSection';
import LoginCredentials from '@/components/staff/LoginCredentials';
import { validateEmployeeCode, isEmployeeCodeUnique } from '@/utils/employeeCodeGenerator';
import { validatePasswordStrength, checkUsernameUniqueness } from '@/utils/credentialGenerator';
import { updateStaffMember } from '@/services/staffStorageService';
import { syncStaffWithAuthSystem } from '@/services/credentialService';
import { supabase } from '@/integrations/supabase/client';
import { staffWorkingHoursService } from '@/services/staffWorkingHoursService';
import { staffTargetService } from '@/services/staffTargetService';
import { TIMEZONE_OPTIONS, formatTimezoneDisplay } from '@/data/timezones';

const staffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  department: z.string().min(1, 'Department is required'),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(['active', 'inactive', 'on-leave']),
  employeeId: z.string()
    .min(1, "Employee code must be at least 1 digit")
    .max(10, "Employee code must be at most 10 digits")
    .refine(validateEmployeeCode, "Employee code must be digits only"),
  operationalCountries: z.array(z.string()).min(1, "Please select at least one operational country"),
  skills: z.array(z.string()),
  certifications: z.array(z.string()),
  reportingManager: z.string(),
  joinDate: z.date({
    required_error: "Joining date is required",
  }),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  // Optional login credentials fields for editing
  username: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  mustChangePassword: z.boolean().default(false)
}).refine((data) => {
  if (data.password && data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type StaffFormData = z.infer<typeof staffSchema>;

const EditStaff: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<EnhancedStaffMember | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const [workingHours, setWorkingHours] = useState<any>({
    monday: { isWorking: false, shifts: [] },
    tuesday: { isWorking: false, shifts: [] },
    wednesday: { isWorking: false, shifts: [] },
    thursday: { isWorking: false, shifts: [] },
    friday: { isWorking: false, shifts: [] },
    saturday: { isWorking: false, shifts: [] },
    sunday: { isWorking: false, shifts: [] }
  });
  const [whTimezone, setWhTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
  const [targets, setTargets] = useState<TargetType[]>([]);

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema.refine((data) => 
      isEmployeeCodeUnique(data.employeeId, id), {
        message: "Employee code must be unique",
        path: ["employeeId"]
      }
    )),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      department: '',
      role: '',
      status: 'active',
      employeeId: '',
      skills: [],
      certifications: [],
      operationalCountries: [],
      reportingManager: '',
      joinDate: new Date(),
      dateOfBirth: new Date(),
      username: '',
      password: '',
      confirmPassword: '',
      mustChangePassword: false,
    }
  });

  useEffect(() => {
    const mapProfileToEnhancedStaff = (p: any): EnhancedStaffMember => {
      const today = new Date().toISOString().slice(0, 10);
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
        performance: {
          daily: { date: today, tasksCompleted: 0, responseTime: 0, customerSatisfaction: 0 },
          monthly: { month: today.slice(0, 7), totalTasks: 0, averageResponseTime: 0, averageCustomerSatisfaction: 0, targetAchievement: 0 },
          quarterly: { quarter: `Q${Math.floor((new Date().getMonth() / 3) + 1)}-${new Date().getFullYear()}`, performanceRating: 0, goalsAchieved: 0, totalGoals: 0, growthPercentage: 0 },
          overall: { totalExperience: '0 years', performanceScore: 0, ranking: 0, badges: [] },
        },
        targets: [],
        permissions: [],
        workingHours: {
          monday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          tuesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          wednesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          thursday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          friday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          saturday: { isWorking: false },
          sunday: { isWorking: false },
        },
        reportingManager: undefined,
        teamMembers: undefined,
        employeeId: p.employee_id || '',
        operationalCountries: [],
        salaryStructure: undefined,
        leaveBalance: undefined,
        attendanceRecord: undefined,
      };
    };

    const mapStaffRowToEnhancedStaff = (s: any): EnhancedStaffMember => {
      const today = new Date().toISOString().slice(0, 10);
      const status = ['active', 'inactive', 'on-leave'].includes(s?.status) ? s.status : 'active';
      return {
        id: s.id,
        name: s.name || (s.email ? String(s.email).split('@')[0] : 'Staff Member'),
        email: s.email || '',
        phone: s.phone || '',
        department: s.department || 'General',
        role: s.role || 'staff',
        status,
        avatar: s.avatar || undefined,
        joinDate: (s.join_date ? String(s.join_date).slice(0, 10) : today),
        dateOfBirth: s.date_of_birth ? String(s.date_of_birth).slice(0, 10) : undefined,
        skills: [],
        certifications: [],
        performance: {
          daily: { date: today, tasksCompleted: 0, responseTime: 0, customerSatisfaction: 0 },
          monthly: { month: today.slice(0, 7), totalTasks: 0, averageResponseTime: 0, averageCustomerSatisfaction: 0, targetAchievement: 0 },
          quarterly: { quarter: `Q${Math.floor((new Date().getMonth() / 3) + 1)}-${new Date().getFullYear()}`, performanceRating: 0, goalsAchieved: 0, totalGoals: 0, growthPercentage: 0 },
          overall: { totalExperience: '0 years', performanceScore: 0, ranking: 0, badges: [] },
        },
        targets: [],
        permissions: [],
        workingHours: {
          monday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          tuesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          wednesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          thursday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          friday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          saturday: { isWorking: false },
          sunday: { isWorking: false },
        },
        reportingManager: s.reporting_manager || '',
        teamMembers: undefined,
        employeeId: s.employee_id || '',
        operationalCountries: Array.isArray(s.operational_countries) ? s.operational_countries : [],
        salaryStructure: undefined,
        leaveBalance: undefined,
        attendanceRecord: undefined,
      };
    };

    const loadStaff = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email, phone, department, role, status, employee_id, created_at, avatar')
          .eq('id', id)
          .maybeSingle();
        if (error) {
          console.warn('Supabase profile fetch failed:', error);
        }
        if (data) {
          const staffMember = mapProfileToEnhancedStaff(data);

          // Merge extended fields from staff table (join_date, date_of_birth, reporting_manager, operational_countries, employee_id)
          let mergedStaffMember = staffMember;
          try {
            const { data: staffRow, error: staffRowError } = await supabase
              .from('staff' as any)
              .select('join_date, date_of_birth, reporting_manager, operational_countries, employee_id')
              .eq('id', id)
              .maybeSingle();

            if (staffRowError) {
              console.warn('Supabase staff (extended fields) fetch failed:', staffRowError);
            }

            if (staffRow) {
              const extra = mapStaffRowToEnhancedStaff(staffRow);
              mergedStaffMember = {
                ...staffMember,
                employeeId: extra.employeeId || staffMember.employeeId,
                joinDate: extra.joinDate || staffMember.joinDate,
                dateOfBirth: extra.dateOfBirth || staffMember.dateOfBirth,
                reportingManager: extra.reportingManager || staffMember.reportingManager,
                operationalCountries: Array.isArray(extra.operationalCountries) ? extra.operationalCountries : (staffMember.operationalCountries || []),
              };
            }
          } catch (augmentErr) {
            console.warn('Failed to augment staff details from staff table:', augmentErr);
          }

          setStaff(mergedStaffMember);

          // Convert legacy working hours format to new shift format if needed
          const convertedWorkingHours = convertLegacyWorkingHours(mergedStaffMember.workingHours);
          setWorkingHours(convertedWorkingHours);
          setTargets(mergedStaffMember.targets || []);

          // Load persisted Working Hours & Targets from Supabase if available
          try {
            const wh = await staffWorkingHoursService.getWorkingHoursByStaff(id);
            if (!wh.error) setWorkingHours(wh.data);
            // Load timezone separately
            try {
              const tzRes = await staffWorkingHoursService.getTimezoneByStaff(id);
              if (!tzRes.error && tzRes.timezone) {
                setWhTimezone(String(tzRes.timezone));
              }
            } catch (tzErr) {
              console.warn('Failed to load timezone for staff', tzErr);
            }
          } catch (err) {
            console.warn('Failed to load working hours for staff', err);
          }
          try {
            const tg = await staffTargetService.listTargetsByStaff(id);
            if (!tg.error) setTargets(tg.data);
          } catch (err) {
            console.warn('Failed to load targets for staff', err);
          }

          const joinDate = mergedStaffMember.joinDate ? new Date(mergedStaffMember.joinDate) : new Date();
          const dateOfBirth = mergedStaffMember.dateOfBirth ? new Date(mergedStaffMember.dateOfBirth) : new Date();

          const editableStatus = mergedStaffMember.status === 'on-leave' ? 'inactive' : mergedStaffMember.status as 'active' | 'inactive' | 'on-leave';

          form.reset({
            name: mergedStaffMember.name,
            email: mergedStaffMember.email,
            phone: mergedStaffMember.phone,
            department: mergedStaffMember.department,
            role: mergedStaffMember.role,
            status: editableStatus,
            employeeId: mergedStaffMember.employeeId || '',
            operationalCountries: mergedStaffMember.operationalCountries || [],
            skills: mergedStaffMember.skills,
            certifications: mergedStaffMember.certifications,
            reportingManager: mergedStaffMember.reportingManager || '',
            joinDate: joinDate,
            dateOfBirth: dateOfBirth,
            mustChangePassword: false,
          });
        } else {
          // Fallback: try loading from 'staff' table
          const { data: staffData, error: staffError } = await supabase
            .from('staff' as any)
            .select('id, name, email, phone, department, role, status, employee_id, join_date, date_of_birth, reporting_manager, operational_countries, avatar')
            .eq('id', id)
            .maybeSingle();

          if (staffError) {
            console.warn('Supabase staff fetch failed:', staffError);
          }

          if (staffData) {
            const staffMember = mapStaffRowToEnhancedStaff(staffData);
            setStaff(staffMember);

            const convertedWorkingHours = convertLegacyWorkingHours(staffMember.workingHours);
            setWorkingHours(convertedWorkingHours);
            setTargets(staffMember.targets || []);

            const joinDate = staffMember.joinDate ? new Date(staffMember.joinDate) : new Date();
            const dateOfBirth = staffMember.dateOfBirth ? new Date(staffMember.dateOfBirth) : new Date();

            const editableStatus = staffMember.status === 'on-leave' ? 'inactive' : staffMember.status as 'active' | 'inactive' | 'on-leave';

            form.reset({
              name: staffMember.name,
              email: staffMember.email,
              phone: staffMember.phone,
              department: staffMember.department,
              role: staffMember.role,
              status: editableStatus,
              employeeId: staffMember.employeeId || '',
              operationalCountries: staffMember.operationalCountries || [],
              skills: staffMember.skills,
              certifications: staffMember.certifications,
              reportingManager: staffMember.reportingManager || '',
              joinDate: joinDate,
              dateOfBirth: dateOfBirth,
              mustChangePassword: false,
            });
          } else {
            setStaff(null);
          }
        }
      } catch (err) {
        console.warn('Error loading staff from Supabase:', err);
      }
    };

    loadStaff();
  }, [id, form]);

  // Helper function to convert legacy working hours to new shift format
  const convertLegacyWorkingHours = (legacyHours: any) => {
    const convertedHours: any = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
      const dayData = legacyHours[day];
      if (dayData && dayData.isWorking && dayData.startTime && dayData.endTime) {
        // Convert old format to new shift format
        convertedHours[day] = {
          isWorking: true,
          shifts: [{
            id: `shift_${Date.now()}_${day}`,
            startTime: dayData.startTime,
            endTime: dayData.endTime,
            breakStart: dayData.breakTime ? '12:00' : undefined,
            breakEnd: dayData.breakTime ? '13:00' : undefined,
            label: 'Regular Shift'
          }]
        };
      } else {
        convertedHours[day] = { isWorking: false, shifts: [] };
      }
    });
    
    return convertedHours;
  };

  const onSubmit = async (data: StaffFormData) => {
    if (!staff) return;

    const updatedStaff: EnhancedStaffMember = {
      ...staff,
      name: data.name,
      email: data.email,
      phone: data.phone,
      department: data.department,
      role: data.role,
      status: data.status,
      employeeId: data.employeeId,
      operationalCountries: data.operationalCountries,
      skills: data.skills,
      certifications: data.certifications,
      workingHours,
      targets,
      reportingManager: data.reportingManager,
      joinDate: data.joinDate.toISOString().slice(0, 10),
      dateOfBirth: data.dateOfBirth.toISOString().slice(0, 10),
    };

    // Update using the staff storage service to ensure consistency
    updateStaffMember(id!, updatedStaff);

    // Persist extended fields into public.staff (join_date, date_of_birth, reporting_manager, operational_countries)
    try {
      const { data: staffRow, error: staffErr } = await supabase
        .from('staff' as any)
        .select('id')
        .eq('id', id)
        .maybeSingle();

      const staffPayload: any = {
        id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        role: data.role,
        status: data.status,
        employee_id: data.employeeId,
        join_date: updatedStaff.joinDate ?? null,
        reporting_manager: updatedStaff.reportingManager ?? null,
        date_of_birth: updatedStaff.dateOfBirth ?? null,
        operational_countries: Array.isArray(updatedStaff.operationalCountries)
          ? updatedStaff.operationalCountries
          : null,
        updated_at: new Date().toISOString(),
      };

      if (staffErr || !staffRow) {
        await supabase
          .from('staff' as any)
          .upsert(staffPayload, { onConflict: 'id' });
      } else {
        await supabase
          .from('staff' as any)
          .update(staffPayload)
          .eq('id', id);
      }
    } catch (staffSaveErr) {
      console.warn('Failed to persist extended staff fields:', staffSaveErr);
    }

    // If login credentials are provided, sync with auth system
    if (data.username && data.password && showCredentials) {
      await syncStaffWithAuthSystem(updatedStaff, data.username, data.password, data.mustChangePassword);
      console.log('Updated staff member with new login credentials:', { 
        staff: updatedStaff.name, 
        username: data.username,
        email: updatedStaff.email,
        mustChangePassword: data.mustChangePassword 
      });
    }

    // Persist Working Hours & Performance Targets to Supabase
    try {
      const upsertWH = await staffWorkingHoursService.upsertWorkingHours(id!, workingHours, whTimezone || undefined);
      if (upsertWH.error) console.warn('Working hours upsert error:', upsertWH.error);
    } catch (err) {
      console.warn('Working hours upsert failed:', err);
    }
    try {
      const replaceTargets = await staffTargetService.replaceTargetsForStaff(id!, targets || []);
      if (replaceTargets.error) console.warn('Targets replace error:', replaceTargets.error);
    } catch (err) {
      console.warn('Targets replace failed:', err);
    }
    
    // Trigger a storage event to notify other components
    window.dispatchEvent(new Event('storage'));
    
    console.log('Updating staff:', updatedStaff);
    toast({
      title: "Staff profile updated successfully!",
      description: `${data.name}'s profile has been updated with status: ${data.status}`,
    });
    navigate(`/management/staff/profile/${id}`);
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      const currentSkills = form.getValues('skills');
      form.setValue('skills', [...currentSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues('skills');
    form.setValue('skills', currentSkills.filter(skill => skill !== skillToRemove));
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      const currentCerts = form.getValues('certifications');
      form.setValue('certifications', [...currentCerts, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const removeCertification = (certToRemove: string) => {
    const currentCerts = form.getValues('certifications');
    form.setValue('certifications', currentCerts.filter(cert => cert !== certToRemove));
  };

  if (!staff) {
    return (
      <PageLayout title="Edit Staff">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Staff member not found</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Edit Staff Profile"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Staff Management", href: "/management/staff" },
        { title: staff.name, href: `/management/staff/profile/${staff.id}` },
        { title: "Edit", href: `/management/staff/edit/${staff.id}` },
      ]}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Staff Profile</h2>
            <p className="text-muted-foreground">Update staff member information and settings</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/management/staff')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Staff
            </Button>
            <Button variant="outline" onClick={() => navigate(`/management/staff/profile/${id}`)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-gray-100">Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-gray-100">Employee Code</FormLabel>
                        <FormControl>
                          <EmployeeCodeField
                            value={field.value}
                            onChange={field.onChange}
                            excludeId={id}
                            error={form.formState.errors.employeeId?.message}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-gray-100">Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-gray-100">Phone</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-gray-900 dark:text-gray-100">Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="joinDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-gray-900 dark:text-gray-100">Joining Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date(new Date().setDate(new Date().getDate() + 365)) || 
                                date < new Date("2020-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-gray-100">Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-gray-100">Role</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-gray-100">Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="on-leave">On Leave</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground mt-1">
                          Note: Leave status can be managed through the leave management system
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Reporting Manager Field */}
                  <FormField
                    control={form.control}
                    name="reportingManager"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 dark:text-gray-100">Reporting Manager</FormLabel>
                        <FormControl>
                          <ReportingManagerSelector
                            value={field.value || ''}
                            onChange={field.onChange}
                            excludeId={id}
                            label=""
                            placeholder="Select reporting manager..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Login Credentials Section */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 dark:text-gray-100">Login Credentials</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCredentials(!showCredentials)}
                  >
                    {showCredentials ? 'Hide' : 'Update'} Credentials
                  </Button>
                </div>
              </CardHeader>
              {showCredentials && (
                <CardContent>
                  <LoginCredentials
                    control={form.control}
                    watchedEmail={form.watch('email')}
                    watchedName={form.watch('name')}
                    formErrors={form.formState.errors}
                  />
                </CardContent>
              )}
            </Card>

            {/* Operational Countries */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Operational Countries</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="operationalCountries"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <OperationalCountriesSelector
                          selectedCountries={field.value}
                          onCountriesChange={field.onChange}
                          placeholder="Select countries this staff member manages..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new skill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                  <Button type="button" onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.watch('skills').map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Certifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new certification"
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                  <Button type="button" onClick={addCertification}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.watch('certifications').map((cert, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {cert}
                      <button
                        type="button"
                        onClick={() => removeCertification(cert)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Targets */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Performance Targets</CardTitle>
              </CardHeader>
              <CardContent>
                {form.watch('department') && form.watch('role') && (
                  <TargetSettings
                    department={form.watch('department')}
                    role={form.watch('role')}
                    targets={targets}
                    onTargetsChange={setTargets}
                  />
                )}
                {(!form.watch('department') || !form.watch('role')) && (
                  <div className="text-center text-muted-foreground py-8">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Please select department and role first to configure targets</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timezone (Edit separately) */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Timezone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Label className="text-sm">Timezone</Label>
                <Select value={whTimezone || ''} onValueChange={setWhTimezone}>
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 overflow-y-auto">
                    {TIMEZONE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex flex-col text-left">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {opt.abbreviation}, {opt.offset} — {opt.cities.join(', ')}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{opt.value}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Working Hours */}
            <WorkingHoursSection
              workingHours={workingHours}
              onWorkingHoursChange={setWorkingHours}
            />

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" className="min-w-32">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PageLayout>
  );
};

export default EditStaff;
