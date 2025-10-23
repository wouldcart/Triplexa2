
import React from 'react';
import TravelerLayout from '@/components/traveler/TravelerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, User, Plus, CheckCircle2, Clock3, AlertCircle, Car, Phone, Info } from 'lucide-react';
import { useTravelerData } from '@/hooks/useTravelerData';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AdditionalRequestDialog from '@/components/traveler/AdditionalRequestDialog';

const TravelerItineraryPage: React.FC = () => {
  const { currentTrip, currentTripActivities, tripProgress } = useTravelerData();
  const isMobile = useIsMobile();

  // Get activity type images
  const getActivityImage = (type: string) => {
    const imageMap: Record<string, string> = {
      flight: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=200&fit=crop',
      hotel: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=200&fit=crop',
      sightseeing: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=400&h=200&fit=crop',
      default: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400&h=200&fit=crop'
    };
    return imageMap[type] || imageMap.default;
  };

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />;
      case 'confirmed':
        return <Clock3 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />;
      case 'pending':
        return <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />;
      default:
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />;
    }
  };

  // Get driver/transport details
  const getTransportDetails = (activityId: string) => {
    const transportDetails: Record<string, any> = {
      'activity-001': {
        driver: 'Raj Kumar',
        phone: '+91-9876543210',
        vehicle: 'Toyota Innova - DL 01 AB 1234',
        company: 'Delhi Airport Transfers'
      },
      'activity-006': {
        driver: 'Suresh Sharma',
        phone: '+91-9876543211', 
        vehicle: 'Honda City - DL 02 CD 5678',
        company: 'Delhi Airport Transfers'
      }
    };
    return transportDetails[activityId];
  };

  // Group activities by date
  const groupedActivities = currentTripActivities.reduce((groups, activity) => {
    const date = activity.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, typeof currentTripActivities>);

  // Sort dates
  const sortedDates = Object.keys(groupedActivities).sort();

  if (!currentTrip) {
    return (
      <TravelerLayout>
        <div className="p-3 sm:p-4 lg:p-6">
          <Card>
            <CardContent className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-center">
                <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No Active Trip</h3>
                <p className="text-sm sm:text-base text-muted-foreground">You don't have any active trips at the moment.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TravelerLayout>
    );
  }

  return (
    <TravelerLayout>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Trip Header with Progress */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                  <span className="truncate">{currentTrip.destination}</span>
                </CardTitle>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  {currentTrip.startDate} - {currentTrip.endDate} • {currentTrip.duration} days
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="text-xs sm:text-sm text-muted-foreground">Trip Progress:</div>
                  <div className="text-xs sm:text-sm font-medium text-primary">{tripProgress}%</div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <AdditionalRequestDialog 
                  tripId={currentTrip.id}
                  trigger={
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      {isMobile ? 'Request' : 'Add Request'}
                    </Button>
                  }
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Activities by Date */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Your Itinerary</h2>
            <Badge variant="secondary" className="text-xs sm:text-sm">
              {currentTripActivities.length} Activities
            </Badge>
          </div>
          
          {sortedDates.map((date) => (
            <div key={date} className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground truncate">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: isMobile ? 'short' : 'long', 
                    year: 'numeric', 
                    month: isMobile ? 'short' : 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <Badge variant="outline" className="text-xs ml-auto">
                  {groupedActivities[date].length}
                </Badge>
              </div>
              
              <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                {groupedActivities[date].map((activity) => (
                  <Card key={activity.id} className="group hover:shadow-md transition-shadow duration-200">
                    <div className="relative">
                      <img 
                        src={getActivityImage(activity.type)} 
                        alt={activity.title}
                        className="w-full h-24 sm:h-32 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-2 right-2 flex gap-1 sm:gap-2">
                        {getStatusIcon(activity.status)}
                        <Badge 
                          variant={activity.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-3 sm:p-4">
                      <div className="space-y-2 sm:space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {activity.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">
                            {activity.description}
                          </p>
                        </div>
                        
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span>{activity.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{activity.location}</span>
                          </div>
                          {activity.isStaffAssigned && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 flex-shrink-0" />
                              <span>Staff Assigned</span>
                            </div>
                          )}
                        </div>

                        {/* Confirmation Section */}
                        {activity.status === 'completed' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 space-y-1">
                                <p className="text-xs font-medium text-green-800">Activity Completed</p>
                                <p className="text-xs text-green-700">
                                  Successfully completed on {activity.date} at {activity.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Transport Details Section */}
                        {activity.type === 'flight' && getTransportDetails(activity.id) && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                            <div className="flex items-start gap-2">
                              <Car className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 space-y-2">
                                <p className="text-xs font-medium text-blue-800 flex items-center gap-1">
                                  <Info className="h-3 w-3" />
                                  Transport Details
                                </p>
                                {(() => {
                                  const transport = getTransportDetails(activity.id);
                                  return (
                                    <div className="space-y-1 text-xs text-blue-700">
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        <span className="font-medium">Driver:</span> {transport.driver}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        <span className="font-medium">Phone:</span> {transport.phone}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Car className="h-3 w-3" />
                                        <span className="font-medium">Vehicle:</span> {transport.vehicle}
                                      </div>
                                      <div className="text-xs text-blue-600 font-medium mt-1">
                                        {transport.company}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Confirmation Required Section */}
                        {activity.status === 'pending' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 space-y-1">
                                <p className="text-xs font-medium text-yellow-800">Confirmation Required</p>
                                <p className="text-xs text-yellow-700">
                                  Please confirm your attendance for this activity
                                </p>
                                <Button size="sm" className="mt-2 h-6 text-xs">
                                  Confirm Attendance
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <Badge variant="outline" className="text-xs capitalize">
                            {activity.type}
                          </Badge>
                          <AdditionalRequestDialog 
                            tripId={currentTrip.id}
                            activityId={activity.id}
                            trigger={
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                <Plus className="h-3 w-3 mr-1" />
                                {isMobile ? 'Req' : 'Request'}
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </TravelerLayout>
  );
};

export default TravelerItineraryPage;
