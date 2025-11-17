import { supabase, authHelpers, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';
import { User } from '@/types/User';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  position: string;
  employeeId?: string;
  employee_id?: string;
  company_name?: string;
  city?: string;
  country?: string;
  avatar?: string;
  // Optional flag stored in user metadata to enforce password change
  must_change_password?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User | null;
  error: string | null;
  session: any;
}

// Helper function to get permissions based on role
const getPermissionsByRole = (role: string): string[] => {
  switch (role) {
    case 'super_admin':
      // Full administrative access
      return ['*', 'manage_users', 'manage_settings', 'queries.*', 'staff.*', 'hr.*', 'attendance.*', 'payroll.*'];
    case 'admin':
      return ['read', 'write', 'delete', 'manage_users', 'manage_settings'];
    case 'manager':
      return ['read', 'write', 'manage_team'];
    case 'hr_manager':
      // HR managers have HR-focused capabilities
      return ['staff.*', 'hr.*', 'attendance.*', 'payroll.*', 'queries.view'];
    case 'staff':
      // Baseline staff capabilities
      return ['queries.view', 'bookings.view'];
    case 'agent':
      return ['read', 'write'];
    case 'support':
      return ['read', 'write', 'manage_tickets'];
    default:
      return ['read'];
  }
};

const convertToAppUser = (authUser: any): User => {
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.name || authUser.email,
    role: authUser.role || 'agent',
    department: authUser.department,
    phone: authUser.phone || '',
    status: authUser.status || 'active',
    position: authUser.position || authUser.role || 'Agent',
    employeeId: authUser.employeeId ?? authUser.employee_id,
    avatar: authUser.avatar || '',
    permissions: getPermissionsByRole(authUser.role || 'agent'),
  };
};

export class AuthService {
  /**
   * Enhanced sign-in that properly handles Supabase-invited agents
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting sign-in for:', email);
      
      // First try Supabase Auth
      const { data: authData, error: authError } = await authHelpers.signIn(email, password);
      
      if (!authError && authData.user) {
        console.log('✅ Supabase Auth successful for:', authData.user.email);
        
        // Fetch profile directly; if missing, self-heal by upserting minimal profile
        const { data: profileRow, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        const profileData = profileRow || await AuthService.ensureProfileExists(authData.user);

        if (profileData) {
          console.log('✅ Profile resolved:', profileData.name);
          
          // For agents with Supabase Auth, sync their password to agent_credentials
          if ((profileData as any).role === 'agent') {
            await this.syncSupabasePasswordToAgentCredentials(authData.user.id, email, password);
          }
          
          // Convert to app user format
          const appUser = convertToAppUser(profileData);
          return {
            user: appUser,
            error: null,
            session: authData.session
          };
        } else {
          console.log('❌ Profile not found for user:', authData.user.id);
        }
      } else {
        console.log('❌ Supabase Auth error:', authError?.message);
      }

      // If Supabase Auth failed or profile not found, try DB-backed agent authentication
      console.log('🔄 Trying DB-backed agent authentication');
      const agentResponse = await this.tryAgentLogin(email, password);
      if (agentResponse && agentResponse.user) {
        console.log('✅ DB-backed agent authentication successful');
        return agentResponse;
      }

      // If both methods failed, return appropriate error
      return {
        user: null,
        error: authError?.message || 'Authentication failed',
        session: null
      };
    } catch (error) {
      console.error('❌ Sign-in error:', error);
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Authentication failed',
        session: null
      };
    }
  }

  /**
   * Check if a user exists by email using the Admin Auth client.
   * Returns { exists, id } where id is the Supabase Auth user id if found.
   */
  static async userExistsByEmail(email: string): Promise<{ exists: boolean; id?: string }> {
    try {
      if (!email) return { exists: false };
      const target = String(email).trim().toLowerCase();

      // Prefer admin listUsers when available
      if (isAdminClientConfigured && adminSupabase) {
        const adminAuth = (adminSupabase as any).auth.admin;
        const { data, error } = await adminAuth.listUsers();
        if (error) {
          console.warn('Error listing users for email check:', error.message || error);
        } else {
          const match = (data?.users || []).find((u: any) => String(u.email || '').toLowerCase() === target);
          if (match) return { exists: true, id: match.id };
        }
      }

      // Fallback: call RPC if available
      try {
        const { data: rpcData, error: rpcErr } = await (supabase as any).rpc('check_user_exists_by_email', { p_email: target });
        if (rpcErr) {
          // Silently ignore RPC errors and return false
          // console.warn('RPC email check error:', rpcErr.message || rpcErr);
          return { exists: false };
        }
        if (rpcData && typeof rpcData === 'object') {
          const exists = !!(rpcData as any).exists;
          const id = (rpcData as any).id;
          return { exists, id };
        }
      } catch {}

      return { exists: false };
    } catch (e) {
      console.warn('userExistsByEmail error:', e);
      return { exists: false };
    }
  }

