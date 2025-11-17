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
  // const [logs, setLogs] = useState<string[]>([]); // Hidden for production
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
  const [countryCode, setCountryCode] = useState('+1'); // Default to US
  const [detectedCountry, setDetectedCountry] = useState('');
  const { settings } = useApplicationSettings();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-detect country on component mount
  useEffect(() => {
    detectCountryFromIP();
  }, []);

  const businessTypes = [
    'Travel Agency',
    'Tour Operator',
    'Online Travel Portal',
    'Corporate Travel Desk',
    'Destination Management Company',
    'Travel Consultant',
    'Other'
  ];

  // Country codes for phone number input
  const countryCodes = [
    { code: '+1', country: 'US', name: 'United States' },
    { code: '+44', country: 'GB', name: 'United Kingdom' },
    { code: '+91', country: 'IN', name: 'India' },
    { code: '+61', country: 'AU', name: 'Australia' },
    { code: '+81', country: 'JP', name: 'Japan' },
    { code: '+49', country: 'DE', name: 'Germany' },
    { code: '+33', country: 'FR', name: 'France' },
    { code: '+86', country: 'CN', name: 'China' },
    { code: '+65', country: 'SG', name: 'Singapore' },
    { code: '+852', country: 'HK', name: 'Hong Kong' },
    { code: '+971', country: 'AE', name: 'UAE' },
    { code: '+966', country: 'SA', name: 'Saudi Arabia' },
    { code: '+27', country: 'ZA', name: 'South Africa' },
    { code: '+34', country: 'ES', name: 'Spain' },
    { code: '+39', country: 'IT', name: 'Italy' },
    { code: '+82', country: 'KR', name: 'South Korea' },
    { code: '+66', country: 'TH', name: 'Thailand' },
    { code: '+84', country: 'VN', name: 'Vietnam' },
    { code: '+62', country: 'ID', name: 'Indonesia' },
    { code: '+60', country: 'MY', name: 'Malaysia' },
    { code: '+63', country: 'PH', name: 'Philippines' },
    { code: '+92', country: 'PK', name: 'Pakistan' },
    { code: '+880', country: 'BD', name: 'Bangladesh' },
    { code: '+94', country: 'LK', name: 'Sri Lanka' },
    { code: '+977', country: 'NP', name: 'Nepal' },
    { code: '+975', country: 'BT', name: 'Bhutan' },
    { code: '+960', country: 'MV', name: 'Maldives' },
    { code: '+93', country: 'AF', name: 'Afghanistan' },
    { code: '+98', country: 'IR', name: 'Iran' },
    { code: '+964', country: 'IQ', name: 'Iraq' },
    { code: '+962', country: 'JO', name: 'Jordan' },
    { code: '+961', country: 'LB', name: 'Lebanon' },
    { code: '+963', country: 'SY', name: 'Syria' },
    { code: '+970', country: 'PS', name: 'Palestine' },
    { code: '+972', country: 'IL', name: 'Israel' },
    { code: '+20', country: 'EG', name: 'Egypt' },
    { code: '+212', country: 'MA', name: 'Morocco' },
    { code: '+216', country: 'TN', name: 'Tunisia' },
    { code: '+213', country: 'DZ', name: 'Algeria' },
    { code: '+218', country: 'LY', name: 'Libya' },
    { code: '+222', country: 'MR', name: 'Mauritania' },
    { code: '+221', country: 'SN', name: 'Senegal' },
    { code: '+225', country: 'CI', name: 'Ivory Coast' },
    { code: '+233', country: 'GH', name: 'Ghana' },
    { code: '+234', country: 'NG', name: 'Nigeria' },
    { code: '+254', country: 'KE', name: 'Kenya' },
    { code: '+255', country: 'TZ', name: 'Tanzania' },
    { code: '+256', country: 'UG', name: 'Uganda' },
    { code: '+250', country: 'RW', name: 'Rwanda' },
    { code: '+257', country: 'BI', name: 'Burundi' },
    { code: '+252', country: 'SO', name: 'Somalia' },
    { code: '+258', country: 'MZ', name: 'Mozambique' },
    { code: '+260', country: 'ZM', name: 'Zambia' },
    { code: '+263', country: 'ZW', name: 'Zimbabwe' },
    { code: '+264', country: 'NA', name: 'Namibia' },
    { code: '+267', country: 'BW', name: 'Botswana' },
    { code: '+268', country: 'SZ', name: 'Swaziland' },
    { code: '+290', country: 'SH', name: 'Saint Helena' },
    { code: '+500', country: 'FK', name: 'Falkland Islands' },
    { code: '+508', country: 'PM', name: 'Saint Pierre and Miquelon' },
    { code: '+590', country: 'GP', name: 'Guadeloupe' },
    { code: '+591', country: 'BO', name: 'Bolivia' },
    { code: '+592', country: 'GY', name: 'Guyana' },
    { code: '+593', country: 'EC', name: 'Ecuador' },
    { code: '+594', country: 'GF', name: 'French Guiana' },
    { code: '+595', country: 'PY', name: 'Paraguay' },
    { code: '+596', country: 'MQ', name: 'Martinique' },
    { code: '+597', country: 'SR', name: 'Suriname' },
    { code: '+598', country: 'UY', name: 'Uruguay' },
    { code: '+599', country: 'AN', name: 'Netherlands Antilles' },
    { code: '+7', country: 'RU', name: 'Russia' },
    { code: '+40', country: 'RO', name: 'Romania' },
    { code: '+41', country: 'CH', name: 'Switzerland' },
    { code: '+43', country: 'AT', name: 'Austria' },
    { code: '+45', country: 'DK', name: 'Denmark' },
    { code: '+46', country: 'SE', name: 'Sweden' },
    { code: '+47', country: 'NO', name: 'Norway' },
    { code: '+48', country: 'PL', name: 'Poland' },
    { code: '+51', country: 'PE', name: 'Peru' },
    { code: '+52', country: 'MX', name: 'Mexico' },
    { code: '+53', country: 'CU', name: 'Cuba' },
    { code: '+54', country: 'AR', name: 'Argentina' },
    { code: '+55', country: 'BR', name: 'Brazil' },
    { code: '+56', country: 'CL', name: 'Chile' },
    { code: '+57', country: 'CO', name: 'Colombia' },
    { code: '+58', country: 'VE', name: 'Venezuela' },
    { code: '+64', country: 'NZ', name: 'New Zealand' },
    { code: '+68', country: 'TO', name: 'Tonga' },
    { code: '+690', country: 'TK', name: 'Tokelau' },
    { code: '+691', country: 'FM', name: 'Micronesia' },
    { code: '+692', country: 'MH', name: 'Marshall Islands' },
    { code: '+800', country: '001', name: 'International Freephone' },
    { code: '+808', country: '001', name: 'International Shared Cost' },
    { code: '+870', country: '001', name: 'Inmarsat SNAC' },
    { code: '+878', country: '001', name: 'Universal Personal Telecommunications' },
    { code: '+881', country: '001', name: 'Global Mobile Satellite System' },
    { code: '+882', country: '001', name: 'International Networks' },
    { code: '+883', country: '001', name: 'International Networks' },
    { code: '+888', country: '001', name: 'Telematics' },
    { code: '+979', country: '001', name: 'International Premium Rate Service' }
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

  // Handle phone number input - only allow numbers
  const handlePhoneChange = (value: string) => {
    // Remove all non-numeric characters except for the initial + in country code
    const numericValue = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, phone: numericValue }));
  };

  // Detect country based on IP address
  const detectCountryFromIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const detectedCountry = data.country_code;
      const countryCodeObj = countryCodes.find(c => c.country === detectedCountry);
      if (countryCodeObj) {
        setCountryCode(countryCodeObj.code);
        setDetectedCountry(countryCodeObj.name);
        // setLogs(prev => [...prev, `Auto-detected country: ${countryCodeObj.name} (${countryCodeObj.code})`]);
      }
    } catch (error) {
      console.warn('Failed to detect country from IP:', error);
      // setLogs(prev => [...prev, 'Could not auto-detect country, using default']);
    }
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
        const phone = `${countryCode}${formData.phone.trim()}`;
        const digits = formData.phone.trim().replace(/\D/g, '');
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
  }, [formData.phone, countryCode]);

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
      phone: `${countryCode}${formData.phone.trim()}`,
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
          phone: `${countryCode}${formData.phone}`,
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
        // setLogs((prev) => [...prev, `Signup error: ${authResponse.error}`]);
        setError(authResponse.error);
        return;
      }

      // Sync agent record with all form data to agents table
      // setLogs((prev) => [...prev, 'Syncing agent record with complete data...']);
      const result = await AgentManagementService.signupAgent({
        ...signupRequest,
        ...additionalAgentData
      });
      if (result && result.error) {
        console.warn('Managed agents sync error:', result.error);
        // setLogs((prev) => [...prev, `Managed agents sync warning: ${String(result.error)}`]);
      }

      // Force source attribution based on URL params (overrides trigger defaults)
      // setLogs((prev) => [...prev, 'Enforcing source attribution...']);
      const forceRes = await AgentManagementService.updateAgentSourceByEmail(
        formData.email.trim(),
        source_type,
        source_details
      );
      if (forceRes?.error) {
        console.warn('Force source update warning:', forceRes.error);
      // setLogs((prev) => [...prev, `Source update warning: ${String(forceRes.error)}`]);
      }

      toast({
        title: 'Account created',
        description: 'Check your email to verify.',
      });
      // setLogs((prev) => [...prev, 'Verification email sent. Redirecting to login...']);
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      setError('Signup failed. Try again.');
      // setLogs((prev) => [...prev, `Registration error: ${err instanceof Error ? err.message : String(err)}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-4 sm:py-8">
      <div className="w-full max-w-2xl space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="text-center">
          {settings.logo ? (
            <div className="flex justify-center mb-3 sm:mb-4">
              <img 
                src={settings.logo} 
                alt={settings.companyDetails.name}
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-white font-bold text-lg sm:text-xl">
                {settings.companyDetails.name.charAt(0)}
              </span>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Sign Up
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
           Access exclusive deals, AI itinerary tools, and more.
          </p>
        </div>

        <Card>
          <CardHeader className="px-4 sm:px-6 pb-4">
            <CardTitle className="text-lg sm:text-xl">Registration</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Complete the form below to register as a travel agent or agency
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Company Information */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-medium">Company Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="company_name"
                        placeholder="Company name"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                        className="pl-10 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Contact Person Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        placeholder="Contact person name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="pl-10 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10 text-sm sm:text-base"
                        required
                      />
                      {emailExists && (
                        <div className="mt-2 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="text-red-600">This email is already registered.</span>
                          <Button
                            type="button"
                            variant="link"
                            className="p-0 h-auto text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
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
                    <div className="flex gap-1 sm:gap-2">
                      <div className="relative w-16 sm:w-20 flex-shrink-0">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger className="w-full px-2 sm:px-3">
                            <SelectValue>
                              <span className="text-xs sm:text-sm font-medium">{countryCode}</span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] sm:max-h-[300px]">
                            {countryCodes.map((country) => (
                              <SelectItem key={country.code} value={country.code} className="text-xs sm:text-sm">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <span className="text-xs sm:text-sm font-medium">{country.code}</span>
                                  <span className="text-xs text-gray-500 hidden sm:inline">{country.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="relative flex-1 min-w-0">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          placeholder="Phone number"
                          value={formData.phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="pl-10 w-full text-sm sm:text-base"
                          required
                        />
                      </div>
                    </div>
                    {phoneExists && (
                      <div className="mt-2 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="text-red-600">This phone number is already registered.</span>
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
                          onClick={() => navigate(`/login?email=${encodeURIComponent(formData.email.trim())}`)}
                        >
                          Login Instead
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

               

                

                 
               
              </div>

            


                














              {/* Login Credentials */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-medium">Login Credentials</h3>
                <div className="space-y-4">
                  {/* Create Password - full width */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Create Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Strong password"
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(!!formData.password)}
                        className="pr-8 sm:pr-10 text-sm sm:text-base"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-2 sm:px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                        )}
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
                        <div className="text-xs mt-2 text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-1 sm:gap-2">
                          <span className="text-xs">Strength: {passwordStrength.label}</span>
                          {(() => {
                            const pwd = formData.password || '';
                            const reqs = [
                              { label: '8+ chars', ok: pwd.length >= 8 },
                              { label: 'capital', ok: /[A-Z]/.test(pwd) },
                              { label: 'number', ok: /\d/.test(pwd) },
                              { label: 'symbol', ok: /[^A-Za-z0-9]/.test(pwd) },
                            ];
                            return reqs.map((r) => (
                              <span key={r.label} className={`flex items-center gap-1 text-xs ${r.ok ? 'text-green-600' : 'text-gray-500'}`}>
                                {r.ok ? <Check className="h-2 w-2 sm:h-3 sm:w-3" /> : <X className="h-2 w-2 sm:h-3 sm:w-3" />}
                                <span className="hidden sm:inline">{r.label}</span>
                              </span>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password - inline with Generate button (80%/20%) */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password *</Label>
                    <div className="flex gap-1 sm:gap-2">
                      <div className="relative flex-[4] w-4/5">
                        <Input
                          id="confirm_password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm password"
                          autoComplete="new-password"
                          value={formData.confirm_password}
                          onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                          className="pr-8 sm:pr-10 w-full text-sm sm:text-base"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-2 sm:px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="xs" 
                        onClick={handleGeneratePassword}
                        className="flex-[1] w-1/5 text-xs py-1 h-9 sm:h-10 min-w-0 whitespace-nowrap px-1 sm:px-2"
                      >
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline ml-1">Generate</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms & Privacy consent */}
              <div className="flex items-start gap-2 sm:gap-3">
                <Checkbox id="consent" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                <label htmlFor="consent" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
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

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:flex-1"
                  onClick={() => navigate('/login')}
                >
                  Back to Login
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:flex-1"
                  disabled={loading || emailExists || phoneExists || !agreed}
                >
                  {loading ? 'Registering...' : 'Get Started'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        {/* Debug Logs (last 3) - Hidden for production */}
        {/* <div className="max-w-2xl mx-auto mt-4">
          {logs.slice(-3).map((msg, idx) => (
            <div key={idx} className="text-xs rounded border p-2 mb-2 bg-muted/30">
              {msg}
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
};

export default AgentSignup;