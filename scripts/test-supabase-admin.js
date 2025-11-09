// Simple Supabase admin connectivity check using service role key
// Usage: node scripts/test-supabase-admin.js

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
// Prefer service role if present; fall back to anon/publishable for a basic ping
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

async function main() {
  if (!url) {
    console.error('Missing VITE_SUPABASE_URL in environment.');
    process.exit(1);
  }

  if (!serviceKey && !anonKey) {
    console.error('Missing Supabase keys. Provide VITE_SUPABASE_SERVICE_ROLE_KEY or anon/publishable key.');
    process.exit(1);
  }

  const client = createClient(url, serviceKey || anonKey);

  console.log('Testing Supabase connectivity to:', url);

  try {
    if (serviceKey) {
      // Admin check: list users (requires service role key)
      const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (error) throw error;
      console.log('Admin connectivity OK. Users result sample:', {
        total: data?.total ?? 'unknown',
        usersSampleCount: data?.users?.length ?? 0,
      });
    } else {
      // Public check: call a lightweight endpoint (no auth)
      // We attempt to get the auth settings to validate connectivity without requiring a session
      const { data, error } = await client.auth.getAuthSettings();
      if (error) throw error;
      console.log('Public connectivity OK. Auth settings received:', {
        externalProviders: Object.keys(data?.external ?? {}),
      });
    }
  } catch (err) {
    console.error('Supabase connectivity test failed:', err?.message || err);
    process.exit(2);
  }

  console.log('Supabase connectivity test completed successfully.');
}

main();