  /**
   * Check if a user exists by phone using Admin Auth and user metadata.
   * Normalizes to digits-only when comparing.
   */
  static async userExistsByPhone(phone: string): Promise<{ exists: boolean; id?: string }> {
    try {
      if (!phone) return { exists: false };
      const normalize = (p: string) => String(p || '').replace(/\D/g, '');
      const target = normalize(phone);
      if (!target) return { exists: false };

      // Prefer admin listUsers when available
      if (isAdminClientConfigured && adminSupabase) {
        const adminAuth = (adminSupabase as any).auth.admin;
        const { data, error } = await adminAuth.listUsers();
        if (error) {
          console.warn('Error listing users for phone check:', error.message || error);
        } else {
          const match = (data?.users || []).find((u: any) => {
            const authPhone = normalize(u.phone || '');
            const metaPhone = normalize(u.user_metadata?.phone || '');
            return authPhone === target || metaPhone === target;
          });
          if (match) return { exists: true, id: match.id };
        }
      }

      // Fallback: call RPC if available
      try {
        const { data: rpcData, error: rpcErr } = await (supabase as any).rpc('check_user_exists_by_phone', { p_phone: target });
        if (rpcErr) {
          // console.warn('RPC phone check error:', rpcErr.message || rpcErr);
          return { exists: false };
        }
        if (rpcData && typeof rpcData === 'object') {
          const exists = !!(rpcData as any).exists;
          const id = (rpcData as any).id;
          return { exists, id };
        }
      } catch {}

      return { exists: false };
    } catch (e) {
      console.warn('userExistsByPhone error:', e);
      return { exists: false };
    }
  }

  /**
   * Sync Supabase password to agent_credentials table for fallback authentication
   */
  private static async syncSupabasePasswordToAgentCredentials(
    userId: string, 
    email: string, 
    password: string
  ): Promise<void> {
    try {
      // Import AgentManagementService here to avoid circular dependency
      const { AgentManagementService } = await import('./agentManagementService');
      
      // Check if agent credentials already exist and are not temporary
      const { data: existingCreds, error: credsError } = await (supabase as any)
        .from('agent_credentials')
        .select('username, is_temporary, agent_id')
        .eq('username', email)
        .single();

      if (credsError && credsError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected if no credentials exist
        console.warn('⚠️ Error checking existing credentials:', credsError.message);
        return;
      }

      // Only sync if credentials don't exist or are temporary
      if (!existingCreds || (existingCreds as any)?.is_temporary) {
        await AgentManagementService.setAgentCredentials(userId, email, password, false);
        console.log('✅ Synced Supabase password to agent_credentials for:', email);
      } else {
        console.log('ℹ️ Agent credentials already exist and are not temporary for:', email);
      }
    } catch (error) {
      console.warn('⚠️ Failed to sync password to agent_credentials:', error);
      // Don't fail the login if sync fails
    }
  }

