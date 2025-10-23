
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CentralItinerary, ItineraryDay } from '@/types/itinerary';
import { formatCurrency } from '@/lib/formatters';
import { 
  MapPin, Clock, DollarSign, Plus, Trash2, 
  Hotel, Car, Landmark, Utensils 
} from 'lucide-react';

interface ItineraryTimelineProps {
  itinerary: CentralItinerary;
  onUpdateDay: (dayIndex: number, updates: Partial<ItineraryDay>) => void;
  onAddDay: () => void;
  onRemoveDay: (dayIndex: number) => void;
  context: 'query' | 'proposal' | 'package';
}

const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({
  itinerary,
  onUpdateDay,
  onAddDay,
  onRemoveDay,
  context,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Itinerary Timeline</h3>
        <Button onClick={onAddDay} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Day
        </Button>
      </div>

      <div className="space-y-4">
        {itinerary.days.map((day, index) => (
          <Card key={day.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span>Day {day.day}</span>
                  <Badge variant="outline">{day.date}</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatCurrency(day.totalCost)}
                  </span>
                  {itinerary.days.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveDay(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{typeof day.location === 'string' ? day.location : (day.location?.city || day.location?.name || 'Location')}, {typeof day.location === 'string' ? '' : (day.location?.country || '')}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Accommodation */}
              {day.accommodation && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Hotel className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">{day.accommodation.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {day.accommodation.roomType} • {day.accommodation.nights} night(s)
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {formatCurrency(day.accommodation.price)}
                    </p>
                  </div>
                </div>
              )}

              {/* Transport */}
              {day.transport && day.transport.length > 0 && (
                <div className="space-y-2">
                  {day.transport.map((transport) => (
                    <div key={transport.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <Car className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium capitalize">{transport.type}</h4>
                        <p className="text-sm text-muted-foreground">
                          {typeof transport.from === 'string' ? transport.from : transport.from?.city || transport.from?.name || 'Origin'} → {typeof transport.to === 'string' ? transport.to : transport.to?.city || transport.to?.name || 'Destination'} • {transport.duration}
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {formatCurrency(transport.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Activities */}
              {day.activities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Activities</h4>
                  {day.activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                      <Landmark className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="font-medium">{activity.name}</h5>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{activity.startTime} - {activity.endTime}</span>
                        </div>
                        <p className="text-sm font-medium mt-1">
                          {formatCurrency(activity.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Meals */}
              {day.meals.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Meals</h4>
                  {day.meals.map((meal) => (
                    <div key={meal.id} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                      <Utensils className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="font-medium capitalize">{meal.type} at {meal.restaurant}</h5>
                        <p className="text-sm text-muted-foreground">
                          {meal.cuisine} • {meal.time}
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {formatCurrency(meal.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {day.notes && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <h4 className="font-medium mb-1">Notes</h4>
                    <p className="text-muted-foreground">{day.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ItineraryTimeline;
