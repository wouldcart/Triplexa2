import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ItineraryDay } from '@/types/package';
import TransportSelector from './TransportSelector';

interface ItineraryDayEditorProps {
  day: ItineraryDay;
  onUpdate: (updatedDay: ItineraryDay) => void;
  onDelete?: () => void;
  cities: string[];
  previousCity?: string;
}

const ItineraryDayEditor: React.FC<ItineraryDayEditorProps> = ({ 
  day, 
  onUpdate, 
  onDelete,
  cities,
  previousCity
}) => {
  const [activities, setActivities] = useState(day.activities || []);
  const [showTransport, setShowTransport] = useState(!!day.transportation);
  
  const activityTypes = [
    { value: 'hotel', label: 'Hotel Check-in/out' },
    { value: 'sightseeing', label: 'Sightseeing' },
    { value: 'transport', label: 'Transportation' },
    { value: 'free', label: 'Free Time' },
    { value: 'gala', label: 'Gala Dinner/Event' },
    { value: 'additional', label: 'Additional Activity' }
  ];
  
  const handleInputChange = (field: keyof ItineraryDay, value: any) => {
    onUpdate({
      ...day,
      [field]: value
    });
  };
  
  const handleMealsChange = (meal: 'breakfast' | 'lunch' | 'dinner', checked: boolean) => {
    onUpdate({
      ...day,
      meals: {
        ...day.meals,
        [meal]: checked
      }
    });
  };
  
  const handleAccommodationChange = (field: string, value: any) => {
    onUpdate({
      ...day,
      accommodation: {
        ...day.accommodation,
        [field]: value
      }
    });
  };
  
  // Handle transportation changes
  const handleTransportationChange = (field: string, value: any) => {
    onUpdate({
      ...day,
      transportation: {
        ...day.transportation,
        [field]: value
      }
    });
  };
  
  // Handle transport route selection
  const handleTransportRouteSelect = (route: any, price?: number, vehicleType?: string) => {
    if (route) {
      onUpdate({
        ...day,
        transportation: {
          type: 'Transport',
          from: previousCity || day.city,
          to: day.city,
          description: `${route.startLocationFullName || route.startLocation} to ${route.endLocationFullName || route.endLocation}`,
          routeId: route.id,
          price: price,
          vehicleType: vehicleType
        }
      });
    } else {
      // If no route selected, keep basic transportation data
      onUpdate({
        ...day,
        transportation: {
          type: day.transportation?.type || 'Transport',
          from: previousCity || day.city,
          to: day.city
        }
      });
    }
  };
  
  // Add activity
  const addActivity = () => {
    const newActivity = {
      id: uuidv4(),
      type: 'additional',
      title: '',
      description: ''
    };
    
    const updatedActivities = [...activities, newActivity];
    setActivities(updatedActivities);
    
    onUpdate({
      ...day,
      activities: updatedActivities
    });
  };
  
  // Update activity
  const updateActivity = (id: string, field: string, value: any) => {
    const updatedActivities = activities.map(activity => {
      if (activity.id === id) {
        return { ...activity, [field]: value };
      }
      return activity;
    });
    
    setActivities(updatedActivities);
    onUpdate({
      ...day,
      activities: updatedActivities
    });
  };
  
  // Remove activity
  const removeActivity = (id: string) => {
    const updatedActivities = activities.filter(activity => activity.id !== id);
    setActivities(updatedActivities);
    
    onUpdate({
      ...day,
      activities: updatedActivities
    });
  };
  
  return (
    <Card className="mb-4">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Day {day.day}</h3>
          {onDelete && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onDelete}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`day-title-${day.id}`}>Day Title</Label>
            <Input
              id={`day-title-${day.id}`}
              value={day.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Day title (e.g., Arrival Day)"
            />
          </div>
          
          <div>
            <Label htmlFor={`day-city-${day.id}`}>City</Label>
            <Select
              value={day.city}
              onValueChange={(value) => handleInputChange('city', value)}
            >
              <SelectTrigger id={`day-city-${day.id}`}>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor={`day-description-${day.id}`}>Description</Label>
          <Textarea
            id={`day-description-${day.id}`}
            value={day.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe this day's activities"
            className="h-20"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Meals Included</Label>
          <div className="flex space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id={`breakfast-${day.id}`}
                checked={day.meals.breakfast}
                onCheckedChange={(checked) => handleMealsChange('breakfast', checked)}
              />
              <Label htmlFor={`breakfast-${day.id}`}>Breakfast</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id={`lunch-${day.id}`}
                checked={day.meals.lunch}
                onCheckedChange={(checked) => handleMealsChange('lunch', checked)}
              />
              <Label htmlFor={`lunch-${day.id}`}>Lunch</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id={`dinner-${day.id}`}
                checked={day.meals.dinner}
                onCheckedChange={(checked) => handleMealsChange('dinner', checked)}
              />
              <Label htmlFor={`dinner-${day.id}`}>Dinner</Label>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Accommodation</Label>
          </div>
          
          <Input
            value={day.accommodation?.customHotelName || day.accommodation?.hotelName || ''}
            onChange={(e) => handleAccommodationChange('customHotelName', e.target.value)}
            placeholder="Hotel name or 'No accommodation'"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Transportation</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id={`show-transport-${day.id}`}
                checked={showTransport}
                onCheckedChange={(checked) => {
                  setShowTransport(checked);
                  if (!checked) {
                    onUpdate({
                      ...day,
                      transportation: undefined
                    });
                  } else {
                    onUpdate({
                      ...day,
                      transportation: {
                        type: 'Transport',
                        from: previousCity || '',
                        to: day.city
                      }
                    });
                  }
                }}
              />
              <Label htmlFor={`show-transport-${day.id}`}>Add Transportation</Label>
            </div>
          </div>
          
          {showTransport && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>From</Label>
                  <Input
                    value={day.transportation?.from || previousCity || ''}
                    onChange={(e) => handleTransportationChange('from', e.target.value)}
                    placeholder="Departure city"
                  />
                </div>
                
                <div>
                  <Label>To</Label>
                  <Input
                    value={day.transportation?.to || day.city}
                    onChange={(e) => handleTransportationChange('to', e.target.value)}
                    placeholder="Arrival city"
                  />
                </div>
              </div>
              
              <TransportSelector
                fromCity={day.transportation?.from || previousCity || ''}
                toCity={day.transportation?.to || day.city}
                onSelectRoute={handleTransportRouteSelect}
                selectedRouteId={day.transportation?.routeId}
              />
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={day.transportation?.description || ''}
                  onChange={(e) => handleTransportationChange('description', e.target.value)}
                  placeholder="Transportation details"
                  className="h-20"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label>Activities</Label>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Activity {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeActivity(activity.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={activity.type}
                      onValueChange={(value) => updateActivity(activity.id, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                      <SelectContent>
                        {activityTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={activity.title}
                      onChange={(e) => updateActivity(activity.id, 'title', e.target.value)}
                      placeholder="Activity title"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={activity.description || ''}
                    onChange={(e) => updateActivity(activity.id, 'description', e.target.value)}
                    placeholder="Activity description"
                  />
                </div>

                <div>
                  <Label>Duration</Label>
                  <Input
                    value={activity.duration || ''}
                    onChange={(e) => updateActivity(activity.id, 'duration', e.target.value)}
                    placeholder="Duration (e.g. 2 hours)"
                  />
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addActivity}
              className="w-full flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Activity
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItineraryDayEditor;
