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
    case 'admin':
      return ['read', 'write', 'delete', 'manage_users', 'manage_settings'];
    case 'manager':
      return ['read', 'write', 'manage_team'];
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
    department: authUser.department || 'General',
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
        
        // Get user profile from database
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (!profileError && profileData) {
          console.log('✅ Profile found:', profileData.name);
          
          // For agents with Supabase Auth, sync their password to agent_credentials
          if (profileData.role === 'agent') {
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
          console.log('❌ Profile lookup error:', profileError?.message);
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
        department: userData.department || 'General',
        phone: userData.phone,
        position: userData.position || userData.role || 'Agent',
        employee_id: userData.employee_id ?? userData.employeeId,
        company_name: userData.company_name,
        city: userData.city,
        country: userData.country,
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
                department: userData.department || 'General',
                phone: userData.phone,
                position: userData.position || userData.role || 'Agent',
                employee_id: userData.employee_id ?? userData.employeeId,
                company_name: userData.company_name,
                city: userData.city,
                country: userData.country,
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
                  department: userData.department || 'General',
                  phone: userData.phone,
                  status: 'active',
                  position: userData.position || userData.role || 'Agent',
                  employee_id: userData.employee_id ?? userData.employeeId,
                  company_name: userData.company_name,
                  city: userData.city,
                  country: userData.country,
                }]);
  
              const appUser: User = {
                id: adminCreate.user.id,
                email,
                name: userData.name || email,
                role: userData.role || 'agent',
                department: userData.department || 'General',
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
                  department: userData.department || 'General',
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
            // No admin client; avoid client-side upsert to prevent RLS violations.
            // The on_auth_user_created trigger will create the profile.
          }
        } catch (profileUpsertEx) {
          console.warn('Profile upsert exception (non-blocking):', profileUpsertEx);
        }
  
        const appUser: User = {
          id: data.user.id,
          email: email,
          name: userData.name || email,
          role: userData.role || 'agent',
          department: userData.department || 'General',
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

      // Get user profile from database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        return { user: null, session: session, error: 'Profile not found' };
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
   * Enhanced password update that handles both Supabase and DB-backed agents
   */
  static async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { error: 'User not authenticated' };
      }

      // Get user profile to check if they're an agent
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();

      // Update Supabase password
      const { error: supabaseError } = await authHelpers.updatePassword(newPassword);
      
      if (supabaseError) {
        return { error: (supabaseError as any).message || 'Password update failed' };
      }

      // If user is an agent, also update their DB credentials
      if (profileData?.role === 'agent' && profileData.email) {
        try {
          // Import AgentManagementService here to avoid circular dependency
          const { AgentManagementService } = await import('./agentManagementService');
          
          await AgentManagementService.setAgentCredentials(
            user.id, 
            profileData.email, 
            newPassword, 
            false
          );
          console.log('✅ Updated both Supabase and DB credentials for agent:', profileData.email);
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
          phone: updates.phone,
          department: updates.department,
          position: updates.position,
          employee_id: updates.employee_id ?? updates.employeeId,
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

      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();

      // For agents, check if they have temporary credentials
      if (profileData?.role === 'agent' && profileData.email) {
        const { data: credStatus, error: credsError } = await (supabase as any)
          .from('agent_credentials')
          .select('is_temporary')
          .eq('username', profileData.email)
          .single();

        if (credsError && credsError.code !== 'PGRST116') {
          console.warn('⚠️ Error checking agent credentials:', credsError.message);
          return { required: false };
        }

        if ((credStatus as any)?.is_temporary) {
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
}