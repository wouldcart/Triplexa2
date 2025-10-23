
import React, { useEffect, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EyeIcon, EyeOffIcon, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { AppSettingsHelpers, AppSettingsService, SETTING_CATEGORIES } from '@/services/appSettingsService_database';
import { agentWelcomeTemplate } from '@/email/templates';
import { loadSMTPConfig, sendEmail } from '@/services/emailService';
import { useApplicationSettings } from '@/contexts/ApplicationSettingsContext';

const ApiSettings: React.FC = () => {
  const { translate } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showApiKey, setShowApiKey] = useState(false);
  const { settings: appSettings } = useApplicationSettings();

  // SMTP form state
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState<string>('');
  const [smtpSecure, setSmtpSecure] = useState<boolean>(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  
  const handleRegenerateKey = () => {
    toast({
      title: "API Key Regenerated",
      description: "Your new API key has been generated successfully",
    });
  };
  
  const handleSave = () => {
    toast({
      title: translate('success'),
      description: translate('apiSettingsSaved'),
    });
  };

  useEffect(() => {
    // Load SMTP config into form
    (async () => {
      try {
        const cfg = await loadSMTPConfig();
        setSmtpHost((cfg.smtp_host as string) || '');
        setSmtpPort(String(cfg.smtp_port || ''));
        setSmtpSecure(Boolean(cfg.smtp_secure) === true);
        setSmtpUser((cfg.smtp_user as string) || '');
        setSmtpPassword((cfg.smtp_password as string) || '');
        setFromEmail((cfg.from_email as string) || '');
        setFromName((cfg.from_name as string) || '');
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const persistSMTP = async () => {
    setSaving(true);
    setPreviewUrl(null);
    try {
      const entries = [
        { key: 'smtp_host', value: smtpHost },
        { key: 'smtp_port', value: smtpPort },
        { key: 'smtp_secure', value: smtpSecure },
        { key: 'smtp_user', value: smtpUser },
        { key: 'smtp_password', value: smtpPassword },
        { key: 'from_email', value: fromEmail },
        { key: 'from_name', value: fromName },
      ];
      for (const { key, value } of entries) {
        await AppSettingsHelpers.upsertSetting({
          category: SETTING_CATEGORIES.NOTIFICATIONS,
          setting_key: key,
          ...(typeof value === 'string' ? { setting_value: value } : { setting_json: value as any }),
        });
      }
      toast({ title: 'SMTP settings saved', description: 'Notifications credentials updated.' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Could not save SMTP settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast({ title: 'Enter test email', description: 'Please provide an email to send test', variant: 'destructive' });
      return;
    }
    setSending(true);
    setPreviewUrl(null);
    try {
      // Build sample email
      const companyName = appSettings?.companyDetails?.name || 'Triplexa';
      const html = agentWelcomeTemplate({ companyName, recipientName: 'Test Recipient' });
      const subject = 'SMTP Test Email';
      const res = await sendEmail(testEmail, subject, html, {
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_secure: smtpSecure,
        smtp_user: smtpUser,
        smtp_password: smtpPassword,
        from_email: fromEmail || undefined,
        from_name: fromName || companyName,
      });
      if (res?.previewUrl) {
        setPreviewUrl(res.previewUrl);
        toast({ title: 'Test sent', description: 'Preview available via Ethereal link.' });
      } else {
        toast({ title: 'Test sent', description: 'Email sent successfully.' });
      }
    } catch (e: any) {
      toast({ title: 'Send failed', description: e?.message || 'Failed to send test email', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <h1 className="text-xl md:text-2xl font-bold">API Settings</h1>
        
        {/* Currency API Notice */}
        <Alert>
          <ArrowRight className="h-4 w-4" />
          <AlertDescription>
            <strong>Looking for Currency API settings?</strong> CurrencyAPI.com configuration has been moved to{' '}
            <button 
              onClick={() => navigate('/settings/currency-converter')}
              className="text-blue-600 hover:underline font-medium"
            >
              Currency Converter Settings
            </button>{' '}
            for better integration.
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>General API Settings</CardTitle>
            <CardDescription>Manage your general API keys and integrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">General API Key</Label>
              <div className="flex">
                <div className="relative flex-1">
                  <Input 
                    id="api-key" 
                    type={showApiKey ? "text" : "password"} 
                    defaultValue="sk_live_1234567890abcdef" 
                    className="flex-1 rounded-r-none pr-10" 
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOffIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
                <Button className="rounded-l-none" onClick={handleRegenerateKey}>Regenerate</Button>
              </div>
              <p className="text-sm text-muted-foreground">Your general API key for integrating with third-party services</p>
            </div>
            
            <div className="space-y-2 pt-4">
              <h3 className="text-lg font-medium">Connected Services</h3>
              
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="font-medium">WhatsApp Business API</p>
                  <p className="text-sm text-muted-foreground">Send proposals and vouchers via WhatsApp</p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-green-600 mr-2">Connected</span>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-b py-4">
                <div>
                  <p className="font-medium">Email Service (SMTP)</p>
                  <p className="text-sm text-muted-foreground">Send emails to agents and clients</p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-green-600 mr-2">Connected</span>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>

              {/* Notifications (SMTP) configuration */}
              <div className="pt-6">
                <h3 className="text-lg font-medium">Notifications (SMTP)</h3>
                <p className="text-sm text-muted-foreground mb-4">Configure SMTP credentials to send notifications and emails.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input id="smtp-host" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.example.com" />
                  </div>
                  <div>
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Input id="smtp-port" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch id="smtp-secure" checked={smtpSecure} onCheckedChange={setSmtpSecure} />
                    <div>
                      <Label htmlFor="smtp-secure">Use TLS (Secure)</Label>
                      <p className="text-xs text-muted-foreground">Enable for port 465 or TLS-enabled servers</p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="smtp-user">SMTP User</Label>
                    <Input id="smtp-user" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="user@example.com" />
                  </div>
                  <div className="relative">
                    <Label htmlFor="smtp-password">SMTP Password</Label>
                    <Input id="smtp-password" type={showPassword ? 'text' : 'password'} value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} placeholder="••••••••" />
                    <button type="button" className="absolute right-3 top-9" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOffIcon className="h-4 w-4 text-gray-500" /> : <EyeIcon className="h-4 w-4 text-gray-500" />}
                    </button>
                  </div>
                  <div>
                    <Label htmlFor="from-email">From Email</Label>
                    <Input id="from-email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="no-reply@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="from-name">From Name</Label>
                    <Input id="from-name" value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Company Notifications" />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <Button onClick={persistSMTP} disabled={saving}>{saving ? 'Saving…' : 'Save SMTP'}</Button>
                  <div className="flex items-center gap-2">
                    <Input id="test-email" type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="Enter test email" className="w-60" />
                    <Button variant="outline" onClick={handleSendTest} disabled={sending || !testEmail}>{sending ? 'Sending…' : 'Send Test'}</Button>
                  </div>
                </div>
                {previewUrl && (
                  <div className="mt-3 text-sm">
                    <span className="text-muted-foreground">Preview URL: </span>
                    <a href={previewUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{previewUrl}</a>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <p className="font-medium">Payment Gateway</p>
                  <p className="text-sm text-muted-foreground">Process payments from agents</p>
                </div>
                <div>
                  <Button>Connect</Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 pt-4 border-t mt-4">
              <h3 className="text-lg font-medium">API Access Controls</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Rate Limiting</p>
                  <p className="text-sm text-muted-foreground">Limit API calls per minute</p>
                </div>
                <Input type="number" defaultValue="100" className="w-24" />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-medium">Enable CORS</p>
                  <p className="text-sm text-muted-foreground">Allow cross-origin requests</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleSave}>Save Changes</Button>
          </CardFooter>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ApiSettings;
