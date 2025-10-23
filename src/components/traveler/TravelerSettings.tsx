import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, Bell, Globe, Moon, Sun, Shield, CreditCard, Phone, Mail, Save, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';
import { toast } from '@/hooks/use-toast';

const TravelerSettings: React.FC = () => {
  const { currentUser } = useApp();
  const { theme, setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    language: 'en',
    darkMode: theme === 'dark',
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    expenseTracking: true,
    activityReminders: true,
    tripUpdates: true,
    marketingEmails: false
  });

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'hi', label: 'हिन्दी' }
  ];

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      });
      return;
    }

    console.log('Updating profile:', profileData);
    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated.",
    });
    setIsEditing(false);
  };

  const handlePreferencesSubmit = () => {
    console.log('Updating preferences:', preferences);
    if (preferences.darkMode !== (theme === 'dark')) {
      setTheme(preferences.darkMode ? 'dark' : 'light');
    }
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };

  const handlePreferenceChange = (key: string, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your account and preferences
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Profile Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label>Account Type</Label>
                  <div className="flex items-center mt-1">
                    <Badge variant="secondary">
                      {currentUser?.role === 'user' ? 'Traveler' : currentUser?.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {isEditing && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Change Password (Optional)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPassword ? "text" : "password"}
                            value={profileData.currentPassword}
                            onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={profileData.newPassword}
                          onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={profileData.confirmPassword}
                          onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Email Notifications</Label>
                  <p className="text-xs text-gray-500">Receive notifications via email</p>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Push Notifications</Label>
                  <p className="text-xs text-gray-500">Receive push notifications in browser</p>
                </div>
                <Switch
                  checked={preferences.pushNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange('pushNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">SMS Notifications</Label>
                  <p className="text-xs text-gray-500">Receive important updates via SMS</p>
                </div>
                <Switch
                  checked={preferences.smsNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange('smsNotifications', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Activity Reminders</Label>
                  <p className="text-xs text-gray-500">Get reminded about upcoming activities</p>
                </div>
                <Switch
                  checked={preferences.activityReminders}
                  onCheckedChange={(checked) => handlePreferenceChange('activityReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Trip Updates</Label>
                  <p className="text-xs text-gray-500">Receive updates about trip changes</p>
                </div>
                <Switch
                  checked={preferences.tripUpdates}
                  onCheckedChange={(checked) => handlePreferenceChange('tripUpdates', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Marketing Emails</Label>
                  <p className="text-xs text-gray-500">Receive promotional offers and travel tips</p>
                </div>
                <Switch
                  checked={preferences.marketingEmails}
                  onCheckedChange={(checked) => handlePreferenceChange('marketingEmails', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance & Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Appearance & Language</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="language">Language</Label>
                <Select
                  value={preferences.language}
                  onValueChange={(value) => handlePreferenceChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium flex items-center space-x-2">
                    {preferences.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    <span>Dark Mode</span>
                  </Label>
                  <p className="text-xs text-gray-500">Toggle dark/light theme</p>
                </div>
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => handlePreferenceChange('darkMode', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Privacy & Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Expense Tracking</Label>
                <p className="text-xs text-gray-500">Track and categorize trip expenses</p>
              </div>
              <Switch
                checked={preferences.expenseTracking}
                onCheckedChange={(checked) => handlePreferenceChange('expenseTracking', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handlePreferencesSubmit}>
            <Save className="h-4 w-4 mr-2" />
            Save All Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TravelerSettings;