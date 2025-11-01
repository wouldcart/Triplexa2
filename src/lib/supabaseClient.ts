// Centralized Supabase clients to avoid multiple GoTrueClient instances.
// Re-export existing configured clients so the app uses a single auth instance.

import { supabase as baseClient, authHelpers } from '@/integrations/supabase/client';
import { supabaseAdmin as adminClient, isAdminClientConfigured } from '@/integrations/supabase/adminClient';

// Primary client for app usage
export const supabase = baseClient;

// Admin/service-role client (server-only). In browser, fall back to base client to prevent
// multiple GoTrueClient instances and avoid runtime null dereferencing.
export const adminSupabase = adminClient || baseClient;

// Flag to know if admin client is configured
export { isAdminClientConfigured };

// Auth helpers from the base client
export { authHelpers };