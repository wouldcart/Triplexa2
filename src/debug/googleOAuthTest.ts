/**
 * Test script to verify Google OAuth configuration
 */

import { supabase } from '@/lib/supabaseClient';

export const testGoogleOAuthConfig = async () => {
  try {
    console.log('🔍 Testing Google OAuth configuration...');
    
    // Test 1: Check if Supabase client is properly configured
    console.log('✅ Supabase URL:', supabase.supabaseUrl);
    
    // Test 2: Try to initiate Google OAuth flow
    console.log('🚀 Testing Google OAuth initiation...');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        data: {
          role: 'agent'
        }
      }
    });
    
    if (error) {
      console.error('❌ Google OAuth test failed:', error);
      console.error('📝 Error details:', error.message);
      
      // Check for specific configuration errors
      if (error.message?.includes('provider') || error.message?.includes('oauth')) {
        console.error('🔧 Google OAuth provider may not be configured in Supabase dashboard');
        console.error('📋 Please check: https://app.supabase.com/project/xzofytokwszfwiupsdvi/auth/providers');
      }
      
      return { success: false, error: error.message };
    }
    
    console.log('✅ Google OAuth test successful!');
    console.log('📊 OAuth URL:', data?.url);
    return { success: true, url: data?.url };
    
  } catch (err) {
    console.error('🚨 Unexpected error testing Google OAuth:', err);
    return { success: false, error: 'Unexpected error' };
  }
};

// Run the test if this file is imported
if (typeof window !== 'undefined') {
  console.log('🧪 Google OAuth test script loaded. Run testGoogleOAuthConfig() to test.');
}