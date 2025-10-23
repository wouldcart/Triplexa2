
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';

const NotificationSettings: React.FC = () => {
  const { translate } = useApp();
  const { toast } = useToast();
  
  const handleSave = () => {
    toast({
      title: translate('success'),
      description: translate('notificationSettingsSaved'),
    });
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <h1 className="text-xl md:text-2xl font-bold">{translate('notificationSettings')}</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive email for new queries and bookings</p>
              </div>
              <Switch defaultChecked id="email-notifications" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">System Notifications</p>
                <p className="text-sm text-muted-foreground">In-app notifications for system events</p>
              </div>
              <Switch defaultChecked id="system-notifications" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Task Reminders</p>
                <p className="text-sm text-muted-foreground">Reminders for upcoming tasks and follow-ups</p>
              </div>
              <Switch defaultChecked id="task-reminders" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing Updates</p>
                <p className="text-sm text-muted-foreground">Notifications for marketing and promotional content</p>
              </div>
              <Switch id="marketing-updates" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mobile Push Notifications</p>
                <p className="text-sm text-muted-foreground">Enable push notifications on mobile devices</p>
              </div>
              <Switch defaultChecked id="push-notifications" />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleSave}>Save Preferences</Button>
          </CardFooter>
        </Card>
      </div>
    </PageLayout>
  );
};

export default NotificationSettings;
