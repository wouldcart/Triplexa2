import { supabase } from '../lib/supabaseClient';
import { toast } from '../hooks/use-toast';
import { ExponentialBackoff } from './exponentialBackoff';

interface ReloginCredentials {
  email: string;
  password: string;
}

interface ReloginOptions {
  maxRetries?: number;
  retryDelay?: number;
  showNotifications?: boolean;
  onSuccess?: () => void;
  onFailure?: (error: Error) => void;
}

export class AutoReloginFlow {
  private static instance: AutoReloginFlow;
  private isReloginInProgress = false;
  private storedCredentials: ReloginCredentials | null = null;
  private reloginQueue: Array<() => void> = [];

  private constructor() {}

  static getInstance(): AutoReloginFlow {
    if (!AutoReloginFlow.instance) {
      AutoReloginFlow.instance = new AutoReloginFlow();
    }
    return AutoReloginFlow.instance;
  }

  /**
   * Store user credentials securely for automatic re-login
   * Note: In production, consider using more secure storage methods
   */
  storeCredentials(email: string, password: string): void {
    // For security, we should encrypt these credentials
    // For now, storing in memory only (lost on page refresh)
    this.storedCredentials = { email, password };
  }

  /**
   * Clear stored credentials
   */
  clearCredentials(): void {
    this.storedCredentials = null;
  }

  /**
   * Check if credentials are available for auto re-login
   */
  hasStoredCredentials(): boolean {
    return this.storedCredentials !== null;
  }

  /**
   * Attempt automatic re-login with stored credentials
   */
  async attemptAutoRelogin(options: ReloginOptions = {}): Promise<boolean> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      showNotifications = true,
      onSuccess,
      onFailure
    } = options;

    if (this.isReloginInProgress) {
      // If re-login is already in progress, wait for it to complete
      return new Promise((resolve) => {
        this.reloginQueue.push(() => resolve(this.hasValidSession()));
      });
    }

    if (!this.storedCredentials) {
      if (showNotifications) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
      }
      onFailure?.(new Error('No stored credentials available for auto re-login'));
      return false;
    }

    this.isReloginInProgress = true;

    try {
      if (showNotifications) {
        toast({
          title: "Session Expired",
          description: "Attempting to restore your session...",
        });
      }

      // Use exponential backoff for re-login attempts
      const reloginResult = await ExponentialBackoff.retryAuth(async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: this.storedCredentials!.email,
          password: this.storedCredentials!.password,
        });

        if (error) {
          throw new Error(`Re-login failed: ${error.message}`);
        }

        if (!data.session) {
          throw new Error('Re-login returned no session');
        }

        return data.session;
      });

      if (reloginResult.success) {
        if (showNotifications) {
          toast({
            title: "Session Restored",
            description: `You have been automatically logged back in after ${reloginResult.attempts} attempt(s).`,
          });
        }

        // Process queued callbacks
        this.processReloginQueue();
        onSuccess?.();
        return true;
      } else {
        // All retries failed
        if (showNotifications) {
          toast({
            title: "Auto Re-login Failed",
            description: "Please log in manually to continue.",
            variant: "destructive",
          });
        }

        // Clear invalid credentials
        this.clearCredentials();
        this.processReloginQueue();
        onFailure?.(reloginResult.error || new Error('Auto re-login failed after all retries'));
        return false;
      }

    } finally {
      this.isReloginInProgress = false;
    }
  }

  /**
   * Check if there's a valid session
   */
  private async hasValidSession(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session !== null && session.expires_at > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  /**
   * Process queued callbacks after re-login attempt
   */
  private processReloginQueue(): void {
    const callbacks = [...this.reloginQueue];
    this.reloginQueue = [];
    callbacks.forEach(callback => callback());
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle session refresh failure and attempt auto re-login
   */
  async handleRefreshFailure(options: ReloginOptions = {}): Promise<boolean> {
    console.warn('Session refresh failed, attempting auto re-login...');
    
    // First, try to refresh the session one more time
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data.session) {
        console.log('Session refresh succeeded on retry');
        return true;
      }
    } catch (error) {
      console.warn('Session refresh retry failed:', error);
    }

    // If refresh still fails, attempt auto re-login
    return this.attemptAutoRelogin(options);
  }

  /**
   * Validate session before API calls and auto re-login if needed
   */
  async validateSessionForApiCall(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('No session found, attempting auto re-login...');
        return this.attemptAutoRelogin({ showNotifications: false });
      }

      // Check if session is about to expire (within 5 minutes)
      const expiresAt = session.expires_at;
      const now = Date.now() / 1000;
      const timeUntilExpiry = expiresAt - now;

      if (timeUntilExpiry < 300) { // 5 minutes
        console.warn('Session expiring soon, attempting refresh...');
        
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.warn('Session refresh failed, attempting auto re-login...');
          return this.attemptAutoRelogin({ showNotifications: false });
        }
      }

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return this.attemptAutoRelogin({ showNotifications: false });
    }
  }
}

// Export singleton instance
export const autoReloginFlow = AutoReloginFlow.getInstance();