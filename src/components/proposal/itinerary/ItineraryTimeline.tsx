
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CentralItinerary, ItineraryDay } from '@/types/itinerary';
import { Query } from '@/types/query';
import { formatCurrency } from '@/lib/formatters';
import { 
  MapPin, Clock, DollarSign, Plus, Trash2, Edit2, Save, X,
  Hotel, Car, Landmark, Utensils 
} from 'lucide-react';

interface ItineraryTimelineProps {
  itinerary: CentralItinerary;
  onUpdate: (itinerary: CentralItinerary) => void;
  query: Query;
}

const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({
  itinerary,
  onUpdate,
  query
}) => {
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState('');

  const handleAddDay = () => {
    const newDayNumber = itinerary.days.length + 1;
    const lastDay = itinerary.days[itinerary.days.length - 1];
    const newDate = new Date(lastDay?.date || itinerary.startDate);
    newDate.setDate(newDate.getDate() + 1);
    
    const newDay: ItineraryDay = {
      id: `day-${Date.now()}`,
      day: newDayNumber,
      date: newDate.toISOString().split('T')[0],
      location: lastDay?.location || itinerary.destinations[0],
      activities: [],
      meals: [],
      totalCost: 0,
    };
    
    const updatedItinerary = {
      ...itinerary,
      days: [...itinerary.days, newDay],
      duration: {
        ...itinerary.duration,
        days: itinerary.duration.days + 1,
      },
      updatedAt: new Date().toISOString()
    };
    
    onUpdate(updatedItinerary);
  };

  const handleRemoveDay = (dayIndex: number) => {
    if (itinerary.days.length <= 1) return;
    
    const updatedDays = itinerary.days.filter((_, index) => index !== dayIndex);
    const renumberedDays = updatedDays.map((day, index) => ({
      ...day,
      day: index + 1,
    }));
    
    const updatedItinerary = {
      ...itinerary,
      days: renumberedDays,
      duration: {
        ...itinerary.duration,
        days: itinerary.duration.days - 1,
        nights: Math.max(0, itinerary.duration.nights - 1),
      },
      updatedAt: new Date().toISOString()
    };
    
    onUpdate(updatedItinerary);
  };

  const handleEditNotes = (dayId: string, currentNotes: string = '') => {
    setEditingDay(dayId);
    setEditingNotes(currentNotes);
  };

  const handleSaveNotes = (dayId: string) => {
    const updatedDays = itinerary.days.map(day => 
      day.id === dayId ? { ...day, notes: editingNotes } : day
    );
    
    const updatedItinerary = {
      ...itinerary,
      days: updatedDays,
      updatedAt: new Date().toISOString()
    };
    
    onUpdate(updatedItinerary);
    setEditingDay(null);
    setEditingNotes('');
  };

  const handleCancelEdit = () => {
    setEditingDay(null);
    setEditingNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Day-by-Day Timeline</h3>
        <Button onClick={handleAddDay} size="sm">
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
                    ${day.totalCost.toFixed(2)}
                  </span>
                  {itinerary.days.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDay(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{day.location.city}, {day.location.country}</span>
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
                      ${day.accommodation.price.toFixed(2)}
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
                          ${transport.price.toFixed(2)}
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
                          ${activity.price.toFixed(2)}
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
                          ${meal.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes Section */}
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Notes</h4>
                  {editingDay !== day.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNotes(day.id, day.notes)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {editingDay === day.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      placeholder="Add notes for this day..."
                      className="min-h-[60px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveNotes(day.id)}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {day.notes || 'No notes added yet. Click the edit button to add notes.'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export { ItineraryTimeline };
