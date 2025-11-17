import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Smartphone, 
  Save, 
  TestTube, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getMetaSettings,
  updateMetaSettings,
  testWhatsAppConnection,
  getConnectionStatus,
  validateWabaId,
  validatePhoneId,
  validateAccessToken,
  checkTokenExpirationRisk,
  maskToken,
  MetaSettings
} from '@/services/metaSettingsService';

export function MetaWhatsAppSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<MetaSettings>({
    waba_id: '',
    phone_id: '',
    token: '',
    template_name: 'otp_verification',
    business_name: '',
    is_active: false
  });
  const [originalSettings, setOriginalSettings] = useState<MetaSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error' | 'checking'>('checking');
  const [testPhone, setTestPhone] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [tokenValidation, setTokenValidation] = useState<{ isValid: boolean; riskLevel: 'low' | 'medium' | 'high'; message: string } | null>(null);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Check connection status when settings change
  useEffect(() => {
    if (settings.is_active && settings.token && settings.phone_id) {
      checkConnectionStatus();
    } else {
      setConnectionStatus('disconnected');
    }
  }, [settings]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const result = await getMetaSettings();
      
      if (result.success && result.data) {
        setSettings(result.data);
        setOriginalSettings(result.data);
      } else {
        // No settings found, use defaults
        setOriginalSettings(settings);
      }
    } catch (error) {
      console.error('❌ Failed to load Meta settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load WhatsApp configuration',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      setIsCheckingStatus(true);
      const status = await getConnectionStatus();
      setConnectionStatus(status);
    } catch (error) {
      console.error('❌ Connection status check failed:', error);
      setConnectionStatus('error');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleInputChange = (field: keyof MetaSettings, value: string | boolean) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    
    // Check if there are changes compared to original
    const hasChangesNow = JSON.stringify(newSettings) !== JSON.stringify(originalSettings);
    setHasChanges(hasChangesNow);
    
    // Validate token when it changes
    if (field === 'token' && typeof value === 'string') {
      if (value.trim()) {
        const validation = checkTokenExpirationRisk(value);
        setTokenValidation(validation);
      } else {
        setTokenValidation(null);
      }
    }
  };

  const handleSave = async () => {
    try {
      // Validate inputs
      if (!settings.waba_id || !settings.phone_id || !settings.token || !settings.business_name) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      if (!validateWabaId(settings.waba_id)) {
        toast({
          title: 'Invalid WABA ID',
          description: 'WhatsApp Business Account ID should be numeric',
          variant: 'destructive'
        });
        return;
      }

      if (!validatePhoneId(settings.phone_id)) {
        toast({
          title: 'Invalid Phone ID',
          description: 'Phone Number ID should be numeric',
          variant: 'destructive'
        });
        return;
      }

      if (!validateAccessToken(settings.token)) {
        toast({
          title: 'Invalid Access Token',
          description: 'Access token should be at least 100 characters long',
          variant: 'destructive'
        });
        return;
      }

      setIsSaving(true);
      const result = await updateMetaSettings(settings);
      
      if (result.success) {
        setOriginalSettings(result.data!);
        setHasChanges(false);
        toast({
          title: 'Success',
          description: 'WhatsApp configuration saved successfully'
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Failed to save Meta settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save configuration',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testPhone) {
      toast({
        title: 'Test Phone Required',
        description: 'Please enter a phone number to test',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsTesting(true);
      const result = await testWhatsAppConnection(testPhone, 'Test message from Triplexa WhatsApp configuration');
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Test message sent successfully!',
          duration: 5000
        });
        setConnectionStatus('connected');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Test connection failed:', error);
      
      // Enhanced error handling for token expiration
      const errorMessage = error.message || 'Failed to send test message';
      const isTokenExpired = errorMessage.toLowerCase().includes('expired') || 
                           errorMessage.toLowerCase().includes('session') ||
                           errorMessage.toLowerCase().includes('token');
      
      if (isTokenExpired) {
        toast({
          title: 'Access Token Expired',
          description: 'Your WhatsApp Business API access token has expired. Please generate a new token from Meta Business Manager and update it in the settings above.',
          variant: 'destructive',
          duration: 10000,
        });
      } else {
        toast({
          title: 'Test Failed',
          description: errorMessage,
          variant: 'destructive',
          duration: 5000
        });
      }
      
      setConnectionStatus('error');
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'disconnected':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Disconnected</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'checking':
        return <Badge variant="outline"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Checking...</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading WhatsApp configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            Meta WhatsApp Configuration
          </h2>
          <p className="text-muted-foreground">
            Configure WhatsApp Business API for OTP authentication
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <Button
            variant="outline"
            size="sm"
            onClick={checkConnectionStatus}
            disabled={isCheckingStatus}
          >
            <RefreshCw className={`h-4 w-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Business API Settings</CardTitle>
          <CardDescription>
            Enter your Meta WhatsApp Business API credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Make sure you have a verified WhatsApp Business account and phone number. 
              <a 
                href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Get started with WhatsApp Business API <ExternalLink className="h-3 w-3" />
              </a>
              {connectionStatus === 'error' && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-800 mb-1">🔑 Token Issues Detected</p>
                  <p className="text-xs text-yellow-700">
                    If you're seeing token expiration errors, generate a new access token from your{' '}
                    <a 
                      href="https://business.facebook.com/settings/system-users" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Meta Business Manager
                    </a>
                    {' '}and update it below.
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="waba_id">WhatsApp Business Account ID (WABA ID)</Label>
              <Input
                id="waba_id"
                value={settings.waba_id}
                onChange={(e) => handleInputChange('waba_id', e.target.value)}
                placeholder="1234567890123456"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Your WhatsApp Business Account ID from Meta Business Manager
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_id">Phone Number ID</Label>
              <Input
                id="phone_id"
                value={settings.phone_id}
                onChange={(e) => handleInputChange('phone_id', e.target.value)}
                placeholder="1234567890123456"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Your registered phone number ID from WhatsApp Business
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">Permanent Access Token</Label>
              <div className="relative">
                <Input
                  id="token"
                  type={showToken ? 'text' : 'password'}
                  value={settings.token}
                  onChange={(e) => handleInputChange('token', e.target.value)}
                  placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="font-mono pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your permanent access token from Meta Business Manager
                {settings.token && (
                  <span className="ml-1 font-mono">
                    (Current: {maskToken(settings.token)})
                  </span>
                )}
              </p>
              {tokenValidation && (
                <div className={`mt-1 text-xs p-2 rounded ${
                  tokenValidation.riskLevel === 'high' ? 'bg-red-50 text-red-700 border border-red-200' :
                  tokenValidation.riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                  'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  <div className="flex items-center gap-1">
                    {tokenValidation.riskLevel === 'high' && <AlertCircle className="h-3 w-3" />}
                    {tokenValidation.riskLevel === 'medium' && <AlertCircle className="h-3 w-3" />}
                    {tokenValidation.riskLevel === 'low' && <CheckCircle className="h-3 w-3" />}
                    <span>{tokenValidation.message}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="template_name">OTP Template Name</Label>
              <Input
                id="template_name"
                value={settings.template_name}
                onChange={(e) => handleInputChange('template_name', e.target.value)}
                placeholder="otp_verification"
              />
              <p className="text-xs text-muted-foreground">
                The name of your OTP template in WhatsApp Business
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_name">Business / Sender Name</Label>
              <Input
                id="business_name"
                value={settings.business_name}
                onChange={(e) => handleInputChange('business_name', e.target.value)}
                placeholder="Your Business Name"
              />
              <p className="text-xs text-muted-foreground">
                The name that will appear as the sender in WhatsApp messages
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={settings.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="text-sm">
                Enable WhatsApp OTP Authentication
              </Label>
            </div>
          </div>

          {/* Token Management Help */}
          {connectionStatus === 'error' && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  Access Token Issues?
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 text-sm text-yellow-700">
                  <p><strong>Token Expired:</strong> Meta Business API tokens expire after 60 days or when your session ends.</p>
                  <div className="space-y-2">
                    <p><strong>To get a new token:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Go to <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meta Business Manager</a></li>
                      <li>Select your system user</li>
                      <li>Click "Generate New Token"</li>
                      <li>Select your WhatsApp Business app</li>
                      <li>Copy the new token and paste it above</li>
                    </ol>
                  </div>
                  <p className="text-xs text-yellow-600">
                    <strong>Note:</strong> Tokens start with "EAA" and should be at least 100 characters long.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          <div className="flex justify-between">
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="min-w-[100px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>

            {hasChanges && (
              <p className="text-sm text-muted-foreground flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                You have unsaved changes
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Connection */}
      <Card>
        <CardHeader>
          <CardTitle>Test Connection</CardTitle>
          <CardDescription>
            Send a test message to verify your WhatsApp Business API configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test_phone">Test Phone Number</Label>
              <Input
                id="test_phone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+1234567890"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Enter a phone number in international format (e.g., +1234567890)
              </p>
            </div>

            <Button
              onClick={handleTestConnection}
              disabled={isTesting || !settings.is_active || !settings.token}
              variant="outline"
              className="min-w-[150px]"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>

            {!settings.is_active && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  WhatsApp OTP authentication must be enabled to test the connection.
                </AlertDescription>
              </Alert>
            )}

            {!settings.token && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Access token is required to test the connection.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">1. Create WhatsApp Business Account</h4>
            <p className="text-sm text-muted-foreground">
              Go to Meta Business Manager and create a WhatsApp Business account.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">2. Register Phone Number</h4>
            <p className="text-sm text-muted-foreground">
              Add and verify your phone number in WhatsApp Business Manager.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">3. Create System User</h4>
            <p className="text-sm text-muted-foreground">
              Create a system user in Meta Business Manager and generate a permanent access token.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">4. Create Message Template</h4>
            <p className="text-sm text-muted-foreground">
              Create an OTP verification template in WhatsApp Business Manager with variables for OTP code and business name.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">5. Configure Here</h4>
            <p className="text-sm text-muted-foreground">
              Enter your credentials above and test the connection to ensure everything works.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}