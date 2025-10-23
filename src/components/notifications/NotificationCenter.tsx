
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Settings, CheckCheck, Wifi, WifiOff, BellOff } from 'lucide-react';
import { useStaffNotifications } from '@/contexts/StaffNotificationContext';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import NotificationItem from './NotificationItem';
import NotificationPreferences from './NotificationPreferences';
import { RealTimeNotificationSettings } from './RealTimeNotificationSettings';

const NotificationCenter: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    dismissNotification
  } = useStaffNotifications();
  
  const { isConnected, connectionStatus } = useRealTimeNotifications();
  
  const [activeTab, setActiveTab] = useState('all');
  const [showSettings, setShowSettings] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return unreadNotifications;
      case 'read':
        return readNotifications;
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  if (showSettings) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Notification Settings</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(false)}
          >
            Back
          </Button>
        </div>
        <Tabs defaultValue="preferences" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="realtime">Real-time</TabsTrigger>
          </TabsList>
          <TabsContent value="preferences">
            <NotificationPreferences />
          </TabsContent>
          <TabsContent value="realtime">
            <RealTimeNotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {isConnected ? (
                 <Wifi className="h-4 w-4 text-green-500" />
               ) : (
                 <WifiOff className="h-4 w-4 text-red-500" />
               )}
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
              <Badge variant="secondary" className="text-xs">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read">
              Read
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No notifications
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'unread' 
                    ? "You're all caught up! No new notifications."
                    : "You don't have any notifications yet."
                  }
                </p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDismiss={dismissNotification}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
