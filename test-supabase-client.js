// Test script to verify Supabase client initialization
import { supabase } from './src/integrations/supabase/client.js';

console.log('Testing Supabase client...');
console.log('Supabase URL:', supabase.supabaseUrl);
console.log('Supabase Key:', supabase.supabaseKey ? 'Present' : 'Missing');
console.log('Auth headers:', supabase.rest.headers);

// Test a simple auth operation
try {
  const { data, error } = await supabase.auth.getSession();
  console.log('Session test result:', { data: !!data, error: error?.message });
} catch (err) {
  console.error('Session test error:', err.message);
}
