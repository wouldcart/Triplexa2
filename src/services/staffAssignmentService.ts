import { supabase } from '@/lib/supabaseClient';
import { StaffMember } from '@/types/assignment';
import { Query } from '@/types/query';
import { getBestCountryMatch } from '@/services/countryAssignmentService';

type StaffRow = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: string;
  status: string | null;
  avatar?: string | null;
  operational_countries?: string[] | null;
  position?: string | null;
};

// Use a relaxed Supabase client type to avoid type overloads
const sb = supabase as any;

/**
 * Fetch enhanced staff members from the database, including assignment counts
 * and operational countries. Preserves the Supabase UUID via a hidden `uuid` property.
 */
export async function fetchEnhancedStaff(): Promise<StaffMember[]> {
  try {
    // Prefer public.staff table for richer fields
    const { data: staffRows, error: staffErr } = await sb
      .from('staff')
      .select('id,name,email,department,role,status,avatar,operational_countries,position');
    if (staffErr) throw staffErr;

    // Fetch assignment history counts per staff
    const { data: historyRows, error: histErr } = await sb
      .from('assignment_history')
      .select('staff_id');
    if (histErr) throw histErr;

    const assignedCounts: Record<string, number> = {};
    (historyRows || []).forEach((r: any) => {
      const sid = String(r.staff_id);
      assignedCounts[sid] = (assignedCounts[sid] || 0) + 1;
    });

    // Map to StaffMember; preserve uuid for assignment operations
    const mapped: StaffMember[] = [];
    let nextId = 1;
    (staffRows || []).forEach((row: StaffRow) => {
      const expertise = Array.isArray(row.operational_countries) ? row.operational_countries : [];
      const assigned = assignedCounts[row.id] || 0;
      const staff: any = {
        id: nextId++,
        name: row.name || 'Staff Member',
        role: row.role || 'staff',
        email: row.email || '',
        active: (row.status || 'active') === 'active',
        assigned,
        avatar: row.avatar || '',
        expertise,
        workloadCapacity: (row.department || '').toLowerCase() === 'sales' ? 12 : 10,
        availability: [
          { day: 'Monday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
          { day: 'Tuesday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
          { day: 'Wednesday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
          { day: 'Thursday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
          { day: 'Friday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
          { day: 'Saturday', isAvailable: false },
          { day: 'Sunday', isAvailable: false },
        ],
        autoAssignEnabled: true,
        sequenceOrder: nextId - 1,
        department: row.department || 'General',
        experience: 3,
        specializations: row.position ? [row.position] : [],
        // Preserve Supabase UUID for assignment operations
        uuid: row.id,
        // Also include operationalCountries explicitly for country matching utility
        operationalCountries: Array.isArray(row.operational_countries) ? row.operational_countries : [],
      };
      mapped.push(staff as StaffMember);
    });

    // Augment with managers and super admins from profiles if not present in staff table
    const existingUuids = new Set((mapped || []).map((m: any) => String(m.uuid)));
    const { data: managerProfiles, error: mgrErr } = await sb
      .from('profiles')
      .select('id,name,email,role')
      .in('role', ['manager', 'super_admin']);
    if (mgrErr) throw mgrErr;

    (managerProfiles || []).forEach((p: any) => {
      const uuid = String(p?.id);
      if (existingUuids.has(uuid)) return; // avoid duplicates when profiles overlap with staff
      const staff: any = {
        id: nextId++,
        name: p?.name || 'Staff Member',
        role: p?.role || 'manager',
        email: p?.email || '',
        active: true,
        assigned: 0,
        avatar: '',
        expertise: [],
        workloadCapacity: 10,
        availability: [
          { day: 'Monday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
          { day: 'Tuesday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
          { day: 'Wednesday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
          { day: 'Thursday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
          { day: 'Friday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
          { day: 'Saturday', isAvailable: false },
          { day: 'Sunday', isAvailable: false },
        ],
        autoAssignEnabled: true,
        sequenceOrder: nextId - 1,
        department: 'Management',
        experience: 3,
        specializations: [],
        operationalCountries: [],
        uuid,
      };
      mapped.push(staff as StaffMember);
    });

    return mapped;
    } catch (e) {
    // Fallback: fetch minimal staff from profiles when staff table is unavailable
    try {
      const { data: profiles } = await sb
        .from('profiles')
        .select('id,name,email,role')
        .in('role', ['staff', 'manager', 'super_admin']);
      const minimal: StaffMember[] = (profiles || []).map((p: any, idx: number) => ({
        id: idx + 1,
        name: (p as any)?.name || 'Staff Member',
        role: (p as any)?.role || 'staff',
        email: (p as any)?.email || '',
        active: true,
        assigned: 0,
        avatar: '',
        expertise: [],
        workloadCapacity: 10,
        availability: [
          { day: 'Monday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
          { day: 'Tuesday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
          { day: 'Wednesday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
          { day: 'Thursday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
          { day: 'Friday', isAvailable: true, workingHours: { start: '09:00', end: '17:00' } },
          { day: 'Saturday', isAvailable: false },
          { day: 'Sunday', isAvailable: false },
        ],
        autoAssignEnabled: true,
        sequenceOrder: idx + 1,
        department: 'General',
        experience: 3,
        specializations: [],
        operationalCountries: [],
        uuid: (p as any)?.id,
      } as any));
      return minimal;
    } catch {
      return [];
    }
  }
}

/**
 * Filter available staff: active, auto-assign enabled, and under capacity.
 */
export function getAvailableStaff(staff: StaffMember[]): StaffMember[] {
  return (staff || [])
    .filter(s => s.active && s.autoAssignEnabled && s.assigned < s.workloadCapacity);
}

/**
 * Find best staff match for a query using country expertise first,
 * then enhanced scoring (destination expertise, package specialization, workload, experience),
 * and finally fallback to lowest workload ratio.
 */
export function findBestStaffMatch(query: Query, staff: StaffMember[]): StaffMember | null {
  const active = getAvailableStaff(staff);
  if (active.length === 0) return null;

  // Priority 1: Country-based matching
  const countryMatch = getBestCountryMatch(active, query);
  if (countryMatch) return countryMatch;

  // Priority 2: Enhanced matching from existing logic
  const destinations = [
    typeof query?.destination?.country === 'string' ? query.destination.country : '',
    ...((Array.isArray(query?.destination?.cities) ? query.destination.cities : []) as string[])
  ].filter(Boolean);

  const scoredStaff = active.map(s => {
    let score = 0;

    // Destination expertise match (string contains either way)
    const destinationMatch = destinations.some(dest =>
      (Array.isArray(s.expertise) ? s.expertise : [])
        .some(exp => exp.toLowerCase().includes(dest.toLowerCase()) || dest.toLowerCase().includes(exp.toLowerCase()))
    );
    if (destinationMatch) score += 50;

    // Package type specialization
    const pkg = typeof query?.packageType === 'string' ? query.packageType : '';
    const packageMatch = (s.specializations || [])
      .some(spec => spec.toLowerCase().includes(pkg.toLowerCase()));
    if (packageMatch) score += 30;

    // Workload factor (lower ratio is better)
    const workloadRatio = s.assigned / s.workloadCapacity;
    score += (1 - workloadRatio) * 20;

    // Experience bonus
    score += (s.experience || 0) * 2;

    return { staff: s, score };
  })
    .filter(entry => entry.staff.assigned < entry.staff.workloadCapacity)
    .sort((a, b) => b.score - a.score);

  if (scoredStaff.length > 0) {
    return scoredStaff[0].staff;
  }

  // Final fallback: choose lowest workload
  return active.sort((a, b) => (a.assigned / a.workloadCapacity) - (b.assigned / b.workloadCapacity))[0] || null;
}