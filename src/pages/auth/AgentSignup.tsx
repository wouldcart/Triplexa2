import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useApplicationSettings } from '@/contexts/ApplicationSettingsContext';
import { Building2, Mail, Phone, MapPin, User } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

    // Credentials validation
    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

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
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter a strong password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password *</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      placeholder="Re-enter your password"
                      value={formData.confirm_password}
                      onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                      required
                    />
                  </div>
                </div>
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
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register Agent'}
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