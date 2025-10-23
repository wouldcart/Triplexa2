
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  X, 
  Clock, 
  UserPlus, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  ArrowRight
} from 'lucide-react';
import { StaffNotification } from '@/types/query';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: StaffNotification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  compact?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDismiss,
  compact = false
}) => {
  const navigate = useNavigate();

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
        return CheckCircle;
    }
  };

  const getPriorityColor = (priority: StaffNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/20';
      case 'high':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20';
      case 'normal':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'low':
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950/20';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
    }
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(notification.id);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };

  const Icon = getNotificationIcon(notification.type);
  const timeAgo = new Date(notification.timestamp).toLocaleString();

  return (
    <Card 
      className={cn(
        'border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md',
        getPriorityColor(notification.priority),
        !notification.read && 'ring-2 ring-primary/20',
        compact && 'p-2'
      )}
      onClick={handleClick}
    >
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 mt-1">
              <Icon className={cn(
                'h-5 w-5',
                notification.priority === 'urgent' && 'text-red-500',
                notification.priority === 'high' && 'text-orange-500',
                notification.priority === 'normal' && 'text-blue-500',
                notification.priority === 'low' && 'text-gray-500'
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn(
                  'font-semibold text-sm',
                  !notification.read && 'font-bold'
                )}>
                  {notification.title}
                </h4>
                {!notification.read && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                )}
              </div>
              
              <p className={cn(
                'text-sm text-muted-foreground mb-2',
                compact && 'truncate'
              )}>
                {notification.message}
              </p>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {notification.priority.toUpperCase()}
                </Badge>
                
                {notification.actionRequired && (
                  <Badge variant="outline" className="text-xs">
                    ACTION REQUIRED
                  </Badge>
                )}
                
                <span className="text-xs text-muted-foreground">
                  {timeAgo}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsRead}
                className="h-8 w-8 p-0"
                title="Mark as read"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            
            {notification.actionUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="View details"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationItem;
