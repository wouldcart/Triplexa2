import React, { useState } from 'react';
import { useTravelerData } from '@/hooks/useTravelerData';
import { TripActivity } from '@/types/travelerTypes';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, User, Navigation, ArrowLeft, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import TravelerLayout from './TravelerLayout';
import AdditionalRequestDialog from './AdditionalRequestDialog';
import ActivityFeedbackDialog from './ActivityFeedbackDialog';

const TravelerItinerary: React.FC = () => {
  const { currentTrip, currentTripActivities } = useTravelerData();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  if (!currentTrip) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🧳</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Active Trip
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have any active trips to view itinerary for.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Group activities by date
  const activitiesByDate = currentTripActivities.reduce((acc, activity) => {
    const date = activity.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, TripActivity[]>);

  // Sort dates
  const sortedDates = Object.keys(activitiesByDate).sort();

  const getActivityIcon = (type: TripActivity['type']) => {
    switch (type) {
      case 'flight':
        return '✈️';
      case 'hotel':
        return '🏨';
      case 'sightseeing':
        return '🏛️';
      case 'transport':
        return '🚗';
      case 'meal':
        return '🍽️';
      default:
        return '📅';
    }
  };

  const getStatusColor = (status: TripActivity['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
  };

  const getStatusIcon = (status: TripActivity['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDayNumber = (dateString: string) => {
    const tripStart = new Date(currentTrip.startDate);
    const currentDate = new Date(dateString);
    const diffTime = currentDate.getTime() - tripStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Itinerary
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {currentTrip.destination} • {currentTrip.duration} days
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Trip Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{currentTrip.destination}</span>
              <Badge variant="outline">
                {currentTrip.cities.join(' → ')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Calendar className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-sm font-medium">Start Date</p>
                <p className="text-xs text-gray-500">{new Date(currentTrip.startDate).toLocaleDateString()}</p>
              </div>
              <div className="text-center">
                <Calendar className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-sm font-medium">End Date</p>
                <p className="text-xs text-gray-500">{new Date(currentTrip.endDate).toLocaleDateString()}</p>
              </div>
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <p className="text-sm font-medium">Duration</p>
                <p className="text-xs text-gray-500">{currentTrip.duration} days</p>
              </div>
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                <p className="text-sm font-medium">Destinations</p>
                <p className="text-xs text-gray-500">{currentTrip.cities.length} cities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Itinerary */}
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const activities = activitiesByDate[date].sort((a, b) => a.time.localeCompare(b.time));
            const dayNumber = getDayNumber(date);
            
            return (
              <Card key={date}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <span className="text-lg">Day {dayNumber}</span>
                      <p className="text-sm font-normal text-gray-600 dark:text-gray-400">
                        {formatDate(date)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {activities.length} activities
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities.map((activity, index) => (
                      <div 
                        key={activity.id}
                        className="flex items-start space-x-4 p-4 border border-gray-100 dark:border-gray-700 rounded-lg"
                      >
                        {/* Timeline */}
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-lg">
                            {getActivityIcon(activity.type)}
                          </div>
                          {index < activities.length - 1 && (
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mt-2" />
                          )}
                        </div>

                        {/* Activity Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {activity.title}
                            </h4>
                            <div className={cn(
                              "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                              getStatusColor(activity.status)
                            )}>
                              {getStatusIcon(activity.status)}
                              <span className="capitalize">{activity.status}</span>
                            </div>
                          </div>

                          {activity.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {activity.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{activity.time}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{activity.location}</span>
                            </div>

                            {activity.isStaffAssigned && (
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>Staff Assigned</span>
                              </div>
                            )}

                            {activity.coordinates && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  const url = `https://maps.google.com/?q=${activity.coordinates!.lat},${activity.coordinates!.lng}`;
                                  window.open(url, '_blank');
                                }}
                              >
                                <Navigation className="h-3 w-3 mr-1" />
                                Navigate
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TravelerItinerary;