import React, { useState } from 'react';
import { useTravelerData } from '@/hooks/useTravelerData';
import { TravelerNotification } from '@/types/travelerTypes';
import { Bell, CheckCircle2, AlertTriangle, MessageCircle, Calendar, MoreVertical, Trash2, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TravelerNotifications: React.FC = () => {
  const { notifications, unreadNotificationsCount, actionRequiredNotifications } = useTravelerData();
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  const getNotificationIcon = (type: TravelerNotification['type']) => {
    switch (type) {
      case 'activity':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'trip-update':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'message':
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case 'confirmation':
        return <CheckCircle2 className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationBorderColor = (type: TravelerNotification['type']) => {
    switch (type) {
      case 'activity':
        return 'border-l-blue-500';
      case 'trip-update':
        return 'border-l-orange-500';
      case 'message':
        return 'border-l-green-500';
      case 'confirmation':
        return 'border-l-purple-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes > 0 ? `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago` : 'Just now';
    }
  };

  const markAsRead = (notificationId: string) => {
    console.log('Marking notification as read:', notificationId);
  };

  const deleteNotification = (notificationId: string) => {
    console.log('Deleting notification:', notificationId);
  };

  const archiveNotification = (notificationId: string) => {
    console.log('Archiving notification:', notificationId);
  };

  const markAllAsRead = () => {
    console.log('Marking all notifications as read');
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  const NotificationItem = ({ notification }: { notification: TravelerNotification }) => (
    <Card 
      className={cn(
        "border-l-4 transition-all hover:shadow-md",
        getNotificationBorderColor(notification.type),
        !notification.isRead ? "bg-blue-50 dark:bg-blue-950/10" : ""
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className={cn(
                  "text-sm font-medium",
                  !notification.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                )}>
                  {notification.title}
                  {!notification.isRead && (
                    <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block" />
                  )}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {notification.message}
                </p>
                
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(notification.timestamp)}
                  </span>
                  
                  {notification.actionRequired && (
                    <Badge variant="destructive" className="text-xs">
                      Action Required
                    </Badge>
                  )}
                  
                  <Badge variant="outline" className="text-xs capitalize">
                    {notification.type.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!notification.isRead && (
                    <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark as read
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => archiveNotification(notification.id)}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => deleteNotification(notification.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {notification.actionRequired && (
              <div className="mt-3 flex space-x-2">
                <Button size="sm" variant="default">
                  Take Action
                </Button>
                <Button size="sm" variant="outline">
                  Later
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Notifications
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Stay updated with your travel information
              </p>
            </div>
            
            {unreadNotificationsCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                Mark all as read
              </Button>
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {unreadNotificationsCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Unread</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {actionRequiredNotifications.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Action Required</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {notifications.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Notifications
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                You're all caught up! New notifications will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread ({unreadNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="action">
                Action Required ({actionRequiredNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="read">
                Read ({readNotifications.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4 mt-6">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </TabsContent>
            
            <TabsContent value="unread" className="space-y-4 mt-6">
              {unreadNotifications.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      All caught up!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      You have no unread notifications.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                unreadNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="action" className="space-y-4 mt-6">
              {actionRequiredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Action Required
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      You have no pending actions.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                actionRequiredNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="read" className="space-y-4 mt-6">
              {readNotifications.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Read Notifications
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Read notifications will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                readNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default TravelerNotifications;