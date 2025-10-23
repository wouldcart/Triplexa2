import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProfileActivity } from '@/hooks/useEnhancedProfile';
import { 
  Clock, 
  User, 
  Edit, 
  Save, 
  Eye, 
  Settings,
  Shield,
  Phone,
  Mail,
  MapPin,
  Briefcase
} from 'lucide-react';

interface ProfileActivityProps {
  userId?: string;
  limit?: number;
  showHeader?: boolean;
}

const ProfileActivity: React.FC<ProfileActivityProps> = ({ 
  userId, 
  limit = 10, 
  showHeader = true 
}) => {
  const { activityLog, loading, error } = useProfileActivity(userId, limit);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'profile_updated': return <Edit className="h-4 w-4" />;
      case 'profile_viewed': return <Eye className="h-4 w-4" />;
      case 'settings_changed': return <Settings className="h-4 w-4" />;
      case 'password_changed': return <Shield className="h-4 w-4" />;
      case 'contact_updated': return <Phone className="h-4 w-4" />;
      case 'email_updated': return <Mail className="h-4 w-4" />;
      case 'address_updated': return <MapPin className="h-4 w-4" />;
      case 'work_info_updated': return <Briefcase className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'profile_updated': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'profile_viewed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'settings_changed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'password_changed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'contact_updated': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'email_updated': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'address_updated': return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
      case 'work_info_updated': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatActivityDescription = (activity: any) => {
    const { action, field_name, old_value, new_value } = activity;
    
    switch (action) {
      case 'profile_updated':
        if (field_name && old_value && new_value) {
          return `Updated ${field_name} from "${old_value}" to "${new_value}"`;
        }
        return 'Profile information updated';
      case 'profile_viewed':
        return 'Profile viewed';
      case 'settings_changed':
        return `Settings changed: ${field_name || 'General settings'}`;
      case 'password_changed':
        return 'Password changed for security';
      case 'contact_updated':
        return `Contact information updated: ${field_name || 'Phone/Email'}`;
      case 'email_updated':
        return `Email changed to ${new_value || 'new address'}`;
      case 'address_updated':
        return 'Address information updated';
      case 'work_info_updated':
        return `Work information updated: ${field_name || 'Job details'}`;
      default:
        return activity.description || 'Profile activity';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return activityTime.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Track your profile changes and activity
            </CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Unable to load activity history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>
            Track your profile changes and activity
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <ScrollArea className="h-[300px]">
          {activityLog.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activityLog.map((activity, index) => (
                <div key={activity.id || index} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${getActivityColor(activity.action)}`}>
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {formatActivityDescription(activity)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {formatTimeAgo(activity.created_at)}
                      </Badge>
                    </div>
                    {activity.ip_address && (
                      <p className="text-xs text-muted-foreground mt-1">
                        From {activity.ip_address}
                      </p>
                    )}
                    {activity.user_agent && (
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.user_agent}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export { ProfileActivity };