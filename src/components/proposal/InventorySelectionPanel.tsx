
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Query } from '@/types/query';
import { ProposalDay } from './DayPlanningInterface';
import { useEnhancedInventoryData } from '@/hooks/useEnhancedInventoryData';
import { useTransportRoutes } from '@/hooks/useTransportRoutes';
import { formatCurrency } from '@/lib/formatters';
import { 
  Hotel, Car, X, Search, MapPin, Star, Clock, Users 
} from 'lucide-react';

interface InventorySelectionPanelProps {
  query: Query;
  day: ProposalDay;
  onSelectItem: (item: any, type: 'accommodation' | 'transport' | 'activity') => void;
  onClose: () => void;
}

export const InventorySelectionPanel: React.FC<InventorySelectionPanelProps> = ({
  query,
  day,
  onSelectItem,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('hotels');
  const [searchQuery, setSearchQuery] = useState('');

  // Load inventory data
  const { 
    hotels, 
    sightseeing, 
    loading: inventoryLoading 
  } = useEnhancedInventoryData({
    countries: [query.destination.country],
    cities: [day.city]
  });

  const {
    routes: transportRoutes = [],
    loading: transportLoading = false
  } = useTransportRoutes({
    country: query.destination?.country || '',
    cities: query.destination?.cities || []
  }) || {};

  // Filter items based on search
  const filteredHotels = useMemo(() => {
    if (!searchQuery) return hotels;
    return hotels.filter(hotel => 
      hotel.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [hotels, searchQuery]);

  const filteredTransport = useMemo(() => {
    if (!searchQuery) return transportRoutes;
    return transportRoutes.filter(route => 
      route.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.to?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.transportType?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transportRoutes, searchQuery]);

  const filteredActivities = useMemo(() => {
    if (!searchQuery) return sightseeing;
    return sightseeing.filter(activity => 
      activity.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sightseeing, searchQuery]);

  const handleHotelSelect = (hotel: any) => {
    const selectedHotel = {
      id: hotel.id,
      name: hotel.name,
      type: hotel.hotelType || 'Hotel',
      price: hotel.roomTypes?.[0]?.adultPrice || hotel.minRate || 100
    };
    onSelectItem(selectedHotel, 'accommodation');
  };

  const handleTransportSelect = (route: any) => {
    const selectedTransport = {
      id: route.id,
      name: `${route.transportType} - ${route.from} to ${route.to}`,
      from: route.from,
      to: route.to,
      price: route.price || 50
    };
    onSelectItem(selectedTransport, 'transport');
  };

  const loading = inventoryLoading || transportLoading;

  return (
    <Card className="mt-4 border-2 border-blue-200 dark:border-blue-900">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Select Inventory for Day {day.dayNumber}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="hotels" className="flex items-center gap-2 rounded-md data-[state=active]:bg-gray-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-300">
              <Hotel className="h-4 w-4" />
              Hotels ({filteredHotels.length})
            </TabsTrigger>
            <TabsTrigger value="transport" className="flex items-center gap-2 rounded-md data-[state=active]:bg-gray-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-300">
              <Car className="h-4 w-4" />
              Transport ({filteredTransport.length})
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2 rounded-md data-[state=active]:bg-gray-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-300">
              <MapPin className="h-4 w-4" />
              Activities ({filteredActivities.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hotels" className="mt-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading hotels...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {filteredHotels.map((hotel) => (
                  <div key={hotel.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-700 dark:hover:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{hotel.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {hotel.city || hotel.location}
                          </div>
                          {hotel.starRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {hotel.starRating}★
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {hotel.roomTypes?.[0]?.maxOccupancy || 2} guests
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(hotel.roomTypes?.[0]?.adultPrice || hotel.minRate || 100)}
                          </div>
                          <div className="text-xs text-muted-foreground">per night</div>
                        </div>
                        <Button size="sm" onClick={() => handleHotelSelect(hotel)}>
                          Select
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredHotels.length === 0 && (
                  <div className="text-center py-8">
                    <Hotel className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No hotels found</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="transport" className="mt-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading transport options...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {filteredTransport.map((route) => (
                  <div key={route.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-700 dark:hover:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{route.from} → {route.to}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {route.transportType}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {route.distance}km
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {route.duration}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(route.price || 50)}
                          </div>
                          <div className="text-xs text-muted-foreground">total</div>
                        </div>
                        <Button size="sm" onClick={() => handleTransportSelect(route)}>
                          Select
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredTransport.length === 0 && (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No transport routes found</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activities" className="mt-4">
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{activity.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {activity.city}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          2-3 hours
                        </div>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(typeof activity.price === 'object' ? activity.price.adult : activity.price || 30)}
                        </div>
                        <div className="text-xs text-muted-foreground">per person</div>
                      </div>
                      <Button size="sm" onClick={() => onSelectItem(activity, 'activity')}>
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredActivities.length === 0 && (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No activities found</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
