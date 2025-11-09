import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { EnhancedStaffMember, Target as TargetType, Department } from '@/types/staff';
import { departmentService } from '@/services/departmentService';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import EmployeeCodeField from '@/components/staff/EmployeeCodeField';
import OperationalCountriesSelector from '@/components/staff/OperationalCountriesSelector';
import ReportingManagerSelector from '@/components/staff/ReportingManagerSelector';
import TargetSettings from '@/components/staff/TargetSettings';
import WorkingHoursSection from '@/components/staff/WorkingHoursSection';
import LoginCredentials from '@/components/staff/LoginCredentials';
import { validateEmployeeCode, isEmployeeCodeUnique } from '@/utils/employeeCodeGenerator';
import { validatePasswordStrength, checkUsernameUniqueness } from '@/utils/credentialGenerator';
import { syncStaffWithAuthSystem } from '@/services/credentialService';
import { ensureReferralExistsForStaff } from '@/services/staffReferralService';
import { staffWorkingHoursService } from '@/services/staffWorkingHoursService';
import { staffTargetService } from '@/services/staffTargetService';

const staffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  department: z.string().min(1, 'Department is required'),
  role: z.enum(['manager', 'staff', 'hr_manager'], {
    required_error: 'Role is required'
  }),
  position: z.string().min(1, 'Position/Designation is required'),
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
  // Login credentials fields
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .refine((val) => checkUsernameUniqueness(val), "Username already exists"),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine((val) => validatePasswordStrength(val).isValid, "Password does not meet security requirements"),
  confirmPassword: z.string(),
  mustChangePassword: z.boolean().default(true)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type StaffFormData = z.infer<typeof staffSchema>;

