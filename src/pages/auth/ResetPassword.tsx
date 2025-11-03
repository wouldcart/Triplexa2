import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { AuthService } from '@/services/authService';
import { useApplicationSettings } from '@/contexts/ApplicationSettingsContext';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { settings } = useApplicationSettings();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  // Handle Supabase recovery flow: exchange PKCE code or process hash tokens
  useEffect(() => {
    const processAuthLink = async () => {
      try {
        // First, try PKCE code from query string
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setError(error.message || 'Invalid or expired reset link');
            return;
          }
          // Clean query to avoid re-processing
          window.history.replaceState(null, document.title, window.location.pathname);
        } else {
          // Fallback: handle hash tokens (access_token/refresh_token) for recovery
          const hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
          if (hash) {
            const h = new URLSearchParams(hash);
            const type = h.get('type');
            const access_token = h.get('access_token');
            const refresh_token = h.get('refresh_token');
            const codeFromHash = h.get('code');

            if (type === 'recovery') {
              if (access_token && refresh_token) {
                const { error } = await supabase.auth.setSession({ access_token, refresh_token } as any);
                if (error) {
                  setError(error.message || 'Failed to process reset link');
                  return;
                }
              } else if (codeFromHash) {
                const { error } = await supabase.auth.exchangeCodeForSession(codeFromHash);
                if (error) {
                  setError(error.message || 'Failed to process reset link');
                  return;
                }
              }
              // Clean hash
              window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
            }
          }
        }

        // After session is set, fetch enriched user to display name/email
        const { user: sessionUser } = await AuthService.getCurrentSession();
        if (sessionUser) {
          setUserName(sessionUser.name || '');
          setUserEmail(sessionUser.email || '');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to process reset link');
      }
    };

    processAuthLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validatePassword = (pwd: string): string | null => {
    if (!pwd || pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Include at least one uppercase letter';
    if (!/\d/.test(pwd)) return 'Include at least one number';
    if (!/[^A-Za-z0-9]/.test(pwd)) return 'Include at least one symbol';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }
    const pwdErr = validatePassword(newPassword);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }

    setLoading(true);
    try {
      const { error: updateErr } = await AuthService.updatePassword(newPassword);
      if (updateErr) {
        setError(updateErr);
        return;
      }

      toast({ title: 'Password updated', description: 'You can now sign in with your new password.' });

      // Sign out to avoid direct login to profile after reset
      await AuthService.signOut();
      navigate('/login');
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : 'Password update failed');
    } finally {
      setLoading(false);
    }
  };

  const companyName = settings.companyDetails?.name || 'TripOex';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              {companyName} {userName ? `- ${userName}` : userEmail ? `- ${userEmail}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>

              <div className="text-center">
                <Button type="button" variant="link" className="p-0 h-auto" onClick={() => navigate('/login')}>
                  Back to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;