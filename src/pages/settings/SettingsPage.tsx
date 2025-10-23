import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  FileText, 
  Users, 
  Bell, 
  Lock, 
  Palette,
  Database,
  Mail,
  Smartphone,
  Cog,
  Folder
} from 'lucide-react';
import LocalFileManager from '@/components/settings/LocalFileManager';
import PDFTemplateManager from '@/components/pdf/PDFTemplateManager';


const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('app-settings');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your application settings, templates, and preferences
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="app-settings" className="flex items-center gap-2">
              <Cog className="h-4 w-4" />
              App Settings
            </TabsTrigger>
            <TabsTrigger value="pdf-templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              PDF Templates
            </TabsTrigger>
            <TabsTrigger value="email-templates" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Templates
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
            <TabsTrigger value="local-files" className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Local Files
            </TabsTrigger>
          </TabsList>

          {/* App Settings Tab */}
          <TabsContent value="app-settings">
            <Card>
              <CardHeader>
                <CardTitle>App Settings Moved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">App Settings have been moved</h3>
                  <p className="text-muted-foreground mb-4">
                    App settings are now available in the General Settings page
                  </p>
                  <Button onClick={() => window.location.href = '/settings/general'}>
                    Go to General Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PDF Templates Tab */}
          <TabsContent value="pdf-templates">
            <PDFTemplateManager />
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="email-templates">
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <Link to="/email-templates" className="block">
                  <div className="text-center py-12 rounded-md hover:bg-muted transition-colors cursor-pointer">
                    <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Email Template Management</h3>
                    <p className="text-muted-foreground">
                      Click here to manage and edit your email templates
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Team Management</h3>
                  <p className="text-muted-foreground mb-4">
                    Manage team members, roles, and permissions
                  </p>
                  <Button variant="outline">
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Notification Preferences</h3>
                  <p className="text-muted-foreground mb-4">
                    Configure how and when you receive notifications
                  </p>
                  <Button variant="outline">
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Security & Privacy</h3>
                  <p className="text-muted-foreground mb-4">
                    Manage passwords, two-factor authentication, and privacy settings
                  </p>
                  <Button variant="outline">
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance & Branding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Customize Appearance</h3>
                  <p className="text-muted-foreground mb-4">
                    Customize colors, fonts, and branding for your proposals
                  </p>
                  <Button variant="outline">
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Third-party Integrations</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect with external services and APIs
                  </p>
                  <Button variant="outline">
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Data Import & Export</h3>
                  <p className="text-muted-foreground mb-4">
                    Manage your data, import/export settings, and backups
                  </p>
                  <Button variant="outline">
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Local Files Tab */}
          <TabsContent value="local-files">
            <LocalFileManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;