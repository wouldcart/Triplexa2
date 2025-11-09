import { supabase } from '@/integrations/supabase/client';
// The generated Supabase types may not yet include newly added tables.
// Use a lightly-typed alias to avoid overload/type narrowing issues during CRUD.
const sb = supabase as any;

export type WorkingShift = {
  id?: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  label?: string;
};

export type WorkingHoursUI = Record<string, { isWorking: boolean; shifts: WorkingShift[] }>;

const dayKeyToIndex: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

const indexToDayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const normalizeUIHours = (ui: any): WorkingHoursUI => {
  const result: WorkingHoursUI = {} as any;
  indexToDayKey.forEach((day) => {
    const v = ui?.[day];
    if (v && Array.isArray(v.shifts)) {
      result[day] = { isWorking: !!v.isWorking, shifts: v.shifts as WorkingShift[] };
    } else {
      result[day] = { isWorking: !!v?.isWorking, shifts: [] };
    }
  });
  return result;
};

const mapUIToRows = (staffId: string, ui: WorkingHoursUI, timezone?: string) => {
  return Object.entries(ui).map(([day, data]) => ({
    staff_id: staffId,
    day_of_week: dayKeyToIndex[day] ?? 0,
    is_working: !!data.isWorking,
    shifts: data.shifts ? JSON.parse(JSON.stringify(data.shifts)) : [],
    timezone: timezone,
  }));
};

const mapRowsToUI = (rows: any[]): WorkingHoursUI => {
  const base: WorkingHoursUI = normalizeUIHours({});
  rows.forEach((r) => {
    const key = indexToDayKey[r.day_of_week ?? 0] ?? 'monday';
    base[key] = {
      isWorking: !!r.is_working,
      shifts: Array.isArray(r.shifts) ? r.shifts : [],
    };
  });
  return base;
};

export const staffWorkingHoursService = {
  async getWorkingHoursByStaff(staffId: string) {
    const { data, error } = await sb
      .from('staff_working_hours')
      .select('day_of_week, is_working, shifts, timezone')
      .eq('staff_id', staffId)
      .order('day_of_week', { ascending: true });
    if (error) {
      console.warn('Failed to load working hours', error);
      return { data: normalizeUIHours({}), error };
    }
    return { data: mapRowsToUI(((data || []) as any[])), error: null };
  },

  async getTimezoneByStaff(staffId: string) {
    const { data, error } = await sb
      .from('staff_working_hours')
      .select('timezone')
      .eq('staff_id', staffId)
      .limit(1);
    if (error) {
      console.warn('Failed to load staff timezone', error);
      return { timezone: null as string | null, error } as any;
    }
    const tz = Array.isArray(data) && data.length > 0 ? (data[0]?.timezone || null) : null;
    return { timezone: tz, error: null } as any;
  },

  async upsertWorkingHours(staffId: string, uiHours: any, timezone?: string) {
    const normalized = normalizeUIHours(uiHours);
    const rows = mapUIToRows(staffId, normalized, timezone);
    // Simple replace strategy: delete then insert to keep unique(day) invariant cleanly
    const del = await sb.from('staff_working_hours').delete().eq('staff_id', staffId);
    if (del.error) {
      console.warn('Failed to delete prior working hours', del.error);
      return { data: null, error: del.error };
    }
    const { data, error } = await sb.from('staff_working_hours').insert(rows as any).select();
    if (error) {
      console.warn('Failed to insert working hours', error);
      return { data: null, error };
    }
    return { data, error: null };
  },

  async deleteWorkingHoursForStaff(staffId: string) {
    const { error } = await sb.from('staff_working_hours').delete().eq('staff_id', staffId);
    return { error };
  },

  async setWorkingDay(
    staffId: string,
    dayKey: keyof WorkingHoursUI,
    payload: { isWorking: boolean; shifts: WorkingShift[]; timezone?: string }
  ) {
    const dayIndex = dayKeyToIndex[String(dayKey)];
    if (dayIndex == null) return { error: 'Invalid day' } as any;
    const row = {
      staff_id: staffId,
      day_of_week: dayIndex,
      is_working: !!payload.isWorking,
      shifts: payload.shifts ?? [],
      timezone: payload.timezone,
    };
    // Upsert via delete+insert for simplicity
    const del = await sb
      .from('staff_working_hours')
      .delete()
      .eq('staff_id', staffId)
      .eq('day_of_week', dayIndex);
    if (del.error) return { error: del.error };
    const { data, error } = await sb.from('staff_working_hours').insert(row as any).select().single();
    return { data, error };
  },
};