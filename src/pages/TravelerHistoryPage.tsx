
import React from 'react';
import TravelerLayout from '@/components/traveler/TravelerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, MapPin, Calendar } from 'lucide-react';
import { useTravelerData } from '@/hooks/useTravelerData';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';

const TravelerHistoryPage: React.FC = () => {
  const { tripHistory } = useTravelerData();
  const isMobile = useIsMobile();

  return (
    <TravelerLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Trip History</h1>
        </div>

        {tripHistory.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-center">
                <History className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No Trip History</h3>
                <p className="text-sm sm:text-base text-muted-foreground">You haven't completed any trips yet.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {tripHistory.map((trip) => (
              <Card key={trip.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        <span className="truncate">{trip.destination}</span>
                      </CardTitle>
                      <p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-2">
                        {trip.description}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs sm:text-sm flex-shrink-0">
                      {trip.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{trip.startDate} - {trip.endDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{trip.cities.join(', ')}</span>
                      </div>
                      <span className="text-xs sm:text-sm">{trip.duration} days</span>
                    </div>
                    <div className="border-t pt-2 sm:pt-3">
                      <h4 className="text-xs sm:text-sm font-medium text-foreground mb-1">Travel Agent</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {trip.agentDetails.name} - {trip.agentDetails.company}
                      </p>
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

export default TravelerHistoryPage;
