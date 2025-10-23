
import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAccessControl } from '@/hooks/use-access-control';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Shield, Settings, Users, Database, 
  Bell, Palette, Globe, Key
} from 'lucide-react';

const RoleBasedSettings: React.FC = () => {
  const { currentUser } = useApp();
  const { isSuperAdmin, isManager, isStaff, isAgent } = useAccessControl();

  const renderSuperAdminSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            System Administration
          </CardTitle>
          <CardDescription>
            Advanced system configuration and management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Global Security Settings</Label>
                <p className="text-sm text-muted-foreground">
                  Configure system-wide security policies
                </p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>User Role Management</Label>
                <p className="text-sm text-muted-foreground">
                  Manage user roles and permissions
                </p>
              </div>
              <Button variant="outline">Manage</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>System Backup</Label>
                <p className="text-sm text-muted-foreground">
                  Configure automated backups
                </p>
              </div>
              <Button variant="outline">Setup</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Audit Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Enable detailed audit trails
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderManagerSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team Management
          </CardTitle>
          <CardDescription>
            Configure team settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Team Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Manage team notification preferences
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Performance Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get alerts on team performance metrics
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Approval Workflows</Label>
                <p className="text-sm text-muted-foreground">
                  Configure approval processes
                </p>
              </div>
              <Button variant="outline">Setup</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Department Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Automated department reporting
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStaffSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Work Preferences
          </CardTitle>
          <CardDescription>
            Customize your work environment and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Task Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about new tasks
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Deadline Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Automatic deadline reminders
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Performance Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Weekly performance summaries
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Training Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Updates on training opportunities
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAgentSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Business Settings
          </CardTitle>
          <CardDescription>
            Configure your business preferences and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Commission Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about commission updates
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Client Communications</Label>
                <p className="text-sm text-muted-foreground">
                  Auto-respond to client inquiries
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Booking Confirmations</Label>
                <p className="text-sm text-muted-foreground">
                  Automated booking confirmations
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Performance Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Monthly performance reports
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUserSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Personal Preferences
          </CardTitle>
          <CardDescription>
            Configure your personal settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Marketing Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Promotional emails and updates
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Security Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Important security notifications
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Account Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Changes to your account
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render based on user role
  if (isSuperAdmin) {
    return renderSuperAdminSettings();
  }

  if (isManager) {
    return renderManagerSettings();
  }

  if (isStaff) {
    return renderStaffSettings();
  }

  if (isAgent) {
    return renderAgentSettings();
  }

  return renderUserSettings();
};

export default RoleBasedSettings;
