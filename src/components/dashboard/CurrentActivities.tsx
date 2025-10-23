
import React from 'react';
import { Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrentActivity } from '@/data/mockData';
import { useIsMobile } from '@/hooks/use-mobile';

interface CurrentActivitiesProps {
  activities: CurrentActivity;
}

const CurrentActivities: React.FC<CurrentActivitiesProps> = ({ activities }) => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-brand-blue" />
          Current Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Staff */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Staff</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activities.activeStaff}</p>
            </div>
            <div className="bg-brand-blue/10 p-3 rounded-full">
              <Users className="h-6 w-6 text-brand-blue" />
            </div>
          </div>

          {/* Processing Bookings */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Processing Bookings</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activities.processingBookings}</p>
            </div>
            <div className="bg-purple-400/10 p-3 rounded-full">
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
          </div>

          {/* Active Inquiries */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Inquiries</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activities.activeInquiries}</p>
            </div>
            <div className="bg-orange-400/10 p-3 rounded-full">
              <Clock className="h-6 w-6 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Staff Activity Status */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Staff Activity</h3>
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            {activities.recentActivity.map((activity, index) => (
              <div 
                key={index}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${
                    activity.status === 'online' ? 'bg-green-500' : 
                    activity.status === 'busy' ? 'bg-orange-500' : 'bg-gray-400'
                  }`} />
                  <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{activity.name}</span>
                </div>
                <span className="text-xs text-gray-500">{activity.action}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentActivities;
