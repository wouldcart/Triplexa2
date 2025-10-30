
import { EnhancedStaffMember } from '@/types/staff';
import { supabase } from '@/integrations/supabase/client';

// Local storage source removed. Return empty array to avoid legacy fallback usage.
export const getStoredStaff = (): EnhancedStaffMember[] => {
  console.warn('getStoredStaff: local storage source removed; returning empty list');
  return [];
};

// Supabase-only helpers
export const fetchStaffFromSupabase = async (): Promise<EnhancedStaffMember[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, phone, department, role, status, employee_id, created_at, avatar')
      .eq('role', 'staff');

    if (error) {
      console.warn('Supabase profiles fetch failed:', error);
      return [];
    }

    const today = new Date().toISOString().slice(0, 10);
    const mapRow = (p: any): EnhancedStaffMember => ({
      id: p.id,
      name: p.name || (p.email ? String(p.email).split('@')[0] : 'Staff Member'),
      email: p.email || '',
      phone: p.phone || '',
      department: p.department || 'General',
      role: p.role || 'staff',
      status: ['active', 'inactive', 'on-leave'].includes(p?.status) ? p.status : 'active',
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
    });

    return (Array.isArray(data) ? data.map(mapRow) : []) as EnhancedStaffMember[];
  } catch (err) {
    console.warn('Error fetching staff from Supabase:', err);
    return [];
  }
};

export const saveStaffMember = (staffMember: EnhancedStaffMember): void => {
  (async () => {
    const payload: any = {
      ...(staffMember.id ? { id: staffMember.id } : {}),
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone || null,
      department: staffMember.department || null,
      role: staffMember.role || 'staff',
      position: staffMember.position || staffMember.role || null,
      status: staffMember.status || 'active',
      employee_id: staffMember.employeeId || null,
      avatar: staffMember.avatar || null,
      must_change_password: true,
    };
    const { error } = await supabase.from('profiles').insert(payload);
    if (error) console.error('Error saving staff to Supabase:', error);
  })().catch(e => console.error('Async error saving staff:', e));
};

export const getStaffById = (id: string): EnhancedStaffMember | null => {
  console.warn('getStaffById: local storage source removed; returning null');
  return null;
};

export const updateStaffMember = (id: string, updates: Partial<EnhancedStaffMember>): void => {
  (async () => {
    const payload: any = {};
    if (updates.name != null) payload.name = updates.name;
    if (updates.email != null) payload.email = updates.email;
    if (updates.phone != null) payload.phone = updates.phone;
    if (updates.department != null) payload.department = updates.department;
    if (updates.role != null) payload.role = updates.role;
    if (updates.position != null) payload.position = updates.position;
    if (updates.status != null) payload.status = updates.status;
    if (updates.employeeId != null) payload.employee_id = updates.employeeId;
    if (updates.avatar != null) payload.avatar = updates.avatar;
    payload.updated_at = new Date().toISOString();

    const { error } = await supabase.from('profiles').update(payload).eq('id', id);
    if (error) console.error('Error updating staff in Supabase:', error);
  })().catch(e => console.error('Async error updating staff:', e));
};

export const deleteStaffMember = (id: string): void => {
  (async () => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) console.error('Error deleting staff from Supabase:', error);
  })().catch(e => console.error('Async error deleting staff:', e));
};
