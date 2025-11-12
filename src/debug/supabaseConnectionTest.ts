// Debug test for Supabase connection and 406 error
import { supabase, adminSupabase, isAdminClientConfigured } from '@/lib/supabaseClient';

export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase Connection...');
  
  // Test 1: Check environment variables
  console.log('📋 Environment Variables:', {
    url: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
    key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'SET' : 'MISSING',
    mode: import.meta.env.MODE
  });

  // Test 2: Test basic connection with regular client
  try {
    console.log('🔗 Testing regular client connection...');
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Regular client error:', error);
    } else {
      console.log('✅ Regular client success:', data);
    }
  } catch (err) {
    console.error('❌ Regular client exception:', err);
  }

  // Test 3: Test admin client connection (server-only)
  const IS_BROWSER = typeof window !== 'undefined';
  if (!IS_BROWSER && isAdminClientConfigured) {
    try {
      console.log('🔗 Testing admin client connection...');
      const { data, error } = await adminSupabase
        .from('app_settings')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ Admin client error:', error);
      } else {
        console.log('✅ Admin client success:', data);
      }
    } catch (err) {
      console.error('❌ Admin client exception:', err);
    }
  } else {
    console.log('ℹ️ Skipping admin client test in browser or when not configured.');
  }

  // Test 4: Test specific brand_tagline query
  try {
    console.log('🔗 Testing specific brand_tagline query...');
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('category', 'Branding & UI')
      .eq('setting_key', 'brand_tagline')
      .eq('is_active', true);
    
    if (error) {
      console.error('❌ Brand tagline query error:', error);
    } else {
      console.log('✅ Brand tagline query success:', data);
    }
  } catch (err) {
    console.error('❌ Brand tagline query exception:', err);
  }

  // Test 5: Check authentication status
  try {
    console.log('🔐 Checking authentication status...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth session error:', error);
    } else {
      console.log('🔐 Auth session:', session ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED');
    }
  } catch (err) {
    console.error('❌ Auth session exception:', err);
  }
};
// Note: No auto-run here. Consumers should invoke conditionally as needed.