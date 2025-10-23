// Centralized Supabase clients to avoid multiple GoTrueClient instances.
// Re-export existing configured clients so the app uses a single auth instance.

import { supabase as baseClient, authHelpers } from '@/integrations/supabase/client';
import { supabaseAdmin as adminClient, isAdminClientConfigured } from '@/integrations/supabase/adminClient';

// Primary client for app usage
export const supabase = baseClient;

// Admin/service-role client (isolated storage to avoid auth conflicts)
export const adminSupabase = adminClient;

// Flag to know if admin client is configured
export { isAdminClientConfigured };

// Auth helpers from the base client
export { authHelpers };