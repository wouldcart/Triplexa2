import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';

// Prefer admin client if configured for server-side writes
const dbClient: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;

const DB_LOGIN_TABLE = 'agent_login_records';
const DB_ACTIVE_TABLE = 'agent_active_sessions';

// Best-effort client IP capture via public API; falls back silently
const fetchClientIp = async (): Promise<string | undefined> => {
  try {
    const resp = await fetch('https://api.ipify.org?format=json');
    if (!resp.ok) return undefined;
    const data = await resp.json();
    return typeof data?.ip === 'string' ? data.ip : undefined;
  } catch {
    return undefined;
  }
};

export interface AgentLoginRecord {
  id: string;
  agentId: string;
  agentName: string;
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

export interface AgentActiveSession {
  agentId: string;
  agentName: string;
  loginTime: string;
  lastActivity: string;
  status: 'active';
  department?: string;
  city?: string;
  country?: string;
}

export type AgentLoginFilters = {
  department?: string;
  country?: string;
  city?: string;
};

const LOGIN_RECORDS_KEY = 'agent_login_records';
const ACTIVE_SESSIONS_KEY = 'active_agent_sessions';

export const getAgentLoginRecords = (): AgentLoginRecord[] => {
  console.warn('getAgentLoginRecords: use fetchAgentLoginRecords() for Supabase-backed data');
  return [];
};

export const getActiveAgentSessions = (): AgentActiveSession[] => {
  console.warn('getActiveAgentSessions: use fetchActiveAgentSessions() for Supabase-backed data');
  return [];
};

// Supabase-backed fetchers with local fallback
export const fetchAgentLoginRecords = async (limit: number = 1000, filters?: AgentLoginFilters): Promise<AgentLoginRecord[]> => {
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
      agentId: String(row.agent_id),
      agentName: String(row.agent_name || ''),
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
    console.warn('DB fetch agent login records failed, using local fallback:', e);
    return getAgentLoginRecords();
  }
};

export const fetchActiveAgentSessions = async (filters?: AgentLoginFilters): Promise<AgentActiveSession[]> => {
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
      agentId: String(row.agent_id),
      agentName: String(row.agent_name || ''),
      loginTime: String(row.login_time),
      lastActivity: String(row.last_activity),
      status: 'active',
      department: row.department || undefined,
      city: row.city || undefined,
      country: row.country || undefined,
    }));
  } catch (e) {
    console.warn('DB fetch active agent sessions failed, using local fallback:', e);
    return getActiveAgentSessions();
  }
};

export const recordAgentLogin = (agentId: string, agentName: string): string => {
  try {
    const loginId = `agent_login_${Date.now()}_${agentId}`;
    const loginTime = new Date().toISOString();

    // Supabase writes only (no local storage)
    (async () => {
      try {
        if (!dbClient) return;
        const resolvedIp = await fetchClientIp();

        // Try to enrich with department/city/country
        let department: string | undefined;
        let city: string | undefined;
        let country: string | undefined;
        try {
          // Prefer profiles for department; may also contain city/country
          const { data: profile } = await dbClient
            .from('profiles')
            .select('department, city, country')
            .eq('id', agentId)
            .maybeSingle();
          if (profile) {
            department = profile.department ?? undefined;
            city = profile.city ?? undefined;
            country = profile.country ?? undefined;
          }
        } catch {}

        if (!city || !country || !department) {
          try {
            // Fallback to agents table for city/country; use business_type as department fallback
            const { data: agentCore } = await dbClient
              .from('agents')
              .select('city, country, business_type')
              .or(`user_id.eq.${agentId},id.eq.${agentId}`)
              .limit(1)
              .maybeSingle();
            if (agentCore) {
              city = city ?? (agentCore as any).city ?? undefined;
              country = country ?? (agentCore as any).country ?? undefined;
              department = department ?? (agentCore as any).business_type ?? undefined;
            }
          } catch {}
        }

        const { error: loginErr } = await dbClient
          .from(DB_LOGIN_TABLE)
          .upsert({
            id: loginId, // text PK in schema
            agent_id: agentId,
            agent_name: agentName,
            login_time: loginTime,
            status: 'active',
            ip_address: resolvedIp ?? undefined,
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
            agent_id: agentId,
            agent_name: agentName,
            login_time: loginTime,
            last_activity: loginTime,
            status: 'active',
            login_record_id: loginId,
            department,
            city,
            country,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'agent_id' });
        if (sessErr) throw sessErr;
      } catch (dbWriteErr) {
        console.warn('Supabase agent login write failed:', dbWriteErr);
      }
    })();

    return loginId;
  } catch (error) {
    console.error('Error recording agent login:', error);
    return '';
  }
};

export const recordAgentLogout = (agentId: string): void => {
  try {
    const logoutTime = new Date().toISOString();
    (async () => {
      try {
        if (!dbClient) return;
        // Fetch active login record for this agent to compute duration
        const { data: activeRec, error: fetchErr } = await dbClient
          .from(DB_LOGIN_TABLE)
          .select('id,login_time')
          .eq('agent_id', agentId)
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
          .eq('agent_id', agentId)
          .eq('status', 'active');
        if (updErr) throw updErr;

        const { error: delErr } = await dbClient
          .from(DB_ACTIVE_TABLE)
          .delete()
          .eq('agent_id', agentId);
        if (delErr) throw delErr;
      } catch (dbErr) {
        console.warn('Supabase agent logout update failed:', dbErr);
      }
    })();
  } catch (error) {
    console.error('Error recording agent logout:', error);
  }
};

export const updateAgentActivity = (agentId: string): void => {
  try {
    (async () => {
      try {
        if (!dbClient) return;
        const { error } = await dbClient
          .from(DB_ACTIVE_TABLE)
          .update({ last_activity: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('agent_id', agentId);
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase agent activity update failed:', e);
      }
    })();
  } catch (error) {
    console.error('Error updating agent activity:', error);
  }
};

export const getAgentLoginHistory = (agentId: string, days: number = 30): AgentLoginRecord[] => {
  // Prefer Supabase; if offline, return empty rather than reading local storage
  // Callers that need async history should use fetchAgentLoginRecords directly
  console.warn('getAgentLoginHistory: use fetchAgentLoginRecords() for async Supabase data');
  return [];
};

export const isAgentCurrentlyActive = (agentId: string): boolean => {
  // Use Supabase-backed fetchers asynchronously in UI; sync method returns false
  console.warn('isAgentCurrentlyActive: use fetchActiveAgentSessions() for async Supabase data');
  return false;
};
