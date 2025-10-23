
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Bell, 
  X, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  UserPlus,
  FileText
} from 'lucide-react';
import { useStaffNotifications } from '@/contexts/StaffNotificationContext';
import { StaffNotification } from '@/types/query';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const StaffNotificationBanner: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    dismissNotification, 
    markAllAsRead 
  } = useStaffNotifications();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);

  // Get only unread notifications for the banner
  const unreadNotifications = notifications.filter(n => !n.read);

  // Auto-cycle through notifications every 5 seconds
  useEffect(() => {
    if (unreadNotifications.length > 1) {
      const interval = setInterval(() => {
        setCurrentNotificationIndex(prev => 
          prev === unreadNotifications.length - 1 ? 0 : prev + 1
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [unreadNotifications.length]);

  // Reset index when notifications change
  useEffect(() => {
    if (currentNotificationIndex >= unreadNotifications.length) {
      setCurrentNotificationIndex(0);
    }
  }, [unreadNotifications.length, currentNotificationIndex]);

  if (unreadCount === 0) {
    return null;
  }

  const currentNotification = unreadNotifications[currentNotificationIndex];

  const getNotificationIcon = (type: StaffNotification['type']) => {
    switch (type) {
      case 'assignment':
        return UserPlus;
      case 'status_change':
        return CheckCircle;
      case 'follow_up_due':
        return Clock;
      case 'proposal_request':
        return FileText;
      case 'urgent_query':
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  const getPriorityColor = (priority: StaffNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white border-red-600';
      case 'high':
        return 'bg-orange-500 text-white border-orange-600';
      case 'normal':
        return 'bg-blue-500 text-white border-blue-600';
      case 'low':
        return 'bg-gray-500 text-white border-gray-600';
      default:
        return 'bg-blue-500 text-white border-blue-600';
    }
  };

  const handleNotificationClick = (notification: StaffNotification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleDismiss = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    dismissNotification(notificationId);
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsRead();
  };

  if (!currentNotification) {
    return null;
  }

  const NotificationIcon = getNotificationIcon(currentNotification.type);

  return (
    <div className="relative mb-4">
      <Card 
        className={cn(
          "border-l-4 cursor-pointer transition-all duration-300 hover:shadow-md",
          getPriorityColor(currentNotification.priority),
          "border-l-current"
        )}
        onClick={() => handleNotificationClick(currentNotification)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex-shrink-0">
                <NotificationIcon className="h-5 w-5 text-current" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-sm text-current">
                    {currentNotification.title}
                  </h4>
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-white/20 text-current border-white/30"
                  >
                    {currentNotification.priority.toUpperCase()}
                  </Badge>
                  {currentNotification.actionRequired && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-white/20 text-current border-white/30"
                    >
                      ACTION REQUIRED
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-current/90 truncate">
                  {currentNotification.message}
                </p>
                <p className="text-xs text-current/70 mt-1">
                  {new Date(currentNotification.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {unreadCount > 1 && (
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-white/20 text-current border-white/30"
                  >
                    {currentNotificationIndex + 1} of {unreadCount}
                  </Badge>
                  <div className="flex space-x-1">
                    {unreadNotifications.map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-300",
                          index === currentNotificationIndex 
                            ? "bg-white" 
                            : "bg-white/40"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-current hover:bg-white/20 h-8 px-2"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDismiss(e, currentNotification.id)}
                className="text-current hover:bg-white/20 h-8 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {unreadCount > 1 && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="flex items-center justify-between text-xs text-current/80">
                <span>
                  {unreadCount} unread notifications
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="text-current hover:bg-white/20 h-6 px-2 text-xs"
                >
                  {isExpanded ? 'Show Less' : 'View All'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expanded notifications list */}
      {isExpanded && unreadCount > 1 && (
        <Card className="mt-2 border shadow-lg">
          <CardContent className="p-2">
            <div className="max-h-60 overflow-y-auto">
              {unreadNotifications.slice(1).map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDismiss(e, notification.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StaffNotificationBanner;
