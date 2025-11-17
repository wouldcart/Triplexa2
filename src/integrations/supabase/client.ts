// Enhanced Supabase client configuration for database authentication
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Read environment variables for remote Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// Prefer publishable key, but fall back to anon key for robustness
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging for environment variables
console.log('🔧 Supabase Client Initializing:', {
  url: SUPABASE_URL ? `Loaded: ${SUPABASE_URL.substring(0, 20)}...` : 'MISSING - VITE_SUPABASE_URL',
  key: SUPABASE_PUBLISHABLE_KEY ? `Loaded: ${SUPABASE_PUBLISHABLE_KEY.substring(0, 20)}...` : 'MISSING - VITE_SUPABASE_PUBLISHABLE_KEY',
  mode: import.meta.env.MODE,
});


if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ Critical Error: Supabase environment variables are not loaded.', {
    VITE_SUPABASE_URL: SUPABASE_URL ? 'Loaded' : 'Not Loaded',
    VITE_SUPABASE_PUBLISHABLE_KEY: SUPABASE_PUBLISHABLE_KEY ? 'Loaded' : 'Not Loaded'
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Enhanced storage handling with permission checks
const createStorageAdapter = () => {
  try {
    // Test if localStorage is available and accessible
    const testKey = '__supabase_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    
    // If we get here, localStorage is available
    return localStorage;
  } catch (error) {
    console.warn('localStorage not available, falling back to sessionStorage:', error);
    
    try {
      // Try sessionStorage as fallback
      const testKey = '__supabase_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return sessionStorage;
    } catch (sessionError) {
      console.warn('sessionStorage also not available, using memory storage:', sessionError);
      
      // Create a simple memory storage fallback
      const memoryStorage = new Map();
      return {
        getItem: (key: string) => memoryStorage.get(key) || null,
        setItem: (key: string, value: string) => memoryStorage.set(key, value),
        removeItem: (key: string) => memoryStorage.delete(key),
        clear: () => memoryStorage.clear(),
        key: (index: number) => Array.from(memoryStorage.keys())[index] || null,
        get length() { return memoryStorage.size; }
      };
    }
  }
};

const storageAdapter = createStorageAdapter();

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: storageAdapter,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'triplexa-app',
      // Explicitly ensure apikey header is present for auth endpoints
      'apikey': SUPABASE_PUBLISHABLE_KEY
    }
  }
});

// Debug: Log client headers to verify apikey presence
try {
  // Access internal client headers for diagnostics (safe cast)
  const restHeaders = (supabase as any)?.rest?.headers || (supabase as any)?.transport?.headers;
  console.log('🔎 Supabase Client Headers:', restHeaders || 'Unavailable');
} catch (e) {
  console.warn('⚠️ Unable to inspect Supabase client headers:', e);
}

// Auth helper functions
export const authHelpers = {
  // Sign up new user
  signUp: async (email: string, password: string, userData?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          // Redirect back to app after email confirmation
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      if (error) {
        console.error('❌ Supabase signUp error:', error);
      }
      return { data, error };
    } catch (err) {
      console.error('❌ Supabase signUp exception:', err);
      return { data: { user: null, session: null }, error: err as any };
    }
  },

  // Sign in user
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  // Sign out user
  signOut: async () => {
    try {
      // Clear session storage safely with permission handling
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('sb-xzofytokwszfwiupsdvi-auth-token');
        }
      } catch (storageError) {
        console.warn('Could not clear localStorage during signout:', storageError);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        return { error: null };
      }
      return { error: null };
    } catch (err) {
      console.error('SignOut catch error:', err);
      // Try to clear storage even on error, but handle permission issues
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('sb-xzofytokwszfwiupsdvi-auth-token');
        }
      } catch (storageError) {
        console.warn('Could not clear localStorage during error handling:', storageError);
      }
      return { error: null };
    }
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Get current user
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Reset password
  resetPassword: async (email: string) => {
    // Redirect back to main domain root so we can handle `?code=` there
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { data, error };
  },

  // Update password for logged-in user
  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    return { data, error };
  },

  // Send magic link for passwordless login
  signInWithMagicLink: async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`
      }
    });
    return { data, error };
  },

  // Sign in with Google OAuth
  signInWithGoogle: async (role: string = 'agent') => {
    try {
      console.log('🚀 Initiating Google OAuth with redirect to:', `${window.location.origin}/login`);
      console.log('📍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('🎯 Role for Google OAuth user:', role);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Store role in metadata so it can be accessed during profile creation
          data: {
            role: role
          }
        }
      });
      
      console.log('📊 OAuth response:', { data, error });
      
      if (error) {
        console.error('❌ OAuth error:', error);
        // Check if it's a configuration error
        if (error.message?.includes('provider') || error.message?.includes('oauth')) {
          console.error('🔧 Google OAuth may not be configured in Supabase dashboard');
        }
      } else {
        console.log('✅ OAuth initiated successfully, data:', data);
      }
      
      return { data, error };
    } catch (err) {
      console.error('🚨 Exception in signInWithGoogle:', err);
      return { data: null, error: err as any };
    }
  }
};