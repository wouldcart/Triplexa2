import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CentralItinerary } from '@/types/itinerary';
import { Query } from '@/types/query';
import { useEnhancedInventoryData } from '@/hooks/useEnhancedInventoryData';
import { Hotel, Car, Camera, Utensils, Plus, MapPin, Clock, DollarSign, Search } from 'lucide-react';

interface EnhancedInventorySelectorProps {
  query: Query;
  itinerary: CentralItinerary;
  onUpdate: (itinerary: CentralItinerary) => void;
}

export const EnhancedInventorySelector: React.FC<EnhancedInventorySelectorProps> = ({
  query,
  itinerary,
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState('transport');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItems, setPreviewItems] = useState<any[]>([]);

  // Load enhanced inventory data with real-time updates
  const { 
    hotels, 
    restaurants, 
    sightseeing, 
    transportRoutes, 
    loading, 
    refreshData 
  } = useEnhancedInventoryData({
    countries: [query.destination.country],
    cities: query.destination.cities
  });

  // Filter items based on search query
  const filteredTransportRoutes = useMemo(() => {
    if (!searchQuery) return transportRoutes;
    return transportRoutes.filter(route => 
      route.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.to?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.transportType?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transportRoutes, searchQuery]);

  const filteredHotels = useMemo(() => {
    if (!searchQuery) return hotels;
    return hotels.filter(hotel => 
      hotel.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [hotels, searchQuery]);

  const filteredSightseeing = useMemo(() => {
    if (!searchQuery) return sightseeing;
    return sightseeing.filter(sight => 
      sight.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sight.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sight.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sightseeing, searchQuery]);

  const filteredRestaurants = useMemo(() => {
    if (!searchQuery) return restaurants;
    return restaurants.filter(restaurant => 
      restaurant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [restaurants, searchQuery]);

  const handleAddToDay = (item: any, dayId: string, type: string) => {
    const dayIndex = itinerary.days.findIndex(d => d.id === dayId);
    if (dayIndex === -1) return;

    const updatedDays = [...itinerary.days];
    const day = updatedDays[dayIndex];

    switch (type) {
      case 'transport':
        const newTransport = {
          id: `transport_${Date.now()}`,
          type: item.transportType?.toLowerCase() || 'car',
          from: {
            id: `from_${Date.now()}`,
            name: item.from,
            country: query.destination.country,
            city: item.from
          },
          to: {
            id: `to_${Date.now()}`,
            name: item.to,
            country: query.destination.country,
            city: item.to
          },
          duration: item.duration,
          price: item.price,
          details: `${item.distance}km route`
        };
        
        day.transport = day.transport || [];
        day.transport.push(newTransport);
        day.totalCost += item.price;
        break;

      case 'hotel':
        const newAccommodation = {
          id: `hotel_${Date.now()}`,
          name: item.name,
          type: 'hotel' as const,
          location: {
            id: `loc_${Date.now()}`,
            name: item.city || item.location,
            country: query.destination.country,
            city: item.city || item.location
          },
          checkIn: day.date,
          checkOut: day.date,
          nights: 1,
          roomType: item.roomTypes?.[0]?.name || 'Standard Room',
          price: item.roomTypes?.[0]?.adultPrice || item.minRate || 100,
          starRating: item.starRating,
          amenities: item.amenities || []
        };
        
        day.accommodation = newAccommodation;
        day.totalCost += newAccommodation.price;
        break;

      case 'activity':
        const newActivity = {
          id: `activity_${Date.now()}`,
          name: item.name,
          type: 'sightseeing' as const,
          location: {
            id: `loc_${Date.now()}`,
            name: item.city,
            country: query.destination.country,
            city: item.city
          },
          startTime: '09:00',
          endTime: '12:00',
          duration: '3 hours',
          price: typeof item.price === 'object' ? item.price.adult : item.price || 30,
          description: item.description,
          inclusions: []
        };
        
        day.activities.push(newActivity);
        day.totalCost += newActivity.price;
        break;

      case 'dining':
        const newMeal = {
          id: `meal_${Date.now()}`,
          type: 'lunch' as const,
          restaurant: item.name,
          location: {
            id: `loc_${Date.now()}`,
            name: item.city || item.location,
            country: query.destination.country,
            city: item.city || item.location
          },
          cuisine: item.cuisine || 'International',
          price: item.averagePrice || item.averageCost || 25,
          time: '12:00'
        };
        
        day.meals.push(newMeal);
        day.totalCost += newMeal.price;
        break;
    }

    updatedDays[dayIndex] = day;
    onUpdate({
      ...itinerary,
      days: updatedDays,
      updatedAt: new Date().toISOString()
    });
  };

  const handlePreview = (item: any) => {
    setPreviewItems([item]);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-muted-foreground">Loading enhanced inventory data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Enhanced Inventory Selector</h3>
        <p className="text-muted-foreground">
          Add services and inventory items to your itinerary with advanced filtering
        </p>
      </div>

      {/* Day Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Day to Add Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger>
              <SelectValue placeholder="Select a day to add services" />
            </SelectTrigger>
            <SelectContent>
              {itinerary.days.map((day) => (
                <SelectItem key={day.id} value={day.id}>
                  Day {day.day} - {day.date} ({day.location.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search inventory items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="transport" className="flex items-center gap-2 rounded-md data-[state=active]:bg-gray-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-300">
            <Car className="h-4 w-4" />
            Transport
            <Badge variant="secondary">{filteredTransportRoutes.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="hotels" className="flex items-center gap-2 rounded-md data-[state=active]:bg-gray-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-300">
            <Hotel className="h-4 w-4" />
            Hotels
            <Badge variant="secondary">{filteredHotels.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2 rounded-md data-[state=active]:bg-gray-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-300">
            <Camera className="h-4 w-4" />
            Activities
            <Badge variant="secondary">{filteredSightseeing.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="dining" className="flex items-center gap-2 rounded-md data-[state=active]:bg-gray-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-300">
            <Utensils className="h-4 w-4" />
            Dining
            <Badge variant="secondary">{filteredRestaurants.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transport" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transport Routes</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTransportRoutes.length > 0 ? (
                <div className="grid gap-4">
                  {filteredTransportRoutes.map((route) => (
                    <div key={route.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{route.from} → {route.to}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {route.distance}km
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {route.duration}
                            </div>
                            <div className="flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              {route.transportType}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 font-medium">
                            <DollarSign className="h-4 w-4" />
                            {route.price}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(route)}
                          >
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => selectedDay && handleAddToDay(route, selectedDay, 'transport')}
                            disabled={!selectedDay}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add to Day
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No transport routes found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hotels" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Hotel Options</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredHotels.length > 0 ? (
                <div className="grid gap-4">
                  {filteredHotels.map((hotel) => (
                    <div key={hotel.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{hotel.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {hotel.city || hotel.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Hotel className="h-3 w-3" />
                              {hotel.starRating}★
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 font-medium">
                            <DollarSign className="h-4 w-4" />
                            {hotel.roomTypes?.[0]?.adultPrice || hotel.minRate || 100}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(hotel)}
                          >
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => selectedDay && handleAddToDay(hotel, selectedDay, 'hotel')}
                            disabled={!selectedDay}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add to Day
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Hotel className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No hotels found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activities & Sightseeing</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSightseeing.length > 0 ? (
                <div className="grid gap-4">
                  {filteredSightseeing.map((activity) => (
                    <div key={activity.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{activity.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {activity.city}
                            </div>
                            <div className="flex items-center gap-1">
                              <Camera className="h-3 w-3" />
                              {activity.category || 'Sightseeing'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 font-medium">
                            <DollarSign className="h-4 w-4" />
                            {typeof activity.price === 'object' ? activity.price.adult : activity.price || 30}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(activity)}
                          >
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => selectedDay && handleAddToDay(activity, selectedDay, 'activity')}
                            disabled={!selectedDay}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add to Day
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No activities found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dining" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dining Options</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRestaurants.length > 0 ? (
                <div className="grid gap-4">
                  {filteredRestaurants.map((restaurant) => (
                    <div key={restaurant.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{restaurant.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {restaurant.city || restaurant.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Utensils className="h-3 w-3" />
                              {restaurant.cuisine}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 font-medium">
                            <DollarSign className="h-4 w-4" />
                            {restaurant.averagePrice || restaurant.averageCost || 25}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(restaurant)}
                          >
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => selectedDay && handleAddToDay(restaurant, selectedDay, 'dining')}
                            disabled={!selectedDay}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add to Day
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No restaurants found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Section */}
      {previewItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {previewItems.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900">
                <h4 className="font-medium">{item.name || `${item.from} → ${item.to}`}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.description || item.city || `${item.transportType} • ${item.distance}km • ${item.duration}`}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
