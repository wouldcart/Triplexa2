import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useApplicationSettings } from '@/contexts/ApplicationSettingsContext';
import { Building2, Mail, Phone, MapPin, User, Eye, EyeOff, Check, X, Sparkles } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { AgentManagementService } from '@/services/agentManagementService';
import { AuthService } from '@/services/authService';
import { AgentSignupRequest } from '@/types/agentManagement';
import { useToast } from '@/hooks/use-toast';
import { recordReferralCodeIfMissing } from '@/services/staffReferralService';

const AgentSignup: React.FC = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    business_type: '',
    specialization: '',
    address: '',
    city: '',
    country: '',
    password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; label: string }>({ score: 0, label: 'Too short' });
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const { settings } = useApplicationSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const businessTypes = [
    'Travel Agency',
    'Tour Operator',
    'Online Travel Portal',
    'Corporate Travel Desk',
    'Destination Management Company',
    'Travel Consultant',
    'Other'
  ];

  const specializations = [
    'Leisure Travel',
    'Corporate Travel',
    'Adventure Travel',
    'Luxury Travel',
    'Budget Travel',
    'Group Tours',
    'Honeymoon Packages',
    'Educational Tours',
    'Pilgrimage Tours',
    'International Travel',
    'Domestic Travel'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill in all required fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Duplicate checks
    if (emailExists) {
      setError('Email already exists. Please login.');
      return false;
    }
    if (phoneExists) {
      setError('Phone number already exists. Please login.');
      return false;
    }

    // Credentials validation with stronger requirements
    const pwd = formData.password || '';
    const hasLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSymbol = /[^A-Za-z0-9]/.test(pwd);

    if (!pwd) {
      setError('Password is required');
      return false;
    }
    if (!hasLength || !hasUpper || !hasNumber || !hasSymbol) {
      setError('Password must be at least 8 chars and include uppercase, number, and symbol');
      return false;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return false;
    }

    if (!agreed) {
      setError('You must agree to the Terms & Privacy to continue');
      return false;
    }

    return true;
  };

  // Compute password strength whenever the user types
  useEffect(() => {
    const pwd = formData.password || '';
    const score = (
      (pwd.length >= 8 ? 1 : 0) +
      (/[A-Z]/.test(pwd) ? 1 : 0) +
      (/\d/.test(pwd) ? 1 : 0) +
      (/[^A-Za-z0-9]/.test(pwd) ? 1 : 0)
    );
    const labelMap: Record<number, string> = {
      0: 'Too short',
      1: 'Weak',
      2: 'Fair',
      3: 'Good',
      4: 'Strong',
    };
    setPasswordStrength({ score, label: labelMap[score] });
  }, [formData.password]);

  // Generate a strong password and fill both fields
  const handleGeneratePassword = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = upper + lower + numbers + symbols;
    const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
    const length = 14;
    const base = [pick(upper), pick(lower), pick(numbers), pick(symbols)].join('');
    let rest = '';
    for (let i = 0; i < length - base.length; i++) rest += pick(all);
    const raw = (base + rest).split('');
    // Shuffle
    for (let i = raw.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [raw[i], raw[j]] = [raw[j], raw[i]];
    }
    const generated = raw.join('');
    setFormData((prev) => ({ ...prev, password: generated, confirm_password: generated }));
    setPasswordFocused(true);
    setShowPassword(false);
  };

  // Debounced email existence check
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const email = formData.email.trim();
        if (!email) {
          setEmailExists(false);
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setEmailExists(false);
          return;
        }
        const { exists } = await AuthService.userExistsByEmail(email);
        setEmailExists(!!exists);
      } catch {
        setEmailExists(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [formData.email]);

  // Debounced phone existence check (digits-only compare)
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const phone = formData.phone.trim();
        const digits = phone.replace(/\D/g, '');
        if (!digits || digits.length < 7) {
          setPhoneExists(false);
          return;
        }
        const { exists } = await AuthService.userExistsByPhone(phone);
        setPhoneExists(!!exists);
      } catch {
        setPhoneExists(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [formData.phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    // Capture source tracking from URL params
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref') || undefined;
    const utmSource = params.get('utm_source') || undefined;
    const event = params.get('event') || undefined;
    const sourceParam = params.get('source') || undefined;

    let source_type = 'organic';
    let source_details = 'direct_signup';
    if (ref) {
      source_type = 'staff_referral';
      source_details = ref;
      // Record referral code into staff_referrals table if missing
      try { await recordReferralCodeIfMissing(ref); } catch {}
    } else if (event) {
      source_type = 'event';
      source_details = event;
    } else if (utmSource) {
      source_type = 'ad_campaign';
      source_details = utmSource;
    } else if (sourceParam && sourceParam.toLowerCase().startsWith('qr_')) {
      // Backward-compat: old QR links used ?source=qr_<CODE>
      source_type = 'event';
      source_details = sourceParam.replace(/^qr_/i, '');
    }

    const signupRequest = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      company_name: formData.company_name.trim(),
      password: formData.password,
      source_type,
      source_details
    };

    const additionalAgentData = {
      business_address: formData.address.trim(),
      city: formData.city.trim(),
      country: formData.country.trim(),
      type: formData.business_type,
      specializations: formData.specialization ? [formData.specialization] : []
    };

    try {
      const authResponse = await AuthService.signUp(
        formData.email,
        formData.password,
        {
          name: formData.name,
          role: 'agent',
          phone: formData.phone,
          department: 'Agents',
          position: 'External Agent',
          business_address: formData.address,
          city: formData.city,
          country: formData.country,
          business_type: formData.business_type,
          specialization: formData.specialization,
          company_name: formData.company_name,
          source_type,
          source_details,
        } as any
      );

      if (authResponse.error) {
        setLogs((prev) => [...prev, `Signup error: ${authResponse.error}`]);
        setError(authResponse.error);
        return;
      }

      // Sync agent record with all form data to agents table
      setLogs((prev) => [...prev, 'Syncing agent record with complete data...']);
      const result = await AgentManagementService.signupAgent({
        ...signupRequest,
        ...additionalAgentData
      });
      if (result && result.error) {
        console.warn('Managed agents sync error:', result.error);
        setLogs((prev) => [...prev, `Managed agents sync warning: ${String(result.error)}`]);
      }

      // Force source attribution based on URL params (overrides trigger defaults)
      setLogs((prev) => [...prev, 'Enforcing source attribution...']);
      const forceRes = await AgentManagementService.updateAgentSourceByEmail(
        formData.email.trim(),
        source_type,
        source_details
      );
      if (forceRes?.error) {
        console.warn('Force source update warning:', forceRes.error);
        setLogs((prev) => [...prev, `Source update warning: ${String(forceRes.error)}`]);
      }

      toast({
        title: 'Account created',
        description: 'Check your email to verify.',
      });
      setLogs((prev) => [...prev, 'Verification email sent. Redirecting to login...']);
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      setError('Signup failed. Try again.');
      setLogs((prev) => [...prev, `Registration error: ${err instanceof Error ? err.message : String(err)}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="w-full max-w-2xl space-y-6 p-6">
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
            Sign Up
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
           Access exclusive deals, AI itinerary tools, and more.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registration</CardTitle>
            <CardDescription>
              Complete the form below to register as a travel agent or agency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="company_name"
                        placeholder="Enter company name"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Contact Person Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        placeholder="Enter contact person name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10"
                        required
                      />
                      {emailExists && (
                        <div className="mt-2 text-sm flex items-center gap-2">
                          <span className="text-red-600">This email is already registered.</span>
                          <Button
                            type="button"
                            variant="link"
                            className="p-0 h-auto text-blue-600 hover:text-blue-800"
                            onClick={() => navigate(`/login?email=${encodeURIComponent(formData.email.trim())}`)}
                          >
                            Login Instead
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="pl-10"
                        required
                      />
                      {phoneExists && (
                        <div className="mt-2 text-sm flex items-center gap-2">
                          <span className="text-red-600">This phone number is already registered.</span>
                          <Button
                            type="button"
                            variant="link"
                            className="p-0 h-auto text-blue-600 hover:text-blue-800"
                            onClick={() => navigate(`/login?email=${encodeURIComponent(formData.email.trim())}`)}
                          >
                            Login Instead
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

               

                

                 
               
              </div>

            


                














              {/* Login Credentials */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Login Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Create Password *</Label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter a strong password"
                          autoComplete="new-password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(!!formData.password)}
                          className="pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={handleGeneratePassword} className="shrink-0">
                        <Sparkles className="h-4 w-4 mr-1" /> Generate
                      </Button>
                    </div>
                    {/* Password strength meter & compact hints, shown only when typing/creating */}
                    {(passwordFocused || !!formData.password) && (
                      <div className="mt-2">
                        <div className="h-2 w-full rounded bg-gray-200 overflow-hidden">
                          <div
                            className={
                              `h-full transition-all ${
                                passwordStrength.score <= 1 ? 'bg-red-500' :
                                passwordStrength.score === 2 ? 'bg-yellow-500' :
                                passwordStrength.score === 3 ? 'bg-green-500' : 'bg-emerald-600'
                              }`
                            }
                            style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs mt-2 text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-2">
                          <span>Strength: {passwordStrength.label}</span>
                          {(() => {
                            const pwd = formData.password || '';
                            const reqs = [
                              { label: '8+ chars', ok: pwd.length >= 8 },
                              { label: 'capital', ok: /[A-Z]/.test(pwd) },
                              { label: 'number', ok: /\d/.test(pwd) },
                              { label: 'symbol', ok: /[^A-Za-z0-9]/.test(pwd) },
                            ];
                            return reqs.map((r) => (
                              <span key={r.label} className={`flex items-center gap-1 ${r.ok ? 'text-green-600' : 'text-gray-500'}`}>
                                {r.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                {r.label}
                              </span>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        value={formData.confirm_password}
                        onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                        className="pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms & Privacy consent */}
              <div className="flex items-start gap-3">
                <Checkbox id="consent" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                <label htmlFor="consent" className="text-sm text-gray-700 dark:text-gray-300">
                  I agree to the{' '}
                  <a href="/terms" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                </label>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/login')}
                >
                  Back to Login
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading || emailExists || phoneExists || !agreed}
                >
                  {loading ? 'Registering...' : 'Get Started'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        {/* Debug Logs (last 3) */}
        <div className="max-w-2xl mx-auto mt-4">
          {logs.slice(-3).map((msg, idx) => (
            <div key={idx} className="text-xs rounded border p-2 mb-2 bg-muted/30">
              {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentSignup;