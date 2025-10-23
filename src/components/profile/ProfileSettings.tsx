import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Bell, 
  Eye, 
  Lock, 
  Globe, 
  Smartphone, 
  Mail, 
  Key,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Settings,
  User,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileSettingsProps {
  userId: string;
  onSettingsChange?: (settings: any) => void;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'contacts';
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  allowDirectMessages: boolean;
  showOnlineStatus: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  queryUpdates: boolean;
  proposalUpdates: boolean;
  systemAlerts: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
  deviceTracking: boolean;
  passwordExpiry: number;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ 
  userId, 
  onSettingsChange 
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('privacy');

  // Settings state
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showEmail: true,
    showPhone: false,
    showLocation: true,
    allowDirectMessages: true,
    showOnlineStatus: true,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    queryUpdates: true,
    proposalUpdates: true,
    systemAlerts: true,
    marketingEmails: false,
    weeklyDigest: true,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginAlerts: true,
    deviceTracking: true,
    passwordExpiry: 90,
  });

  // Load settings on mount
  useEffect(() => {
    loadUserSettings();
  }, [userId]);

  const loadUserSettings = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load from localStorage or API
      const savedSettings = localStorage.getItem(`profile-settings-${userId}`);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setPrivacySettings(prev => ({ ...prev, ...parsed.privacy }));
        setNotificationSettings(prev => ({ ...prev, ...parsed.notifications }));
        setSecuritySettings(prev => ({ ...prev, ...parsed.security }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const allSettings = {
        privacy: privacySettings,
        notifications: notificationSettings,
        security: securitySettings,
        updatedAt: new Date().toISOString(),
      };

      // Save to localStorage (in real app, this would be an API call)
      localStorage.setItem(`profile-settings-${userId}`, JSON.stringify(allSettings));
      
      onSettingsChange?.(allSettings);
      
      toast({
        title: "Settings saved",
        description: "Your profile settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportData = () => {
    const data = {
      privacy: privacySettings,
      notifications: notificationSettings,
      security: securitySettings,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile-settings-${userId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data exported",
      description: "Your settings have been exported successfully.",
    });
  };

  const resetToDefaults = () => {
    setPrivacySettings({
      profileVisibility: 'public',
      showEmail: true,
      showPhone: false,
      showLocation: true,
      allowDirectMessages: true,
      showOnlineStatus: true,
    });
    
    setNotificationSettings({
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      queryUpdates: true,
      proposalUpdates: true,
      systemAlerts: true,
      marketingEmails: false,
      weeklyDigest: true,
    });
    
    setSecuritySettings({
      twoFactorEnabled: false,
      sessionTimeout: 30,
      loginAlerts: true,
      deviceTracking: true,
      passwordExpiry: 90,
    });
    
    toast({
      title: "Settings reset",
      description: "All settings have been reset to defaults.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Profile Settings
        </CardTitle>
        <CardDescription>
          Manage your privacy, notifications, and security preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="privacy" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-visibility">Profile Visibility</Label>
                <Select 
                  value={privacySettings.profileVisibility} 
                  onValueChange={(value: any) => 
                    setPrivacySettings(prev => ({ ...prev, profileVisibility: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Public - Anyone can view
                      </div>
                    </SelectItem>
                    <SelectItem value="contacts">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Contacts only
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Private - Only you
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Contact Information Visibility</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Email Address</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your email address
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.showEmail}
                    onCheckedChange={(checked) =>
                      setPrivacySettings(prev => ({ ...prev, showEmail: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Phone Number</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your phone number
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.showPhone}
                    onCheckedChange={(checked) =>
                      setPrivacySettings(prev => ({ ...prev, showPhone: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Location</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your location
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.showLocation}
                    onCheckedChange={(checked) =>
                      setPrivacySettings(prev => ({ ...prev, showLocation: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Direct Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others send you direct messages
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.allowDirectMessages}
                    onCheckedChange={(checked) =>
                      setPrivacySettings(prev => ({ ...prev, allowDirectMessages: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Online Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Display when you're online or offline
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.showOnlineStatus}
                    onCheckedChange={(checked) =>
                      setPrivacySettings(prev => ({ ...prev, showOnlineStatus: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Notification Channels</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on your device
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important alerts via SMS
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.smsNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))
                  }
                />
              </div>

              <Separator />

              <h4 className="font-medium">Content Notifications</h4>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Query Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about query status changes
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.queryUpdates}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, queryUpdates: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Proposal Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about proposal changes
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.proposalUpdates}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, proposalUpdates: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Important system notifications
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.systemAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, systemAlerts: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Promotional content and updates
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.marketingEmails}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, marketingEmails: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Weekly summary of your activity
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.weeklyDigest}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, weeklyDigest: checked }))
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                These settings help protect your account and data. Enable two-factor authentication for enhanced security.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Two-Factor Authentication
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {securitySettings.twoFactorEnabled && (
                    <Badge variant="secondary" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  )}
                  <Switch
                    checked={securitySettings.twoFactorEnabled}
                    onCheckedChange={(checked) =>
                      setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Select 
                  value={securitySettings.sessionTimeout.toString()} 
                  onValueChange={(value) => 
                    setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Login Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of new login attempts
                  </p>
                </div>
                <Switch
                  checked={securitySettings.loginAlerts}
                  onCheckedChange={(checked) =>
                    setSecuritySettings(prev => ({ ...prev, loginAlerts: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Device Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Track devices that access your account
                  </p>
                </div>
                <Switch
                  checked={securitySettings.deviceTracking}
                  onCheckedChange={(checked) =>
                    setSecuritySettings(prev => ({ ...prev, deviceTracking: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-expiry">Password Expiry (days)</Label>
                <Select 
                  value={securitySettings.passwordExpiry.toString()} 
                  onValueChange={(value) => 
                    setSecuritySettings(prev => ({ ...prev, passwordExpiry: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                Manage your data and account preferences. You can export your data or reset settings to defaults.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Export Data</CardTitle>
                  <CardDescription>
                    Download a copy of your profile settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={exportData} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reset Settings</CardTitle>
                  <CardDescription>
                    Reset all settings to their default values
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={resetToDefaults} 
                    variant="outline" 
                    className="w-full"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible actions that affect your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" className="w-full" disabled>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Contact support to delete your account
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-6 border-t">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset All
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};