
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
import { Eye, EyeOff, Lock, User as UserIcon, Mail, Send, Chrome } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { upsertAgentWithPhone, sendOtp as smsSendOtp, verifyOtp as smsVerifyOtp } from '@/services/smsService';

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
  const [activeTab, setActiveTab] = useState<'email'|'mobile'>('email');
  const [mobilePhone, setMobilePhone] = useState('');
  const [mobileName, setMobileName] = useState('');
  const [mobileRequestId, setMobileRequestId] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileSending, setMobileSending] = useState(false);
  const [mobileVerifying, setMobileVerifying] = useState(false);
  
  // Use ApplicationSettings with fallback for unauthenticated users
  let settings = { 
    logo: '', 
    companyDetails: { 
      name: 'Travel App', 
      tagline: 'Your Travel Partner' 
    } 
  };
  
  try {
    const { settings: appSettings } = useApplicationSettings();
    settings = appSettings || settings;
  } catch (error) {
    // Fallback for when ApplicationSettingsProvider is not available
    console.warn('ApplicationSettingsProvider not available, using fallback settings');
  }
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const { signIn, signInWithGoogle, user } = useAuth();

  // Redirect authenticated users immediately to root (which will handle role-based routing)
  useEffect(() => {
    if (user) {
      console.log('🔄 User already authenticated, redirecting to root for role-based routing');
      console.log('👤 User details:', user.id, 'Role:', user.role);
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔐 Initiating Google OAuth for agent role');
      console.log('📍 Current origin:', window.location.origin);
      console.log('🧪 Testing Supabase client availability...');
      
      // Test if Supabase client is available
      const { supabase: testClient } = await import('../../lib/supabaseClient');
      console.log('✅ Supabase client loaded:', !!testClient);
      
      // Check if we're in a development environment
      console.log('🌍 Environment:', import.meta.env.MODE);
      console.log('🔗 Redirect URL will be:', `${window.location.origin}/login`);
      
      const result = await signInWithGoogle('agent');
      
      if (result.error) {
        console.error('❌ Google sign-in error:', result.error);
        
        // Check for specific OAuth errors
        const errorMessage = result.error;
        if (errorMessage.includes('provider') || errorMessage.includes('oauth')) {
          setError('Google OAuth is not configured. Please contact support or use email login.');
          toast({
            title: "Google OAuth Not Available",
            description: "Google sign-in is not configured. Please use email login or contact support.",
            variant: "destructive",
          });
        } else {
          setError(result.error);
          toast({
            title: "Google sign-in failed",
            description: result.error,
            variant: "destructive",
          });
        }
      } else {
        console.log('✅ Google OAuth initiated, result:', result);
        console.log('🔄 Waiting for redirect...');
        // The OAuth flow will redirect to Google and back
        // The auth state change listener will handle the session
        
        // Show a message to the user
        toast({
          title: "Redirecting to Google...",
          description: "You'll be redirected to Google to complete sign-in.",
        });
      }
    } catch (err: any) {
      console.error('🚨 Google sign-in error:', err);
      setError(err.message || 'Google sign-in failed');
      toast({
        title: "Google sign-in failed",
        description: err.message || 'An error occurred during Google sign-in',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
            <Tabs value={activeTab} onValueChange={(v:any)=>setActiveTab(v)}>
              <TabsList className="mb-4">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
              </TabsList>
              <TabsContent value="email">
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

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <Chrome className="h-4 w-4 mr-2" />
                {loading ? 'Connecting...' : 'Sign in with Google'}
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
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  New to our platform? Sign in with Google to get started.
                </p>
              </div>
            </form>
              </TabsContent>
              <TabsContent value="mobile">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobileName">Name</Label>
                    <Input id="mobileName" type="text" placeholder="Your name" value={mobileName} onChange={(e)=>setMobileName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobilePhone">Mobile (India)</Label>
                    <div className="flex gap-3">
                      <Input id="mobilePhone" type="tel" placeholder="10-digit mobile number" value={mobilePhone} onChange={(e)=>setMobilePhone(e.target.value.replace(/\D/g,''))} maxLength={10} className="flex-1" />
                      <Button type="button" onClick={async()=>{ setMobileSending(true); const r = await smsSendOtp(mobilePhone,'login'); if (r.ok) { setMobileRequestId(r.data.request_id||''); toast({ title:'OTP sent', description:`Enter the OTP sent to +91${mobilePhone}` }); } else { toast({ title:'Send OTP failed', description:String(r.data?.error||'Unknown error'), variant:'destructive' }); } setMobileSending(false); }} disabled={mobileSending || mobilePhone.length!==10 || mobileName.trim()==='' }>
                        {mobileSending ? 'Sending…' : 'Send OTP Code'}
                      </Button>
                    </div>
                  </div>
                  {mobileRequestId && (
                    <div className="space-y-2">
                      <Label>OTP</Label>
                      <Input
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={mobileOtp}
                        onChange={(e)=>setMobileOtp(e.target.value.replace(/\D/g,''))}
                        placeholder="Enter 6-digit OTP"
                      />
                    </div>
                  )}
                  {mobileRequestId && (
                    <div className="flex items-center gap-3">
                      <Button type="button" onClick={async()=>{
                        setMobileVerifying(true);
                        const r = await smsVerifyOtp(mobilePhone, mobileRequestId, mobileOtp)
                        if (r.ok) {
                          const u = await upsertAgentWithPhone(mobilePhone, mobileName || `Agent ${mobilePhone}`)
                          if (u.ok) {
                            const emailAlias = u.data.email
                            const pwd = u.data.password
                            const resp = await signIn(emailAlias, pwd)
                            if (resp.error) {
                              toast({ title:'Login failed', description:String(resp.error), variant:'destructive' })
                            } else {
                              toast({ title:'Login successful', description:`Welcome, ${resp.user?.name||'Agent'}` })
                            }
                          } else {
                            toast({ title:'Account creation failed', description:String(u.data?.error||'Unknown error'), variant:'destructive' })
                          }
                        } else {
                          toast({ title:'Verification failed', description:String(r.data?.error||'Unknown error'), variant:'destructive' })
                        }
                        setMobileVerifying(false);
                      }} disabled={mobileVerifying || mobilePhone.length!==10 || mobileName.trim()==='' || mobileOtp.length!==6}>
                        {mobileVerifying ? 'Verifying…' : 'Verify & Sign In'}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
           
            
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
