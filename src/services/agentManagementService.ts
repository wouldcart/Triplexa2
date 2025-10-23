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
        .select('id,status,created_at,updated_at,created_by,source_type,source_details,agency_name,city,country')
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
        if (currentUserId) {
          const { data: me } = await supabase
            .from('profiles')
            .select('id,role')
            .eq('id', currentUserId)
            .maybeSingle();
          currentRole = (me as any)?.role;
        }
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
          const s = filters.search.toLowerCase();
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
      const { data: profiles, error: profilesError } = await (supabase as any)
        .from('profiles' as any)
        .select('id,name,email,phone,company_name,created_at,updated_at,role,city,country')
        .in('id', ids);

      if (profilesError) {
        return { data: null, error: profilesError };
      }

      const profileMap = new Map<string, any>();
      (profiles || []).forEach(p => profileMap.set(p.id, p));

      let merged: ManagedAgent[] = agentsCore.map((a: any) => {
        const p = profileMap.get(a.id) || {};
        const name = p.name || '';
        const email = p.email || '';
        const phone = p.phone || '';
        const company_name = p.company_name || a.agency_name || '';
        const created_at = a.created_at || p.created_at || new Date().toISOString();
        const updated_at = a.updated_at || p.updated_at || created_at;
        return {
          id: a.id,
          name,
          email,
          phone,
          company_name,
          country: a.country ?? (p as any)?.country ?? undefined,
          city: a.city ?? (p as any)?.city ?? undefined,
          status: (a.status as AgentStatus) || ('pending' as AgentStatus),
          role: 'agent',
          source_type: a.source_type,
          source_details: a.source_details,
          created_by: a.created_by,
          assigned_staff: [],
          login_credentials: {},
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
      const { data: agentCore, error: agentError } = await (supabase as any)
        .from('agents' as any)
        // Select known-safe columns plus attribution
        .select('id,status,created_at,updated_at,created_by,source_type,source_details,agency_name,city,country')
        .eq('id', id)
        .maybeSingle();

      if (agentError && this.isMissingTableError(agentError)) {
        const agents = this.readAgentsFromStorage();
        const found = agents.find(a => a.id === id) || null;
        return { data: found, error: null };
      }

      if (!agentCore) {
        // Zero rows found: avoid throwing and try local fallback
        const agents = this.readAgentsFromStorage();
        const found = agents.find(a => a.id === id) || null;
        return { data: found, error: found ? null : 'Not found' };
      }

      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles' as any)
        // Include city and country using untyped select for broader compatibility
        .select('id,name,email,phone,company_name,created_at,updated_at,role,city,country')
        .eq('id', id)
        .maybeSingle();

      if (profileError && this.isMissingTableError(profileError)) {
        // If profiles table missing, try local storage fallback
        const agents = this.readAgentsFromStorage();
        const local = agents.find(a => a.id === id);
        if (local) {
          return { data: local as any, error: null };
        }
      }

      const merged: ManagedAgent = {
        id,
        name: profile?.name || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        company_name: (profile?.company_name || (agentCore as any)?.agency_name || ''),
        profile_image: (profile as any)?.profile_image || undefined,
        country: (agentCore as any)?.country ?? (profile as any)?.country ?? undefined,
        city: (agentCore as any)?.city ?? (profile as any)?.city ?? undefined,
        status: (agentCore.status as AgentStatus) || ('pending' as AgentStatus),
        role: 'agent',
        type: (agentCore as any)?.agent_type || undefined,
        commission_type: (agentCore as any)?.commission_type || undefined,
        commission_value: (agentCore as any)?.commission_value || undefined,
        source_type: (agentCore as any)?.source_type,
        source_details: (agentCore as any)?.source_details,
        created_by: (agentCore as any)?.created_by,
        assigned_staff: [],
        login_credentials: {},
        created_at: agentCore.created_at || profile?.created_at || new Date().toISOString(),
        updated_at: agentCore.updated_at || profile?.updated_at || new Date().toISOString()
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
      if (!isAdminClientConfigured || !adminSupabase) {
        return { data: null, error: new Error('Admin client is not configured. Cannot create agent.') };
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
        assigned_staff: [],
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
        source_details
      } = agentData;

      // Build profile update payload from defined fields only
      const profileUpdate: any = {};
      if (name !== undefined) profileUpdate.name = name;
      if (email !== undefined) profileUpdate.email = email;
      if (phone !== undefined) profileUpdate.phone = phone;
      if (company_name !== undefined) profileUpdate.company_name = company_name;
      if (profile_image !== undefined) profileUpdate.profile_image = profile_image;
      if (preferred_language !== undefined) profileUpdate.preferred_language = preferred_language;
      if (country !== undefined) profileUpdate.country = country;
      if (city !== undefined) profileUpdate.city = city;

      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileErr } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', id);
        if (profileErr) {
          if (this.isMissingTableError(profileErr) || this.isAuthOrPermissionError(profileErr)) {
            // Fallback: update local cache
            const agents = this.readAgentsFromStorage();
            const idx = agents.findIndex(a => a.id === id);
            if (idx >= 0) {
              const updated = { ...agents[idx], ...profileUpdate, updated_at: new Date().toISOString() } as ManagedAgent;
              agents[idx] = updated;
              this.writeAgentsToStorage(agents);
            }
          } else {
            return { data: null, error: profileErr };
          }
        }
      }

      // Build agents update payload
      const agentUpdate: any = {};
      if (status !== undefined) agentUpdate.status = status;
      if (type !== undefined) agentUpdate.agent_type = type;
      if (commission_type !== undefined) agentUpdate.commission_type = commission_type;
      if (commission_value !== undefined) agentUpdate.commission_value = commission_value as any;
      if (source_type !== undefined) agentUpdate.source_type = source_type;
      if (source_details !== undefined) agentUpdate.source_details = source_details;
      // Keep agents table in sync: map company_name → agency_name
      if (company_name !== undefined) agentUpdate.agency_name = company_name;
      if (country !== undefined) agentUpdate.country = country;
      if (city !== undefined) agentUpdate.city = city;

      if (Object.keys(agentUpdate).length > 0) {
        const { error: agentErr } = await supabase
          .from('agents')
          .update(agentUpdate)
          .eq('id', id);
        if (agentErr) {
          if (this.isMissingTableError(agentErr) || this.isAuthOrPermissionError(agentErr)) {
            // Fallback: update local cache
            const agents = this.readAgentsFromStorage();
            const idx = agents.findIndex(a => a.id === id);
            if (idx >= 0) {
              const localUpdate: Partial<ManagedAgent> = {
                ...(status !== undefined ? { status: status as any } : {}),
                ...(type !== undefined ? { type } : {}),
                ...(commission_type !== undefined ? { commission_type } : {}),
                ...(commission_value !== undefined ? { commission_value } : {}),
                ...(source_type !== undefined ? { source_type } : {}),
                ...(source_details !== undefined ? { source_details } : {}),
                ...(country !== undefined ? { country } : {}),
                ...(city !== undefined ? { city } : {}),
              };
              const updated = { ...agents[idx], ...localUpdate, updated_at: new Date().toISOString() } as ManagedAgent;
              agents[idx] = updated;
              this.writeAgentsToStorage(agents);
            }
          } else {
            return { data: null, error: agentErr };
          }
        }
      }

      return this.getAgentById(id);
    } catch (error) {
      return { data: null, error };
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
      const client = isAdminClientConfigured ? adminSupabase : supabase;
      const { data, error } = await client
        .from('agents')
        .update({ status: 'suspended' })
        .eq('id', id)
        .select('id,status,created_at,updated_at')
        .single();

      if (error && this.isMissingTableError(error)) {
        const agents = this.readAgentsFromStorage();
        const idx = agents.findIndex(a => a.id === id);
        if (idx >= 0) {
          const updated = { ...agents[idx], status: 'suspended', updated_at: new Date().toISOString() } as ManagedAgent;
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
        .update({ status: 'active' })
        .eq('id', id)
        .select('id,status,created_at,updated_at')
        .single();

      if (error && this.isMissingTableError(error)) {
        const agents = this.readAgentsFromStorage();
        const idx = agents.findIndex(a => a.id === id);
        if (idx >= 0) {
          const updated = { ...agents[idx], status: 'active', updated_at: new Date().toISOString() } as ManagedAgent;
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
}


