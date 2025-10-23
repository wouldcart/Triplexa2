import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, X, MapPin, Clock, DollarSign, Car, Hotel, Camera, Utensils, Save, Layout } from 'lucide-react';
import { Query } from '@/types/query';
import { useTransportRoutes } from '@/hooks/useTransportRoutes';
import { useHotelInventory } from '@/hooks/useHotelInventory';
import { useSightseeingInventory } from '@/hooks/useSightseeingInventory';
import { formatCurrency } from '@/utils/currencyUtils';
import { TemplateSelector } from './TemplateSelector';
import { SaveAsTemplateDialog } from './SaveAsTemplateDialog';
import ProposalTemplateService, { EnhancedProposalTemplate } from '@/services/proposalTemplateService';

export interface ProposalDay {
  id: string;
  dayNumber: number;
  date: string;
  city: string;
  title: string;
  description: string;
  activities: {
    id: string;
    name: string;
    price: number;
    duration: string;
  }[];
  accommodation?: {
    id: string;
    name: string;
    type: string;
    price: number;
    hotel?: string;
    roomType?: string;
  };
  transport?: {
    id: string;
    name: string;
    from: string;
    to: string;
    price: number;
    type?: string;
  };
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  totalCost: number;
}

interface DayPlanningInterfaceProps {
  query: Query;
  days: ProposalDay[];
  onAddDay: () => void;
  onUpdateDay: (dayId: string, updates: Partial<ProposalDay>) => void;
  onRemoveDay: (dayId: string) => void;
}

