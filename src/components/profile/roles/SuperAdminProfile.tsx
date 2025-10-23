import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { useApplicationSettings } from '@/contexts/ApplicationSettingsContext';
import LogoUpload from '@/components/settings/LogoUpload';
import CompanyDetailsForm from '@/components/settings/CompanyDetailsForm';
import SEOSettingsComponent from '@/components/settings/SEOSettings';
import CountryEnquiryManager from '@/components/admin/CountryEnquiryManager';
import { 
  Shield, Users, Settings, Database, Activity, AlertTriangle,
  CheckCircle, UserCog, Lock, Unlock, Eye, EyeOff, Palette
} from 'lucide-react';

interface SuperAdminProfileProps {
  isEditing: boolean;
  editData: any;
  setEditData: (data: any) => void;
  validationErrors: Record<string, string>;
}

const SuperAdminProfile: React.FC<SuperAdminProfileProps> = ({
  isEditing,
  editData,
  setEditData,
  validationErrors
}) => {
  const { toast } = useToast();
  const { settings, updateSettings, updateCompanyDetails, updateSEOSettings } = useApplicationSettings();
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    newUserRegistration: true,
    advancedLogging: true,
    systemNotifications: true
  });

  const handleSystemSettingChange = (key: string, value: boolean) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: value
    }));
    toast({
      title: "System Setting Updated",
      description: `${key} has been ${value ? 'enabled' : 'disabled'}`,
    });
  };

  const handleLogoChange = (logo: string | null, type: 'light' | 'dark') => {
    if (type === 'light') {
      updateSettings({ logo });
    } else {
      updateSettings({ darkLogo: logo });
    }
  };

  return (
    <Tabs defaultValue="system-control" className="space-y-4">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="system-control">System Control</TabsTrigger>
        <TabsTrigger value="application-settings">Application Settings</TabsTrigger>
        <TabsTrigger value="user-management">User Management</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      <TabsContent value="application-settings" className="space-y-4">
        <div className="space-y-6">
          <LogoUpload
            logo={settings.logo}
            darkLogo={settings.darkLogo}
            onLogoChange={handleLogoChange}
          />
          
          <CompanyDetailsForm
            companyDetails={settings.companyDetails}
            onSave={updateCompanyDetails}
          />
          
          <SEOSettingsComponent
            seoSettings={settings.seoSettings}
            onSave={updateSEOSettings}
          />
        </div>
      </TabsContent>

      <TabsContent value="system-control" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              System Configuration
            </CardTitle>
            <CardDescription>
              Control system-wide settings and maintenance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Put system in maintenance mode
                  </p>
                </div>
                <Switch
                  checked={systemSettings.maintenanceMode}
                  onCheckedChange={(value) => handleSystemSettingChange('maintenanceMode', value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>New User Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow new user registrations
                  </p>
                </div>
                <Switch
                  checked={systemSettings.newUserRegistration}
                  onCheckedChange={(value) => handleSystemSettingChange('newUserRegistration', value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Advanced Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable detailed system logging
                  </p>
                </div>
                <Switch
                  checked={systemSettings.advancedLogging}
                  onCheckedChange={(value) => handleSystemSettingChange('advancedLogging', value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>System Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send system alerts and notifications
                  </p>
                </div>
                <Switch
                  checked={systemSettings.systemNotifications}
                  onCheckedChange={(value) => handleSystemSettingChange('systemNotifications', value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enquiry ID Configuration - Replace with new Country Management */}
        <CountryEnquiryManager />
      </TabsContent>

      <TabsContent value="user-management" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage users, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Users</Label>
                <div className="text-2xl font-bold text-blue-600">247</div>
              </div>
              <div>
                <Label>Active Sessions</Label>
                <div className="text-2xl font-bold text-green-600">89</div>
              </div>
              <div>
                <Label>Pending Approvals</Label>
                <div className="text-2xl font-bold text-orange-600">12</div>
              </div>
              <div>
                <Label>System Alerts</Label>
                <div className="text-2xl font-bold text-red-600">3</div>
              </div>
            </div>
            <Button className="w-full">
              <UserCog className="h-4 w-4 mr-2" />
              Manage All Users
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="analytics" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              System Analytics
            </CardTitle>
            <CardDescription>
              Monitor system performance and usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">99.9%</div>
                <Label>Uptime</Label>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">1.2s</div>
                <Label>Avg Response</Label>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">15.7k</div>
                <Label>Daily Requests</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security & Access Control
            </CardTitle>
            <CardDescription>
              Advanced security settings and monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Force 2FA for All Users</Label>
                  <p className="text-sm text-muted-foreground">
                    Require two-factor authentication for all accounts
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">
                    Auto-logout inactive users
                  </p>
                </div>
                <Select defaultValue="30">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default SuperAdminProfile;
