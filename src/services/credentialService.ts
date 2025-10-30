
import { User } from '@/types/User';
import { EnhancedStaffMember } from '@/types/staff';
import { AuthService } from '@/services/authService';
import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';

// Local credential storage has been removed in favor of Supabase-only auth.
// The following types and functions are retained as no-ops for backward compatibility
// and will be removed in a future cleanup.
interface StaffCredentials {
  id: string;
  staffId: string;
  username: string;
  password: string;
  temporaryPassword: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  lastPasswordChange?: string;
}

export const saveStaffCredentials = (_credentials: StaffCredentials): void => {
  console.warn('saveStaffCredentials is deprecated. Local storage has been removed; rely on Supabase auth only.');
};

export const getStoredCredentials = (): StaffCredentials[] => {
  console.warn('getStoredCredentials is deprecated. Local storage has been removed; returning empty list.');
  return [];
};

export const createUserFromStaff = (
  staff: EnhancedStaffMember, 
  username: string, 
  password: string,
  mustChangePassword: boolean = false
): User => {
  const user: User = {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    avatar: staff.avatar || `/avatars/avatar-${Math.floor(Math.random() * 5) + 1}.png`,
    role: mapStaffRoleToUserRole(staff.role, staff.department),
    department: staff.department,
    phone: staff.phone,
    status: staff.status === 'active' ? 'active' : 'inactive',
    position: staff.position || staff.role,
    workLocation: 'Head Office',
    employeeId: staff.employeeId,
    joinDate: staff.joinDate,
    reportingManager: staff.reportingManager,
    lastLogin: undefined,
    skills: staff.skills,
    certifications: staff.certifications,
    permissions: mapDepartmentToPermissions(staff.department, staff.role),
    languageAccess: true,
    preferredLanguage: 'en'
  };

  return user;
};

const mapStaffRoleToUserRole = (role: string, department: string): string => {
  const normalized = (role || '').trim().toLowerCase();

  // Preserve explicit UI roles; only collapse legacy/variants
  const shortCodeMap: { [key: string]: string } = {
    // Managerial roles
    'manager': 'manager',
    'hr_manager': 'hr_manager',
    'finance_manager': 'manager',

    // Staff/agent roles
    'staff': 'staff',
    'agent': 'agent',
    'sales_agent': 'agent',
    'senior agent': 'agent',
    'executive': 'agent',
  };

  if (shortCodeMap[normalized]) return shortCodeMap[normalized];

  // Legacy labels support
  const legacyMap: { [key: string]: string } = {
    'Manager': 'manager',
    'Senior Agent': 'agent',
    'Agent': 'agent',
    'Executive': 'agent',
    'HR Manager': 'hr_manager',
    'Finance Manager': 'manager',
    'Staff': 'staff'
  };

  return legacyMap[role] || 'agent';
};

const mapDepartmentToPermissions = (department: string, role: string): string[] => {
  const basePermissions: { [key: string]: string[] } = {
    'Sales': ['queries.view', 'queries.create', 'bookings.view', 'bookings.create'],
    'Operations': ['bookings.*', 'inventory.view', 'vendors.*'],
    'Customer Support': ['agents.*', 'tickets.*', 'communication.*'],
    'Human Resources': ['staff.*', 'hr.*', 'attendance.*', 'payroll.*'],
    'Finance': ['finance.*', 'reports.*', 'commission.*', 'billing.*'],
    'Field Sales': ['leads.*', 'agents.create', 'agents.view', 'territory.*'],
    'Marketing': ['inventory.view', 'queries.view']
  };

  const roleBonus: { [key: string]: string[] } = {
    'Manager': ['manage_staff', 'view_reports', 'manage_queries'],
    'Senior Agent': ['create_proposals', 'view_analytics']
  };

  const permissions = basePermissions[department] || ['queries.view'];
  const additionalPermissions = roleBonus[role] || [];

  return [...permissions, ...additionalPermissions];
};

