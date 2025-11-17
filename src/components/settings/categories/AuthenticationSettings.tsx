import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Lock, 
  Smartphone, 
  Mail, 
  Key, 
  Shield, 
  Save, 
  TestTube, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Settings as SettingsIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { appSettingsService } from '@/services/appSettingsService';
import {
  getMetaSettings,
  testWhatsAppConnection,
  getConnectionStatus,
  MetaSettings
} from '@/services/metaSettingsService';

interface AuthSettings {
  // General Auth Settings
  enable_email_auth: boolean;
  enable_google_oauth: boolean;
  enable_whatsapp_otp: boolean;
  require_email_verification: boolean;
  enable_two_factor: boolean;
  session_timeout: number;
  password_min_length: number;
  password_require_special: boolean;
  password_require_number: boolean;
  password_require_uppercase: boolean;
  
  // WhatsApp OTP Settings
  whatsapp_template_name: string;
  whatsapp_otp_length: number;
  whatsapp_otp_expiry: number;
  whatsapp_rate_limit: number;
  whatsapp_business_name: string;
}

export function AuthenticationSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AuthSettings>({
    enable_email_auth: true,
    enable_google_oauth: true,
    enable_whatsapp_otp: false,
    require_email_verification: true,
    enable_two_factor: false,
    session_timeout: 1440,
    password_min_length: 8,
    password_require_special: true,
    password_require_number: true,
    password_require_uppercase: true,
    whatsapp_template_name: 'otp_verification',
    whatsapp_otp_length: 6,
    whatsapp_otp_expiry: 10,
    whatsapp_rate_limit: 5,
    whatsapp_business_name: 'Your Business'
  });
  
  const [originalSettings, setOriginalSettings] = useState<AuthSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);
  const [whatsAppStatus, setWhatsAppStatus] = useState<'connected' | 'disconnected' | 'error' | 'checking'>('checking');
  const [metaSettings, setMetaSettings] = useState<MetaSettings | null>(null);

  // Handle URL parameter for auto-navigation to WhatsApp settings
  useEffect(() => {
    const section = document.documentElement.getAttribute('data-settings-section');
    if (section === 'meta-whatsapp') {
      // Enable WhatsApp OTP if navigating from integrations
      setSettings(prev => ({ ...prev, enable_whatsapp_otp: true }));
      // Clear the attribute after use
      document.documentElement.removeAttribute('data-settings-section');
    }
  }, []);

  // Load settings
  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Load authentication settings from app settings
      const authSettingsResponse = await appSettingsService.getSettingsByCategory('Authentication & Security');
      
      if (authSettingsResponse.success && authSettingsResponse.data) {
        const loadedSettings = { ...settings };
        
        authSettingsResponse.data.forEach((setting) => {
          if (setting.setting_key in loadedSettings) {
            const key = setting.setting_key as keyof AuthSettings;
            if (typeof loadedSettings[key] === 'boolean') {
              loadedSettings[key] = setting.setting_value === 'true';
            } else if (typeof loadedSettings[key] === 'number') {
              loadedSettings[key] = parseInt(setting.setting_value || '0', 10);
            } else {
              loadedSettings[key] = setting.setting_value || loadedSettings[key];
            }
          }
        });
        
        setSettings(loadedSettings);
        setOriginalSettings(loadedSettings);
      }

      // Load WhatsApp Meta settings
      const metaResponse = await getMetaSettings();
      if (metaResponse.success && metaResponse.data) {
        setMetaSettings(metaResponse.data);
        
        // Update WhatsApp settings with Meta data
        setSettings(prev => ({
          ...prev,
          whatsapp_business_name: metaResponse.data?.business_name || prev.whatsapp_business_name,
          whatsapp_template_name: metaResponse.data?.template_name || prev.whatsapp_template_name
        }));
      }

      // Check WhatsApp connection status
      await checkWhatsAppStatus();
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load authentication settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkWhatsAppStatus = async () => {
    if (!metaSettings) return;
    
    setWhatsAppStatus('checking');
    try {
      const statusResponse = await getConnectionStatus();
      if (statusResponse.success) {
        setWhatsAppStatus(statusResponse.data?.status === 'connected' ? 'connected' : 'disconnected');
      } else {
        setWhatsAppStatus('error');
      }
    } catch (error) {
      setWhatsAppStatus('error');
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save general authentication settings
      const settingsToSave = [
        { category: 'Authentication & Security', setting_key: 'enable_email_auth', setting_value: settings.enable_email_auth.toString() },
        { category: 'Authentication & Security', setting_key: 'enable_google_oauth', setting_value: settings.enable_google_oauth.toString() },
        { category: 'Authentication & Security', setting_key: 'enable_whatsapp_otp', setting_value: settings.enable_whatsapp_otp.toString() },
        { category: 'Authentication & Security', setting_key: 'require_email_verification', setting_value: settings.require_email_verification.toString() },
        { category: 'Authentication & Security', setting_key: 'enable_two_factor', setting_value: settings.enable_two_factor.toString() },
        { category: 'Authentication & Security', setting_key: 'session_timeout', setting_value: settings.session_timeout.toString() },
        { category: 'Authentication & Security', setting_key: 'password_min_length', setting_value: settings.password_min_length.toString() },
        { category: 'Authentication & Security', setting_key: 'password_require_special', setting_value: settings.password_require_special.toString() },
        { category: 'Authentication & Security', setting_key: 'password_require_number', setting_value: settings.password_require_number.toString() },
        { category: 'Authentication & Security', setting_key: 'password_require_uppercase', setting_value: settings.password_require_uppercase.toString() },
        { category: 'Authentication & Security', setting_key: 'whatsapp_template_name', setting_value: settings.whatsapp_template_name },
        { category: 'Authentication & Security', setting_key: 'whatsapp_otp_length', setting_value: settings.whatsapp_otp_length.toString() },
        { category: 'Authentication & Security', setting_key: 'whatsapp_otp_expiry', setting_value: settings.whatsapp_otp_expiry.toString() },
        { category: 'Authentication & Security', setting_key: 'whatsapp_rate_limit', setting_value: settings.whatsapp_rate_limit.toString() },
        { category: 'Authentication & Security', setting_key: 'whatsapp_business_name', setting_value: settings.whatsapp_business_name }
      ];

      for (const setting of settingsToSave) {
        await appSettingsService.upsertSetting(setting);
      }

      setOriginalSettings(settings);
      toast({
        title: "Settings saved",
        description: "Authentication settings have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save authentication settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!metaSettings) {
      toast({
        title: "WhatsApp not configured",
        description: "Please configure WhatsApp Business API settings first",
        variant: "destructive",
      });
      return;
    }

    setIsTestingWhatsApp(true);
    try {
      const response = await testWhatsAppConnection();
      if (response.success) {
        setWhatsAppStatus('connected');
        toast({
          title: "Connection successful",
          description: "WhatsApp Business API is working correctly",
        });
      } else {
        setWhatsAppStatus('error');
        toast({
          title: "Connection failed",
          description: response.error || "Failed to connect to WhatsApp Business API",
          variant: "destructive",
        });
      }
    } catch (error) {
      setWhatsAppStatus('error');
      toast({
        title: "Connection error",
        description: "An error occurred while testing WhatsApp connection",
        variant: "destructive",
      });
    } finally {
      setIsTestingWhatsApp(false);
    }
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading authentication settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Authentication Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            General Authentication
          </CardTitle>
          <CardDescription>
            Configure basic authentication methods and security policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Authentication Methods */}
          <div className="space-y-4">
            <h4 className="font-medium">Authentication Methods</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Email & Password</div>
                    <div className="text-sm text-muted-foreground">Traditional email-based authentication</div>
                  </div>
                </div>
                <Switch
                  checked={settings.enable_email_auth}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enable_email_auth: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-blue-500 rounded" />
                  <div>
                    <div className="font-medium">Google OAuth</div>
                    <div className="text-sm text-muted-foreground">Sign in with Google accounts</div>
                  </div>
                </div>
                <Switch
                  checked={settings.enable_google_oauth}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enable_google_oauth: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      WhatsApp OTP
                      <Badge variant="secondary" className="text-xs">New</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">One-time password via WhatsApp</div>
                  </div>
                </div>
                <Switch
                  checked={settings.enable_whatsapp_otp}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enable_whatsapp_otp: checked }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Security Policies */}
          <div className="space-y-4">
            <h4 className="font-medium">Security Policies</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-verification">Require Email Verification</Label>
                <Switch
                  id="email-verification"
                  checked={settings.require_email_verification}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, require_email_verification: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="two-factor">Enable Two-Factor Authentication</Label>
                <Switch
                  id="two-factor"
                  checked={settings.enable_two_factor}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enable_two_factor: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={settings.session_timeout}
                  onChange={(e) => setSettings(prev => ({ ...prev, session_timeout: parseInt(e.target.value) || 1440 }))}
                  min="30"
                  max="10080"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password Requirements
          </CardTitle>
          <CardDescription>
            Configure password complexity and security requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="min-length">Minimum Password Length</Label>
            <Input
              id="min-length"
              type="number"
              value={settings.password_min_length}
              onChange={(e) => setSettings(prev => ({ ...prev, password_min_length: parseInt(e.target.value) || 8 }))}
              min="6"
              max="32"
            />
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Password Complexity</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="require-special">Require Special Characters</Label>
              <Switch
                id="require-special"
                checked={settings.password_require_special}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, password_require_special: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="require-number">Require Numbers</Label>
              <Switch
                id="require-number"
                checked={settings.password_require_number}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, password_require_number: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="require-uppercase">Require Uppercase Letters</Label>
              <Switch
                id="require-uppercase"
                checked={settings.password_require_uppercase}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, password_require_uppercase: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp OTP Configuration */}
      {settings.enable_whatsapp_otp && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              WhatsApp OTP Configuration
              {whatsAppStatus === 'connected' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {whatsAppStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
              {whatsAppStatus === 'checking' && <RefreshCw className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <CardDescription>
              Configure WhatsApp Business API settings for OTP authentication
              {whatsAppStatus === 'connected' && (
                <span className="block mt-1 text-green-600">✓ Connected to WhatsApp Business API</span>
              )}
              {whatsAppStatus === 'error' && (
                <span className="block mt-1 text-red-600">✗ Connection issues detected</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!metaSettings && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  WhatsApp Business API is not configured. Please configure it in the{' '}
                  <a href="/settings/app?category=integrations&section=meta-whatsapp" className="text-primary hover:underline">
                    Meta WhatsApp Settings
                  </a>
                  {' '}first.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">WhatsApp Template Name</Label>
                <Input
                  id="template-name"
                  value={settings.whatsapp_template_name}
                  onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_template_name: e.target.value }))}
                  placeholder="otp_verification"
                  disabled={!metaSettings}
                />
                <p className="text-xs text-muted-foreground">
                  The WhatsApp template name for sending OTP messages
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-name">Business Name</Label>
                <Input
                  id="business-name"
                  value={settings.whatsapp_business_name}
                  onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_business_name: e.target.value }))}
                  placeholder="Your Business Name"
                  disabled={!metaSettings}
                />
                <p className="text-xs text-muted-foreground">
                  Your business name that appears in WhatsApp messages
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp-length">OTP Length</Label>
                <Input
                  id="otp-length"
                  type="number"
                  value={settings.whatsapp_otp_length}
                  onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_otp_length: parseInt(e.target.value) || 6 }))}
                  min="4"
                  max="8"
                  disabled={!metaSettings}
                />
                <p className="text-xs text-muted-foreground">
                  Number of digits in the OTP (4-8)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp-expiry">OTP Expiry (minutes)</Label>
                <Input
                  id="otp-expiry"
                  type="number"
                  value={settings.whatsapp_otp_expiry}
                  onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_otp_expiry: parseInt(e.target.value) || 10 }))}
                  min="5"
                  max="60"
                  disabled={!metaSettings}
                />
                <p className="text-xs text-muted-foreground">
                  How long the OTP remains valid
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate-limit">Rate Limit (per hour)</Label>
                <Input
                  id="rate-limit"
                  type="number"
                  value={settings.whatsapp_rate_limit}
                  onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_rate_limit: parseInt(e.target.value) || 5 }))}
                  min="1"
                  max="20"
                  disabled={!metaSettings}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum OTP requests per phone number per hour
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleTestWhatsApp}
                disabled={!metaSettings || isTestingWhatsApp || whatsAppStatus === 'checking'}
                variant="outline"
              >
                {isTestingWhatsApp ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={checkWhatsAppStatus}
                disabled={!metaSettings || whatsAppStatus === 'checking'}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${whatsAppStatus === 'checking' ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}