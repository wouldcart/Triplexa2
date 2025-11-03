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

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
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
      // Clear local session first
      localStorage.removeItem('sb-xzofytokwszfwiupsdvi-auth-token');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        // Even if there's an error, we've cleared local storage
        return { error: null };
      }
      return { error: null };
    } catch (err) {
      console.error('SignOut catch error:', err);
      // Clear local storage even on error
      localStorage.removeItem('sb-xzofytokwszfwiupsdvi-auth-token');
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
  }
};