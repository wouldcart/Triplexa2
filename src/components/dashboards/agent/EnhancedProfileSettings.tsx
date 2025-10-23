import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { 
  User, Building2, Bell, Globe, Shield, Key, 
  Camera, Save, MapPin, Phone, Mail, Calendar
} from 'lucide-react';
import PasswordChangeDialog from '@/components/security/PasswordChangeDialog';

const EnhancedProfileSettings: React.FC = () => {
  const [profileData, setProfileData] = useState({
    name: 'Sarah Johnson',
    email: 'sarah@globaltravelsolutions.com',
    phone: '+1 234 567 8900',
    agencyName: 'Global Travel Solutions',
    agencyCode: 'GTS001',
    defaultCountry: 'US',
    defaultLanguage: 'en',
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false
    }
  });

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile & Settings
          </CardTitle>
          <CardDescription>
            Manage your profile information, preferences, and account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="agency">Agency</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="text-lg">SJ</AvatarFallback>
                  </Avatar>
                  <Button 
                    size="sm" 
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{profileData.name}</h3>
                  <p className="text-sm text-muted-foreground">Travel Agent</p>
                  <p className="text-sm text-muted-foreground">{profileData.agencyName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input id="position" defaultValue="Senior Travel Agent" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Tell us about yourself and your travel expertise..."
                  className="min-h-[100px]"
                />
              </div>
            </TabsContent>

            <TabsContent value="agency" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agencyName">Agency Name</Label>
                  <Input 
                    id="agencyName" 
                    value={profileData.agencyName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, agencyName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agencyCode">Agency Code</Label>
                  <Input 
                    id="agencyCode" 
                    value={profileData.agencyCode}
                    onChange={(e) => setProfileData(prev => ({ ...prev, agencyCode: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">License Number</Label>
                  <Input id="license" placeholder="Travel agency license number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iata">IATA Number</Label>
                  <Input id="iata" placeholder="IATA accreditation number" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agencyAddress">Agency Address</Label>
                <Textarea 
                  id="agencyAddress" 
                  placeholder="Complete agency address..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Business Phone</Label>
                  <Input id="businessPhone" placeholder="+1 234 567 8900" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Business Email</Label>
                  <Input id="businessEmail" type="email" placeholder="info@agency.com" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Regional Settings
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="defaultCountry">Default Country</Label>
                      <Select value={profileData.defaultCountry} onValueChange={(value) => 
                        setProfileData(prev => ({ ...prev, defaultCountry: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">🇺🇸 United States</SelectItem>
                          <SelectItem value="IN">🇮🇳 India</SelectItem>
                          <SelectItem value="AE">🇦🇪 UAE</SelectItem>
                          <SelectItem value="TH">🇹🇭 Thailand</SelectItem>
                          <SelectItem value="SG">🇸🇬 Singapore</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="defaultLanguage">Default Language</Label>
                      <Select value={profileData.defaultLanguage} onValueChange={(value) => 
                        setProfileData(prev => ({ ...prev, defaultLanguage: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="hi">Hindi</SelectItem>
                          <SelectItem value="ar">Arabic</SelectItem>
                          <SelectItem value="th">Thai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notification Preferences
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="emailNotif">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                      <Switch 
                        id="emailNotif"
                        checked={profileData.notifications.email}
                        onCheckedChange={(checked) => 
                          setProfileData(prev => ({
                            ...prev, 
                            notifications: { ...prev.notifications, email: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="pushNotif">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive browser notifications</p>
                      </div>
                      <Switch 
                        id="pushNotif"
                        checked={profileData.notifications.push}
                        onCheckedChange={(checked) => 
                          setProfileData(prev => ({
                            ...prev, 
                            notifications: { ...prev.notifications, push: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="smsNotif">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                      </div>
                      <Switch 
                        id="smsNotif"
                        checked={profileData.notifications.sms}
                        onCheckedChange={(checked) => 
                          setProfileData(prev => ({
                            ...prev, 
                            notifications: { ...prev.notifications, sms: checked }
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Theme Preference</h4>
                <div className="flex items-center gap-4">
                  <Label>Appearance</Label>
                  <ThemeToggle />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Password & Security
                </h4>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Change Password</p>
                    <p className="text-sm text-muted-foreground">
                      Update your account password for enhanced security
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setPasswordDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Key className="h-4 w-4" />
                    Change Password
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Two-Factor Authentication
                </h4>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Account Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Download Account Data
                  </Button>
                  <Button variant="destructive" className="w-full justify-start">
                    Delete Account
                  </Button>
                </div>
              </div>
            </TabsContent>

            <div className="flex justify-end pt-6 border-t">
              <Button className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <PasswordChangeDialog 
        open={passwordDialogOpen} 
        onOpenChange={setPasswordDialogOpen} 
      />
    </div>
  );
};

export default EnhancedProfileSettings;