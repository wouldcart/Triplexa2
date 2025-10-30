import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing Supabase URL or anon/publishable key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function run() {
  const testEmail = `auth-test-${Date.now()}@example.com`;
  const testPassword = 'AuthTest#12345';
  console.log('🔐 Testing signUp:', testEmail);

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Auth Test User',
          role: 'agent',
          department: 'Sales',
          company_name: 'Test Co',
          country: 'US',
          city: 'NYC'
        }
      }
    });

    if (error) {
      console.error('❌ signUp error:', error.name, '-', error.message);
      try {
        // Some AuthApiError objects include status
        console.error('   status:', (error).status);
      } catch {}
      process.exit(1);
    }
    console.log('✅ signUp result:', !!data.user, 'user id:', data.user?.id);

    // Verify profiles and agents via admin client
    if (serviceRoleKey && data.user?.id) {
      const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const userId = data.user.id;
      console.log('🔎 Verifying profiles and agents with admin client');
      const { data: profile, error: pErr } = await admin
        .from('profiles')
        .select('id, email, role, status, department, company_name, city, country')
        .eq('id', userId)
        .maybeSingle();
      if (pErr) console.warn('⚠️ Profile fetch error:', pErr.message);
      else console.log('🧑‍💼 Profile:', profile);

      const { data: agent, error: aErr } = await admin
        .from('agents')
        .select('id, user_id, status, agency_name')
        .eq('user_id', userId)
        .maybeSingle();
      if (aErr) console.warn('⚠️ Agent fetch error:', aErr.message);
      else console.log('🧑‍💼 Agent:', agent);
    } else {
      console.log('ℹ️ Skipping admin verification (service role key missing or user not created)');
    }

    // Attempt an immediate sign-in if email confirmation is disabled
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    if (signInError) {
      console.warn('⚠️ signIn error (expected if email confirmation enabled):', signInError.message);
    } else {
      console.log('✅ signIn success for:', signInData.user?.email);
    }
  } catch (err) {
    console.error('❌ signUp exception:', err);
    process.exit(1);
  }
}

run();