import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Chrome, TestTube } from 'lucide-react';

const GoogleOAuthDiagnostic: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const testGoogleOAuth = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🧪 Starting Google OAuth diagnostic test...');
      
      // Test 1: Check environment variables
      console.log('🔍 Environment check:');
      console.log('📍 VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('📍 VITE_SUPABASE_PROJECT_ID:', import.meta.env.VITE_SUPABASE_PROJECT_ID);
      console.log('📍 VITE_SUPABASE_SERVICE_ROLE_KEY exists:', !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
      
      // Test 2: Try to initiate Google OAuth
      console.log('🚀 Testing Google OAuth initiation...');
      const { supabase } = await import('@/lib/supabaseClient');
      
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
        
        let errorMessage = error.message;
        let suggestion = '';
        
        if (error.message?.includes('provider') || error.message?.includes('oauth')) {
          errorMessage = 'Google OAuth provider is not configured in Supabase dashboard';
          suggestion = 'Please enable Google OAuth in your Supabase project settings at https://app.supabase.com/project/xzofytokwszfwiupsdvi/auth/providers';
        } else if (error.message?.includes('redirect')) {
          errorMessage = 'Redirect URL configuration issue';
          suggestion = 'Please verify the redirect URL is properly configured in your Google OAuth app settings';
        }
        
        setResult({
          type: 'error',
          message: `${errorMessage}${suggestion ? `\n\n${suggestion}` : ''}`
        });
      } else {
        console.log('✅ Google OAuth test successful!');
        console.log('📊 OAuth URL generated:', data?.url);
        
        setResult({
          type: 'success',
          message: 'Google OAuth is properly configured! Click the button below to proceed with actual authentication.'
        });
      }
      
    } catch (err: any) {
      console.error('🚨 Unexpected error during Google OAuth test:', err);
      setResult({
        type: 'error',
        message: `Unexpected error: ${err.message || 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateRealGoogleOAuth = async () => {
    try {
      setLoading(true);
      console.log('🔐 Initiating real Google OAuth flow...');
      
      const { signInWithGoogle } = await import('@/contexts/AuthContext');
      const { useAuth } = await import('@/contexts/AuthContext');
      const { signInWithGoogle: authSignInWithGoogle } = useAuth();
      
      const result = await authSignInWithGoogle('agent');
      
      if (result.error) {
        console.error('❌ Real Google OAuth failed:', result.error);
        setResult({
          type: 'error',
          message: `Google OAuth failed: ${result.error}`
        });
      } else {
        console.log('✅ Real Google OAuth initiated successfully!');
        setResult({
          type: 'success',
          message: 'Google OAuth initiated! You should be redirected to Google shortly...'
        });
      }
    } catch (err: any) {
      console.error('🚨 Error during real Google OAuth:', err);
      setResult({
        type: 'error',
        message: `Error: ${err.message || 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Google OAuth Diagnostic Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-gray-600">
            <p>This tool will help diagnose Google OAuth configuration issues.</p>
            <p className="mt-2 font-medium">Steps to verify Google OAuth setup:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Click "Test Google OAuth Configuration" to check basic setup</li>
              <li>If successful, click "Initiate Real Google OAuth" to test the actual flow</li>
              <li>Check the browser console for detailed logs</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={testGoogleOAuth}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {loading ? 'Testing...' : 'Test Google OAuth Configuration'}
            </Button>
            
            <Button
              onClick={initiateRealGoogleOAuth}
              disabled={loading}
              className="flex-1"
            >
              <Chrome className="h-4 w-4 mr-2" />
              {loading ? 'Processing...' : 'Initiate Real Google OAuth'}
            </Button>
          </div>

          {result && (
            <Alert variant={result.type === 'success' ? 'default' : 'destructive'}>
              <AlertDescription className="whitespace-pre-line">
                {result.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Console Logs:</h4>
            <p className="text-sm text-gray-600">
              Open your browser's developer console (F12) to see detailed logs during the authentication process.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Google OAuth Setup Checklist:</h4>
            <ul className="text-sm space-y-1">
              <li>✅ Supabase project configured</li>
              <li>🔍 Google OAuth provider enabled in Supabase dashboard</li>
              <li>🔍 Authorized redirect URIs configured in Google Cloud Console</li>
              <li>🔍 Client ID and secret added to Supabase</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleOAuthDiagnostic;