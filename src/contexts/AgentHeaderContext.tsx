import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export type AgentHeader = {
  agency_name?: string;
  profile_image?: string;
};

interface AgentHeaderContextType {
  agentHeader: AgentHeader | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  clearError: () => void;
}

const AgentHeaderContext = createContext<AgentHeaderContextType | undefined>(undefined);

const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

export const AgentHeaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [agentHeader, setAgentHeader] = useState<AgentHeader | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadAgentHeader = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      // Determine user id
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id || user?.id;
      if (!userId) {
        setAgentHeader(null);
        return;
      }

      // Cache key per user
      const cacheKey = `agentHeader:${userId}`;
      const cachedStr = localStorage.getItem(cacheKey);
      const now = Date.now();

      if (!force && cachedStr) {
        try {
          const cached = JSON.parse(cachedStr) as { value: AgentHeader; timestamp: number };
          if (cached?.timestamp && (now - cached.timestamp) < CACHE_TTL_MS) {
            setAgentHeader(cached.value || null);
            return;
          }
        } catch (_) {
          // ignore cache parse error
        }
      }

      // Fetch from Supabase
      const { data, error: dbError } = await supabase
        .from('agents')
        .select('agency_name, profile_image')
        .eq('user_id', userId)
        .maybeSingle();

      if (dbError) {
        throw dbError;
      }

      const value: AgentHeader | null = data ? (data as AgentHeader) : null;
      setAgentHeader(value);

      // Persist cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ value, timestamp: now }));
      } catch (_) {
        // ignore localStorage errors
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load agent header';
      setError(message);
      setAgentHeader(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    await loadAgentHeader(true);
  }, [loadAgentHeader]);

  const clearError = () => setError(null);

  // Auto-load when user changes
  useEffect(() => {
    loadAgentHeader(false);
  }, [loadAgentHeader]);

  // Realtime subscription: auto-update header when agents row changes for current user
  useEffect(() => {
    let isMounted = true;
    let channel: any = null;

    const setupRealtime = async () => {
      try {
        // Resolve current user id
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id || user?.id;
        if (!userId) return;

        // Subscribe to changes on public.agents filtered by user_id
        channel = supabase
          .channel(`agent-header:${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'agents', filter: `user_id=eq.${userId}` },
            (payload: any) => {
              try {
                const row = (payload?.new || payload?.old || {}) as any;
                const value: AgentHeader = {
                  agency_name: row?.agency_name,
                  profile_image: row?.profile_image,
                };
                if (isMounted) {
                  setAgentHeader(value);
                }
                // Update cache
                const cacheKey = `agentHeader:${userId}`;
                try {
                  localStorage.setItem(cacheKey, JSON.stringify({ value, timestamp: Date.now() }));
                } catch (_) {}
              } catch (e) {
                // ignore payload errors
              }
            }
          )
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              // Optional: force refresh to hydrate immediately
              await loadAgentHeader(true);
            }
          });
      } catch (err) {
        // ignore subscription errors; context still works with manual refresh
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      try {
        if (channel) {
          supabase.removeChannel(channel);
        }
      } catch (_) {}
    };
  }, [user?.id, loadAgentHeader]);

  return (
    <AgentHeaderContext.Provider value={{ agentHeader, loading, error, refresh, clearError }}>
      {children}
    </AgentHeaderContext.Provider>
  );
};

export const useAgentHeader = () => {
  const ctx = useContext(AgentHeaderContext);
  if (!ctx) throw new Error('useAgentHeader must be used within AgentHeaderProvider');
  return ctx;
};