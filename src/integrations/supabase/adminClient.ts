// Admin client for bypassing RLS policies
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get configuration from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Avoid creating an admin GoTrue client in the browser to prevent
// "Multiple GoTrueClient instances detected" warnings and undefined behavior.
// The service role key should only be used server-side.
const IS_BROWSER = typeof window !== 'undefined';

// Export a flag to check if admin client is properly configured
export const isAdminClientConfigured = !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) && !IS_BROWSER;

// Custom storage implementation that completely isolates admin client
const adminStorage = {
  getItem: (key: string) => null,
  setItem: (key: string, value: string) => {},
  removeItem: (key: string) => {}
};

// Admin client that bypasses RLS policies (only when configured)
// Completely isolated from main client to prevent multiple GoTrueClient instances
export const supabaseAdmin = isAdminClientConfigured
  ? createClient<Database>(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
          storage: adminStorage,
          storageKey: 'triplexa-admin-auth', // Unique storage key
          flowType: 'implicit' // Different flow type to avoid conflicts
        },
        global: {
          headers: {
            'X-Client-Info': 'triplexa-admin'
          }
        }
      }
    )
  : null as any;