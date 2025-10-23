
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, DollarSign, Users, Star, Plus } from "lucide-react";
import { SmartSuggestion, useSmartSuggestions } from '@/hooks/useSmartSuggestions';
import { Query } from '@/types/query';
import { formatCurrency } from '@/utils/currencyUtils';

interface ActivityTimelineViewProps {
  query: Query;
  dayNumber: number;
  selectedActivities: SmartSuggestion[];
  onAddActivity: (activity: SmartSuggestion, timeSlot: string) => void;
  onRemoveActivity: (activityId: string) => void;
}

const timeSlots = [
  { id: 'morning', label: 'Morning', time: '9:00 AM - 12:00 PM', color: 'bg-amber-50 border-amber-200' },
  { id: 'afternoon', label: 'Afternoon', time: '1:00 PM - 5:00 PM', color: 'bg-blue-50 border-blue-200' },
  { id: 'evening', label: 'Evening', time: '6:00 PM - 9:00 PM', color: 'bg-purple-50 border-purple-200' }
];

export const ActivityTimelineView: React.FC<ActivityTimelineViewProps> = ({
  query,
  dayNumber,
  selectedActivities,
  onAddActivity,
  onRemoveActivity
}) => {
  const [activeTimeSlot, setActiveTimeSlot] = useState<string | null>(null);
  const { getTimeSlotSuggestions, travelerProfile } = useSmartSuggestions(query, dayNumber);

  const getActivitiesForTimeSlot = (timeSlotId: string) => {
    return selectedActivities.filter(activity => 
      activity.category === timeSlotId || 
      (activity.category === 'full-day' && timeSlotId === 'morning')
    );
  };

  const handleTimeSlotClick = (timeSlotId: string) => {
    setActiveTimeSlot(activeTimeSlot === timeSlotId ? null : timeSlotId);
  };

  const ActivityCard: React.FC<{ activity: SmartSuggestion; isSelected?: boolean }> = ({ 
    activity, 
    isSelected = false 
  }) => (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-sm line-clamp-2">{activity.name}</h4>
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <Star className="h-3 w-3 fill-current" />
            <span>{Math.round(activity.popularity)}</span>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {activity.description}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{activity.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{typeof activity.location === 'string' ? activity.location : (activity.location as any)?.city || (activity.location as any)?.name || 'Location'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
            <DollarSign className="h-3 w-3" />
            <span>{formatCurrency(activity.price, query.destination.country)}</span>
          </div>
          
          {isSelected ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveActivity(activity.id);
              }}
              className="h-6 px-2 text-xs"
            >
              Remove
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddActivity(activity, activity.category);
              }}
              className="h-6 px-2 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Day {dayNumber} Timeline</h3>
          <p className="text-sm text-muted-foreground">
            Plan your perfect day with smart suggestions
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{travelerProfile.paxCount} travelers</span>
        </div>
      </div>

      {/* Timeline View */}
      <div className="space-y-4">
        {timeSlots.map((timeSlot) => {
          const slotActivities = getActivitiesForTimeSlot(timeSlot.id);
          const suggestions = getTimeSlotSuggestions(timeSlot.id as any);
          const isActive = activeTimeSlot === timeSlot.id;

          return (
            <Card key={timeSlot.id} className={`${timeSlot.color} transition-all`}>
              <CardHeader 
                className="pb-3 cursor-pointer"
                onClick={() => handleTimeSlotClick(timeSlot.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{timeSlot.label}</CardTitle>
                    <p className="text-sm text-muted-foreground">{timeSlot.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {slotActivities.length > 0 && (
                      <Badge variant="secondary">{slotActivities.length} selected</Badge>
                    )}
                    <Button variant="ghost" size="sm">
                      {isActive ? 'Hide' : 'Show'} Suggestions
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Selected Activities */}
                {slotActivities.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Selected Activities</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {slotActivities.map((activity) => (
                        <ActivityCard
                          key={activity.id}
                          activity={activity}
                          isSelected={true}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {isActive && suggestions.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Smart Suggestions</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {suggestions
                        .filter(s => !selectedActivities.some(sa => sa.id === s.id))
                        .slice(0, 6)
                        .map((suggestion) => (
                          <ActivityCard
                            key={suggestion.id}
                            activity={suggestion}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {slotActivities.length === 0 && !isActive && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No activities planned for {timeSlot.label.toLowerCase()}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTimeSlotClick(timeSlot.id)}
                      className="mt-2"
                    >
                      Browse Suggestions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