export const DayPlanningInterface: React.FC<DayPlanningInterfaceProps> = ({
  query,
  days,
  onAddDay,
  onUpdateDay,
  onRemoveDay
}) => {
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<Record<string, any>>({});
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  const { routes: transportRoutes = [], loading: transportLoading = false } = useTransportRoutes({
    country: query.destination?.country || '',
    cities: query.destination?.cities || []
  }) || {};

  const { hotels, loading: hotelsLoading } = useHotelInventory({
    country: query.destination?.country || '',
    cities: query.destination?.cities || []
  });

  const { sightseeing, loading: sightseeingLoading } = useSightseeingInventory({
    country: query.destination?.country || '',
    cities: query.destination?.cities || []
  });

  const addActivity = (dayId: string) => {
    const day = days.find(d => d.id === dayId);
    if (!day) return;

    const newActivity = {
      id: `activity_${Date.now()}`,
      name: '',
      price: 0,
      duration: '2 hours'
    };

    const updatedActivities = [...day.activities, newActivity];
    const updatedTotalCost = calculateDayTotal({
      ...day,
      activities: updatedActivities
    });

    onUpdateDay(dayId, {
      activities: updatedActivities,
      totalCost: updatedTotalCost
    });
  };

  const updateActivity = (dayId: string, activityId: string, updates: any) => {
    const day = days.find(d => d.id === dayId);
    if (!day) return;

    const updatedActivities = day.activities.map(activity =>
      activity.id === activityId ? { ...activity, ...updates } : activity
    );

    const updatedTotalCost = calculateDayTotal({
      ...day,
      activities: updatedActivities
    });

    onUpdateDay(dayId, {
      activities: updatedActivities,
      totalCost: updatedTotalCost
    });
  };

  const removeActivity = (dayId: string, activityId: string) => {
    const day = days.find(d => d.id === dayId);
    if (!day) return;

    const updatedActivities = day.activities.filter(activity => activity.id !== activityId);
    const updatedTotalCost = calculateDayTotal({
      ...day,
      activities: updatedActivities
    });

    onUpdateDay(dayId, {
      activities: updatedActivities,
      totalCost: updatedTotalCost
    });
  };

  const calculateDayTotal = (day: ProposalDay): number => {
    const activitiesTotal = day.activities.reduce((sum, activity) => sum + activity.price, 0);
    const accommodationTotal = day.accommodation?.price || 0;
    const transportTotal = day.transport?.price || 0;
    return activitiesTotal + accommodationTotal + transportTotal;
  };

  const addTransportToDay = (dayId: string, transportId: string) => {
    const transport = transportRoutes.find(r => r.id === transportId);
    const day = days.find(d => d.id === dayId);
    if (!transport || !day) return;

    const transportData = {
      id: transport.id,
      name: transport.name,
      from: transport.from || 'Unknown',
      to: transport.to || 'Unknown',
      price: transport.price,
      type: transport.transportType
    };

    const updatedTotalCost = calculateDayTotal({
      ...day,
      transport: transportData
    });

    onUpdateDay(dayId, {
      transport: transportData,
      totalCost: updatedTotalCost
    });
  };

  const addHotelToDay = (dayId: string, hotelId: string, roomType: string = 'standard') => {
    const hotel = hotels.find(h => h.id === hotelId);
    const day = days.find(d => d.id === dayId);
    if (!hotel || !day) return;

    // Use roomTypes array to find room pricing
    const roomTypes = hotel.roomTypes || [];
    const selectedRoomType = roomTypes.find(r => r.name?.toLowerCase() === roomType.toLowerCase());
    const price = selectedRoomType?.adultPrice || roomTypes[0]?.adultPrice || 100; // fallback price

    const accommodationData = {
      id: hotel.id,
      name: hotel.name,
      type: roomType,
      price: price,
      hotel: hotel.name,
      roomType: roomType
    };

    const updatedTotalCost = calculateDayTotal({
      ...day,
      accommodation: accommodationData
    });

    onUpdateDay(dayId, {
      accommodation: accommodationData,
      totalCost: updatedTotalCost
    });
  };

  const addSightseeingToDay = (dayId: string, sightseeingId: string) => {
    const sightseeingItem = sightseeing.find(s => s.id?.toString() === sightseeingId);
    const day = days.find(d => d.id === dayId);
    if (!sightseeingItem || !day) return;

    const price = typeof sightseeingItem.price === 'object' 
      ? sightseeingItem.price.adult 
      : sightseeingItem.price || 0;

    const newActivity = {
      id: sightseeingItem.id?.toString() || `sightseeing_${Date.now()}`,
      name: sightseeingItem.name,
      price: price * (query.paxDetails.adults + query.paxDetails.children),
      duration: sightseeingItem.duration || '2 hours'
    };

    const updatedActivities = [...day.activities, newActivity];
    const updatedTotalCost = calculateDayTotal({
      ...day,
      activities: updatedActivities
    });

    onUpdateDay(dayId, {
      activities: updatedActivities,
      totalCost: updatedTotalCost
    });
  };

  const handleApplyTemplate = (template: EnhancedProposalTemplate) => {
    // Clear existing days first
    days.forEach(day => onRemoveDay(day.id));
    
    // Apply template days
    setTimeout(() => {
      template.dayPlan.forEach((templateDay, index) => {
        const newDay = {
          ...templateDay,
          id: `day_${Date.now()}_${index}`,
          date: new Date(new Date(query.travelDates.from).getTime() + index * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0]
        };
        
        // Add day
        onAddDay();
        
        // Update with template data
        setTimeout(() => {
          onUpdateDay(newDay.id, newDay);
        }, 100);
      });
    }, 100);
    
    setShowTemplateSelector(false);
  };

  return (
    <div className="space-y-6">
      {/* Template Actions Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Layout className="h-5 w-5" />
            Template Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowTemplateSelector(true)}
              className="gap-2"
            >
              <Layout className="h-4 w-4" />
              Use Template
            </Button>
            {days.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setShowSaveTemplate(true)}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save as Template
              </Button>
            )}
          </div>
          <p className="text-sm text-purple-600 mt-2">
            Use pre-made templates to create proposals faster, or save your current proposal as a template for future use.
          </p>
        </CardContent>
      </Card>

      {/* Service Inventory Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Transport Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Car className="h-4 w-4" />
              Transport Routes ({transportRoutes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {transportLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              transportRoutes.slice(0, 5).map(route => (
                <div key={route.id} className="p-2 border rounded text-xs">
                  <div className="font-medium">{route.name}</div>
                  <div className="text-muted-foreground">
                    {route.transportType} • {formatCurrency(route.price, query.destination.country)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Hotels Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Hotel className="h-4 w-4" />
              Hotels ({hotels.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {hotelsLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              hotels.slice(0, 5).map(hotel => {
                const minPrice = hotel.roomTypes?.[0]?.adultPrice || hotel.minRate || 0;
                return (
                  <div key={hotel.id} className="p-2 border rounded text-xs">
                    <div className="font-medium">{hotel.name}</div>
                    <div className="text-muted-foreground">
                      {hotel.starRating}★ • {formatCurrency(minPrice, query.destination.country)}/night
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Sightseeing Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Camera className="h-4 w-4" />
              Sightseeing ({sightseeing.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sightseeingLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              sightseeing.slice(0, 5).map(item => (
                <div key={item.id} className="p-2 border rounded text-xs">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-muted-foreground">
                    {item.duration} • {formatCurrency(
                      typeof item.price === 'object' ? item.price.adult : item.price || 0,
                      query.destination.country
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Days List */}
      <div className="space-y-4">
        {days.map((day) => (
          <Card key={day.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Day {day.dayNumber}</Badge>
                  <div>
                    <CardTitle className="text-lg">{day.title || `Day ${day.dayNumber}`}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{day.city}</span>
                      <span>•</span>
                      <span>{day.date}</span>
                      <span>•</span>
                      <span className="font-medium">
                        {formatCurrency(day.totalCost, query.destination.country)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveDay(day.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Day Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Day Title</label>
                  <Input
                    value={day.title}
                    onChange={(e) => onUpdateDay(day.id, { title: e.target.value })}
                    placeholder={`Day ${day.dayNumber} - Enter title`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Select
                    value={day.city}
                    onValueChange={(value) => onUpdateDay(day.id, { city: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {query.destination.cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={day.description}
                  onChange={(e) => onUpdateDay(day.id, { description: e.target.value })}
                  placeholder="Brief description of the day"
                  rows={2}
                />
              </div>

              <Separator />

              {/* Service Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Transport Selection */}
                <div>
                  <label className="text-sm font-medium">Transport</label>
                  <Select onValueChange={(value) => addTransportToDay(day.id, value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add transport" />
                    </SelectTrigger>
                    <SelectContent>
                      {transportRoutes.map(route => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.name} - {formatCurrency(route.price, query.destination.country)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {day.transport && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      <div className="font-medium">{day.transport.name}</div>
                      <div className="text-muted-foreground">
                        {formatCurrency(day.transport.price, query.destination.country)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Hotel Selection */}
                <div>
                  <label className="text-sm font-medium">Accommodation</label>
                  <Select onValueChange={(value) => {
                    const [hotelId, roomType] = value.split('|');
                    addHotelToDay(day.id, hotelId, roomType || 'standard');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotels.map(hotel => {
                        const roomTypes = hotel.roomTypes || [];
                        if (roomTypes.length > 0) {
                          return roomTypes.map(room => (
                            <SelectItem key={`${hotel.id}|${room.name}`} value={`${hotel.id}|${room.name}`}>
                              {hotel.name} - {room.name} - {formatCurrency(room.adultPrice || 0, query.destination.country)}
                            </SelectItem>
                          ));
                        } else {
                          return (
                            <SelectItem key={hotel.id} value={`${hotel.id}|standard`}>
                              {hotel.name} - {formatCurrency(hotel.minRate || 0, query.destination.country)}
                            </SelectItem>
                          );
                        }
                      })}
                    </SelectContent>
                  </Select>
                  {day.accommodation && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                      <div className="font-medium">{day.accommodation.name}</div>
                      <div className="text-muted-foreground">
                        {day.accommodation.roomType} - {formatCurrency(day.accommodation.price, query.destination.country)}/night
                      </div>
                    </div>
                  )}
                </div>

                {/* Sightseeing Selection */}
                <div>
                  <label className="text-sm font-medium">Sightseeing</label>
                  <Select onValueChange={(value) => addSightseeingToDay(day.id, value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add sightseeing" />
                    </SelectTrigger>
                    <SelectContent>
                      {sightseeing.map(item => (
                        <SelectItem key={item.id} value={item.id?.toString() || ''}>
                          {item.name} - {formatCurrency(
                            typeof item.price === 'object' ? item.price.adult : item.price || 0,
                            query.destination.country
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Activities */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Activities & Sightseeing</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addActivity(day.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Activity
                  </Button>
                </div>

                <div className="space-y-3">
                  {day.activities.map((activity, index) => (
                    <div key={activity.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeActivity(day.id, activity.id)}
                          className="text-destructive hover:text-destructive h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input
                          value={activity.name}
                          onChange={(e) => updateActivity(day.id, activity.id, { name: e.target.value })}
                          placeholder="Activity name"
                        />
                        <Input
                          value={activity.duration}
                          onChange={(e) => updateActivity(day.id, activity.id, { duration: e.target.value })}
                          placeholder="Duration"
                        />
                        <Input
                          type="number"
                          value={activity.price}
                          onChange={(e) => updateActivity(day.id, activity.id, { price: parseFloat(e.target.value) || 0 })}
                          placeholder="Price"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meals */}
              <div>
                <h4 className="font-medium mb-2">Meals Included</h4>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={day.meals.breakfast}
                      onChange={(e) => onUpdateDay(day.id, {
                        meals: { ...day.meals, breakfast: e.target.checked }
                      })}
                    />
                    <span className="text-sm">Breakfast</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={day.meals.lunch}
                      onChange={(e) => onUpdateDay(day.id, {
                        meals: { ...day.meals, lunch: e.target.checked }
                      })}
                    />
                    <span className="text-sm">Lunch</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={day.meals.dinner}
                      onChange={(e) => onUpdateDay(day.id, {
                        meals: { ...day.meals, dinner: e.target.checked }
                      })}
                    />
                    <span className="text-sm">Dinner</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {days.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No days added yet</p>
            <div className="space-y-2">
              <Button onClick={onAddDay}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Day
              </Button>
              <p className="text-sm text-muted-foreground">or</p>
              <Button 
                variant="outline" 
                onClick={() => setShowTemplateSelector(true)}
                className="gap-2"
              >
                <Layout className="h-4 w-4" />
                Start with Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl max-h-[90vh] overflow-auto w-full">
            <div className="p-6">
              <TemplateSelector
                query={query}
                onSelectTemplate={handleApplyTemplate}
                onClose={() => setShowTemplateSelector(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Save as Template Dialog */}
      <SaveAsTemplateDialog
        isOpen={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        proposalDays={days}
        query={query}
      />
    </div>
  );
};
