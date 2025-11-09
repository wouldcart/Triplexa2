import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Agent } from '@/types/agent';
import { agents as defaultAgents } from '@/data/agentData';
import { AgentStorageService } from '@/services/agentStorageService';

export interface SupabaseAgentOption {
  id: string;
  name: string;
  agencyName?: string;
  email?: string;
  phone?: string;
  agent_code?: string;
  country?: string;
  city?: string;
  status?: string;
  profile_image?: string;
  // Keep shape compatible with UI that expects stats
  stats: {
    totalQueries: number;
    totalBookings: number;
    conversionRate: number;
    revenueGenerated: number;
    averageBookingValue: number;
    activeCustomers: number;
  };
}

/**
 * Loads active agents from Supabase by joining public.agents with public.profiles.
 * Filters to status = 'active' (and optionally profiles.status = 'active').
 * Returns a simplified list of agent options for dropdown usage.
 */
export function useSupabaseAgentsList() {
  const [agents, setAgents] = useState<SupabaseAgentOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Map local Agent type to SupabaseAgentOption for UI compatibility
  const mapLocalAgent = (agent: Agent): SupabaseAgentOption => {
    return {
      id: String(agent.id),
      name: agent.name,
      agencyName: agent.type === 'company' ? agent.name : undefined,
      email: agent.email || agent.contact?.email,
      phone: agent.contact?.phone,
      agent_code: undefined,
      country: agent.country,
      city: agent.city,
      status: agent.status,
      profile_image: agent.profileImage,
      stats: {
        totalQueries: agent.stats?.totalQueries ?? 0,
        totalBookings: agent.stats?.totalBookings ?? 0,
        conversionRate: agent.stats?.conversionRate ?? 0,
        revenueGenerated: agent.stats?.revenueGenerated ?? 0,
        averageBookingValue: agent.stats?.averageBookingValue ?? 0,
        activeCustomers: agent.stats?.activeCustomers ?? 0,
      },
    };
  };

  const mapRow = (row: any): SupabaseAgentOption => {
    const profile = row?.profiles || row?.profile || null;
    const name = row?.name || row?.agency_name || profile?.name || 'Unknown Agent';
    const agencyName = row?.agency_name || undefined;
    const email = row?.email || profile?.email || undefined;
    const phone = row?.business_phone || profile?.phone || undefined;
    return {
      id: String(row?.id || row?.user_id || profile?.id || ''),
      name,
      agencyName,
      email,
      phone,
      agent_code: row?.agency_code || row?.agent_code || undefined,
      country: row?.country || undefined,
      city: row?.city || undefined,
      status: row?.status || profile?.status || undefined,
      profile_image: row?.profile_image || undefined,
      stats: {
        totalQueries: 0,
        totalBookings: 0,
        conversionRate: 0,
        revenueGenerated: 0,
        averageBookingValue: 0,
        activeCustomers: 0,
      },
    };
  };

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Primary: join agents with profiles to get full name and contact info
      const client: any = supabase as any;
      const { data, error: err } = await client
        .from('agents')
        .select(`
          id,
          status,
          agency_code,
          name,
          email,
          business_phone,
          profile_image,
          country,
          city,
          profiles:profiles(id, name, email, phone, status)
        `)
        .eq('status', 'active');

      if (err) {
        // Fallback: fetch agents without join (RLS or schema mismatch)
        const { data: agentsOnly, error: fallbackErr } = await client
          .from('agents')
          .select('id, status, agency_code, name, email, business_phone, profile_image, country, city')
          .eq('status', 'active');

        if (fallbackErr) {
          // If Supabase fetch completely fails, use local fallback sources
          const localStored = AgentStorageService.getAgents();
          const combinedLocal = [...defaultAgents, ...localStored];
          const localOptions = combinedLocal.map(mapLocalAgent);
          setAgents(localOptions);
          setLoading(false);
          return;
        }
        const options = (agentsOnly || []).map(mapRow);
        if (!options || options.length === 0) {
          const localStored = AgentStorageService.getAgents();
          const combinedLocal = [...defaultAgents, ...localStored];
          const localOptions = combinedLocal.map(mapLocalAgent);
          setAgents(localOptions);
        } else {
          setAgents(options);
        }
        setLoading(false);
        return;
      }

      const options = (data || []).map(mapRow);
      if (!options || options.length === 0) {
        const localStored = AgentStorageService.getAgents();
        const combinedLocal = [...defaultAgents, ...localStored];
        const localOptions = combinedLocal.map(mapLocalAgent);
        setAgents(localOptions);
      } else {
        setAgents(options);
      }
    } catch (e: any) {
      // On any error, attempt local fallback so UI still has data
      try {
        const localStored = AgentStorageService.getAgents();
        const combinedLocal = [...defaultAgents, ...localStored];
        const localOptions = combinedLocal.map(mapLocalAgent);
        setAgents(localOptions);
      } catch (fallbackErr) {
        console.warn('Local agent fallback failed', fallbackErr);
      }
      setError(e?.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Multi-field search across common agent attributes (name, agency, email, phone, city, country)
  const searchAgents = useCallback(async (term: string): Promise<SupabaseAgentOption[]> => {
    const q = (term || '').trim();
    if (!q) return agents;
    const like = `%${q}%`;
    try {
      const client: any = supabase as any;
      const { data, error: err } = await client
        .from('agents')
        .select(`
          id,
          status,
          agency_code,
          name,
          email,
          business_phone,
          country,
          city,
          alternate_email,
          mobile_numbers,
          profiles:profiles(id, name, email, phone, status)
        `)
        .or(
          [
            `name.ilike.${like}`,
            `agency_name.ilike.${like}`,
            `email.ilike.${like}`,
            `business_phone.ilike.${like}`,
            `alternate_email.ilike.${like}`,
            `mobile_numbers.ilike.${like}`,
            `city.ilike.${like}`,
            `country.ilike.${like}`,
          ].join(',')
        )
        .limit(50);

      if (err) throw err;
      return (data || []).map(mapRow);
    } catch (e) {
      // Fallback to client-side filtering of currently loaded list
      const lower = q.toLowerCase();
      return agents.filter((a) => {
        return [
          a.name,
          a.agencyName,
          a.email,
          a.phone,
          a.city,
          a.country,
          a.agent_code,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(lower));
      });
    }
  }, [agents]);

  return { agents, loading, error, reload: loadAgents, searchAgents };
}

// Helper: find an agent by a numeric ID coming from Query.agentId
// Matches against stringified `id` or `agent_code` for flexibility
export function findSupabaseAgentByNumericId(
  agents: SupabaseAgentOption[],
  numericId?: number | null
): SupabaseAgentOption | undefined {
  if (numericId == null) return undefined;
  const idStr = String(numericId);
  return agents.find((a) => a.id === idStr || a.agent_code === idStr);
}