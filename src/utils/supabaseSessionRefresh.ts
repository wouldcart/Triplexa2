// Utility to refresh Supabase session and handle common errors
import { supabase, adminSupabase } from '@/lib/supabaseClient';

/**
 * Refreshes the current Supabase session
 * @returns The refreshed session or null if no session exists
 */
export const refreshSupabaseSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Failed to refresh session:', error.message);
      return null;
    }
    return data.session;
  } catch (err) {
    console.error('Session refresh error:', err);
    return null;
  }
};

/**
 * Safely fetches data from transport_routes table
 * Falls back to adminSupabase if regular client fails
 */
export const fetchTransportRoutes = async () => {
  try {
    // First try with regular client
    const { data, error } = await supabase
      .from('transport_routes')
      .select('*');
    
    if (error) {
      console.warn('Regular client failed, trying admin client:', error.message);
      
      // Fall back to admin client if available
      if (adminSupabase) {
        const { data: adminData, error: adminError } = await adminSupabase
          .from('transport_routes')
          .select('*');
          
        if (adminError) {
          console.error('Admin client also failed:', adminError.message);
          throw adminError;
        }
        
        return adminData;
      } else {
        throw error;
      }
    }
    
    return data;
  } catch (err) {
    console.error('Failed to fetch transport routes:', err);
    throw err;
  }
};