const AddStaff: React.FC = () => {
  const navigate = useNavigate();
  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [workingHours, setWorkingHours] = useState<any>({
    monday: { isWorking: false, shifts: [] },
    tuesday: { isWorking: false, shifts: [] },
    wednesday: { isWorking: false, shifts: [] },
    thursday: { isWorking: false, shifts: [] },
    friday: { isWorking: false, shifts: [] },
    saturday: { isWorking: false, shifts: [] },
    sunday: { isWorking: false, shifts: [] }
  });
  const [targets, setTargets] = useState<TargetType[]>([]);
  const [dobInput, setDobInput] = useState('');
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState<boolean>(false);

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      department: '',
      role: 'staff',
      position: '',
      status: 'active',
      employeeId: '',
      skills: [],
      certifications: [],
      operationalCountries: [],
      reportingManager: '',
      joinDate: new Date(),
      username: '',
      password: '',
      confirmPassword: '',
      mustChangePassword: true,
    }
  });

  const watchedEmail = form.watch('email');
  const watchedName = form.watch('name');
  const watchedDOB = form.watch('dateOfBirth');
  const selectedDeptCode = form.watch('department');
  const selectedDept = React.useMemo(() => {
    return departmentList.find((d) => d.code === selectedDeptCode);
  }, [departmentList, selectedDeptCode]);
  const selectedDeptName = selectedDept?.name || selectedDeptCode;

  React.useEffect(() => {
    setDobInput(watchedDOB ? format(watchedDOB, 'dd/MM/yyyy') : '');
  }, [watchedDOB]);

  // Load departments from Supabase (public.departments)
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingDepartments(true);
        const { data, source } = await departmentService.getDepartments();
        if (!mounted) return;
        if (source === 'db' && Array.isArray(data)) {
          setDepartmentList(data);
        } else {
          setDepartmentList([]);
        }
      } catch (err) {
        console.warn('Failed to load departments', err);
        if (mounted) setDepartmentList([]);
      } finally {
        if (mounted) setLoadingDepartments(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const onSubmit = async (data: StaffFormData) => {
    const newStaff: EnhancedStaffMember = {
      id: uuidv4(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      department: data.department,
      role: data.role,
      position: data.position,
      status: data.status,
      employeeId: data.employeeId,
      operationalCountries: data.operationalCountries,
      skills: data.skills,
      certifications: data.certifications,
      dateOfBirth: data.dateOfBirth.toISOString().slice(0, 10),
      performance: {
        daily: {
          date: new Date().toISOString().slice(0, 10),
          tasksCompleted: 0,
          responseTime: 0,
          customerSatisfaction: 0,
          revenue: 0,
          enquiriesHandled: 0,
          conversions: 0
        },
        monthly: {
          month: new Date().toISOString().slice(0, 7),
          totalTasks: 0,
          averageResponseTime: 0,
          averageCustomerSatisfaction: 0,
          totalRevenue: 0,
          totalEnquiries: 0,
          conversionRate: 0,
          targetAchievement: 0
        },
        quarterly: {
          quarter: `Q${Math.floor((new Date().getMonth() / 3) + 1)}-${new Date().getFullYear()}`,
          performanceRating: 0,
          goalsAchieved: 0,
          totalGoals: 0,
          growthPercentage: 0
        },
        overall: {
          totalExperience: "0 years",
          totalRevenue: 0,
          clientRetentionRate: 0,
          performanceScore: 0,
          ranking: 0,
          badges: []
        }
      },
      targets: targets,
      permissions: [],
      workingHours: workingHours,
      avatar: `/avatars/avatar-${Math.floor(Math.random() * 5) + 1}.png`,
      joinDate: data.joinDate.toISOString().slice(0, 10),
      reportingManager: data.reportingManager
    };

    // Create login credentials and sync with auth system first
    // This will create the auth user and let the `handle_new_user` trigger
    // populate the profiles row, avoiding RLS violations from direct inserts.
    const authUserId = await syncStaffWithAuthSystem(newStaff, data.username, data.password, data.mustChangePassword);

    // Generate and persist staff referral link using Supabase auth user ID
    if (authUserId) {
      ensureReferralExistsForStaff(authUserId).catch((err) => console.warn('Referral generation failed:', err));

      // Persist Working Hours & Shifts
      try {
        const upsertWH = await staffWorkingHoursService.upsertWorkingHours(authUserId, workingHours);
        if (upsertWH.error) console.warn('Working hours upsert error:', upsertWH.error);
      } catch (err) {
        console.warn('Working hours upsert failed:', err);
      }

      // Persist Performance Targets
      try {
        const replaceTargets = await staffTargetService.replaceTargetsForStaff(authUserId, targets || []);
        if (replaceTargets.error) console.warn('Targets replace error:', replaceTargets.error);
      } catch (err) {
        console.warn('Targets replace failed:', err);
      }
    } else {
      console.warn('Referral generation skipped: missing Supabase auth user ID.');
    }

    console.log('New staff member created with login credentials:', { 
      staff: newStaff.name, 
      username: data.username,
      email: newStaff.email,
      mustChangePassword: data.mustChangePassword,
      loginMethods: ['username', 'email']
    });
    
    toast({
      title: "Staff profile created successfully!",
      description: `${data.name} can now login with username "${data.username}" or email "${data.email}"`,
    });
    navigate('/management/staff');
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

  const updateWorkingHours = (day: string, field: string, value: any) => {
    setWorkingHours((prev: any) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <PageLayout
      title="Add New Staff Member"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Staff Management", href: "/management/staff" },
        { title: "Add Staff", href: "/management/staff/add" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add New Staff Member</h2>
            <p className="text-muted-foreground">Create a new staff profile with login credentials</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/management/staff')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Staff
            </Button>
            <Button variant="outline" onClick={() => navigate('/management/staff')}>
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
                        <FormControl>
                          <Input
                            placeholder="DD/MM/YYYY"
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            value={dobInput}
                            onChange={(e) => setDobInput(e.target.value)}
                            onBlur={() => {
                              const v = dobInput.trim();
                              const parts = v.split('/');
                              if (parts.length === 3) {
                                const [d, m, y] = parts;
                                const day = Number(d);
                                const month = Number(m);
                                const year = Number(y);
                                if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
                                  const candidate = new Date(year, month - 1, day);
                                  const today = new Date();
                                  const eighteenYearsAgo = new Date(
                                    today.getFullYear() - 18,
                                    today.getMonth(),
                                    today.getDate()
                                  );
                                  const minDate = new Date('1900-01-01');
                                  if (candidate <= eighteenYearsAgo && candidate >= minDate) {
                                    form.clearErrors('dateOfBirth');
                                    field.onChange(candidate);
                                    return;
                                  }
                                }
                              }
                              form.setError('dateOfBirth', {
                                type: 'manual',
                                message: 'Enter valid date DD/MM/YYYY and must be 18+',
                              });
                            }}
                          />
                        </FormControl>
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
                    {loadingDepartments && (
                      <div className="px-2 py-1 text-sm text-muted-foreground">Loading departments…</div>
                    )}
                    {!loadingDepartments && departmentList.length === 0 && (
                      <SelectItem value="__no_departments__" disabled>
                        No departments available
                      </SelectItem>
                    )}
                    {departmentList.map((dept) => (
                      <SelectItem key={dept.id} value={dept.code}>
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
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 dark:text-gray-100">Position / Designation</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Sales Executive" className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
                </FormControl>
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
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="hr_manager">HR Manager</SelectItem>
                          </SelectContent>
                        </Select>
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
                           
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reportingManager"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ReportingManagerSelector
                            value={field.value || ''}
                            onChange={field.onChange}
                            label="Reporting Manager"
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

            {/* Login Credentials */}
            <LoginCredentials
              control={form.control}
              watchedEmail={watchedEmail}
              watchedName={watchedName}
              formErrors={form.formState.errors}
            />

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
                    department={selectedDeptName}
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

            {/* Working Hours */}
            <WorkingHoursSection
              workingHours={workingHours}
              onWorkingHoursChange={setWorkingHours}
            />

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" className="min-w-32">
                <Save className="mr-2 h-4 w-4" />
                Create Staff Profile
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PageLayout>
  );
};

export default AddStaff;