  static async tryAgentLogin(username: string, password: string): Promise<AuthResponse | null> {
    try {
      // Cast client for RPC call not present in generated Database types
      const { data, error } = await (supabase as any).rpc('authenticate_managed_agent', {
        p_username: username,
        p_password: password
      });

      if (error) {
        console.log('❌ Agent RPC auth error:', error.message || error);
        return {
          user: null,
          error: error.message || 'Agent authentication failed',
          session: null
        };
      }

      if (data && (data as any).ok) {
        const agent = (data as any).agent;

        const appUser = AuthService.convertAgentToAppUser(agent);
        return {
          user: appUser,
          error: null,
          session: null
        };
      }

      // If RPC returned ok=false, surface its error message
      if (data && (data as any).error) {
        const errMsg = (data as any).error;
        // Provide a friendly message for gating
        const message = errMsg === 'Password change required'
          ? 'Password change required. Please use the invite link or reset your password.'
          : errMsg;
        return {
          user: null,
          error: message,
          session: null
        };
      }

      return {
        user: null,
        error: 'Agent authentication failed',
        session: null
      };
    } catch (err) {
      console.log('❌ Agent login fallback error:', err);
      return {
        user: null,
        error: 'Agent authentication failed',
        session: null
      };
    }
  }

  // Convert agent basic info to app User type
  static convertAgentToAppUser(agent: { id: string; name: string; email: string; role: string }): User {
    return {
      id: agent.id,
      email: agent.email,
      name: agent.name || agent.email,
      role: 'agent',
      department: 'Sales',
      status: 'active' as const,
      position: 'Travel Agent',
      phone: '',
      avatar: '',
      permissions: getPermissionsByRole('agent'),
    };
  }

