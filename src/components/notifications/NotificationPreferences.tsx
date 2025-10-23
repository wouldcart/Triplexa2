
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Mail, AlertTriangle } from 'lucide-react';
import { useStaffNotifications } from '@/contexts/StaffNotificationContext';
import { toast } from 'sonner';

const NotificationPreferences: React.FC = () => {
  const { 
    preferences, 
    updatePreferences, 
    requestBrowserPermission,
    hasBrowserPermission 
  } = useStaffNotifications();

  const handleBrowserPermissionRequest = async () => {
    const granted = await requestBrowserPermission();
    if (granted) {
      toast.success('Browser notifications enabled successfully!');
    } else {
      toast.error('Browser notifications were denied. Please enable them in your browser settings.');
    }
  };

  if (!preferences) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground">Loading notification preferences...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Browser Notifications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Browser Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Get desktop notifications for new assignments
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!hasBrowserPermission && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBrowserPermissionRequest}
                  className="text-xs"
                >
                  Enable
                </Button>
              )}
              <Switch
                checked={preferences.browserNotifications && hasBrowserPermission}
                onCheckedChange={(checked) => 
                  updatePreferences({ browserNotifications: checked })
                }
                disabled={!hasBrowserPermission}
              />
            </div>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive email alerts for important updates
              </p>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => 
                updatePreferences({ emailNotifications: checked })
              }
            />
          </div>
        </div>

        {/* Notification Types */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Notification Types</Label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">New Assignments</Label>
              <Switch
                checked={preferences.assignments}
                onCheckedChange={(checked) => 
                  updatePreferences({ assignments: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Status Updates</Label>
              <Switch
                checked={preferences.statusUpdates}
                onCheckedChange={(checked) => 
                  updatePreferences({ statusUpdates: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Follow-up Reminders</Label>
              <Switch
                checked={preferences.followUpReminders}
                onCheckedChange={(checked) => 
                  updatePreferences({ followUpReminders: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Urgent Only Mode */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Urgent Only Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Only receive notifications for urgent enquiries
              </p>
            </div>
            <Switch
              checked={preferences.urgentOnly}
              onCheckedChange={(checked) => 
                updatePreferences({ urgentOnly: checked })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;