export const syncStaffWithAuthSystem = async (
  staff: EnhancedStaffMember,
  username: string,
  password: string,
  mustChangePassword: boolean = true
): Promise<string | null> => {
  try {
    console.log('🔄 Syncing staff with auth system:', { name: staff.name, username, email: staff.email });

    // Attempt Supabase sign-up to create real auth user and profile
    // Use UI dropdown role exactly for public.profiles: staff | manager | hr_manager
    const uiRole = (staff.role || '').trim().toLowerCase();
    const roleForProfile = ['staff','manager','hr_manager'].includes(uiRole) ? uiRole : 'staff';
    const { user: remoteUser, error } = await AuthService.signUp(staff.email, password, {
      name: staff.name,
      role: roleForProfile,
      department: staff.department,
      phone: staff.phone,
      position: staff.position || staff.role,
      employee_id: staff.employeeId,
      must_change_password: mustChangePassword,
    });

    if (error) {
      console.warn('⚠️ Supabase signup failed:', error);
    }

    // Verify and hard-sync profiles/staff tables when remote user exists
    if (remoteUser && remoteUser.id) {
      try {
        const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;

        const expectedRole = roleForProfile;
        const expectedDepartment = staff.department;

        const { data: profileRow, error: profileErr } = await client
          .from('profiles' as any)
          .select('id, role, department, position, must_change_password')
          .eq('id', remoteUser.id)
          .maybeSingle();

        if (!profileErr && profileRow) {
          const profileUpdates: any = {};
          const currRole = String((profileRow as any)?.role || '').toLowerCase();
          const currDept = String((profileRow as any)?.department || '');
          const currPos = String((profileRow as any)?.position || '');
          const currMustChange = Boolean((profileRow as any)?.must_change_password === true);
          if (currRole !== expectedRole) profileUpdates.role = expectedRole;
          if (currDept !== expectedDepartment) profileUpdates.department = expectedDepartment;
          const desiredPosition = staff.position || staff.role;
          if (desiredPosition && currPos !== desiredPosition) profileUpdates.position = desiredPosition;
          if (!currMustChange) profileUpdates.must_change_password = true;
          if (Object.keys(profileUpdates).length > 0) {
            await client
              .from('profiles' as any)
              .update({ ...profileUpdates, updated_at: new Date().toISOString() })
              .eq('id', remoteUser.id);
          }
        }

        const { data: staffRow, error: staffErr } = await client
          .from('staff' as any)
          .select('id, role, department, join_date, date_of_birth, reporting_manager, operational_countries, user_id')
          .eq('id', remoteUser.id)
          .maybeSingle();

        if (staffErr || !staffRow) {
          await client
            .from('staff' as any)
            .upsert({
              id: remoteUser.id,
              user_id: remoteUser.id,
              name: staff.name,
              email: staff.email,
              phone: staff.phone,
              department: expectedDepartment,
              role: expectedRole,
              status: 'active',
              employee_id: staff.employeeId,
              join_date: staff.joinDate,
              reporting_manager: staff.reportingManager ?? null,
              date_of_birth: staff.dateOfBirth ?? null,
              operational_countries: Array.isArray(staff.operationalCountries) ? staff.operationalCountries : null,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        } else {
          const sRole = String((staffRow as any)?.role || '').toLowerCase();
          const sDept = String((staffRow as any)?.department || '');
          const staffUpdates: any = {};
          if (sRole !== expectedRole) staffUpdates.role = expectedRole;
          if (sDept !== expectedDepartment) staffUpdates.department = expectedDepartment;
          // Ensure extended fields are up-to-date
          const sJoin = String((staffRow as any)?.join_date || '');
          const sDob = String((staffRow as any)?.date_of_birth || '');
          const sMgr = String((staffRow as any)?.reporting_manager || '');
          const sCountries = Array.isArray((staffRow as any)?.operational_countries) ? (staffRow as any)?.operational_countries : [];
          if (staff.joinDate && staff.joinDate !== sJoin) staffUpdates.join_date = staff.joinDate;
          if (staff.dateOfBirth && staff.dateOfBirth !== sDob) staffUpdates.date_of_birth = staff.dateOfBirth;
          if (staff.reportingManager && staff.reportingManager !== sMgr) staffUpdates.reporting_manager = staff.reportingManager;
          if (Array.isArray(staff.operationalCountries)) {
            const incoming = staff.operationalCountries;
            const eq = Array.isArray(sCountries) && incoming.length === sCountries.length && incoming.every((c: any, idx: number) => String(c) === String(sCountries[idx]));
            if (!eq) staffUpdates.operational_countries = incoming;
          }
          if (Object.keys(staffUpdates).length > 0) {
            await client
              .from('staff' as any)
              .update({ ...staffUpdates, updated_at: new Date().toISOString() })
              .eq('id', remoteUser.id);
          }
        }
      } catch (verifyErr) {
        console.warn('⚠️ Verification sync failed (non-blocking):', verifyErr);
      }
    }

    console.log('✅ Staff synced with auth system successfully:', {
      staff: staff.name,
      username,
      email: staff.email,
      canLoginWith: ['username', 'email'],
      userId: remoteUser?.id || null,
      status: remoteUser?.status
    });
    return remoteUser?.id || null;
  } catch (error) {
    console.error('❌ Error syncing staff with auth system:', error);
    return null;
  }
};

export const getCredentialsByStaffId = (staffId: string): StaffCredentials | null => {
  console.warn('getCredentialsByStaffId is deprecated. Local storage has been removed; returning null.');
  return null;
};
