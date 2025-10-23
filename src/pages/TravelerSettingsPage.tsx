
import React from 'react';
import TravelerLayout from '@/components/traveler/TravelerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Moon, Sun, Bell, Shield, Globe, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';

const TravelerSettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();

  return (
    <TravelerLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Settings</h1>
        </div>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              {theme === 'dark' ? <Moon className="h-4 w-4 sm:h-5 sm:w-5" /> : <Sun className="h-4 w-4 sm:h-5 sm:w-5" />}
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-foreground">Dark Mode</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-foreground">Trip Updates</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Receive notifications about trip changes</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-foreground">Activity Reminders</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Get reminded about upcoming activities</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-foreground">Emergency Alerts</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Important safety and emergency notifications</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-foreground">Marketing Communications</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Offers and promotions from travel partners</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-foreground">Location Sharing</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Share location with travel agent during trips</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-foreground">Data Analytics</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Help improve our services with usage data</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Button variant="outline" className="w-full" size={isMobile ? "sm" : "default"}>
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
              Language & Region
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-sm sm:text-base text-foreground mb-2">Language</p>
              <Button variant="outline" className="w-full justify-start" size={isMobile ? "sm" : "default"}>
                English (US)
              </Button>
            </div>
            <div>
              <p className="font-medium text-sm sm:text-base text-foreground mb-2">Currency</p>
              <Button variant="outline" className="w-full justify-start" size={isMobile ? "sm" : "default"}>
                USD ($)
              </Button>
            </div>
            <div>
              <p className="font-medium text-sm sm:text-base text-foreground mb-2">Time Zone</p>
              <Button variant="outline" className="w-full justify-start" size={isMobile ? "sm" : "default"}>
                Eastern Time (ET)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Smartphone className="h-4 w-4 sm:h-5 sm:w-5" />
              App Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-foreground">Offline Mode</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Download trip data for offline access</p>
              </div>
              <Switch />
            </div>
            <Button variant="outline" className="w-full" size={isMobile ? "sm" : "default"}>
              Clear Cache
            </Button>
          </CardContent>
        </Card>
      </div>
    </TravelerLayout>
  );
};

export default TravelerSettingsPage;
