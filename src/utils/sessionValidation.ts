import { supabase } from '../lib/supabaseClient';
import { SessionManager } from './sessionManager';
import { ExponentialBackoff } from './exponentialBackoff';

export interface SessionValidationResult {
  isValid: boolean;
  needsRefresh: boolean;
  shouldSignOut: boolean;
  error?: string;
}

export class SessionValidator {
  /**
   * Validates the current session and determines the appropriate action
   */
  static async validateCurrentSession(): Promise<SessionValidationResult> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session validation error:', error);
        return {
          isValid: false,
          needsRefresh: false,
          shouldSignOut: true,
          error: error.message
        };
      }

      if (!session) {
        return {
          isValid: false,
          needsRefresh: false,
          shouldSignOut: false
        };
      }

      // Check if token is expired or about to expire (within 5 minutes)
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutesFromNow = now + (5 * 60);

      if (expiresAt && expiresAt <= now) {
        // Token is already expired
        return {
          isValid: false,
          needsRefresh: true,
          shouldSignOut: false
        };
      }

      if (expiresAt && expiresAt <= fiveMinutesFromNow) {
        // Token expires within 5 minutes, should refresh
        return {
          isValid: true,
          needsRefresh: true,
          shouldSignOut: false
        };
      }

      // Session is valid and not expiring soon
      return {
        isValid: true,
        needsRefresh: false,
        shouldSignOut: false
      };
    } catch (error) {
      console.error('Session validation failed:', error);
      return {
        isValid: false,
        needsRefresh: false,
        shouldSignOut: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Attempts to refresh the session if needed
   */
  static async refreshSessionIfNeeded(): Promise<boolean> {
    const validation = await this.validateCurrentSession();
    
    if (!validation.needsRefresh) {
      return validation.isValid;
    }

    // Use exponential backoff for session refresh attempts
    const refreshResult = await ExponentialBackoff.retrySessionRefresh(async () => {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw new Error(`Session refresh failed: ${error.message}`);
      }

      if (!data.session) {
        throw new Error('Session refresh returned no session');
      }

      return data.session;
    });

    if (refreshResult.success) {
      console.log(`Session refreshed successfully after ${refreshResult.attempts} attempt(s)`);
      return true;
    } else {
      console.error(`Session refresh failed after ${refreshResult.attempts} attempt(s):`, refreshResult.error);
      await SessionManager.handleSessionError('Session refresh failed. Please sign in again.', true);
      return false;
    }
  }

  /**
   * Validates session before making API calls
   */
  static async validateBeforeApiCall(): Promise<boolean> {
    const validation = await this.validateCurrentSession();
    
    if (validation.shouldSignOut) {
      await SessionManager.handleSessionError('Your session is invalid. Please sign in again.', true);
      return false;
    }

    if (!validation.isValid && !validation.needsRefresh) {
      // No session at all
      return false;
    }

    if (validation.needsRefresh) {
      return await this.refreshSessionIfNeeded();
    }

    return validation.isValid;
  }

  /**
   * Checks if the user has a valid session for protected routes
   */
  static async isAuthenticated(): Promise<boolean> {
    const validation = await this.validateCurrentSession();
    
    if (validation.shouldSignOut) {
      await SessionManager.clearSession();
      return false;
    }

    if (validation.needsRefresh) {
      return await this.refreshSessionIfNeeded();
    }

    return validation.isValid;
  }
}

export default SessionValidator;