
import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';

// Prefer admin client if configured for server-side writes
const dbClient: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;

const DB_LOGIN_TABLE = 'staff_login_records';
const DB_ACTIVE_TABLE = 'staff_active_sessions';

export interface LoginRecord {
  id: string;
  staffId: string;
  staffName: string;
  loginTime: string;
  logoutTime?: string;
  duration?: number; // in minutes
  status: 'active' | 'logged-out';
  ipAddress?: string;
  userAgent?: string;
  department?: string;
  city?: string;
  country?: string;
}

export interface ActiveSession {
  staffId: string;
  staffName: string;
  loginTime: string;
  lastActivity: string;
  status: 'active';
  department?: string;
  city?: string;
  country?: string;
}

export type LoginFilters = {
  department?: string;
  country?: string;
  city?: string;
};

const LOGIN_RECORDS_KEY = 'staff_login_records';
const ACTIVE_SESSIONS_KEY = 'active_staff_sessions';

export const getLoginRecords = (): LoginRecord[] => {
  try {
    const stored = localStorage.getItem(LOGIN_RECORDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading login records:', error);
    return [];
  }
};

export const getActiveStaffSessions = (): ActiveSession[] => {
  try {
    const stored = localStorage.getItem(ACTIVE_SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading active sessions:', error);
    return [];
  }
};

// Supabase-backed fetchers with local fallback
export const fetchLoginRecords = async (limit: number = 1000, filters?: LoginFilters): Promise<LoginRecord[]> => {
  try {
    if (!dbClient) throw new Error('No Supabase client');
    let query = dbClient
      .from(DB_LOGIN_TABLE)
      .select('*')
      .order('login_time', { ascending: false })
      .limit(limit);

    if (filters?.department && filters.department !== 'all' && filters.department !== 'Unknown') {
      query = query.eq('department', filters.department);
    }
    if (filters?.country && filters.country !== 'all' && filters.country !== 'Unknown') {
      query = query.eq('country', filters.country);
    }
    if (filters?.city && filters.city !== 'all' && filters.city !== 'Unknown') {
      query = query.eq('city', filters.city);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!Array.isArray(data)) return [];
    return data.map((row: any) => ({
      id: String(row.id),
      staffId: String(row.staff_id),
      staffName: String(row.staff_name || ''),
      loginTime: String(row.login_time),
      logoutTime: row.logout_time ? String(row.logout_time) : undefined,
      duration: typeof row.duration_minutes === 'number' ? row.duration_minutes : undefined,
      status: (row.status === 'active' ? 'active' : 'logged-out'),
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
      department: row.department || undefined,
      city: row.city || undefined,
      country: row.country || undefined,
    }));
  } catch (e) {
    console.warn('DB fetch staff login records failed, using local fallback:', e);
    return getLoginRecords();
  }
};

export const fetchActiveStaffSessions = async (filters?: LoginFilters): Promise<ActiveSession[]> => {
  try {
    if (!dbClient) throw new Error('No Supabase client');
    let query = dbClient
      .from(DB_ACTIVE_TABLE)
      .select('*')
      .eq('status', 'active')
      .order('last_activity', { ascending: false });

    if (filters?.department && filters.department !== 'all' && filters.department !== 'Unknown') {
      query = query.eq('department', filters.department);
    }
    if (filters?.country && filters.country !== 'all' && filters.country !== 'Unknown') {
      query = query.eq('country', filters.country);
    }
    if (filters?.city && filters.city !== 'all' && filters.city !== 'Unknown') {
      query = query.eq('city', filters.city);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!Array.isArray(data)) return [];
    return data.map((row: any) => ({
      staffId: String(row.staff_id),
      staffName: String(row.staff_name || ''),
      loginTime: String(row.login_time),
      lastActivity: String(row.last_activity),
      status: 'active',
      department: row.department || undefined,
      city: row.city || undefined,
      country: row.country || undefined,
    }));
  } catch (e) {
    console.warn('DB fetch active staff sessions failed, using local fallback:', e);
    return getActiveStaffSessions();
  }
};

export const recordStaffLogin = (staffId: string, staffName: string): string => {
  try {
    const loginId = `staff_login_${Date.now()}_${staffId}`;
    const loginTime = new Date().toISOString();

    // Local storage fallback (for offline mode)
    try {
      const existingActive = getLoginRecords().find(r => r.staffId === staffId && r.status === 'active');
      const loginRecord: LoginRecord = existingActive || {
        id: loginId,
        staffId,
        staffName,
        loginTime,
        status: 'active',
        ipAddress: 'localhost',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      };
      const activeSession: ActiveSession = {
        staffId,
        staffName,
        loginTime,
        lastActivity: loginTime,
        status: 'active'
      };
      const existingRecords = getLoginRecords();
      if (!existingActive) {
        existingRecords.push(loginRecord);
        localStorage.setItem(LOGIN_RECORDS_KEY, JSON.stringify(existingRecords));
      }
      const activeSessions = getActiveStaffSessions();
      const idx = activeSessions.findIndex(s => s.staffId === staffId);
      if (idx !== -1) activeSessions[idx] = activeSession; else activeSessions.push(activeSession);
      localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(activeSessions));
    } catch {}

    // Supabase writes (best-effort, non-blocking)
    (async () => {
      try {
        if (!dbClient) return;

        // If already active, avoid duplicating login records; just update heartbeat
        try {
          const { data: existingActive } = await dbClient
            .from(DB_ACTIVE_TABLE)
            .select('staff_id, login_record_id')
            .eq('staff_id', staffId)
            .eq('status', 'active')
            .maybeSingle();
          if (existingActive) {
            const now = new Date().toISOString();
            await dbClient
              .from(DB_ACTIVE_TABLE)
              .update({ last_activity: now, updated_at: now })
              .eq('staff_id', staffId);
            return; // Skip creating a new login record
          }
        } catch {}

        // Attempt to enrich location/department from profiles
        let department: string | undefined;
        let city: string | undefined;
        let country: string | undefined;
        try {
          const { data: profile } = await dbClient
            .from('profiles')
            .select('department, city, country')
            .eq('id', staffId)
            .maybeSingle();
          if (profile) {
            department = (profile as any).department ?? undefined;
            city = (profile as any).city ?? undefined;
            country = (profile as any).country ?? undefined;
          }
        } catch {}

        const { error: loginErr } = await dbClient
          .from(DB_LOGIN_TABLE)
          .upsert({
            id: loginId,
            staff_id: staffId,
            staff_name: staffName,
            login_time: loginTime,
            status: 'active',
            ip_address: undefined,
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            department,
            city,
            country,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        if (loginErr) throw loginErr;

        const { error: sessErr } = await dbClient
          .from(DB_ACTIVE_TABLE)
          .upsert({
            staff_id: staffId,
            staff_name: staffName,
            login_time: loginTime,
            last_activity: loginTime,
            status: 'active',
            login_record_id: loginId,
            department,
            city,
            country,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'staff_id' });
        if (sessErr) throw sessErr;
      } catch (dbWriteErr) {
        console.warn('Supabase staff login write failed:', dbWriteErr);
      }
    })();

    return loginId;
  } catch (error) {
    console.error('Error recording staff login:', error);
    return '';
  }
};

export const recordStaffLogout = (staffId: string): void => {
  try {
    const logoutTime = new Date().toISOString();

    // Local fallback update
    try {
      const loginRecords = getLoginRecords();
      const activeRecord = loginRecords.find(
        record => record.staffId === staffId && record.status === 'active'
      );
      if (activeRecord) {
        activeRecord.logoutTime = logoutTime;
        activeRecord.status = 'logged-out';
        activeRecord.duration = Math.floor(
          (new Date(logoutTime).getTime() - new Date(activeRecord.loginTime).getTime()) / (1000 * 60)
        );
        localStorage.setItem(LOGIN_RECORDS_KEY, JSON.stringify(loginRecords));
      }
      const activeSessions = getActiveStaffSessions();
      const updatedSessions = activeSessions.filter(s => s.staffId !== staffId);
      localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(updatedSessions));
    } catch {}

    // Supabase updates (best-effort)
    (async () => {
      try {
        if (!dbClient) return;
        const { data: activeRec, error: fetchErr } = await dbClient
          .from(DB_LOGIN_TABLE)
          .select('id,login_time')
          .eq('staff_id', staffId)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();
        if (fetchErr) throw fetchErr;
        const loginTime = activeRec?.login_time ? new Date(activeRec.login_time).getTime() : null;
        const durationMinutes = loginTime ? Math.floor((new Date(logoutTime).getTime() - loginTime) / (1000 * 60)) : null;

        const { error: updErr } = await dbClient
          .from(DB_LOGIN_TABLE)
          .update({
            logout_time: logoutTime,
            status: 'logged-out',
            duration_minutes: durationMinutes ?? undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('staff_id', staffId)
          .eq('status', 'active');
        if (updErr) throw updErr;

        const { error: delErr } = await dbClient
          .from(DB_ACTIVE_TABLE)
          .delete()
          .eq('staff_id', staffId);
        if (delErr) throw delErr;
      } catch (dbErr) {
        console.warn('Supabase staff logout update failed:', dbErr);
      }
    })();
  } catch (error) {
    console.error('Error recording staff logout:', error);
  }
};

export const updateStaffActivity = (staffId: string): void => {
  try {
    // Local heartbeat
    try {
      const activeSessions = getActiveStaffSessions();
      const sessionIndex = activeSessions.findIndex(s => s.staffId === staffId);
      if (sessionIndex !== -1) {
        activeSessions[sessionIndex].lastActivity = new Date().toISOString();
        localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(activeSessions));
      }
    } catch {}

    // Supabase heartbeat
    (async () => {
      try {
        if (!dbClient) return;
        const now = new Date().toISOString();
        const { error } = await dbClient
          .from(DB_ACTIVE_TABLE)
          .update({ last_activity: now, updated_at: now })
          .eq('staff_id', staffId);
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase staff activity update failed:', e);
      }
    })();
  } catch (error) {
    console.error('Error updating staff activity:', error);
  }
};

export const getStaffLoginHistory = (staffId: string, days: number = 30): LoginRecord[] => {
  const records = getLoginRecords();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return records.filter(
    record => record.staffId === staffId && 
    new Date(record.loginTime) >= cutoffDate
  ).sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());
};

export const getTotalWorkingHours = (staffId: string, date: string): number => {
  const records = getLoginRecords();
  const targetDate = new Date(date).toDateString();
  
  const dayRecords = records.filter(record => {
    const recordDate = new Date(record.loginTime).toDateString();
    return record.staffId === staffId && recordDate === targetDate && record.duration;
  });
  
  return dayRecords.reduce((total, record) => total + (record.duration || 0), 0);
};

export const isStaffCurrentlyActive = (staffId: string): boolean => {
  const activeSessions = getActiveStaffSessions();
  return activeSessions.some(session => session.staffId === staffId);
};
