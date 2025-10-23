
import React from 'react';
import TravelerLayout from '@/components/traveler/TravelerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertCircle, MessageCircle, Calendar, Check } from 'lucide-react';
import { useTravelerData } from '@/hooks/useTravelerData';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const TravelerNotificationsPage: React.FC = () => {
  const { notifications } = useTravelerData();
  const isMobile = useIsMobile();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'activity':
        return <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'trip-update':
        return <Bell className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'message':
        return <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'confirmation':
        return <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
      default:
        return <Bell className="h-3 w-3 sm:h-4 sm:w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <TravelerLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Notifications</h1>
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-center">
                <Bell className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No Notifications</h3>
                <p className="text-sm sm:text-base text-muted-foreground">You're all caught up!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className={`${!notification.isRead ? 'border-primary/50 bg-primary/5' : ''}`}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className={`mt-1 flex-shrink-0 ${notification.type === 'confirmation' ? 'text-orange-500' : 'text-primary'}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                          <h3 className="font-medium text-sm sm:text-base text-foreground truncate">
                            {notification.title}
                          </h3>
                          <div className="flex gap-1 flex-wrap">
                            {!notification.isRead && (
                              <Badge variant="secondary" className="text-xs">New</Badge>
                            )}
                            {notification.actionRequired && (
                              <Badge variant="destructive" className="text-xs">Action Required</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 flex-shrink-0">
                      {notification.actionRequired && !notification.isRead && (
                        <Button size="sm" variant="outline" className="text-xs">
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {isMobile ? 'OK' : 'Confirm'}
                        </Button>
                      )}
                      {!notification.isRead && (
                        <Button size="sm" variant="ghost" className="text-xs">
                          {isMobile ? 'Read' : 'Mark Read'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TravelerLayout>
  );
};

export default TravelerNotificationsPage;
