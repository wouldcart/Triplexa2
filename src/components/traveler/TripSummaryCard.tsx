
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TravelerTrip } from '@/types/travelerTypes';
import { MapPin, Calendar, Users, CheckCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TripSummaryCardProps {
  trip: TravelerTrip;
  progress: number;
  completedActivities: number;
  totalActivities: number;
}

const TripSummaryCard: React.FC<TripSummaryCardProps> = ({
  trip,
  progress,
  completedActivities,
  totalActivities
}) => {
  const isMobile = useIsMobile();

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <span className="truncate">{trip.destination}</span>
            </CardTitle>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {trip.description}
            </p>
          </div>
          <Badge variant="outline" className="flex-shrink-0 text-xs sm:text-sm">
            {trip.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{trip.startDate} - {trip.endDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{trip.duration} days</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                Progress
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedActivities} completed</span>
              <span>{totalActivities} total activities</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TripSummaryCard;
