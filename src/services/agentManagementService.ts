import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';
import { 
  ManagedAgent, 
  CreateAgentRequest, 
  UpdateAgentRequest, 
  AgentSignupRequest, 
  AgentFilters, 
  AgentApprovalRequest,
  StaffMember,
  AgentStatus
} from '../types/agentManagement';
import { storeAgentCredentials } from '@/utils/agentAuth';

export class AgentManagementService {
  // Helpers: detect missing table errors and localStorage fallback
  private static isMissingTableError(error: any): boolean {
    // Handle Supabase/PostgREST variants like PGRST205 and message wording
    const code = (error && error.code) || '';
    const msg = (error && (error.message || error)) || '';
    const text = typeof msg === 'string' ? msg.toLowerCase() : '';
    return (
      code === 'PGRST205' ||
      text.includes('could not find the table') ||
      text.includes('schema cache') ||
      text.includes('does not exist')
    );
  }

  // Detect auth, permission or RLS-related errors to enable safe fallback
  private static isAuthOrPermissionError(error: any): boolean {
    const msg = (error && (error.message || error)) || '';
    if (typeof msg !== 'string') return false;
    const m = msg.toLowerCase();
    return (
      m.includes('permission denied') ||
      m.includes('row level security') ||
      m.includes('rls') ||
      m.includes('not authenticated') ||
      m.includes('auth') && m.includes('error') ||
      m.includes('jwt') ||
      m.includes('insert permission denied')
    );
  }

