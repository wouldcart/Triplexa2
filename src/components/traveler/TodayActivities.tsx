
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TodayActivity } from '@/types/travelerTypes';
import { Clock, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TodayActivitiesProps {
  activities: TodayActivity[];
}

const TodayActivities: React.FC<TodayActivitiesProps> = ({ activities }) => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Today's Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">No activities scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  {activity.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm sm:text-base text-foreground truncate">
                      {activity.title}
                    </h4>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {activity.time}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{activity.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayActivities;
