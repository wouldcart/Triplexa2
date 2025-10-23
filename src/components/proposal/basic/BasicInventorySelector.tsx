
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Query } from '@/types/query';
import { Hotel } from '@/components/inventory/hotels/types/hotel';
import { Restaurant } from '@/pages/inventory/restaurants/types/restaurantTypes';
import { Sightseeing } from '@/types/sightseeing';
import { TransportRoute } from '@/pages/queries/types/proposalTypes';
import { Car, Hotel as HotelIcon, Landmark, Utensils, Plus, Search, MapPin, Star, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface BasicProposalItem {
  id: string;
  type: 'hotel' | 'transport' | 'restaurant' | 'sightseeing' | 'custom';
  name: string;
  description?: string;
  basePrice: number;
  quantity: number;
  markup: number;
  finalPrice: number;
  currency: string;
  data?: any;
}

interface BasicInventorySelectorProps {
  query: Query;
  hotels: Hotel[];
  restaurants: Restaurant[];
  sightseeing: Sightseeing[];
  transportRoutes: TransportRoute[];
  onAddItem: (item: Omit<BasicProposalItem, 'id' | 'finalPrice'>) => void;
  currencySymbol: string;
}

const BasicInventorySelector: React.FC<BasicInventorySelectorProps> = ({
  query,
  hotels,
  restaurants,
  sightseeing,
  transportRoutes,
  onAddItem,
  currencySymbol
}) => {
  const [activeTab, setActiveTab] = useState('hotels');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');

  // Filter inventory by destination cities
  const getRelevantHotels = () => {
    return hotels.filter(hotel => {
      const hotelCity = hotel.city || hotel.location || '';
      return query.destination.cities.some(city => 
        hotelCity.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(hotelCity.toLowerCase())
      );
    });
  };

  const getRelevantRestaurants = () => {
    return restaurants.filter(restaurant => {
      const restaurantCity = restaurant.city || restaurant.location || '';
      return query.destination.cities.some(city => 
        restaurantCity.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(restaurantCity.toLowerCase())
      );
    });
  };

  const getRelevantSightseeing = () => {
    return sightseeing.filter(sight => {
      const sightCity = sight.city || '';
      return query.destination.cities.some(city => 
        sightCity.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(sightCity.toLowerCase())
      );
    });
  };

  const getRelevantTransport = () => {
    return transportRoutes.filter(route => {
      const fromCity = route.from || '';
      const toCity = route.to || '';
      return query.destination.cities.some(city => 
        fromCity.toLowerCase().includes(city.toLowerCase()) ||
        toCity.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(fromCity.toLowerCase()) ||
        city.toLowerCase().includes(toCity.toLowerCase())
      );
    });
  };

  const filterData = (data: any[], type: string) => {
    return data.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const itemCity = item.city || item.location || item.from || item.to || '';
      const matchesCity = selectedCity === 'all' || itemCity.toLowerCase().includes(selectedCity.toLowerCase());
      
      return matchesSearch && matchesCity;
    });
  };

  const handleAddHotel = (hotel: Hotel) => {
    const roomType = hotel.roomTypes?.[0];
    onAddItem({
      type: 'hotel',
      name: `${hotel.name} - ${roomType?.name || 'Standard Room'}`,
      description: `${hotel.starRating || 4}-star hotel in ${hotel.city || 'destination'}`,
      basePrice: roomType?.adultPrice || 100,
      quantity: Math.ceil((new Date(query.travelDates.to).getTime() - new Date(query.travelDates.from).getTime()) / (1000 * 60 * 60 * 24)),
      markup: 10,
      currency: currencySymbol,
      data: hotel
    });
  };

  const handleAddRestaurant = (restaurant: Restaurant) => {
    onAddItem({
      type: 'restaurant',
      name: restaurant.name,
      description: `${restaurant.cuisineTypes || 'Local'} cuisine`,
      basePrice: restaurant.averagePrice || restaurant.averageCost || 50,
      quantity: query.paxDetails.adults + query.paxDetails.children,
      markup: 15,
      currency: currencySymbol,
      data: restaurant
    });
  };

  const handleAddSightseeing = (sight: Sightseeing) => {
    const price = typeof sight.price === 'object' ? sight.price.adult : sight.price || 30;
    onAddItem({
      type: 'sightseeing',
      name: sight.name,
      description: sight.category || 'Sightseeing activity',
      basePrice: price,
      quantity: query.paxDetails.adults + query.paxDetails.children,
      markup: 12,
      currency: currencySymbol,
      data: sight
    });
  };

  const handleAddTransport = (transport: TransportRoute) => {
    onAddItem({
      type: 'transport',
      name: transport.name || `${transport.from ?? 'Unknown'} to ${transport.to ?? 'Unknown'}`,
      description: `${transport.transportType || 'Transport'} service`,
      basePrice: transport.price || 50,
      quantity: 1,
      markup: 8,
      currency: currencySymbol,
      data: transport
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {query.destination.cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hotels" className="flex items-center gap-1 rounded-md data-[state=active]:bg-gray-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-300">
            <HotelIcon className="h-4 w-4" />
            Hotels
          </TabsTrigger>
          <TabsTrigger value="transport" className="flex items-center gap-1 rounded-md data-[state=active]:bg-gray-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-300">
            <Car className="h-4 w-4" />
            Transport
          </TabsTrigger>
          <TabsTrigger value="sightseeing" className="flex items-center gap-1 rounded-md data-[state=active]:bg-gray-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-300">
            <Landmark className="h-4 w-4" />
            Activities
          </TabsTrigger>
          <TabsTrigger value="restaurants" className="flex items-center gap-1 rounded-md data-[state=active]:bg-gray-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-300">
            <Utensils className="h-4 w-4" />
            Dining
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hotels" className="mt-4">
          <div className="grid gap-4">
            {filterData(getRelevantHotels(), 'hotel').map(hotel => (
              <Card key={hotel.id} className="hover:shadow-md transition-shadow border dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{hotel.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{hotel.city || hotel.location}</span>
                        <div className="flex">
                          {Array.from({ length: hotel.starRating || 4 }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-yellow-500 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm mt-1">{hotel.roomTypes?.[0]?.name || 'Standard Room'}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {hotel.amenities?.slice(0, 3).map((amenity: string) => (
                          <Badge key={amenity} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(hotel.roomTypes?.[0]?.adultPrice || 100)} {currencySymbol}
                      </div>
                      <div className="text-xs text-muted-foreground">per night</div>
                      <Button 
                        size="sm" 
                        onClick={() => handleAddHotel(hotel)}
                        className="mt-2"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transport" className="mt-4">
          <div className="grid gap-4">
            {filterData(getRelevantTransport(), 'transport').map(transport => (
              <Card key={transport.id} className="hover:shadow-md transition-shadow border dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{transport.name || `${(transport.from || transport.startLocation || 'Unknown')} to ${(transport.to || transport.endLocation || 'Unknown')}`}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{transport.from ?? 'Unknown'} → {transport.to ?? 'Unknown'}</span>
                    </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{(transport.duration || 'N/A')}</span>
                      </div>
                      <Badge variant="secondary" className="mt-2 text-xs capitalize">
                        {transport.transportType}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(transport.price)} {currencySymbol}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleAddTransport(transport)}
                        className="mt-2"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sightseeing" className="mt-4">
          <div className="grid gap-4">
            {filterData(getRelevantSightseeing(), 'sightseeing').map(sight => (
              <Card key={sight.id} className="hover:shadow-md transition-shadow border dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{sight.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{sight.city}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{sight.duration || '4 hours'}</span>
                      </div>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {sight.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(typeof sight.price === 'object' ? sight.price.adult : sight.price || 30)} {currencySymbol}
                      </div>
                      <div className="text-xs text-muted-foreground">per person</div>
                      <Button 
                        size="sm" 
                        onClick={() => handleAddSightseeing(sight)}
                        className="mt-2"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="restaurants" className="mt-4">
          <div className="grid gap-4">
            {filterData(getRelevantRestaurants(), 'restaurant').map(restaurant => (
              <Card key={restaurant.id} className="hover:shadow-md transition-shadow border dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{restaurant.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{restaurant.city || restaurant.location}</span>
                      </div>
                      <p className="text-sm mt-1">{restaurant.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {restaurant.cuisineTypes || 'Local Cuisine'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {restaurant.mealTypes?.[0] || 'Dinner'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(restaurant.averagePrice || restaurant.averageCost || 50)} {currencySymbol}
                      </div>
                      <div className="text-xs text-muted-foreground">per person</div>
                      <Button 
                        size="sm" 
                        onClick={() => handleAddRestaurant(restaurant)}
                        className="mt-2"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Custom Item */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Custom Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input placeholder="Item name" />
            <Input placeholder="Base price" type="number" />
            <Input placeholder="Quantity" type="number" defaultValue={1} />
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Custom
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicInventorySelector;