  private static readAgentsFromStorage(): ManagedAgent[] {
    try {
      const raw = localStorage.getItem('managed_agents_fallback');
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  private static writeAgentsToStorage(agents: ManagedAgent[]): void {
    try {
      localStorage.setItem('managed_agents_fallback', JSON.stringify(agents));
    } catch {}
  }
  // Get all agents with optional filters (public.agents merged with profiles)
  static async getAgents(filters?: AgentFilters): Promise<{ data: ManagedAgent[] | null; error: any }> {
    try {
      let agentQuery = (supabase as any)
        .from('agents' as any)
        .select('id,user_id,status,created_at,updated_at,created_by,source_type,source_details,agency_name,name,email,business_phone,profile_image,country,city,suspension_reason,suspended_at,suspended_by')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        agentQuery = agentQuery.eq('status', filters.status);
      }

      // Attempt to restrict view for staff users (best-effort without relying on missing columns)
      let currentUserId: string | undefined;
      let currentRole: string | undefined;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id;
        // TEMPORARILY DISABLED: profiles query causing RLS infinite recursion
        // TODO: Fix RLS policies on profiles table to enable role-based filtering
        /*
        if (currentUserId) {
          const { data: me } = await supabase
            .from('profiles')
            .select('id,role')
            .eq('id', currentUserId)
            .maybeSingle();
          currentRole = (me as any)?.role;
        }
        */
        // Note: strict DB-side filtering by creator is disabled because agents.created_by is not available
      } catch {}

      const { data: agentsCore, error: agentsError } = await agentQuery;

      if (agentsError && this.isMissingTableError(agentsError)) {
        // Fallback to localStorage
        let agents = this.readAgentsFromStorage();
        if ((currentRole || '').toLowerCase() === 'staff' && currentUserId) {
          agents = agents.filter(a => (a.created_by || '') === currentUserId);
        }
        if (filters?.status) {
          agents = agents.filter(a => a.status === filters.status);
        }
        if (filters?.search) {
          const s = (filters.search || '').toLowerCase();
           agents = agents.filter(a =>
             (a.name || '').toLowerCase().includes(s) ||
             (a.email || '').toLowerCase().includes(s) ||
             (a.company_name || '').toLowerCase().includes(s)
           );
        }
        if (filters?.assigned_staff) {
          agents = agents.filter(a => (a.assigned_staff || []).includes(filters.assigned_staff!));
        }
        return { data: agents, error: null };
      }

      if (!agentsCore || agentsCore.length === 0) {
        return { data: [], error: null };
      }

      const ids = agentsCore.map(a => a.id);
      // TEMPORARILY DISABLED: profiles query causing RLS infinite recursion
      // const { data: profiles, error: profilesError } = await (supabase as any)
      //   .from('profiles' as any)
      //   .select('id,name,email,phone,company_name,created_at,updated_at,role')
      //   .in('id', ids);

      // if (profilesError) {
      //   return { data: null, error: profilesError };
      // }
      
      // Use empty profiles array to avoid recursion
      const profiles: any[] = [];

      const profileMap = new Map<string, any>();
      (profiles || []).forEach(p => profileMap.set(p.id, p));

      let merged: ManagedAgent[] = agentsCore.map((a: any) => {
        const p = profileMap.get(a.id) || {};
        // Prefer values from agents table; fall back to profiles if enabled later
        const name = (a as any)?.name || (p as any)?.name || '';
        const email = (a as any)?.email || (p as any)?.email || '';
        const phone = (a as any)?.business_phone || (p as any)?.phone || '';
        const company_name = (p as any)?.company_name || (a as any)?.agency_name || '';
        const created_at = (a as any)?.created_at || (p as any)?.created_at || new Date().toISOString();
        const updated_at = (a as any)?.updated_at || (p as any)?.updated_at || created_at;
        return {
          id: a.id,
          user_id: (a as any)?.user_id,
          name,
          email,
          phone,
          company_name,
          profile_image: (a as any)?.profile_image ?? (p as any)?.profile_image ?? undefined,
          country: (a as any)?.country ?? (p as any)?.country ?? undefined,
          city: (a as any)?.city ?? (p as any)?.city ?? undefined,
          status: (a.status as AgentStatus) || ('pending' as AgentStatus),
          role: 'agent',
          source_type: a.source_type,
          source_details: a.source_details,
          created_by: a.created_by,
          assigned_staff: [],
          login_credentials: {},
          suspension_reason: (a as any)?.suspension_reason ?? undefined,
          suspended_at: (a as any)?.suspended_at ?? undefined,
          suspended_by: (a as any)?.suspended_by ?? undefined,
          created_at,
          updated_at
        } as ManagedAgent;
      });

      if (filters?.search) {
        const s = filters.search.toLowerCase();
        merged = merged.filter(a =>
          (a.name || '').toLowerCase().includes(s) ||
          (a.email || '').toLowerCase().includes(s) ||
          (a.company_name || '').toLowerCase().includes(s)
        );
      }

      return { data: merged, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get a single agent by ID (agents + profiles)
  static async getAgentById(id: string): Promise<{ data: ManagedAgent | null; error: any }> {
    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { data: agentCore, error: agentError } = await (client as any)
        .from('agents' as any)
        // Read all relevant agent-owned columns
        .select('id,user_id,status,created_at,updated_at,created_by,source_type,source_details,agency_name,agency_code,name,email,country,city,preferred_language,business_type,commission_type,commission_value,profile_image,business_phone,business_address,license_number,iata_number,specializations,website,alternate_email,mobile_numbers,documents,suspension_reason,suspended_at,suspended_by')
        .eq('id', id)
        .maybeSingle();

      if (agentError && this.isMissingTableError(agentError)) {
        // Final fallback: try Supabase Auth admin lookup to hydrate minimal agent
        if (isAdminClientConfigured && adminSupabase) {
          try {
            const { data: adminUserData, error: adminUserError } = await (adminSupabase as any).auth.admin.getUserById(id);
            if (!adminUserError && adminUserData?.user) {
              const u = (adminUserData as any).user;
              const mergedFromAuth: ManagedAgent = {
                id: u.id,
                user_id: u.id,
                name: (u.user_metadata?.name as string) || '',
                email: (u.email as string) || '',
                phone: undefined,
                company_name: '',
                profile_image: undefined,
                country: undefined,
                city: undefined,
                status: ('inactive' as AgentStatus),
                role: 'agent',
                source_type: 'other',
                source_details: 'Derived from auth user',
                created_by: undefined,
                assigned_staff: [],
                login_credentials: {},
                created_at: (u.created_at as string) || new Date().toISOString(),
                updated_at: (u.updated_at as string) || (u.created_at as string) || new Date().toISOString()
              };
              return { data: mergedFromAuth, error: null };
            }
          } catch {}
        }

        // Final fallback: try Supabase Auth admin lookup to hydrate minimal agent
        if (isAdminClientConfigured && adminSupabase) {
          try {
            const { data: adminUserData, error: adminUserError } = await (adminSupabase as any).auth.admin.getUserById(id);
            if (!adminUserError && adminUserData?.user) {
              const u = (adminUserData as any).user;
              const mergedFromAuth: ManagedAgent = {
                id: u.id,
                name: (u.user_metadata?.name as string) || '',
                email: (u.email as string) || '',
                phone: undefined,
                company_name: '',
                profile_image: undefined,
                country: undefined,
                city: undefined,
                status: ('inactive' as AgentStatus),
                role: 'agent',
                source_type: 'other',
                source_details: 'Derived from auth user',
                created_by: undefined,
                assigned_staff: [],
                login_credentials: {},
                created_at: (u.created_at as string) || new Date().toISOString(),
                updated_at: (u.updated_at as string) || (u.created_at as string) || new Date().toISOString()
              };
              return { data: mergedFromAuth, error: null };
            }
          } catch {}
        }

        const agents = this.readAgentsFromStorage();
        const found = agents.find(a => a.id === id) || null;
        return { data: found, error: found ? null : 'Not found' };
      }

      if (!agentCore) {
        // Try lookup by user_id first, then hydrate from profiles when missing
        try {
          const { data: byUser } = await (client as any)
            .from('agents' as any)
            .select('id,status,created_at,updated_at,created_by,source_type,source_details,agency_name,name,email,country,city,preferred_language,business_type,commission_type,commission_value,profile_image,business_phone,business_address,license_number,iata_number,specializations,website,alternate_email,mobile_numbers,documents,suspension_reason,suspended_at,suspended_by,user_id')
            .eq('user_id', id)
            .maybeSingle();
          if (byUser) {
            const merged: ManagedAgent = {
              id: (byUser as any)?.id || id,
              user_id: (byUser as any)?.user_id || id,
              name: (byUser as any)?.name || (byUser as any)?.agency_name || '',
              email: (byUser as any)?.email || '',
              phone: (byUser as any)?.business_phone || undefined,
              company_name: (byUser as any)?.agency_name || '',
              profile_image: (byUser as any)?.profile_image ?? undefined,
              country: (byUser as any)?.country ?? undefined,
              city: (byUser as any)?.city ?? undefined,
              status: ((byUser as any)?.status as AgentStatus) || ('pending' as AgentStatus),
              role: 'agent',
              type: (byUser as any)?.business_type || undefined,
              commission_type: (byUser as any)?.commission_type || undefined,
              commission_value: (byUser as any)?.commission_value || undefined,
              source_type: (byUser as any)?.source_type,
              source_details: (byUser as any)?.source_details,
              created_by: (byUser as any)?.created_by,
              assigned_staff: [],
              login_credentials: {},
              created_at: (byUser as any)?.created_at || new Date().toISOString(),
              updated_at: (byUser as any)?.updated_at || new Date().toISOString(),
              business_phone: (byUser as any)?.business_phone || undefined,
              business_address: (byUser as any)?.business_address || undefined,
              license_number: (byUser as any)?.license_number || undefined,
              iata_number: (byUser as any)?.iata_number || undefined,
              specializations: (byUser as any)?.specializations || undefined,
              preferred_language: (byUser as any)?.preferred_language ?? undefined,
              alternate_email: (byUser as any)?.alternate_email || undefined,
              website: (byUser as any)?.website || undefined,
              partnership: (byUser as any)?.partnership || undefined,
              mobile_numbers: (byUser as any)?.mobile_numbers || undefined,
              suspension_reason: (byUser as any)?.suspension_reason ?? undefined,
              suspended_at: (byUser as any)?.suspended_at ?? undefined,
              suspended_by: (byUser as any)?.suspended_by ?? undefined,
            };
            return { data: merged, error: null };
          }
        } catch {}
        // Fallback: try to hydrate from profiles when agents row is missing
        try {
          const { data: profile } = await (client as any)
            .from('profiles' as any)
            .select('id,name,email,phone,company_name,profile_image,country,city,created_at,updated_at')
            .eq('id', id)
            .maybeSingle();

          if (profile) {
            const merged: ManagedAgent = {
              id,
              user_id: id,
              name: (profile as any)?.name || '',
              email: (profile as any)?.email || '',
              phone: (profile as any)?.phone || undefined,
              company_name: (profile as any)?.company_name || '',
              profile_image: (profile as any)?.profile_image ?? undefined,
              country: (profile as any)?.country ?? undefined,
              city: (profile as any)?.city ?? undefined,
              status: ('inactive' as AgentStatus),
              role: 'agent',
              source_type: 'other',
              source_details: 'Derived from profile',
              created_by: undefined,
              assigned_staff: [],
              login_credentials: {},
              created_at: (profile as any)?.created_at || new Date().toISOString(),
              updated_at: (profile as any)?.updated_at || new Date().toISOString()
            };
            return { data: merged, error: null };
          }
        } catch {}

        // Fallback: try to hydrate from profiles when agents row is missing
        try {
          const { data: profile } = await (client as any)
            .from('profiles' as any)
            .select('id,name,email,phone,company_name,profile_image,country,city,created_at,updated_at')
            .eq('id', id)
            .maybeSingle();

          if (profile) {
            const merged: ManagedAgent = {
              id,
              name: (profile as any)?.name || '',
              email: (profile as any)?.email || '',
              phone: (profile as any)?.phone || undefined,
              company_name: (profile as any)?.company_name || '',
              profile_image: (profile as any)?.profile_image ?? undefined,
              country: (profile as any)?.country ?? undefined,
              city: (profile as any)?.city ?? undefined,
              status: ('inactive' as AgentStatus),
              role: 'agent',
              source_type: 'other',
              source_details: 'Derived from profile',
              created_by: undefined,
              assigned_staff: [],
              login_credentials: {},
              created_at: (profile as any)?.created_at || new Date().toISOString(),
              updated_at: (profile as any)?.updated_at || new Date().toISOString()
            };
            return { data: merged, error: null };
          }
        } catch {}

        const agents = this.readAgentsFromStorage();
        const found = agents.find(a => a.id === id) || null;
        return { data: found, error: found ? null : 'Not found' };
      }

      const merged: ManagedAgent = {
        id,
        user_id: (agentCore as any)?.user_id || id,
        name: (agentCore as any)?.name || (agentCore as any)?.agency_name || '',
        email: (agentCore as any)?.email || '',
        phone: (agentCore as any)?.business_phone || undefined,
        company_name: (agentCore as any)?.agency_name || '',
        agency_code: (agentCore as any)?.agency_code || undefined,
        profile_image: (agentCore as any)?.profile_image ?? undefined,
        country: (agentCore as any)?.country ?? undefined,
        city: (agentCore as any)?.city ?? undefined,
        status: (agentCore.status as AgentStatus) || ('pending' as AgentStatus),
        role: 'agent',
        type: (agentCore as any)?.business_type || undefined,
        commission_type: (agentCore as any)?.commission_type || undefined,
        commission_value: (agentCore as any)?.commission_value || undefined,
        source_type: (agentCore as any)?.source_type,
        source_details: (agentCore as any)?.source_details,
        created_by: (agentCore as any)?.created_by,
        assigned_staff: [],
        login_credentials: {},
        created_at: (agentCore as any)?.created_at || new Date().toISOString(),
        updated_at: (agentCore as any)?.updated_at || new Date().toISOString(),
        // Extended fields
        business_phone: (agentCore as any)?.business_phone || undefined,
        business_address: (agentCore as any)?.business_address || undefined,
        license_number: (agentCore as any)?.license_number || undefined,
        iata_number: (agentCore as any)?.iata_number || undefined,
        specializations: (agentCore as any)?.specializations || undefined,
        preferred_language: (agentCore as any)?.preferred_language ?? undefined,
        alternate_email: (agentCore as any)?.alternate_email || undefined,
        website: (agentCore as any)?.website || undefined,
        partnership: (agentCore as any)?.partnership || undefined,
        // note: mobile_numbers in agentCore is array or null
        mobile_numbers: (agentCore as any)?.mobile_numbers || undefined,
        suspension_reason: (agentCore as any)?.suspension_reason ?? undefined,
        suspended_at: (agentCore as any)?.suspended_at ?? undefined,
        suspended_by: (agentCore as any)?.suspended_by ?? undefined,
      };

      return { data: merged, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Create a new agent (by admin/staff) -> create profile + agents row
  static async createAgent(agentData: CreateAgentRequest): Promise<{ data: ManagedAgent | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const defaultStatus: AgentStatus = 'inactive';

      // Resolve creator profile for source attribution
      let creatorProfile: { id: string; name?: string; role?: string; email?: string } | null = null;
      if (user?.id) {
        try {
          const { data: cp } = await supabase.from('profiles').select('id,name,role,email').eq('id', user.id).maybeSingle();
          creatorProfile = (cp as any) || null;
        } catch {}
      }

      // Use admin client to create user, profile, and agent records to bypass RLS
      // If admin client is not available (browser/dev env), gracefully fall back to local storage
      if (!isAdminClientConfigured || !adminSupabase) {
        const now = new Date().toISOString();
        const creatorLabel = (creatorProfile?.role || '').toLowerCase() === 'admin' ? 'Admin' : 'Staff';
        const sourceDetails = creatorProfile
          ? `Created by ${creatorLabel}: ${creatorProfile.name || creatorProfile.email || ''}`
          : (user?.email ? `Created by: ${user.email}` : 'Created internally');

        // Generate a local id for temporary storage (will be reconciled when the agent signs up/logs in)
        const localId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
          ? (crypto as any).randomUUID()
          : `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

        const newAgent: ManagedAgent = {
          id: localId,
          name: agentData.name,
          email: agentData.email,
          phone: agentData.phone,
          company_name: agentData.company_name || '',
          status: agentData.status || defaultStatus,
          role: 'agent',
          source_type: 'other',
          source_details: sourceDetails,
          created_by: creatorProfile?.id || user?.id || undefined,
          assigned_staff: Array.isArray(agentData.assigned_staff) ? agentData.assigned_staff : [],
          login_credentials: {},
          created_at: now,
          updated_at: now,
          // Optional extended fields default undefined
          country: undefined,
          city: undefined,
          type: undefined,
        } as ManagedAgent;

        const stored = this.readAgentsFromStorage();
        stored.unshift(newAgent);
        this.writeAgentsToStorage(stored);

        return { data: newAgent, error: null };
      }

      const adminAuth = (adminSupabase as any).auth.admin;

      // Check if user already exists (Supabase JS v2 does not provide getUserByEmail)
      // Use listUsers and filter by email instead
      let userId: string | undefined;
      try {
        const { data: users, error: listErr } = await adminAuth.listUsers();
        if (listErr) {
          console.warn('Error listing users:', listErr.message);
        } else {
          const existing = users?.users?.find((u: any) => String(u.email || '').toLowerCase() === String(agentData.email || '').toLowerCase());
          userId = existing?.id;
        }
      } catch (e: any) {
        console.warn('Error checking for existing user via listUsers:', e?.message || e);
      }

      // If user does not exist, create them
      if (!userId) {
        const { data: newUser, error: inviteError } = await adminAuth.inviteUserByEmail(agentData.email, {
          redirectTo: `${window.location.origin}/login`,
          data: {
            role: 'agent',
            name: agentData.name,
            phone: agentData.phone,
            company_name: agentData.company_name
          }
        });

        if (inviteError) {
          console.warn('Admin invite error:', inviteError.message);
          return { data: null, error: inviteError };
        }
        userId = newUser?.user?.id;
      }

      if (!userId) {
        return { data: null, error: new Error('Failed to create or find user.') };
      }

      // Upsert profile (admin client bypasses RLS)
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .upsert({
          id: userId,
          name: agentData.name,
          email: agentData.email,
          phone: agentData.phone,
          company_name: agentData.company_name,
          role: 'agent',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (profileError) {
        console.warn('Profile upsert error:', profileError.message);
        return { data: null, error: profileError };
      }

      // Upsert agent row (admin client)
      // Use primary key conflict target 'id' to avoid requiring a unique index on user_id
      const creatorLabel = (creatorProfile?.role || '').toLowerCase() === 'admin' ? 'Admin' : 'Staff';
      const sourceDetails = creatorProfile
        ? `Created by ${creatorLabel}: ${creatorProfile.name || creatorProfile.email || ''}`
        : (user?.email ? `Created by: ${user.email}` : 'Created internally');

      const { data: agentCore, error: adminAgentErr } = await (adminSupabase as any)
        .from('agents' as any)
        .upsert({
          id: userId,
          user_id: userId,
          status: agentData.status || defaultStatus,
          created_by: creatorProfile?.id || user?.id || null,
          // Use union-safe value; carry specifics in source_details
          source_type: 'other',
          source_details: sourceDetails,
        }, { onConflict: 'id' })
        .select('id,status,created_at,updated_at,created_by,source_type,source_details')
        .single();

      if (adminAgentErr) {
        console.warn('Agent upsert error:', adminAgentErr.message);
        return { data: null, error: adminAgentErr };
      }

      // Generate temporary DB-backed credentials
      let loginCreds: { username?: string; temporaryPassword?: string } = {};
      try {
        const { data: creds } = await this.generateCredentials(agentCore.id);
        if (creds) {
          loginCreds = {
            username: creds.username,
            temporaryPassword: creds.temporaryPassword
          };
        }
      } catch (e) {
        console.warn('Credential generation failed:', e);
      }

      // Persist staff assignments if provided
      if (agentData.assigned_staff && agentData.assigned_staff.length > 0 && userId) {
        const assignments = agentData.assigned_staff.map(staffId => ({
          agent_id: userId,
          staff_id: staffId,
          assigned_by: creatorProfile?.id || user?.id || null,
          notes: agentData.notes || null, // Use notes from agentData
          assigned_at: new Date().toISOString(),
        }));

        const { error: assignmentError } = await (adminSupabase as any)
          .from('agent_staff_assignments')
          .insert(assignments);

        if (assignmentError) {
          console.warn('Error persisting staff assignments:', assignmentError.message);
          // Do not block agent creation if assignment fails
        }
      }

      const merged: ManagedAgent = {
        id: agentCore.id,
        name: agentData.name,
        email: agentData.email,
        phone: agentData.phone,
        company_name: agentData.company_name || '',
        status: (agentCore.status as AgentStatus) || defaultStatus,
        role: 'agent',
        source_type: (agentCore as any)?.source_type || 'other',
        source_details: (agentCore as any)?.source_details || sourceDetails,
        created_by: (agentCore as any)?.created_by || creatorProfile?.id || user?.id || undefined,
        assigned_staff: agentData.assigned_staff || [], // Reflect assigned staff in the returned object
        login_credentials: loginCreds,
        created_at: agentCore.created_at || new Date().toISOString(),
        updated_at: agentCore.updated_at || new Date().toISOString()
      };

      return { data: merged, error: null };

    } catch (error) {
      return { data: null, error };
    }
  }

  // Update an existing agent (profiles + agents extended fields)
  static async updateAgent(agentData: UpdateAgentRequest): Promise<{ data: ManagedAgent | null; error: any }> {
    try {
      const {
        id,
        status,
        name,
        email,
        phone,
        company_name,
        profile_image,
        preferred_language,
        country,
        city,
        type,
        commission_type,
        commission_value,
        source_type,
        source_details,
        // extended
        business_phone,
        business_address,
        license_number,
        iata_number,
        specializations,
        alternate_email,
        website,
        partnership,
        mobile_numbers,
      } = agentData;

      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;

      // Profiles update removed; all fields now persisted in 'agents' table.

      // Build agents update payload
      const agentUpdate: any = {};
      if (status !== undefined) agentUpdate.status = status;
      if (type !== undefined) agentUpdate.business_type = type;
      if (commission_type !== undefined) agentUpdate.commission_type = commission_type;
      if (commission_value !== undefined) agentUpdate.commission_value = typeof commission_value === 'string' ? parseFloat(commission_value) : commission_value as any;
      if (source_type !== undefined) agentUpdate.source_type = source_type;
      if (source_details !== undefined) agentUpdate.source_details = source_details;
      // Keep agents table in sync: map company_name → agency_name
      if (company_name !== undefined) agentUpdate.agency_name = company_name;
      if (country !== undefined) agentUpdate.country = country;
      if (city !== undefined) agentUpdate.city = city;
      // Core identity fields
      if (name !== undefined) agentUpdate.name = name;
      if (email !== undefined) agentUpdate.email = email;
      if (profile_image !== undefined) agentUpdate.profile_image = profile_image;
      if (preferred_language !== undefined) agentUpdate.preferred_language = preferred_language;
      // Extended fields in agents table
      if (business_phone !== undefined) agentUpdate.business_phone = business_phone;
      if (business_address !== undefined) agentUpdate.business_address = business_address;
      if (license_number !== undefined) agentUpdate.license_number = license_number;
      if (iata_number !== undefined) agentUpdate.iata_number = iata_number;
      if (specializations !== undefined) agentUpdate.specializations = specializations as any;
      if (alternate_email !== undefined) agentUpdate.alternate_email = alternate_email;
      if (website !== undefined) agentUpdate.website = website;
      if (mobile_numbers !== undefined) agentUpdate.mobile_numbers = mobile_numbers;

      if (Object.keys(agentUpdate).length > 0) {
        const { error: agentErr } = await client
          .from('agents')
          .upsert({ id, user_id: id, ...agentUpdate }, { onConflict: 'id' });
        // If there is a hard Supabase error (not missing table or permission), bubble it up.
        if (agentErr && !this.isMissingTableError(agentErr) && !this.isAuthOrPermissionError(agentErr)) {
          return { data: null, error: agentErr };
        }

        // Fallback path: if table is missing or RLS/permission blocks writes, persist to local storage
        if (agentErr && (this.isMissingTableError(agentErr) || this.isAuthOrPermissionError(agentErr))) {
          const now = new Date().toISOString();
          const stored = this.readAgentsFromStorage();
          const idx = stored.findIndex(a => a.id === id);
          let updated: ManagedAgent;
          if (idx >= 0) {
            const prev = stored[idx];
            updated = {
              ...prev,
              status: agentUpdate.status ?? prev.status,
              name: agentUpdate.name ?? prev.name,
              email: agentUpdate.email ?? prev.email,
              phone: agentUpdate.business_phone ?? prev.phone,
              company_name: agentUpdate.agency_name ?? prev.company_name,
              profile_image: agentUpdate.profile_image ?? prev.profile_image,
              preferred_language: agentUpdate.preferred_language ?? prev.preferred_language,
              country: agentUpdate.country ?? prev.country,
              city: agentUpdate.city ?? prev.city,
              type: agentUpdate.business_type ?? prev.type,
              commission_type: agentUpdate.commission_type ?? prev.commission_type,
              commission_value: agentUpdate.commission_value ?? prev.commission_value,
              source_type: agentUpdate.source_type ?? prev.source_type,
              source_details: agentUpdate.source_details ?? prev.source_details,
              business_phone: agentUpdate.business_phone ?? prev.business_phone,
              business_address: agentUpdate.business_address ?? prev.business_address,
              license_number: agentUpdate.license_number ?? prev.license_number,
              iata_number: agentUpdate.iata_number ?? prev.iata_number,
              specializations: (agentUpdate.specializations as any) ?? prev.specializations,
              alternate_email: agentUpdate.alternate_email ?? prev.alternate_email,
              website: agentUpdate.website ?? prev.website,
              mobile_numbers: (agentUpdate.mobile_numbers as any) ?? prev.mobile_numbers,
              updated_at: now
            };
            stored[idx] = updated;
          } else {
            updated = {
              id,
              user_id: id,
              name: (agentUpdate.name as any) || '',
              email: (agentUpdate.email as any) || '',
              phone: (agentUpdate.business_phone as any) || undefined,
              company_name: (agentUpdate.agency_name as any) || '',
              profile_image: (agentUpdate.profile_image as any) ?? undefined,
              preferred_language: (agentUpdate.preferred_language as any) ?? undefined,
              country: (agentUpdate.country as any) ?? undefined,
              city: (agentUpdate.city as any) ?? undefined,
              status: ((agentUpdate.status as any) as AgentStatus) || ('inactive' as AgentStatus),
              role: 'agent',
              type: (agentUpdate.business_type as any) ?? undefined,
              commission_type: (agentUpdate.commission_type as any) ?? undefined,
              commission_value: (agentUpdate.commission_value as any) ?? undefined,
              source_type: (agentUpdate.source_type as any) ?? undefined,
              source_details: (agentUpdate.source_details as any) ?? undefined,
              created_by: undefined,
              assigned_staff: [],
              login_credentials: {},
              created_at: now,
              updated_at: now,
              business_phone: (agentUpdate.business_phone as any) ?? undefined,
              business_address: (agentUpdate.business_address as any) ?? undefined,
              license_number: (agentUpdate.license_number as any) ?? undefined,
              iata_number: (agentUpdate.iata_number as any) ?? undefined,
              specializations: (agentUpdate.specializations as any) ?? undefined,
              alternate_email: (agentUpdate.alternate_email as any) ?? undefined,
              website: (agentUpdate.website as any) ?? undefined,
              partnership: undefined,
              mobile_numbers: (agentUpdate.mobile_numbers as any) ?? undefined,
            } as ManagedAgent;
            stored.push(updated);
          }
          this.writeAgentsToStorage(stored);
          return { data: updated, error: null };
        }
      }

      // Persist non-agents columns in agent_settings.preferences
      const prefsPatch: any = {};
      if (partnership !== undefined) prefsPatch.partnership = partnership;

      if (Object.keys(prefsPatch).length > 0) {
        const { error: prefsErr } = await this.patchAgentSettingsPreferences(id, prefsPatch);
        if (prefsErr) {
          // Non-fatal: continue but report error
          console.warn('patchAgentSettingsPreferences error:', prefsErr);
        }
      }

      // Attempt to read the updated agent; if not found due to missing DB row or RLS, return local fallback
      const result = await this.getAgentById(id);
      if (result && result.error && (typeof result.error === 'string') && result.error.toLowerCase() === 'not found') {
        const now = new Date().toISOString();
        const stored = this.readAgentsFromStorage();
        const idx = stored.findIndex(a => a.id === id);
        let updated: ManagedAgent;
        if (idx >= 0) {
          const prev = stored[idx];
          updated = {
            ...prev,
            status: (agentUpdate.status as any) ?? prev.status,
            name: (agentUpdate.name as any) ?? prev.name,
            email: (agentUpdate.email as any) ?? prev.email,
            phone: (agentUpdate.business_phone as any) ?? prev.phone,
            company_name: (agentUpdate.agency_name as any) ?? prev.company_name,
            profile_image: (agentUpdate.profile_image as any) ?? prev.profile_image,
            preferred_language: (agentUpdate.preferred_language as any) ?? prev.preferred_language,
            country: (agentUpdate.country as any) ?? prev.country,
            city: (agentUpdate.city as any) ?? prev.city,
            type: (agentUpdate.business_type as any) ?? prev.type,
            commission_type: (agentUpdate.commission_type as any) ?? prev.commission_type,
            commission_value: (agentUpdate.commission_value as any) ?? prev.commission_value,
            source_type: (agentUpdate.source_type as any) ?? prev.source_type,
            source_details: (agentUpdate.source_details as any) ?? prev.source_details,
            business_phone: (agentUpdate.business_phone as any) ?? prev.business_phone,
            business_address: (agentUpdate.business_address as any) ?? prev.business_address,
            license_number: (agentUpdate.license_number as any) ?? prev.license_number,
            iata_number: (agentUpdate.iata_number as any) ?? prev.iata_number,
            specializations: (agentUpdate.specializations as any) ?? prev.specializations,
            alternate_email: (agentUpdate.alternate_email as any) ?? prev.alternate_email,
            website: (agentUpdate.website as any) ?? prev.website,
            mobile_numbers: (agentUpdate.mobile_numbers as any) ?? prev.mobile_numbers,
            updated_at: now
          };
          stored[idx] = updated;
        } else {
          updated = {
            id,
            user_id: id,
            name: (agentUpdate.name as any) || '',
            email: (agentUpdate.email as any) || '',
            phone: (agentUpdate.business_phone as any) || undefined,
            company_name: (agentUpdate.agency_name as any) || '',
            profile_image: (agentUpdate.profile_image as any) ?? undefined,
            preferred_language: (agentUpdate.preferred_language as any) ?? undefined,
            country: (agentUpdate.country as any) ?? undefined,
            city: (agentUpdate.city as any) ?? undefined,
            status: ((agentUpdate.status as any) as AgentStatus) || ('inactive' as AgentStatus),
            role: 'agent',
            type: (agentUpdate.business_type as any) ?? undefined,
            commission_type: (agentUpdate.commission_type as any) ?? undefined,
            commission_value: (agentUpdate.commission_value as any) ?? undefined,
            source_type: (agentUpdate.source_type as any) ?? undefined,
            source_details: (agentUpdate.source_details as any) ?? undefined,
            created_by: undefined,
            assigned_staff: [],
            login_credentials: {},
            created_at: now,
            updated_at: now,
            business_phone: (agentUpdate.business_phone as any) ?? undefined,
            business_address: (agentUpdate.business_address as any) ?? undefined,
            license_number: (agentUpdate.license_number as any) ?? undefined,
            iata_number: (agentUpdate.iata_number as any) ?? undefined,
            specializations: (agentUpdate.specializations as any) ?? undefined,
            alternate_email: (agentUpdate.alternate_email as any) ?? undefined,
            website: (agentUpdate.website as any) ?? undefined,
            partnership: undefined,
            mobile_numbers: (agentUpdate.mobile_numbers as any) ?? undefined,
          } as ManagedAgent;
          stored.push(updated);
        }
        this.writeAgentsToStorage(stored);
        return { data: updated, error: null };
      }
      return result;
    } catch (error) {
      return { data: null, error };
    }
  }

  // Patch agent_settings.preferences JSON with a shallow merge
  static async patchAgentSettingsPreferences(agentId: string, patch: any): Promise<{ error: any }> {
    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { data: existing, error: selErr } = await client
        .from('agent_settings')
        .select('id,preferences')
        .eq('agent_id', agentId)
        .maybeSingle();
      if (selErr && !this.isMissingTableError(selErr) && !this.isAuthOrPermissionError(selErr)) {
        return { error: selErr };
      }
      const currentPrefs = (existing as any)?.preferences || {};
      const merged = { ...currentPrefs, ...patch };

      if ((existing as any)?.id) {
        const { error } = await client
          .from('agent_settings')
          .update({ preferences: merged, updated_at: new Date().toISOString() })
          .eq('id', (existing as any).id);
        return { error };
      } else {
        const { error } = await client
          .from('agent_settings')
          .insert({ agent_id: agentId, preferences: merged, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        return { error };
      }
    } catch (err) {
      return { error: err };
    }
  }

  // Sync agent email across Supabase Auth (admin) and profiles table.
  static async syncAgentEmailAcrossAuth(agentId: string, newEmail: string): Promise<{ error: any }> {
    try {
      // 1) Update Supabase Auth user email (requires admin client)
      try {
        if (isAdminClientConfigured && adminSupabase) {
          await (adminSupabase as any).auth.admin.updateUserById(agentId, { email: newEmail });
        } else {
          console.warn('Admin client not configured; skipping Auth email sync');
        }
      } catch (authErr) {
        // Non-fatal: continue but report
        console.warn('Auth email update failed:', authErr);
      }

      // 2) Update profiles.email for consistency
      try {
        const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
        const { error: profileErr } = await client
          .from('profiles')
          .update({ email: newEmail, updated_at: new Date().toISOString() })
          .eq('id', agentId);
        if (profileErr && !this.isMissingTableError(profileErr) && !this.isAuthOrPermissionError(profileErr)) {
          console.warn('profiles email sync failed:', profileErr);
        }
      } catch (profCatch) {
        console.warn('profiles email sync error:', profCatch);
      }

      // 3) Best-effort: ensure agents.email is also in sync (callers usually do this already)
      try {
        const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
        const { error: agentErr } = await client
          .from('agents')
          .update({ email: newEmail, updated_at: new Date().toISOString() })
          .eq('id', agentId);
        if (agentErr && !this.isMissingTableError(agentErr) && !this.isAuthOrPermissionError(agentErr)) {
          console.warn('agents email sync failed:', agentErr);
        }
      } catch (agentCatch) {
        console.warn('agents email sync error:', agentCatch);
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // Delete/deactivate an agent (set status inactive in public.agents)
  static async deleteAgent(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('agents')
        .update({ status: 'inactive' })
        .eq('id', id);
      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Public agent signup
  static async signupAgent(signupData: AgentSignupRequest): Promise<{ data: ManagedAgent | null; error: any }> {
    try {
      // Determine auto-approval setting
      let autoApprove = false;
      try {
        const stored = localStorage.getItem('app_settings_fallback');
        const settings = stored ? JSON.parse(stored) : [];
        const found = settings.find((s: any) => s.category === 'Permissions & Roles' && s.setting_key === 'agents.auto_approve_signup');
        if (found && (found.is_active !== false)) {
          autoApprove = String(found.setting_value).toLowerCase() === 'true';
        }
      } catch {}

      const status: AgentStatus = autoApprove ? 'active' : 'inactive';

      // Duplicate email check before signup
      try {
        const dupeClient = isAdminClientConfigured && adminSupabase ? adminSupabase : supabase;
        const { data: existingProfiles, error: dupeErr } = await dupeClient
          .from('profiles')
          .select('id')
          .eq('email', signupData.email)
          .limit(1);
        if (!dupeErr && Array.isArray(existingProfiles) && existingProfiles.length > 0) {
          return { data: null, error: 'Email already registered' };
        }
      } catch {}

      // Sign up the agent in Supabase Auth
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password || this.generateTemporaryPassword(),
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            role: 'agent',
            name: signupData.name,
            phone: signupData.phone,
            company_name: signupData.company_name
          }
        }
      });

      if (signUpErr) {
        console.warn('Supabase Auth signup error; falling back:', signUpErr);
      }

      const authUserId: string | undefined = (signUpData as any)?.user?.id;
      let profileId: string | undefined = authUserId;

      // If no auth user was created, try admin to create one to satisfy FK
      if (!profileId && isAdminClientConfigured && adminSupabase) {
        try {
          const { data: created, error: adminCreateErr } = (adminSupabase as any).auth.admin.createUser({
            email: signupData.email,
            password: signupData.password || this.generateTemporaryPassword(),
            email_confirm: true,
            user_metadata: {
              role: 'agent',
              name: signupData.name,
              phone: signupData.phone,
              company_name: signupData.company_name
            }
          });
          if (!adminCreateErr && created?.user?.id) {
            profileId = created.user.id;
          }
        } catch (e) {
          console.warn('Admin createUser failed during signup:', e);
        }
      }

      if (!profileId) {
        // Final fallback only relevant for local storage path
        profileId = (crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString());
      }

      // If admin client is available, upsert profile and agents using admin client (bypass RLS)
      if (isAdminClientConfigured && adminSupabase) {
        try {
          await adminSupabase
            .from('profiles')
            .upsert({
              id: profileId,
              name: signupData.name,
              email: signupData.email,
              phone: signupData.phone,
              company_name: signupData.company_name,
              role: 'agent',
              city: signupData.city,
              country: signupData.country,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

          // Insert into agents table with all form fields using raw SQL
          const { data: agentCore, error: agentErr } = await adminSupabase
            .from('agents')
            .upsert({
              id: profileId,
              user_id: profileId,
              agency_name: signupData.company_name,
              business_phone: signupData.phone,
              business_address: signupData.business_address,
              specializations: Array.isArray(signupData.specializations)
                ? signupData.specializations
                : (signupData.specializations ? [signupData.specializations] : []),
              status,
              created_by: profileId,
              source_type: signupData.source_type || 'organic',
              source_details: signupData.source_details || 'direct_signup'
            }, { onConflict: 'id' })
            .select('id,status,created_at,updated_at,created_by,source_type,source_details')
            .single();

          // Update additional fields that are not in the typed interface using raw SQL
          if (!agentErr && agentCore) {
            await adminSupabase
              .from('agents')
              .update({
                name: signupData.name,
                email: signupData.email,
                city: signupData.city,
                country: signupData.country,
                type: signupData.type,
                agent_type: signupData.type
              } as any)
              .eq('id', profileId);
          }

          if (!agentErr && agentCore) {
            const merged: ManagedAgent = {
              id: agentCore.id,
              name: signupData.name,
              email: signupData.email,
              phone: signupData.phone,
              company_name: signupData.company_name || '',
              status: (agentCore.status as AgentStatus) || status,
              role: 'agent',
              created_by: (agentCore as any)?.created_by || profileId!,
              source_type: (agentCore as any)?.source_type || ('organic' as any),
              source_details: (agentCore as any)?.source_details || 'direct_signup',
              assigned_staff: [],
              login_credentials: {},
              created_at: agentCore.created_at || new Date().toISOString(),
              updated_at: agentCore.updated_at || new Date().toISOString()
            };
            return { data: merged, error: null };
          }
        } catch (e) {
          console.warn('Admin upsert during signup failed; will try session client:', e);
        }
      }

      // Session client fallback: attempt inserts; if RLS/FK errors, use local storage
      const profileInsert = await supabase
        .from('profiles')
        .insert([{ id: profileId, name: signupData.name, email: signupData.email, phone: signupData.phone, company_name: signupData.company_name, role: 'agent', city: signupData.city, country: signupData.country }]);
      if ((profileInsert as any)?.error) {
        console.warn('Profile insert during signup failed (likely RLS/FK):', (profileInsert as any).error);
      }

      const agentInsert = await supabase
        .from('agents')
        .insert([{ 
          id: profileId, 
          user_id: profileId, 
          // Map form fields to agents table columns (only properly typed fields)
          name: signupData.name,
          email: signupData.email,
          agency_name: signupData.company_name,
          business_phone: signupData.phone,
          business_address: signupData.business_address,
          city: signupData.city,
          country: signupData.country,
          type: signupData.type,
          agent_type: signupData.type,
          specializations: Array.isArray(signupData.specializations)
            ? signupData.specializations
            : (signupData.specializations ? [signupData.specializations] : []),
          status,
          created_by: profileId
        }]);
      const insertErr = (agentInsert as any).error;

      if (insertErr && (this.isMissingTableError(insertErr) || this.isAuthOrPermissionError(insertErr))) {
        const agents = this.readAgentsFromStorage();
        const now = new Date().toISOString();
        const username = signupData.desired_username || (signupData.email?.split('@')[0] || 'agent');
        const newAgent: ManagedAgent = {
          id: profileId,
          name: signupData.name,
          email: signupData.email,
          phone: signupData.phone,
          company_name: signupData.company_name,
          // Include additional form fields
          country: signupData.country,
          city: signupData.city,
          type: signupData.type as 'individual' | 'company',
          status,
          role: 'agent',
          created_by: profileId,
          // Fallback local record uses signup attribution when available
          source_type: (signupData.source_type as any) || 'organic',
          source_details: signupData.source_details || 'direct_signup',
          assigned_staff: [],
          login_credentials: { username },
          created_at: now,
          updated_at: now
        };
        agents.unshift(newAgent);
        this.writeAgentsToStorage(agents);

        if (signupData.password) {
          try {
            storeAgentCredentials({
              agentId: newAgent.id,
              username,
              password: signupData.password,
              email: newAgent.email,
              forcePasswordChange: false,
              isTemporary: false,
              createdAt: now,
              createdBy: { staffId: profileId!, staffName: signupData.name || 'Agent' }
            });
          } catch (credErr) {
            console.warn('Failed to store credentials locally:', credErr);
          }
        }
        return { data: newAgent, error: null };
      }

      return { data: null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Approve/reject agent (super admin only)
  static async approveAgent(approvalData: AgentApprovalRequest): Promise<{ data: ManagedAgent | null; error: any }> {
    try {
      const { id, status, assigned_staff } = approvalData;
      const client = isAdminClientConfigured ? adminSupabase : supabase;

      // Centralize approval via RPC when activating; otherwise fallback to direct update
      if (status === 'active') {
        const { data: rpcData, error: rpcError } = await (client as any).rpc('approve_agent', { p_id: id });
        if (rpcError) {
          // Fallback to direct update if RPC unavailable
          console.warn('approve_agent RPC failed, falling back:', rpcError);
        } else if (rpcData && (rpcData as any).ok) {
          // Merge updated agent
          const { data: agentCore } = await client
            .from('agents')
            .select('id,status,created_at,updated_at')
            .eq('id', id)
            .single();

          if (agentCore) {
            const { data: profile } = await client
              .from('profiles')
              .select('name,email,phone,company_name,role,created_at,updated_at')
              .eq('id', id)
              .single();

            const merged: ManagedAgent = {
              id: agentCore.id,
              name: (profile as any)?.name || '',
              email: (profile as any)?.email || '',
              phone: (profile as any)?.phone || '',
              company_name: (profile as any)?.company_name || '',
              status: (agentCore as any).status as any,
              role: (profile as any)?.role || 'agent',
              source_type: undefined,
              source_details: undefined,
              created_by: undefined,
              assigned_staff: assigned_staff || [],
              login_credentials: {},
              created_at: (agentCore as any)?.created_at || (profile as any)?.created_at || new Date().toISOString(),
              updated_at: (agentCore as any)?.updated_at || (profile as any)?.updated_at || new Date().toISOString()
            };
            return { data: merged, error: null };
          }
        } else if (rpcData && (rpcData as any).error) {
          return { data: null, error: (rpcData as any).error };
        }
      }

      // Persist status to public.agents when not activating via RPC; assigned_staff is tracked locally
      const upd = await client
        .from('agents')
        .update({ status })
        .eq('id', id)
        .select('id,status,created_at,updated_at')
        .single();

      const data = (upd as any).data || null;
      const error = (upd as any).error || null;

      if (error && this.isMissingTableError(error)) {
        // Fallback to localStorage
        const agents = this.readAgentsFromStorage();
        const idx = agents.findIndex(a => a.id === id);
        if (idx >= 0) {
          const updatePayload: Partial<ManagedAgent> = {
            status: status as any,
            ...(assigned_staff ? { assigned_staff } : {})
          };
          const updated = { ...agents[idx], ...updatePayload, updated_at: new Date().toISOString() } as ManagedAgent;
          agents[idx] = updated;
          this.writeAgentsToStorage(agents);
          return { data: updated, error: null };
        }
        return { data: null, error: 'Agent not found' };
      }

      // Return full merged agent
      const full = await this.getAgentById(id);
      return { data: full.data as any, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Generate credentials for approved agent
  static async generateCredentials(id: string): Promise<{ data: { username: string; temporaryPassword: string } | null; error: any }> {
    try {
      // Get agent details to create username
      const { data: agent, error: agentError } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', id)
        .single();

      if (agentError || !agent) {
        return { data: null, error: agentError || 'Agent not found' };
      }

      // Generate username from email or name (prefer full email for login)
      const baseFromEmail = (agent as any).email ? String((agent as any).email).toLowerCase().trim() : '';
      const baseFromName = (agent as any).name ? String((agent as any).name).toLowerCase().replace(/\s+/g, '') : '';
      const username = baseFromEmail || baseFromName || `agent_${id.slice(0, 6)}`;
      const temporaryPassword = this.generateTemporaryPassword();

      // Set credentials via secure RPC (temporary)
      const client = isAdminClientConfigured ? adminSupabase : supabase;
      const { error } = await (client as any).rpc('set_agent_credentials', {
        p_id: id,
        p_username: username,
        p_password: temporaryPassword,
        p_is_temporary: true
      });

      if (error) {
        return { data: null, error };
      }

      return { data: { username, temporaryPassword }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Reject agent application
  static async rejectAgent(id: string, rejectionReason: string): Promise<{ data: ManagedAgent | null; error: any }> {
    try {
      const client = isAdminClientConfigured ? adminSupabase : supabase;
      const { data, error } = await client
        .from('agents')
        .update({ status: 'rejected' })
        .eq('id', id)
        .select('id,status,created_at,updated_at')
        .single();

      if (error && this.isMissingTableError(error)) {
        const agents = this.readAgentsFromStorage();
        const idx = agents.findIndex(a => a.id === id);
        if (idx >= 0) {
          const updated = { ...agents[idx], status: 'rejected', updated_at: new Date().toISOString() } as ManagedAgent;
          agents[idx] = updated;
          this.writeAgentsToStorage(agents);
          return { data: updated, error: null };
        }
      }

      return { data: data as any, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Suspend an active agent
  static async suspendAgent(id: string, reason: string): Promise<{ data: ManagedAgent | null; error: any }> {
    try {
      // Identify current user performing the action (best-effort)
      let currentUserId: string | undefined;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id;
      } catch {}

      const client = isAdminClientConfigured ? adminSupabase : supabase;
      const { data, error } = await client
        .from('agents')
        .update({ status: 'suspended', suspension_reason: reason, suspended_at: new Date().toISOString(), suspended_by: currentUserId })
        .eq('user_id', id)
        .select('id,status,created_at,updated_at,suspension_reason,suspended_at,suspended_by')
        .single();

      if (error && this.isMissingTableError(error)) {
        const agents = this.readAgentsFromStorage();
        const idx = agents.findIndex(a => a.id === id);
        if (idx >= 0) {
          const updated = { 
            ...agents[idx], 
            status: 'suspended', 
            suspension_reason: reason,
            suspended_at: new Date().toISOString(),
            suspended_by: currentUserId,
            updated_at: new Date().toISOString() 
          } as ManagedAgent;
          agents[idx] = updated;
          this.writeAgentsToStorage(agents);
          return { data: updated, error: null };
        }
      }

      return { data: data as any, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Reactivate a suspended/rejected agent
  static async reactivateAgent(id: string): Promise<{ data: ManagedAgent | null; error: any }> {
    try {
      const client = isAdminClientConfigured ? adminSupabase : supabase;
      const { data, error } = await client
        .from('agents')
        .update({ status: 'active', suspension_reason: null, suspended_at: null, suspended_by: null })
        .eq('id', id)
        .select('id,status,created_at,updated_at,suspension_reason,suspended_at,suspended_by')
        .single();

      if (error && this.isMissingTableError(error)) {
        const agents = this.readAgentsFromStorage();
        const idx = agents.findIndex(a => a.id === id);
        if (idx >= 0) {
          const updated = { 
            ...agents[idx], 
            status: 'active', 
            suspension_reason: undefined,
            suspended_at: undefined,
            suspended_by: undefined,
            updated_at: new Date().toISOString() 
          } as ManagedAgent;
          agents[idx] = updated;
          this.writeAgentsToStorage(agents);
          return { data: updated, error: null };
        }
      }

      return { data: data as any, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Reset agent credentials (overloaded method for backward compatibility)
  static async resetCredentials(id: string, newCredentials?: { username: string; temporaryPassword: string }): Promise<{ data: { username: string; temporaryPassword: string } | null; error: any }> {
    try {
      let username: string;
      let temporaryPassword: string;

      if (newCredentials) {
        // Use provided credentials
        username = newCredentials.username;
        temporaryPassword = newCredentials.temporaryPassword;
      } else {
        // Generate new credentials
        const { data: agent, error: agentError } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', id)
          .single();

        if (agentError || !agent) {
          return { data: null, error: agentError || 'Agent not found' };
        }

        const baseFromEmail = (agent as any).email ? String((agent as any).email).toLowerCase().trim() : '';
        const baseFromName = (agent as any).name ? String((agent as any).name).toLowerCase().replace(/\s+/g, '') : '';
        username = baseFromEmail || baseFromName || `agent_${id.slice(0, 6)}`;
        temporaryPassword = this.generateTemporaryPassword();
      }

      // Set hashed temporary credentials via RPC
      const { error } = await (supabase as any).rpc('set_agent_credentials', {
        p_id: id,
        p_username: username,
        p_password: temporaryPassword,
        p_is_temporary: true
      });

      if (error) {
        return { data: null, error };
      }

      return {
        data: { username, temporaryPassword },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get staff members for assignment
  static async getStaffMembers(): Promise<{ data: StaffMember[] | null; error: any }> {
    try {
      // Fetch directly from profiles to avoid requiring a DB relationship
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .in('role', ['staff', 'admin', 'super_admin']);

      if (error) return { data: null, error };

      if (!data) {
        return { data: [], error: null };
      }

      const staffMembers = (data as any[]).map((item: any) => ({
        id: item.id || '',
        name: item.name || 'Unknown',
        email: item.email || '',
        role: item.role || 'staff'
      }));

      return { data: staffMembers, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get agents assigned to current user (for staff)
  static async getMyAssignedAgents(): Promise<{ data: ManagedAgent[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      // Until DB columns exist, use local storage assignment info
      const agents = this.readAgentsFromStorage();
      const myAgents = agents.filter(a => {
        const byCreator = (a as any).created_by === user.id;
        const byAssignment = Array.isArray((a as any).assigned_staff) && ((a as any).assigned_staff as string[]).includes(user.id);
        return byCreator || byAssignment;
      });

      return { data: myAgents, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Set agent credentials (permanent or temporary) using secure RPC
  static async setAgentCredentials(id: string, username: string, password: string, isTemporary: boolean = false): Promise<{ error: any }> {
    try {
      const { error } = await (supabase as any).rpc('set_agent_credentials', {
        p_id: id,
        p_username: username,
        p_password: password,
        p_is_temporary: isTemporary
      });

      // If RPC succeeds, return immediately
      if (!error) {
        return { error: null };
      }

      // Fallback: persist credentials locally to avoid blocking activation UX
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const createdBy = {
          staffId: (user as any)?.id || 'system',
          staffName: (user as any)?.user_metadata?.name || 'System'
        };

        // Use email-style login (username passed in is email in our flows)
        storeAgentCredentials({
          agentId: String(id),
          username: String(username).toLowerCase(),
          password,
          email: String(username).toLowerCase(),
          forcePasswordChange: !!isTemporary,
          isTemporary: !!isTemporary,
          createdAt: new Date().toISOString(),
          createdBy
        });

        console.warn('RPC set_agent_credentials failed, used local fallback:', error);
        // Suppress error for UX continuity; credentials now usable via local fallback
        return { error: null };
      } catch (fallbackErr) {
        console.error('Local credential fallback failed:', fallbackErr);
        return { error: error || fallbackErr };
      }
    } catch (error) {
      // Exception on RPC call: try local fallback as well
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const createdBy = {
          staffId: (user as any)?.id || 'system',
          staffName: (user as any)?.user_metadata?.name || 'System'
        };

        storeAgentCredentials({
          agentId: String(id),
          username: String(username).toLowerCase(),
          password,
          email: String(username).toLowerCase(),
          forcePasswordChange: !!isTemporary,
          isTemporary: !!isTemporary,
          createdAt: new Date().toISOString(),
          createdBy
        });

        console.warn('RPC set_agent_credentials exception, used local fallback:', error);
        return { error: null };
      } catch (fallbackErr) {
        console.error('Local credential fallback failed after exception:', fallbackErr);
        return { error };
      }
    }
  }

  // Authenticate agent against DB RPC
  static async authenticateAgentWithDB(username: string, password: string): Promise<{ data: { id: string; name: string; email: string; role: string } | null; error: any }> {
    try {
      const { data, error } = await (supabase as any).rpc('authenticate_agent', {
        p_username: username,
        p_password: password
      });

      if (error) {
        return { data: null, error };
      }

      if (data && (data as any).ok) {
        return { data: (data as any).agent, error: null };
      }

      return { data: null, error: (data as any)?.error || 'Authentication failed' };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Generate temporary password
  static generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // New method: update agent source by email
  static async updateAgentSourceByEmail(email: string, source_type: string, source_details: string): Promise<{ error: any }> {
    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;

      const { data: profile, error: profileErr } = await client
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profileErr) {
        return { error: profileErr };
      }

      const id = (profile as any)?.id;
      if (!id) {
        return { error: 'Profile not found for email' };
      }

      const { data: agentExists } = await client
        .from('agents')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (!agentExists) {
        const { error: upErr } = await client
          .from('agents')
          .upsert({ id, user_id: id, source_type, source_details }, { onConflict: 'id' });
        if (upErr) {
          return { error: upErr };
        }
      }

      const { error } = await client
        .from('agents')
        .update({ source_type, source_details })
        .eq('id', id);
      return { error };
    } catch (error) {
      return { error };
    }
  }

  // =============================
  // Staff assignment persistence
  // =============================

  // Legacy local fallback store accessors (kept only for one-time migration)
  private static readAssignmentsFallback(): Record<string, any[]> {
    try {
      const raw = localStorage.getItem('agent_staff_assignments_fallback');
      const map = raw ? JSON.parse(raw) : {};
      return (map && typeof map === 'object') ? map : {};
    } catch {
      return {};
    }
  }

  private static writeAssignmentsFallback(map: Record<string, any[]>): void {
    try {
      localStorage.setItem('agent_staff_assignments_fallback', JSON.stringify(map));
    } catch {}
  }

  // Get staff assignments for a specific agent (Supabase source of truth)
  static async getAgentStaffAssignments(agentId: string): Promise<{ data: any[] | null; error: any }> {
    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;

      // Read detailed assignments from agent_staff_assignments
      const { data: assignmentRows, error: assignErr } = await client
        .from('agent_staff_assignments' as any)
        .select('agent_id, staff_id, is_primary, notes, assigned_at, assigned_by')
        .eq('agent_id', agentId)
        .order('is_primary', { ascending: false })
        .order('assigned_at', { ascending: true });

      if (assignErr) {
        return { data: null, error: assignErr };
      }

      const rows = (assignmentRows as any[]) || [];
      if (rows.length === 0) {
        // If legacy local fallback exists for this agent, migrate it into Supabase automatically
        try {
          const fbMap = this.readAssignmentsFallback();
          const fbRows = Array.isArray(fbMap[agentId]) ? fbMap[agentId] : [];
          if (fbRows.length > 0) {
            await this.migrateAssignmentsFallbackToSupabase(agentId);
            const { data: reRows } = await client
              .from('agent_staff_assignments' as any)
              .select('agent_id, staff_id, is_primary, notes, assigned_at, assigned_by')
              .eq('agent_id', agentId)
              .order('is_primary', { ascending: false })
              .order('assigned_at', { ascending: true });
            if (Array.isArray(reRows) && reRows.length > 0) {
              const staffIds2 = (reRows as any[]).map(r => String((r as any).staff_id));
              const { data: profiles2 } = await client
                .from('profiles' as any)
                .select('id,name,role,email')
                .in('id', staffIds2);
              const profileMap2 = new Map<string, any>();
              (profiles2 || []).forEach(p => profileMap2.set(String((p as any).id), p));
              const migrated = (reRows as any[]).map((r: any) => {
                const p = profileMap2.get(String(r.staff_id)) || {};
                return {
                  staffId: String(r.staff_id),
                  staffName: (p as any)?.name || 'Unknown',
                  role: (p as any)?.role || 'staff',
                  isPrimary: !!r.is_primary,
                  assignedAt: r.assigned_at,
                  assignedBy: r.assigned_by ? String(r.assigned_by) : undefined,
                  notes: r.notes ?? undefined
                };
              });
              return { data: migrated, error: null };
            }
          }
        } catch {}

        // As a soft fallback, return bare assignments derived from agents.assigned_staff (DB column)
        try {
          const { data: agentRow } = await client
            .from('agents' as any)
            .select('assigned_staff')
            .eq('id', agentId)
            .maybeSingle();
          const staffIds: string[] = Array.isArray((agentRow as any)?.assigned_staff)
            ? ((agentRow as any)?.assigned_staff || []).map((x: any) => String(x))
            : [];

          if (staffIds.length === 0) {
            return { data: [], error: null };
          }

          const { data: profiles } = await client
            .from('profiles' as any)
            .select('id,name,role,email')
            .in('id', staffIds);
          const profileMap = new Map<string, any>();
          (profiles || []).forEach(p => profileMap.set(String((p as any).id), p));
          const now = new Date().toISOString();

          const derived = staffIds.map((sid: string, idx: number) => {
            const p = profileMap.get(String(sid)) || {};
            return {
              staffId: String(sid),
              staffName: (p as any)?.name || 'Unknown',
              role: (p as any)?.role || 'staff',
              isPrimary: idx === 0,
              assignedAt: now,
              assignedBy: undefined,
              notes: undefined
            };
          });

          return { data: derived, error: null };
        } catch (innerErr) {
          return { data: [], error: null };
        }
      }

      // Enrich with profiles (assigned staff) and assigners (assigned_by)
      const staffIds = rows.map(r => String((r as any).staff_id));
      const assignerIds = Array.from(new Set(rows
        .map(r => (r as any).assigned_by)
        .filter((id: any) => !!id)
        .map((id: any) => String(id))));

      const { data: staffProfiles } = await client
        .from('profiles' as any)
        .select('id,name,role,email')
        .in('id', staffIds);
      const staffProfileMap = new Map<string, any>();
      (staffProfiles || []).forEach(p => staffProfileMap.set(String((p as any).id), p));

      let assignerProfileMap = new Map<string, any>();
      if (assignerIds.length > 0) {
        const { data: assignerProfiles } = await client
          .from('profiles' as any)
          .select('id,name,role,email')
          .in('id', assignerIds);
        assignerProfileMap = new Map<string, any>();
        (assignerProfiles || []).forEach(p => assignerProfileMap.set(String((p as any).id), p));
      }

      const result = rows.map((r: any) => {
        const staffProfile = staffProfileMap.get(String(r.staff_id)) || {};
        const assignerId = r.assigned_by ? String(r.assigned_by) : undefined;
        const assignerProfile = assignerId ? (assignerProfileMap.get(assignerId) || {}) : {};
        return {
          staffId: String(r.staff_id),
          staffName: (staffProfile as any)?.name || 'Unknown',
          role: (staffProfile as any)?.role || 'staff',
          email: (staffProfile as any)?.email || undefined,
          isPrimary: !!r.is_primary,
          assignedAt: r.assigned_at,
          assignedBy: assignerId,
          assignedByName: (assignerProfile as any)?.name || undefined,
          assignedByRole: (assignerProfile as any)?.role || undefined,
          notes: r.notes ?? undefined
        };
      });

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Add a staff assignment to an agent (writes to agent_staff_assignments; triggers sync agents.assigned_staff)
  static async addStaffAssignmentToAgent(agentId: string, staffId: string, options?: { isPrimary?: boolean; notes?: string; role?: string }): Promise<{ error: any }> {
    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;

      // Determine assigned_by when available
      let assignedBy: string | null = null;
      try {
        const { data: authData } = await supabase.auth.getUser();
        assignedBy = authData?.user?.id ? String(authData.user.id) : null;
      } catch {}

      // Upsert into agent_staff_assignments to avoid duplicates
      const payload: any = {
        agent_id: agentId,
        staff_id: staffId,
        is_primary: !!options?.isPrimary,
        notes: options?.notes ?? null,
        assigned_by: assignedBy
      };

      const { error: upErr } = await client
        .from('agent_staff_assignments' as any)
        .upsert(payload, { onConflict: 'agent_id,staff_id' } as any);
      if (upErr) {
        return { error: upErr };
      }

      // Triggers handle syncing agents.assigned_staff
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // Update assignment details (primary flag, notes) in DB
  static async updateStaffAssignmentForAgent(agentId: string, staffId: string, updates: { isPrimary?: boolean; notes?: string }): Promise<{ error: any }> {
    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;

      // Build patch only with provided fields
      const patch: any = {};
      if (typeof updates?.isPrimary === 'boolean') patch.is_primary = updates.isPrimary;
      if (typeof updates?.notes === 'string') patch.notes = updates.notes;

      if (Object.keys(patch).length === 0) {
        return { error: null };
      }

      const { error: upErr } = await client
        .from('agent_staff_assignments' as any)
        .update(patch)
        .eq('agent_id', agentId)
        .eq('staff_id', staffId);
      if (upErr) {
        return { error: upErr };
      }
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // Remove a staff assignment (deletes row; trigger syncs agents.assigned_staff)
  static async removeStaffAssignmentFromAgent(agentId: string, staffId: string): Promise<{ error: any }> {
    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;

      const { error: delErr } = await client
        .from('agent_staff_assignments' as any)
        .delete()
        .eq('agent_id', agentId)
        .eq('staff_id', staffId);
      if (delErr) {
        return { error: delErr };
      }
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // One-time migration: push localStorage fallback assignments into Supabase
  static async migrateAssignmentsFallbackToSupabase(targetAgentId?: string): Promise<{ migratedAgents: number; migratedRows: number; error: any }> {
    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const fbMap = this.readAssignmentsFallback();
      const entries = Object.entries(fbMap).filter(([agentId]) => !targetAgentId || String(agentId) === String(targetAgentId));

      let migratedAgents = 0;
      let migratedRows = 0;

      for (const [agentId, list] of entries) {
        const rows = Array.isArray(list) ? list : [];
        if (rows.length === 0) continue;

        for (const r of rows) {
          const payload: any = {
            agent_id: agentId,
            staff_id: String(r.staffId),
            is_primary: !!r.isPrimary,
            notes: r.notes ?? null,
            assigned_at: r.assignedAt ?? null,
            assigned_by: r.assignedBy ? String(r.assignedBy) : null
          };
          const { error: upErr } = await client
            .from('agent_staff_assignments' as any)
            .upsert(payload, { onConflict: 'agent_id,staff_id' } as any);
          if (upErr) {
            return { migratedAgents, migratedRows, error: upErr };
          }
          migratedRows += 1;
        }

        migratedAgents += 1;
        // Clear migrated agent from fallback
        const map = this.readAssignmentsFallback();
        delete map[agentId];
        this.writeAssignmentsFallback(map);
      }

      return { migratedAgents, migratedRows, error: null };
    } catch (error) {
      return { migratedAgents: 0, migratedRows: 0, error };
    }
  }

  private static readTaxInfoFromStorage(): Record<string, any[]> {
    try {
      const raw = localStorage.getItem('agent_tax_info_fallback');
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private static writeTaxInfoToStorage(map: Record<string, any[]>): void {
    try {
      localStorage.setItem('agent_tax_info_fallback', JSON.stringify(map));
    } catch {
      // ignore storage write errors
    }
  }

  static async getAgentTaxInfo(agentId: string): Promise<{ data: any[] | null; error: any }> {
    try {
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      const { data, error } = await (client as any)
        .from('agent_tax_info' as any)
        .select('*')
        .eq('agent_id', agentId)
        .order('updated_at', { ascending: false });
      if (error) {
        if (this.isMissingTableError(error) || this.isAuthOrPermissionError(error)) {
          const fb = this.readTaxInfoFromStorage();
          const list = Array.isArray(fb[agentId]) ? fb[agentId] : [];
          return { data: list, error: null };
        }
        return { data: null, error };
      }
      return { data: (data as any[]) || [], error: null };
    } catch (error: any) {
      if (this.isMissingTableError(error) || this.isAuthOrPermissionError(error)) {
        const fb = this.readTaxInfoFromStorage();
        const list = Array.isArray(fb[agentId]) ? fb[agentId] : [];
        return { data: list, error: null };
      }
      return { data: null, error };
    }
  }

  static async upsertAgentTaxInfo(agentId: string, record: any): Promise<{ data: any | null; error: any }> {
    try {
      const payload = { ...record, agent_id: agentId, updated_at: new Date().toISOString() };
      const client: any = (isAdminClientConfigured && adminSupabase) ? adminSupabase : supabase;
      if (payload.id) {
        const { data, error } = await (client as any)
          .from('agent_tax_info')
          .update(payload)
          .eq('id', payload.id)
          .select('*')
          .maybeSingle();
        if (error && (this.isMissingTableError(error) || this.isAuthOrPermissionError(error))) {
          const fb = this.readTaxInfoFromStorage();
          const key = String(agentId);
          const list = Array.isArray(fb[key]) ? fb[key] : [];
          const idx = list.findIndex((r: any) => String(r.id) === String(payload.id));
          const updated = {
            ...(idx >= 0 ? list[idx] : {}),
            ...payload,
            updated_at: new Date().toISOString(),
          };
          if (idx >= 0) list[idx] = updated; else list.push(updated);
          list.sort((a: any, b: any) => (a.updated_at > b.updated_at ? -1 : 1));
          fb[key] = list;
          this.writeTaxInfoToStorage(fb);
          return { data: updated, error: null };
        }
        return { data: data || null, error };
      } else {
        const { data, error } = await (client as any)
          .from('agent_tax_info')
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select('*')
          .maybeSingle();
        if (error && (this.isMissingTableError(error) || this.isAuthOrPermissionError(error))) {
          const fb = this.readTaxInfoFromStorage();
          const key = String(agentId);
          const list = Array.isArray(fb[key]) ? fb[key] : [];
          const id = (globalThis?.crypto && typeof globalThis.crypto.randomUUID === 'function')
            ? globalThis.crypto.randomUUID()
            : Math.random().toString(36).slice(2);
          const created = {
            id,
            ...payload,
            agent_id: agentId,
            tax_verified: payload?.tax_verified ?? false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          list.push(created);
          list.sort((a: any, b: any) => (a.updated_at > b.updated_at ? -1 : 1));
          fb[key] = list;
          this.writeTaxInfoToStorage(fb);
          return { data: created, error: null };
        }
        return { data: data || null, error };
      }
    } catch (error: any) {
      if (this.isMissingTableError(error) || this.isAuthOrPermissionError(error)) {
        const fb = this.readTaxInfoFromStorage();
        const key = String(agentId);
        const list = Array.isArray(fb[key]) ? fb[key] : [];
        if (record?.id) {
          const idx = list.findIndex((r: any) => String(r.id) === String(record.id));
          const updated = {
            ...(idx >= 0 ? list[idx] : {}),
            ...record,
            agent_id: agentId,
            updated_at: new Date().toISOString(),
          };
          if (idx >= 0) list[idx] = updated; else list.push(updated);
          list.sort((a: any, b: any) => (a.updated_at > b.updated_at ? -1 : 1));
          fb[key] = list;
          this.writeTaxInfoToStorage(fb);
          return { data: updated, error: null };
        } else {
          const id = (globalThis?.crypto && typeof globalThis.crypto.randomUUID === 'function')
            ? globalThis.crypto.randomUUID()
            : Math.random().toString(36).slice(2);
          const created = {
            id,
            ...record,
            agent_id: agentId,
            tax_verified: record?.tax_verified ?? false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          list.push(created);
          list.sort((a: any, b: any) => (a.updated_at > b.updated_at ? -1 : 1));
          fb[key] = list;
          this.writeTaxInfoToStorage(fb);
          return { data: created, error: null };
        }
      }
      return { data: null, error };
    }
  }
}