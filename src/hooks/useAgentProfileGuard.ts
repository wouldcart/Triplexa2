import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface AgentProfileRow {
  id?: string;
  user_id?: string;
  name?: string | null;
  email?: string | null;
  profile_image?: string | null;
  agency_name?: string | null;
  business_type?: string | null;
  business_phone?: string | null;
  business_address?: string | null;
  country?: string | null;
  city?: string | null;
  status?: 'pending' | 'active' | 'inactive' | 'approved' | 'rejected' | 'suspended' | string | null;
  updated_at?: string | null;
}

export interface AgentProfileGuardResult {
  loading: boolean;
  error: string | null;
  agent: AgentProfileRow | null;
  completion: number; // 0..100
  status: string | null;
  shouldRedirect: boolean;
  shouldPopup: boolean;
  refresh: () => Promise<void>;
}

function isFilled(v: any): boolean {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'string') return v.trim().length > 0;
  return true;
}

export function useAgentProfileGuard(thresholdPercent: number = 50): AgentProfileGuardResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentProfileRow | null>(null);

  const fetchAgent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        setAgent(null);
        setError('Not authenticated');
        return;
      }
      const { data, error: agentErr } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();
      if (agentErr) {
        setError(agentErr.message || 'Failed to load agent');
        setAgent(null);
      } else {
        setAgent((data || null) as AgentProfileRow | null);
      }
    } catch (e: any) {
      setError(e?.message || 'Unexpected error');
      setAgent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgent(); }, [fetchAgent]);

  const completion = useMemo(() => {
    const fields: (keyof AgentProfileRow)[] = [
      'profile_image',
      'agency_name',
      'business_type',
      'business_phone',
      'name',
      'city',
      'country',
      'business_address',
    ];
    if (!agent) return 0;
    const filled = fields.reduce((acc, key) => acc + (isFilled((agent as any)[key]) ? 1 : 0), 0);
    return Math.round((filled / fields.length) * 100);
  }, [agent]);

  const status = useMemo(() => (agent?.status ?? null) as string | null, [agent]);

  // Business rules:
  // - Redirect if status is not 'active'.
  // - Show popup if status is 'active' but completion < threshold.
  const shouldRedirect = useMemo(() => {
    if (status === null) return false; // unknown -> let them pass
    return (status?.toLowerCase() !== 'active');
  }, [status]);

  const shouldPopup = useMemo(() => {
    if ((status || '').toLowerCase() !== 'active') return false;
    return completion < thresholdPercent;
  }, [status, completion, thresholdPercent]);

  return { loading, error, agent, completion, status, shouldRedirect, shouldPopup, refresh: fetchAgent };
}