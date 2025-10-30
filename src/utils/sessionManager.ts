import { supabase } from '../lib/supabaseClient';
import { SessionValidator, SessionValidationResult } from './sessionValidation';
import { SessionCleanup } from './sessionCleanup';
import { toast } from '../hooks/use-toast';
import { autoReloginFlow } from './autoReloginFlow';

export class SessionManager {
  private static readonly STORAGE_KEY = 'triplexa-session-check';
  private static readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static lastCheck = 0;

  /**
   * Validates the current session using SessionValidator
   */
  static async validateSession(): Promise<SessionValidationResult> {
    return await SessionValidator.validateCurrentSession();
  }

  /**
   * Attempts to refresh the session using SessionValidator
   */
  static async attemptRefresh(): Promise<boolean> {
    return await SessionValidator.refreshSessionIfNeeded();
  }

  /**
   * Clears all session data using SessionCleanup
   */
  static async clearSession(): Promise<void> {
    await SessionCleanup.logoutCleanup();
  }

  /**
   * Handle session errors with user feedback and auto re-login attempt
   */
  static async handleSessionError(error: any, redirectToLogin = true): Promise<void> {
    console.error('Session error:', error);

    // First, attempt auto re-login if credentials are available
    if (autoReloginFlow.hasStoredCredentials()) {
      const reloginSuccess = await autoReloginFlow.handleRefreshFailure({
        showNotifications: true,
        onFailure: (reloginError) => {
          console.error('Auto re-login failed:', reloginError);
          this.fallbackToManualLogin(redirectToLogin);
        }
      });

      if (reloginSuccess) {
        console.log('Auto re-login successful, session restored');
        return;
      }
    }

    // If auto re-login is not available or failed, fall back to manual login
    this.fallbackToManualLogin(redirectToLogin);
  }

  /**
   * Fallback to manual login when auto re-login fails or is not available
   */
  private static async fallbackToManualLogin(redirectToLogin: boolean): Promise<void> {
    // Clear potentially corrupted session data
    await this.clearSession();

    // Show user-friendly error message
    toast({
      title: "Session Expired",
      description: "Please log in again to continue.",
      variant: "destructive",
    });

    // Redirect to login if requested
    if (redirectToLogin && typeof window !== 'undefined') {
      // Clear any remaining auth state
      localStorage.removeItem('user_permissions');
      
      // Redirect to login page
      window.location.href = '/login';
    }
  }

  /**
   * Periodic session validation (call this from AuthContext)
   */
  static async periodicValidation(): Promise<void> {
    const now = Date.now();
    
    // Only check every 5 minutes to avoid excessive API calls
    if (now - this.lastCheck < this.CHECK_INTERVAL) {
      return;
    }
    
    this.lastCheck = now;
    
    const result = await this.validateSession();
    
    if (result.shouldSignOut) {
      this.handleSessionError(result.error || 'Session validation failed', true);
    } else if (!result.isValid && result.error) {
      console.warn('Session validation warning:', result.error);
    }
  }

  /**
   * Validates session before API calls using SessionValidator
   */
  static async validateBeforeApiCall(): Promise<boolean> {
    return await SessionValidator.validateBeforeApiCall();
  }
}

// Export utility functions for easy use
export const validateSession = () => SessionManager.validateSession();
export const clearSession = () => SessionManager.clearSession();
export const handleSessionError = (error: string, shouldSignOut?: boolean) => 
  SessionManager.handleSessionError(error, shouldSignOut);
export const validateBeforeApiCall = () => SessionManager.validateBeforeApiCall();