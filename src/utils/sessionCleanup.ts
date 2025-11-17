import { supabase } from '../lib/supabaseClient';

export interface CleanupOptions {
  clearLocalStorage?: boolean;
  clearSessionStorage?: boolean;
  clearIndexedDB?: boolean;
  clearCookies?: boolean;
}

export class SessionCleanup {
  /**
   * Comprehensive session cleanup utility
   */
  static async performCleanup(options: CleanupOptions = {}): Promise<void> {
    const {
      clearLocalStorage = true,
      clearSessionStorage = true,
      clearIndexedDB = true,
      clearCookies = false
    } = options;

    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear localStorage items
      if (clearLocalStorage) {
        this.clearLocalStorageItems();
      }

      // Clear sessionStorage
      if (clearSessionStorage) {
        this.clearSessionStorageItems();
      }

      // Clear IndexedDB (Supabase may use this for session storage)
      if (clearIndexedDB) {
        await this.clearIndexedDBItems();
      }

      // Clear cookies if requested (usually not needed for Supabase)
      if (clearCookies) {
        this.clearAuthCookies();
      }

      console.log('Session cleanup completed successfully');
    } catch (error) {
      console.error('Error during session cleanup:', error);
      // Even if there's an error, try to clear local storage
      if (clearLocalStorage) {
        this.clearLocalStorageItems();
      }
    }
  }

  /**
   * Clear specific localStorage items related to authentication
   */
  private static clearLocalStorageItems(): void {
    try {
      // Check if localStorage is available and accessible
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn('localStorage not available');
        return;
      }

      const authKeys = [
        'user_permissions',
        'supabase.auth.token',
        'sb-auth-token',
        'sb-refresh-token',
        'user_profile',
        'auth_state'
      ];

      // Clear known auth-related keys with permission handling
      authKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (itemError) {
          console.warn(`Could not remove localStorage item ${key}:`, itemError);
        }
      });

      // Clear any keys that start with 'sb-' (Supabase keys)
      try {
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            try {
              localStorage.removeItem(key);
            } catch (itemError) {
              console.warn(`Could not remove localStorage item ${key}:`, itemError);
            }
          }
        });
      } catch (keysError) {
        console.warn('Could not enumerate localStorage keys:', keysError);
      }

      console.log('localStorage cleared');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  /**
   * Clear sessionStorage items
   */
  private static clearSessionStorageItems(): void {
    try {
      const authKeys = [
        'user_permissions',
        'auth_state',
        'temp_session'
      ];

      authKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });

      // Clear any keys that start with 'sb-' or contain 'supabase'
      const allKeys = Object.keys(sessionStorage);
      allKeys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          sessionStorage.removeItem(key);
        }
      });

      console.log('sessionStorage cleared');
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  }

  /**
   * Clear IndexedDB items (async operation)
   */
  private static async clearIndexedDBItems(): Promise<void> {
    try {
      if ('indexedDB' in window) {
        // Get list of databases
        const databases = await indexedDB.databases();
        
        // Clear Supabase-related databases
        for (const db of databases) {
          if (db.name && (db.name.includes('supabase') || db.name.includes('sb-'))) {
            const deleteRequest = indexedDB.deleteDatabase(db.name);
            await new Promise((resolve, reject) => {
              deleteRequest.onsuccess = () => resolve(undefined);
              deleteRequest.onerror = () => reject(deleteRequest.error);
            });
          }
        }
        
        console.log('IndexedDB cleared');
      }
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
    }
  }

  /**
   * Clear authentication-related cookies
   */
  private static clearAuthCookies(): void {
    try {
      const authCookies = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token'
      ];

      authCookies.forEach(cookieName => {
        // Clear cookie by setting it to expire in the past
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      });

      console.log('Auth cookies cleared');
    } catch (error) {
      console.error('Error clearing cookies:', error);
    }
  }

  /**
   * Emergency cleanup - clears everything possible
   */
  static async emergencyCleanup(): Promise<void> {
    console.log('Performing emergency session cleanup...');
    
    await this.performCleanup({
      clearLocalStorage: true,
      clearSessionStorage: true,
      clearIndexedDB: true,
      clearCookies: true
    });

    // Force reload the page to ensure clean state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }

  /**
   * Selective cleanup for logout
   */
  static async logoutCleanup(): Promise<void> {
    await this.performCleanup({
      clearLocalStorage: true,
      clearSessionStorage: false, // Keep some session data for UX
      clearIndexedDB: true,
      clearCookies: false
    });
  }

  /**
   * Light cleanup for token refresh failures
   */
  static async refreshFailureCleanup(): Promise<void> {
    await this.performCleanup({
      clearLocalStorage: true,
      clearSessionStorage: false,
      clearIndexedDB: false,
      clearCookies: false
    });
  }
}

export default SessionCleanup;