import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Building2, 
  Settings, 
  Shield, 
  Bell, 
  Download, 
  Trash2, 
  Key,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthService } from '@/services/authService';
import PasswordChangeDialog from '@/components/security/PasswordChangeDialog';

const EnhancedProfileSettings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState<{ required: boolean; reason?: string }>({ required: false });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    position: user?.position || '',
    department: user?.department || '',
    employeeId: user?.employeeId || ''
  });

  // Agency form state (if applicable)
  const [agencyForm, setAgencyForm] = useState({
    company_name: '',
    business_license: '',
    address: '',
    website: '',
    description: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    weeklyReports: true,
    language: 'en',
    timezone: 'UTC',
    theme: 'light'
  });

  // Check for password change requirement on component mount
  useEffect(() => {
    const checkPasswordRequirement = async () => {
      try {
        const result = await AuthService.checkPasswordChangeRequired();
        setPasswordChangeRequired(result);
        
        // Auto-open password dialog if change is required
        if (result.required) {
          setShowPasswordDialog(true);
          setActiveTab('security'); // Switch to security tab
        }
      } catch (error) {
        console.warn('Failed to check password requirement:', error);
      }
    };

    checkPasswordRequirement();
  }, []);

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setMessage(null);

    try {
      const { user: updatedUser, error } = await AuthService.updateProfile(user.id, {
        name: profileForm.name,
        phone: profileForm.phone,
        position: profileForm.position,
        department: profileForm.department,
        employeeId: profileForm.employeeId,
      } as any);

      if (error) {
        setMessage({ type: 'error', text: error });
      } else if (updatedUser) {
        updateUser(updatedUser);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Here you would typically save preferences to your backend
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Preferences updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update preferences' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChangeSuccess = () => {
    setPasswordChangeRequired({ required: false });
    setMessage({ type: 'success', text: 'Password updated successfully!' });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <Badge variant={user?.status === 'active' ? 'default' : 'secondary'}>
          {user?.status || 'Active'}
        </Badge>
      </div>

      {/* Password Change Required Alert */}
      {passwordChangeRequired.required && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {passwordChangeRequired.reason || 'Password change required for security.'}
            <Button 
              variant="link" 
              className="p-0 h-auto ml-2 text-destructive"
              onClick={() => setShowPasswordDialog(true)}
            >
              Change Password Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="agency" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Agency
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={profileForm.employeeId}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    placeholder="Enter your employee ID"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={profileForm.position}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Enter your position"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Enter your department"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileUpdate} disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agency Tab */}
        <TabsContent value="agency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agency Information</CardTitle>
              <CardDescription>
                Manage your travel agency details and business information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={agencyForm.company_name}
                    onChange={(e) => setAgencyForm(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_license">Business License</Label>
                  <Input
                    id="business_license"
                    value={agencyForm.business_license}
                    onChange={(e) => setAgencyForm(prev => ({ ...prev, business_license: e.target.value }))}
                    placeholder="Enter license number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={agencyForm.address}
                  onChange={(e) => setAgencyForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter complete business address"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={agencyForm.website}
                  onChange={(e) => setAgencyForm(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://your-agency-website.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Agency Description</Label>
                <Textarea
                  id="description"
                  value={agencyForm.description}
                  onChange={(e) => setAgencyForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your agency and services"
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Agency Info'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications and updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get instant notifications in your browser
                  </p>
                </div>
                <Switch
                  checked={preferences.pushNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive promotional content and offers
                  </p>
                </div>
                <Switch
                  checked={preferences.marketingEmails}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, marketingEmails: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Get weekly performance summaries
                  </p>
                </div>
                <Switch
                  checked={preferences.weeklyReports}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, weeklyReports: checked }))
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handlePreferencesUpdate} disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>
                Manage your password and security settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium">Password</h4>
                    <p className="text-sm text-muted-foreground">
                      {passwordChangeRequired.required 
                        ? 'Password change required for security'
                        : 'Last updated recently'
                      }
                    </p>
                  </div>
                </div>
                <Button 
                  variant={passwordChangeRequired.required ? "destructive" : "outline"}
                  onClick={() => setShowPasswordDialog(true)}
                >
                  Change Password
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
                <Button variant="outline" disabled>
                  Enable
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Download your data or delete your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium">Download Account Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Get a copy of all your account data
                    </p>
                  </div>
                </div>
                <Button variant="outline">
                  Download
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  <div>
                    <h4 className="font-medium text-red-700">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                </div>
                <Button variant="destructive">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Password Change Dialog */}
      <PasswordChangeDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onSuccess={handlePasswordChangeSuccess}
      />
    </div>
  );
};

export default EnhancedProfileSettings;