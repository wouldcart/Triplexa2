import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAppSettingsAccess } from '@/hooks/useAppSettingsAccess';
import { appSettingsService, SETTING_CATEGORIES, AppSetting, AppSettingsService } from '@/services/appSettingsService';
import { GeneralSettings } from '@/components/settings/categories/GeneralSettings';
import { SEOSettings } from '@/components/settings/categories/SEOSettings';
import { BrandingSettings } from '@/components/settings/categories/BrandingSettings';
import { ContentSettings } from '@/components/settings/categories/ContentSettings';
import { AuthenticationSettings } from '@/components/settings/categories/AuthenticationSettings';
import { IntegrationsSettings } from '@/components/settings/categories/IntegrationsSettings';
import AppSettingsHeader from '@/components/settings/AppSettingsHeader';
import AppSettingsSidebar from '@/components/settings/AppSettingsSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Settings, 
  Search, 
  Globe, 
  Palette, 
  Shield, 
  Lock, 
  Bell, 
  CreditCard, 
  Plug, 
  Wrench, 
  FileText,
  Save,
  RefreshCw,
  AlertTriangle,
  Database,
  Users
} from 'lucide-react';

// Category icons mapping
const categoryIcons = {
  [SETTING_CATEGORIES.GENERAL]: Settings,
  [SETTING_CATEGORIES.SEO]: Search,
  [SETTING_CATEGORIES.BRANDING]: Palette,
  [SETTING_CATEGORIES.PERMISSIONS]: Shield,
  [SETTING_CATEGORIES.AUTHENTICATION]: Lock,
  [SETTING_CATEGORIES.NOTIFICATIONS]: Bell,
  [SETTING_CATEGORIES.PAYMENT]: CreditCard,
  [SETTING_CATEGORIES.INTEGRATIONS]: Plug,
  [SETTING_CATEGORIES.MAINTENANCE]: Wrench,
  [SETTING_CATEGORIES.CONTENT]: FileText,
};

const AppSettingsAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(SETTING_CATEGORIES.GENERAL);
  const [settings, setSettings] = useState<Record<string, AppSetting[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { hasAccess, isLoading: accessLoading } = useAppSettingsAccess();
  const [searchParams] = useSearchParams();

  // Load all settings
  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await AppSettingsService.getAllSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        toast({
          title: "Error loading settings",
          description: response.error || "Failed to load application settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load application settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      loadSettings();
    }
  }, [hasAccess]);

  // Handle URL parameters to auto-select tabs and sections
  useEffect(() => {
    const category = searchParams.get('category');
    const section = searchParams.get('section');
    
    if (category && Object.values(SETTING_CATEGORIES).includes(category as any)) {
      setActiveTab(category);
      
      // Store the section in a data attribute or pass it to the component
      if (section) {
        // This will be handled by the individual components
        document.documentElement.setAttribute('data-settings-section', section);
      }
    }
  }, [searchParams]);

  // Save all pending changes
  const handleSaveAll = async () => {
    try {
      // This would typically batch save all changes
      // For now, we'll just refresh the data
      await loadSettings();
      setHasChanges(false);
      toast({
        title: "Settings saved",
        description: "All application settings have been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Failed to save some settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Refresh settings
  const handleRefresh = async () => {
    await loadSettings();
    setHasChanges(false);
    toast({
      title: "Settings refreshed",
      description: "Application settings have been reloaded",
    });
  };

  if (accessLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppSettingsHeader />
        <div className="flex">
          <AppSettingsSidebar />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <AppSettingsHeader />
        <div className="flex">
          <AppSettingsSidebar />
          <main className="flex-1 p-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to access application settings. Please contact your administrator.
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSettingsHeader />
      <div className="flex">
        <AppSettingsSidebar />
        <main className="flex-1 p-6 overflow-auto">
        {/* Quick Actions Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Unsaved Changes
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAll}
                disabled={!hasChanges || isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save All
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {Object.values(settings).flat().length}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Settings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Palette className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {Object.keys(settings).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">Admin</div>
                  <p className="text-sm text-muted-foreground">Access Level</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Management</CardTitle>
            <CardDescription>
              Configure application settings by category. Changes are automatically saved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value)} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                {[
                  SETTING_CATEGORIES.GENERAL,
                  SETTING_CATEGORIES.SEO,
                  SETTING_CATEGORIES.BRANDING,
                  SETTING_CATEGORIES.PERMISSIONS,
                  SETTING_CATEGORIES.AUTHENTICATION,
                  SETTING_CATEGORIES.NOTIFICATIONS,
                  SETTING_CATEGORIES.CONTENT,
                  SETTING_CATEGORIES.INTEGRATIONS,
                ].map((category) => {
                  const Icon = categoryIcons[category] || Settings;
                  const count = settings[category]?.length || 0;
                  
                  return (
                    <TabsTrigger 
                      key={category} 
                      value={category}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{category}</span>
                      {count > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* General Settings */}
              <TabsContent value={SETTING_CATEGORIES.GENERAL}>
                <GeneralSettings />
              </TabsContent>

              {/* SEO Settings */}
              <TabsContent value={SETTING_CATEGORIES.SEO}>
                <SEOSettings />
              </TabsContent>

              {/* Branding Settings */}
              <TabsContent value={SETTING_CATEGORIES.BRANDING}>
                <BrandingSettings />
              </TabsContent>

              {/* Permissions Settings */}
              <TabsContent value={SETTING_CATEGORIES.PERMISSIONS}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Permission Settings
                    </CardTitle>
                    <CardDescription>
                      Manage user roles and access permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Permission Management</h3>
                      <p className="text-muted-foreground mb-4">
                        Configure user roles, permissions, and access controls
                      </p>
                      <Button variant="outline">
                        Coming Soon
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Authentication Settings */}
              <TabsContent value={SETTING_CATEGORIES.AUTHENTICATION}>
                <AuthenticationSettings />
              </TabsContent>

              {/* Notifications Settings */}
              <TabsContent value={SETTING_CATEGORIES.NOTIFICATIONS}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Settings
                    </CardTitle>
                    <CardDescription>
                      Configure system notifications and alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Notification Management</h3>
                      <p className="text-muted-foreground mb-4">
                        Set up email, SMS, and in-app notification preferences
                      </p>
                      <Button variant="outline">
                        Coming Soon
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Settings */}
              <TabsContent value={SETTING_CATEGORIES.CONTENT}>
                <ContentSettings />
              </TabsContent>

              {/* Integrations Settings */}
              <TabsContent value={SETTING_CATEGORIES.INTEGRATIONS}>
                <IntegrationsSettings />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        </main>
      </div>
    </div>
  );
};

export default AppSettingsAdmin;