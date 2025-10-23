import { supabase, authHelpers } from '@/lib/supabaseClient';
import { AuthService, AuthResponse } from './authService';
import { AgentManagementService } from './agentManagementService';

export class EnhancedAuthService extends AuthService {
  /**
   * Enhanced sign-in that properly handles Supabase-invited agents
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      // First, try Supabase Auth
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
          const appUser = super.convertToAppUser(profileData);
          return {
            user: appUser,
            error: null,
            session: authData.session
          };
        }
      }

      // If Supabase Auth failed or profile not found, try DB-backed agent authentication
      console.log('❌ Supabase Auth failed, trying DB-backed agent auth');
      const agentResponse = await super.tryAgentLogin(email, password);
      if (agentResponse && agentResponse.user) {
        return agentResponse;
      }

      // If both methods failed, return the original Supabase error
      return {
        user: null,
        error: authError?.message || 'Authentication failed',
        session: null
      };
    } catch (error) {
      console.error('❌ Enhanced sign-in error:', error);
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
      // Check if agent credentials already exist and are not temporary
      const { data: existingCreds, error: credsError } = await (supabase as any)
        .from('agent_credentials')
        .select('is_temporary')
        .eq('username', email)
        .single();

      if (credsError && credsError.code !== 'PGRST116') {
        console.warn('⚠️ Error checking agent credentials:', credsError.message);
        return;
      }

      // Only sync if credentials don't exist or are temporary
      if (!existingCreds || existingCreds.is_temporary) {
        await AgentManagementService.setAgentCredentials(userId, email, password, false);
        console.log('✅ Synced Supabase password to agent_credentials for:', email);
      }
    } catch (error) {
      console.warn('⚠️ Failed to sync password to agent_credentials:', error);
      // Don't fail the login if sync fails
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
        return { error: supabaseError };
      }

      // If user is an agent, also update their DB credentials
      if (profileData?.role === 'agent' && profileData.email) {
        await AgentManagementService.setAgentCredentials(
          user.id, 
          profileData.email, 
          newPassword, 
          false
        );
        console.log('✅ Updated both Supabase and DB credentials for agent:', profileData.email);
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Enhanced password update error:', error);
      return { error: error instanceof Error ? error.message : 'Password update failed' };
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

        if (credStatus?.is_temporary) {
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