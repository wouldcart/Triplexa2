
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApplicationSettings } from '../../contexts/ApplicationSettingsContext';
import { AuthService } from '../../services/authService';
import { supabase } from '../../lib/supabaseClient';
import { User } from '../../types/User';
import { Eye, EyeOff, Lock, User as UserIcon, Mail, Send } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  
  // Magic link state
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  
  const { settings } = useApplicationSettings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const { signIn, user } = useAuth();

  // Redirect authenticated users immediately
  useEffect(() => {
    if (user) {
      console.log('🔄 User already authenticated, redirecting to root');
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Prefill username and magic link email from query params
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const emailParam = params.get('email');
      if (emailParam) {
        setUsername(emailParam);
        setMagicLinkEmail(emailParam);
      }
    } catch {}
  }, [location.search]);

  // Handle Supabase invite/magic link: set session from hash and redirect
  useEffect(() => {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const type = params.get('type');
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const code = params.get('code');

    // Handle all Supabase auth link types (invite, magiclink, signup, email_confirm, recovery, email_change)
    const handledTypes = new Set(['invite', 'magiclink', 'signup', 'email_confirm', 'recovery', 'email_change']);
    if (type && handledTypes.has(type)) {
      (async () => {
        try {
          console.log('📩 Processing Supabase auth link:', type);

          // Prefer explicit setSession when BOTH tokens are present
          if (access_token && refresh_token) {
            console.log('🔑 Setting session via setSession with access + refresh tokens');
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token
            } as any);
            if (error) {
              console.error('❌ Error setting Supabase session from auth link:', error);
              setError(error.message || 'Failed to process login link');
              return;
            }
          } else if (code) {
            // PKCE flow fallback (when using flowType: 'pkce')
            console.log('🔄 Exchanging PKCE code for session');
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('❌ Error exchanging code for session:', error);
              setError(error.message || 'Failed to process login link');
              return;
            }
          } else {
            // As a safety net, rely on detectSessionInUrl and check session
            console.log('🕵️ Attempting to detect existing session from URL');
            // Give the client a moment to auto-detect and set session
            await new Promise((r) => setTimeout(r, 150));
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              console.warn('⚠️ No session detected from auth link; tokens missing');
              setError('Login link invalid or expired. Please open the latest email.');
              return;
            }
          }

          // Clean the hash to avoid re-processing on navigation
          window.history.replaceState(null, document.title, window.location.pathname + window.location.search);

          // Fetch enriched app user/session and redirect to role-based dashboard
          const { user: sessionUser, error: sessionError } = await AuthService.getCurrentSession();
          if (sessionError) {
            console.warn('⚠️ Session retrieval after auth link had an issue:', sessionError);
          }

          if (sessionUser) {
            console.log('✅ Auth link processed. Redirecting to dashboard for role:', sessionUser.role);
            navigate('/', { replace: true });
          } else {
            console.log('ℹ️ No app user found after setting session; redirecting to root anyway');
            navigate('/', { replace: true });
          }
        } catch (err) {
          console.error('🚨 Unexpected error processing auth link:', err);
          const msg = err instanceof Error ? err.message : 'Failed to process login link';
          setError(msg);
        }
      })();
    }
  }, [navigate]);



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login for:', username);
      
      // Use AuthContext signIn method
      const authResponse = await signIn(username, password);
      
      if (authResponse.error) {
        console.log('❌ Login error:', authResponse.error);
        setError(authResponse.error);
        return;
      }
      
      if (authResponse.user) {
        console.log('✅ Login successful for user:', authResponse.user.name, 'Role:', authResponse.user.role, 'Department:', authResponse.user.department);
        
        // Store user permissions for access control
        localStorage.setItem('user_permissions', JSON.stringify(authResponse.user.permissions || []));
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${authResponse.user.name}!`,
        });

        // The useEffect will handle redirection when user state is updated
        console.log('✅ Login completed, waiting for AuthContext to update user state');
      } else {
        setError('Invalid username/email or password');
      }
    } catch (err) {
      console.error('🚨 Login error:', err);
      if (err instanceof Error) {
        // More specific error messages based on error type
        if (err.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else if (err.message.includes('Email not confirmed')) {
          setError('Please verify your email address before logging in');
        } else if (err.message.includes('Too many requests')) {
          setError('Too many login attempts. Please try again later');
        } else if (err.message.includes('network')) {
          setError('Network error. Please check your connection');
        } else {
          setError(err.message || 'An error occurred during login');
        }
      } else {
        setError('An error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReset = () => {
    setResetMessage(null);
    setResetEmail(username || '');
    setResetOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage(null);
    const trimmed = resetEmail.trim();
    const emailValid = /.+@.+\..+/.test(trimmed);
    if (!emailValid) {
      setResetMessage('Please enter a valid email address.');
      setResetLoading(false);
      return;
    }
    try {
      const { error: resetError } = await AuthService.resetPassword(trimmed);
      if (resetError) {
        setResetMessage(resetError);
      } else {
        setResetMessage('Password reset email sent. Check your inbox.');
      }
    } catch (err: any) {
      setResetMessage(err.message || 'Unable to send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMagicLinkLoading(true);
    setError('');
    
    const trimmedEmail = magicLinkEmail.trim();
    const emailValid = /.+@.+\..+/.test(trimmedEmail);
    
    if (!emailValid) {
      setError('Please enter a valid email address.');
      setMagicLinkLoading(false);
      return;
    }

    try {
      const { authHelpers } = await import('../../lib/supabaseClient');
      const { data, error } = await authHelpers.signInWithMagicLink(trimmedEmail);
      
      if (error) {
        console.error('Magic link error:', error);
        setError(error.message || 'Failed to send magic link');
      } else {
        setMagicLinkSent(true);
        toast({
          title: "Magic link sent!",
          description: `Check your email at ${trimmedEmail} for the login link.`,
        });
      }
    } catch (err: any) {
      console.error('Magic link error:', err);
      setError(err.message || 'Failed to send magic link');
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const enhancedTestAccounts = [
    { 
      role: 'Super Admin', 
      username: 'akshay@wouldcart.com', 
      password: 'Akki#6342', 
      description: 'Full system access',
      permissions: 'All modules, user management, system settings',
      redirectsTo: 'Main Dashboard'
    },
    { 
      role: 'Manager', 
      username: 'manager@wouldcart.com', 
      password: 'manager123', 
      description: 'Management level access',
      permissions: 'Team oversight, bookings, inventory, reports',
      redirectsTo: 'Main Dashboard'
    },
    { 
      role: 'HR Manager', 
      username: 'hrmanager@wouldcart.com', 
      password: 'hr123', 
      description: 'HR management access',
      permissions: 'Staff management, payroll, attendance, leave',
      redirectsTo: 'HR Dashboard'
    },
    { 
      role: 'Sales Staff', 
      username: 'staff_sales@wouldcart.com', 
      password: 'staff123', 
      description: 'Sales department staff',
      permissions: 'Query management, booking creation, customer relations',
      redirectsTo: 'Sales Dashboard'
    },
    { 
      role: 'Support Staff', 
      username: 'support_agent@wouldcart.com', 
      password: 'support123', 
      description: 'Customer support staff',
      permissions: 'Agent management, ticket handling, communication',
      redirectsTo: 'Support Dashboard'
    },
     { 
      role: 'content Marketing', 
      username: 'content@wouldcart.com', 
      password: 'content123', 
      description: 'Content marketing staff',
      permissions: 'Content creation, campaign management, analytics',
      redirectsTo: 'Content Dashboard'
    },
    { 
      role: 'Field Sales', 
      username: 'field_sales@wouldcart.com', 
      password: 'field123', 
      description: 'Field sales executive',
      permissions: 'Agent acquisition, lead generation, territory management',
      redirectsTo: 'Agent Management'
    },
    { 
      role: 'Operations Staff', 
      username: 'ops_staff@wouldcart.com', 
      password: 'ops123', 
      description: 'Operations department',
      permissions: 'Booking coordination, vendor management, service delivery',
      redirectsTo: 'Operations Dashboard'
    },
    { 
      role: 'Travel Agent', 
      username: 'agent@wouldcart.com', 
      password: 'agent123', 
      description: 'External travel agent',
      permissions: 'Query creation, booking management, commission tracking',
      redirectsTo: 'Agent Dashboard'
    },
    { 
      role: 'Basic User', 
      username: 'user@wouldcart.com', 
      password: 'user123', 
      description: 'Traveler account with trip management',
      permissions: 'Trip viewing, itinerary access, travel history, support',
      redirectsTo: 'Traveler Dashboard'
    }
  ];

  const quickLogin = (username: string, password: string) => {
    setUsername(username);
    setPassword(password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-6 p-6">
        <div className="text-center">
          {settings.logo ? (
            <div className="flex justify-center mb-4">
              <img 
                src={settings.logo} 
                alt={settings.companyDetails.name}
                className="h-12 w-auto object-contain"
              />
            </div>
          ) : (
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">
                {settings.companyDetails.name.charAt(0)}
              </span>
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {settings.companyDetails.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {settings.companyDetails.tagline}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Email</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your registered email address."
                    autoComplete="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between mb-2">
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
                  onClick={handleOpenReset}
                >
                  Forgot password?
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto font-medium text-green-600 hover:text-green-800"
                  onClick={() => setShowMagicLink(true)}
                >
                  Email login
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  First time here?{' '}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
                    onClick={() => navigate('/signup/agent')}
                  >
                    Register your travel agency here.
                  </Button>
                </p>
              </div>
            </form>
           
            
            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset your password</DialogTitle>
                  <DialogDescription>
                    Enter your email to receive a password reset link.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleResetPassword}>
                  <div className="mb-4">
                    <Label htmlFor="resetEmail">Email</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      autoComplete="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  {resetMessage && (
                    <Alert>
                      <AlertDescription>{resetMessage}</AlertDescription>
                    </Alert>
                  )}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={resetLoading}>
                      {resetLoading ? 'Sending…' : 'Send reset email'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            {/* Magic Link Dialog */}
            <Dialog open={showMagicLink} onOpenChange={setShowMagicLink}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Login with Email</DialogTitle>
                  <DialogDescription>
                    {magicLinkSent 
                      ? "Magic link sent! Check your email for the login link."
                      : "Enter your email to receive a magic link for passwordless login."
                    }
                  </DialogDescription>
                </DialogHeader>
                {!magicLinkSent ? (
                  <form onSubmit={handleMagicLink}>
                    <div className="mb-4">
                      <Label htmlFor="magicLinkEmail">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="magicLinkEmail"
                          type="email"
                          autoComplete="email"
                          value={magicLinkEmail}
                          onChange={(e) => setMagicLinkEmail(e.target.value)}
                          placeholder="agent@example.com"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowMagicLink(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={magicLinkLoading}>
                        <Send className="h-4 w-4 mr-2" />
                        {magicLinkLoading ? 'Sending...' : 'Send Magic Link'}
                      </Button>
                    </DialogFooter>
                  </form>
                ) : (
                  <DialogFooter>
                    <Button 
                      onClick={() => {
                        setShowMagicLink(false);
                        setMagicLinkSent(false);
                        setMagicLinkEmail('');
                      }}
                    >
                      Close
                    </Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Enhanced Test Accounts with Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Test Accounts with Permissions</CardTitle>
            <CardDescription className="text-xs">
              Click any account to auto-fill credentials. Each role has specific permissions and dashboard access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
              {enhancedTestAccounts.map((account) => (
                <Button
                  key={account.username}
                  variant="outline"
                  size="sm"
                  className="text-xs justify-start h-auto p-3 text-left"
                  onClick={() => quickLogin(account.username, account.password)}
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{account.role}</span>
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        → {account.redirectsTo}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs mb-1">
                      {account.description}
                    </div>
                    <div className="text-xs text-gray-500 border-t pt-1 mt-1">
                      <strong>Access:</strong> {account.permissions}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Note */}
       <p className="text-sm text-gray-600 dark:text-gray-400">
              By signing in, you agree to our{' '}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
                onClick={() => navigate('/terms')}
              >
                Terms & Conditions
              </Button>{' '}
              and{' '}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
                onClick={() => navigate('/privacy')}
              >
                Privacy Policy
              </Button>.
            </p>
      </div>
    </div>
  );
};

export default Login;