  static async signUp(email: string, password: string, userData: Partial<AuthUser>): Promise<AuthResponse> {
    try {
      const { data, error } = await authHelpers.signUp(email, password, {
        name: userData.name,
        role: userData.role || 'agent',
        department: userData.department, 
        phone: userData.phone,
        position: userData.position || userData.role || 'Agent',
        employee_id: userData.employee_id ?? userData.employeeId,
        company_name: userData.company_name,
        city: userData.city,
        country: userData.country,
        // Forward optional metadata control for password change requirement
        must_change_password: userData.must_change_password === true,
      });
  
      if (error) {
        // Fallback: attempt admin user creation if configured
        const msg = error.message || '';
        const isServerSaveError = msg.toLowerCase().includes('database error saving new user');
        if (isServerSaveError && isAdminClientConfigured && adminSupabase) {
          try {
            const { data: adminCreate, error: adminErr } = await adminSupabase.auth.admin.createUser({
              email,
              password,
              user_metadata: {
                name: userData.name,
                role: userData.role || 'agent',
                department: userData.department,
                phone: userData.phone,
                position: userData.position || userData.role || 'Agent',
                employee_id: userData.employee_id ?? userData.employeeId,
                company_name: userData.company_name,
                city: userData.city,
                country: userData.country,
                must_change_password: userData.must_change_password === true,
              }
            });
  
            if (!adminErr && adminCreate?.user?.id) {
              // Create profile using admin client to avoid RLS
              await adminSupabase
                .from('profiles')
                .insert([{ 
                  id: adminCreate.user.id,
                  name: userData.name || email,
                  email,
                  role: userData.role || 'agent',
                  department: userData.department,
                  phone: userData.phone,
                  status: 'active',
                  position: userData.position || userData.role || 'Agent',
                  employee_id: userData.employee_id ?? userData.employeeId,
                  company_name: userData.company_name,
                  city: userData.city,
                  country: userData.country,
                  must_change_password: userData.must_change_password === true,
                }]);
  
              const appUser: User = {
                id: adminCreate.user.id,
                email,
                name: userData.name || email,
                role: userData.role || 'agent',
                department: userData.department,
                phone: userData.phone || '',
                status: 'inactive',
                position: userData.position || userData.role || 'Agent',
                employeeId: userData.employee_id ?? userData.employeeId,
                permissions: getPermissionsByRole(userData.role || 'agent'),
                avatar: '',
              };
  
              return {
                user: appUser,
                error: null,
                session: null
              };
            }
          } catch (adminCreateEx) {
            // fall through to return original error
          }
        }
  
        return {
          user: null,
          error: error.message,
          session: null
        };
      }
  
      if (data.user) {
        // Upsert profile idempotently (trigger may already have created it)
        // Use admin client when available to bypass RLS; otherwise rely on trigger only
        try {
          if (isAdminClientConfigured && adminSupabase) {
            const { error: adminProfileErr } = await adminSupabase
              .from('profiles')
              .upsert([
                {
                  id: data.user.id,
                  name: userData.name || email,
                  email: email,
                  role: userData.role || 'agent',
                  department: userData.department,
                  phone: userData.phone,
                  status: 'active',
                  position: userData.position || userData.role || 'Agent',
                  employee_id: userData.employee_id ?? userData.employeeId,
                  company_name: userData.company_name,
                  city: userData.city,
                  country: userData.country,
                }
              ], { onConflict: 'id' });
            if (adminProfileErr) {
              console.warn('Admin profile upsert error (non-blocking):', adminProfileErr);
            }
          } else {
            // No admin client; proactively ensure profile exists via SECURITY DEFINER RPC
            try {
              await AuthService.ensureProfileExists(data.user);
            } catch (ensureEx) {
              console.warn('ensureProfileExists after signUp failed (non-blocking):', ensureEx);
            }
          }
        } catch (profileUpsertEx) {
          console.warn('Profile upsert exception (non-blocking):', profileUpsertEx);
        }

        // Prefer returning the ensured profile if available
        let ensuredUser: any = null;
        try {
          ensuredUser = await AuthService.ensureProfileExists(data.user);
        } catch {}

        const appUser: User = ensuredUser
          ? convertToAppUser(ensuredUser)
          : {
              id: data.user.id,
              email: email,
              name: userData.name || email,
              role: userData.role || 'agent',
              department: userData.department,
              phone: userData.phone || '',
              status: 'active',
              position: userData.position || userData.role || 'Agent',
              employeeId: userData.employee_id ?? userData.employeeId,
              permissions: getPermissionsByRole(userData.role || 'agent'),
              avatar: '',
            };
  
        return {
          user: appUser,
          error: null,
          session: data.session
        };
      }
  
      return {
        user: null,
        error: 'Sign up failed',
        session: null
      };
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Sign up failed',
        session: null
      };
    }
  }

  /**
   * Sign in with Google OAuth and assign agent role
   */
  static async signInWithGoogle(role: string = 'agent'): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting Google OAuth sign-in with role:', role);
      
      // Initiate Google OAuth flow
      const { data, error } = await authHelpers.signInWithGoogle(role);
      
      if (error) {
        console.error('❌ Google OAuth error:', error);
        return {
          user: null,
          error: error.message || 'Google authentication failed',
          session: null
        };
      }

      // The OAuth flow will redirect to Google and back to /login
      // The session will be handled by the auth state change listener
      console.log('✅ Google OAuth initiated successfully');
      
      return {
        user: null, // User will be set by auth state change listener
        error: null,
        session: null // Session will be set after redirect
      };
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Google authentication failed',
        session: null
      };
    }
  }

  static async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await authHelpers.signOut();
      return { error: error?.message || null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Sign out failed' };
    }
  }

  static async getCurrentSession(): Promise<{ user: User | null; session: any; error: string | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return { user: null, session: null, error: error.message };
      }

      if (!session?.user) {
        return { user: null, session: null, error: null };
      }

      // Fetch current user's profile directly; self-heal if missing
      const { data: profileRow, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', (session.user as any).id)
        .maybeSingle();

      console.log('🔍 getCurrentSession - Profile query result:', { profileRow, profileErr });

      const profileData: any = profileRow || await AuthService.ensureProfileExists(session.user);
      if (!profileData) {
        console.log('❌ Profile not found for user:', (session.user as any).id);
        return { user: null, session: session, error: 'Profile not found' };
      }
      
      console.log('✅ Profile data found:', profileData.id, 'with role:', profileData.role);

      // Post-login enrichment: if metadata contains fields missing in profile, persist them
      try {
        const meta: any = (session.user as any)?.user_metadata || (session.user as any)?.app_metadata || {};
        const updates: Partial<AuthUser> = {};
        const hasValue = (v: any) => v !== undefined && v !== null && String(v).trim() !== '';

        if (!hasValue((profileData as any)?.name) && hasValue(meta.name)) {
          updates.name = meta.name;
        }
        if (!hasValue((profileData as any)?.phone) && hasValue(meta.phone)) {
          updates.phone = meta.phone;
        }
        const metaCompany = (hasValue(meta.company_name) ? meta.company_name : (hasValue(meta.agency_name) ? meta.agency_name : undefined));
        if (!hasValue((profileData as any)?.company_name) && hasValue(metaCompany)) {
          updates.company_name = metaCompany as any;
        }
        if (!hasValue((profileData as any)?.city) && hasValue(meta.city)) {
          updates.city = meta.city;
        }
        if (!hasValue((profileData as any)?.country) && hasValue(meta.country)) {
          updates.country = meta.country;
        }
        // Ensure email stored in profiles if missing
        const authEmail = (session.user as any)?.email;
        if (!hasValue((profileData as any)?.email) && hasValue(authEmail)) {
          updates.email = authEmail as any;
        }

        if (Object.keys(updates).length > 0) {
          await AuthService.updateProfile((session.user as any).id, updates);
          // Merge updates into profileData for return
          Object.assign(profileData as any, updates);
        }
      } catch (enrichErr) {
        console.warn('⚠️ Profile enrichment skipped:', enrichErr);
      }

      const appUser = convertToAppUser(profileData);
      return { user: appUser, session: session, error: null };
    } catch (error) {
      return { 
        user: null, 
        session: null, 
        error: error instanceof Error ? error.message : 'Session check failed' 
      };
    }
  }

  static async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await authHelpers.resetPassword(email);
      return { error: error?.message || null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Password reset failed' };
    }
  }

  /**
   * Re-authenticate the current user using their current password before sensitive actions.
   */
  static async reauthenticateWithPassword(currentPassword: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();
      if (getUserError || !user || !user.email) {
        return { ok: false, error: 'User not authenticated' };
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email as string,
        password: currentPassword,
      });
      if (error) {
        return { ok: false, error: error.message || 'Invalid current password' };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Re-authentication failed' };
    }
  }

  /**
   * Enhanced password update that handles both Supabase and DB-backed agents
   */
  static async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { error: 'User not authenticated' };
      }

      // Determine role and email without querying profiles to avoid RLS recursion
      const meta: any = (user as any)?.user_metadata || (user as any)?.app_metadata || {};
      const role: string = meta.role || 'agent';
      const emailForAgent: string | null = user.email || null;

      // Update Supabase password
      const { error: supabaseError } = await authHelpers.updatePassword(newPassword);
      
      if (supabaseError) {
        return { error: (supabaseError as any).message || 'Password update failed' };
      }

      // Clear metadata flag requiring password change, if present
      try {
        await supabase.auth.updateUser({
          // Only update metadata; password already updated above
          data: { must_change_password: false }
        });
      } catch (metaErr) {
        console.warn('⚠️ Failed to clear must_change_password metadata (non-blocking):', metaErr);
      }

      // If user is an agent, also update their DB credentials
      if (role === 'agent' && emailForAgent) {
        try {
          // Import AgentManagementService here to avoid circular dependency
          const { AgentManagementService } = await import('./agentManagementService');
          
          await AgentManagementService.setAgentCredentials(
            user.id,
            emailForAgent,
            newPassword,
            false
          );
          console.log('✅ Updated both Supabase and DB credentials for agent:', emailForAgent);
        } catch (dbError) {
          console.warn('⚠️ Failed to update DB credentials, but Supabase password updated:', dbError);
          // Don't fail the entire operation if DB sync fails
        }
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Password update error:', error);
      return { error: error instanceof Error ? error.message : 'Password update failed' };
    }
  }

  static async updateProfile(userId: string, updates: Partial<AuthUser>): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          email: updates.email,
          phone: updates.phone,
          department: updates.department,
          position: updates.position,
          employee_id: updates.employee_id ?? updates.employeeId,
          company_name: updates.company_name,
          city: updates.city,
          country: updates.country,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { user: null, error: error.message };
      }

      const appUser = convertToAppUser(data);
      return { user: appUser, error: null };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Profile update failed' };
    }
  }

  /**
   * Check if user needs to change password (for temporary credentials)
   */
  static async checkPasswordChangeRequired(): Promise<{ required: boolean; reason?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { required: false };
      }

      // Check user metadata flag first for general users
      const meta: any = (user as any)?.user_metadata || (user as any)?.app_metadata || {};
      if (meta.must_change_password === true) {
        return {
          required: true,
          reason: 'Your account requires a password change before proceeding.'
        };
      }

      // Determine role and email from auth user metadata to avoid profiles RLS recursion
      const role: string = typeof meta.role === 'string' ? meta.role : 'agent';
      const emailForAgent: string | null = (user as any)?.email || null;

      // For agents, check if they have temporary credentials
      if (role === 'agent' && emailForAgent) {
        const { data: credData, error: credErr } = await (supabase as any)
          .rpc('get_agent_credentials_status', { p_username: emailForAgent });

        if (credErr) {
          console.warn('⚠️ Error checking agent credentials via RPC:', credErr.message || credErr);
          return { required: false };
        }

        // RPC returns a row with fields: credential_exists, is_temporary, agent_id
        if ((credData as any)?.is_temporary) {
          return {
            required: true,
            reason: 'You are using temporary credentials. Please change your password for security.'
          };
        }
      }

      return { required: false };
    } catch (error) {
      console.warn('⚠️ Failed to check password change requirement:', error);
      return { required: false };
    }
  }

  /**
   * Ensure a profile row exists for the given auth user id; upsert minimal data if missing
   */
  private static async ensureProfileExists(authUser: { id: string; email?: string; user_metadata?: any; app_metadata?: any }): Promise<any | null> {
    try {
      // First, try reading existing profile directly
      if (authUser?.id) {
        const { data: existing, error: readErr } = await supabase
          .from('profiles' as any)
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();
        if (!readErr && existing) {
          return existing;
        }
      }
      // Use admin client to upsert minimal profile without RLS recursion
      if (isAdminClientConfigured && adminSupabase && authUser?.id) {
        // Determine role via current session RPC when available; default to 'user'
        let role: string = 'user';
        
        // Check if user came from Google OAuth with specified role
        const metadata = authUser?.user_metadata || {};
        console.log('🔍 ensureProfileExists - Checking metadata for role:', metadata);
        
        if (metadata.role) {
          role = metadata.role;
          console.log('✅ Found role in metadata:', role);
        } else {
          try {
            const { data: roleData, error: roleErr } = await (supabase as any).rpc('get_current_user_role');
            if (!roleErr && typeof roleData === 'string' && roleData) {
              role = roleData;
              console.log('✅ Found role via RPC:', role);
            } else {
              console.log('ℹ️ No role found via RPC, defaulting to user');
            }
          } catch (e) {
            console.log('ℹ️ RPC error, defaulting to user role:', e);
          }
        }

        const name = (authUser?.user_metadata?.name) 
          || (authUser?.email ? String(authUser.email).split('@')[0] : 'User');
        const email = authUser?.email || null;
        const phone = authUser?.user_metadata?.phone || null;

        const payload: any = {
          id: authUser.id,
          name,
          email,
          role,
          phone,
          status: 'active',
          position: role || 'User',
          must_change_password: (authUser?.user_metadata?.must_change_password === true),
          updated_at: new Date().toISOString()
        };

        const { data: upserted, error: upsertErr } = await adminSupabase
          .from('profiles')
          .upsert([payload], { onConflict: 'id' })
          .select()
          .single();

        if (!upsertErr && upserted) {
          console.log('✅ Profile ensured via admin client:', upserted.id, 'with role:', upserted.role);
          return upserted;
        } else {
          console.warn('Admin profile upsert error (non-blocking):', upsertErr);
        }
      }

      return null;
    } catch (e) {
      console.warn('⚠️ ensureProfileExists error:', e);
      return null;
    }
  }
}