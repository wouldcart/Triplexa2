import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Query } from '@/types/query';
import { formatCurrency } from '@/lib/formatters';
import { useInventoryData } from '@/pages/queries/hooks/useInventoryData';
import { 
  Car, Hotel, Landmark, Utensils, Plus, Search, Filter,
  MapPin, Star, Clock, Users, Trash2
} from 'lucide-react';

interface SelectedModule {
  id: string;
  type: 'transport' | 'hotel' | 'sightseeing' | 'restaurant' | 'additional';
  data: any;
  pricing: {
    basePrice: number;
    finalPrice: number;
    currency: string;
  };
}

interface SmartModuleSelectorProps {
  query: Query;
  selectedModules: SelectedModule[];
  onAddModule: (module: SelectedModule) => void;
  onRemoveModule: (moduleId: string) => void;
  onUpdatePricing: (moduleId: string, pricing: any) => void;
}

const SmartModuleSelector: React.FC<SmartModuleSelectorProps> = ({
  query,
  selectedModules,
  onAddModule,
  onRemoveModule,
  onUpdatePricing
}) => {
  const [activeTab, setActiveTab] = useState('transport');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  
  // Use real inventory data with enhanced error handling
  const { 
    hotels, 
    restaurants, 
    sightseeing, 
    transportRoutes, 
    currency, 
    currencySymbol,
    loading: inventoryLoading,
    refreshData
  } = useInventoryData();

  // Add loading state check
  useEffect(() => {
    if (!inventoryLoading) {
      console.log('Smart Module Selector - Inventory data loaded:', {
        hotels: hotels.length,
        restaurants: restaurants.length,
        sightseeing: sightseeing.length,
        transportRoutes: transportRoutes.length
      });
    }
  }, [inventoryLoading, hotels, restaurants, sightseeing, transportRoutes]);

  // Filter real hotels by destination cities with improved matching
  const getRelevantHotels = () => {
    if (inventoryLoading) return [];
    
    return hotels.filter(hotel => {
      const hotelCity = hotel.city || hotel.location || '';
      return query.destination.cities.some(city => 
        hotelCity.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(hotelCity.toLowerCase())
      );
    }).map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      location: hotel.city || hotel.location || 'Unknown Location',
      starRating: hotel.starRating || 4,
      roomType: hotel.roomTypes?.[0]?.name || 'Standard Room',
      amenities: hotel.amenities || [],
      basePrice: hotel.roomTypes?.[0]?.adultPrice || hotel.minRate || 100,
      priceUnit: 'per night',
      currency: currencySymbol,
      cities: [hotel.city || hotel.location || 'Unknown']
    }));
  };

  // Filter real restaurants by destination cities with improved matching
  const getRelevantRestaurants = () => {
    if (inventoryLoading) return [];
    
    return restaurants.filter(restaurant => {
      const restaurantCity = restaurant.city || restaurant.location || '';
      return query.destination.cities.some(city => 
        restaurantCity.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(restaurantCity.toLowerCase())
      );
    }).map(restaurant => {
      const basePrice = restaurant.averagePrice || restaurant.averageCost || 50;
      
      return {
        id: restaurant.id,
        name: restaurant.name,
        location: restaurant.city || restaurant.location || 'Unknown Location',
        cuisine: Array.isArray(restaurant.cuisineTypes) ? restaurant.cuisineTypes[0] : (restaurant.cuisineTypes || 'Local Cuisine'),
        mealType: restaurant.mealTypes?.[0] || 'Dinner',
        speciality: restaurant.description || 'Traditional Local Cuisine',
        basePrice: basePrice,
        priceUnit: 'per person',
        currency: currencySymbol,
        cities: [restaurant.city || restaurant.location || 'Unknown']
      };
    });
  };

  // Filter real sightseeing by destination cities with improved matching
  function getRelevantSightseeing() {
    if (inventoryLoading) return [];
    
    return sightseeing.filter(sight => {
      const sightCity = sight.city || '';
      return query.destination.cities.some(city => 
        sightCity.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(sightCity.toLowerCase())
      );
    }).map(sight => ({
      id: sight.id,
      name: sight.name,
      location: sight.city || 'Unknown Location',
      duration: sight.duration || '4 hours',
      type: sight.category || 'Cultural',
      includes: sight.activities || ['Guide', 'Transport', 'Entrance Fees'],
      basePrice: typeof sight.price === 'object' ? sight.price.adult : sight.price || 30,
      currency: currencySymbol,
      cities: [sight.city || 'Unknown']
    }));
  }

  // Filter real transport routes by destination cities with improved matching
  function getRelevantTransportRoutes() {
    if (inventoryLoading) return [];
    
    return transportRoutes.filter(route => {
      const fromCity = route.from || '';
      const toCity = route.to || '';
      return query.destination.cities.some(city => 
        fromCity.toLowerCase().includes(city.toLowerCase()) ||
        toCity.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(fromCity.toLowerCase()) ||
        city.toLowerCase().includes(toCity.toLowerCase())
      );
    }).map(route => ({
      id: route.id,
      name: route.name || `${route.from} to ${route.to}`,
      type: route.transportType || 'Transport',
      from: route.from || 'Unknown',
      to: route.to || 'Unknown',
      fromLocation: route.from || 'Unknown',
      toLocation: route.to || 'Unknown',
      vehicle: route.transportType || 'Vehicle',
      duration: route.duration || 'N/A',
      basePrice: route.price || 0,
      currency: currencySymbol,
      cities: [route.from, route.to].filter(Boolean),
      routeData: route
    }));
  }

  const getFilteredData = (data: any[], type: string) => {
    return data.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'all' || item.cities?.includes(selectedCity);
      const matchesPrice = priceRange === 'all' || 
        (priceRange === 'budget' && item.basePrice < 100) ||
        (priceRange === 'mid' && item.basePrice >= 100 && item.basePrice < 300) ||
        (priceRange === 'luxury' && item.basePrice >= 300);
      
      return matchesSearch && matchesCity && matchesPrice;
    });
  };

  const handleAddModule = (item: any, type: string) => {
    const module: SelectedModule = {
      id: `${type}_${item.id}_${Date.now()}`,
      type: type as any,
      data: item,
      pricing: {
        basePrice: item.basePrice,
        finalPrice: item.basePrice,
        currency: item.currency
      }
    };
    onAddModule(module);
  };

  const renderTransportModule = (item: any) => (
    <Card key={item.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-semibold">{item.name}</h4>
            <p className="text-sm text-muted-foreground capitalize">{item.type} Route</p>
            <div className="flex items-center gap-2 mt-2">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs">{item.from} → {item.to}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs">{item.duration}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs capitalize">
                {item.vehicle}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              {formatCurrency(item.basePrice)} {item.currency}
            </div>
            <Button 
              size="sm" 
              onClick={() => handleAddModule(item, 'transport')}
              className="mt-2"
            >
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderHotelModule = (item: any) => (
    <Card key={item.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-semibold">{item.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{item.location}</span>
              <div className="flex">
                {Array.from({ length: item.starRating }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 text-yellow-500 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-sm mt-1">{item.roomType}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {item.amenities.slice(0, 3).map((amenity: string) => (
                <Badge key={amenity} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              {formatCurrency(item.basePrice)} {item.currency}
            </div>
            <div className="text-xs text-muted-foreground">{item.priceUnit}</div>
            <Button 
              size="sm" 
              onClick={() => handleAddModule(item, 'hotel')}
              className="mt-2"
            >
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSightseeingModule = (item: any) => (
    <Card key={item.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-semibold">{item.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{item.location}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">{item.duration}</span>
            </div>
            <Badge variant="secondary" className="mt-2 text-xs">
              {item.type}
            </Badge>
            <div className="flex flex-wrap gap-1 mt-2">
              {item.includes.slice(0, 3).map((include: string) => (
                <Badge key={include} variant="outline" className="text-xs">
                  {include}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              {formatCurrency(item.basePrice)} {item.currency}
            </div>
            <Button 
              size="sm" 
              onClick={() => handleAddModule(item, 'sightseeing')}
              className="mt-2"
            >
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderRestaurantModule = (item: any) => (
    <Card key={item.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-semibold">{item.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{item.location}</span>
            </div>
            <p className="text-sm mt-1">{item.speciality}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {item.cuisine}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {item.mealType}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              {formatCurrency(item.basePrice)} {item.currency}
            </div>
            <div className="text-xs text-muted-foreground">{item.priceUnit}</div>
            <Button 
              size="sm" 
              onClick={() => handleAddModule(item, 'restaurant')}
              className="mt-2"
            >
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modules..."
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
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger>
                <SelectValue placeholder="Price range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="mid">Mid-range</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Selected Modules Summary */}
      {selectedModules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Modules ({selectedModules.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedModules.map(module => (
                <div key={module.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {module.type === 'transport' && <Car className="h-4 w-4" />}
                    {module.type === 'hotel' && <Hotel className="h-4 w-4" />}
                    {module.type === 'sightseeing' && <Landmark className="h-4 w-4" />}
                    {module.type === 'restaurant' && <Utensils className="h-4 w-4" />}
                    <span className="text-sm font-medium">{module.data.name}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {module.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatCurrency(module.pricing.finalPrice)} {module.pricing.currency}
                    </span>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => onRemoveModule(module.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Module Selection Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="transport" className="flex items-center gap-1">
            <Car className="h-4 w-4" />
            Transport
          </TabsTrigger>
          <TabsTrigger value="hotels" className="flex items-center gap-1">
            <Hotel className="h-4 w-4" />
            Hotels
          </TabsTrigger>
          <TabsTrigger value="sightseeing" className="flex items-center gap-1">
            <Landmark className="h-4 w-4" />
            Sightseeing
          </TabsTrigger>
          <TabsTrigger value="restaurants" className="flex items-center gap-1">
            <Utensils className="h-4 w-4" />
            Restaurants
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transport" className="mt-4">
          <div className="grid gap-4">
            {getFilteredData(getRelevantTransportRoutes(), 'transport').map(renderTransportModule)}
            {getFilteredData(getRelevantTransportRoutes(), 'transport').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transport routes found for the selected criteria</p>
                <p className="text-sm">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="hotels" className="mt-4">
          <div className="grid gap-4">
            {getFilteredData(getRelevantHotels(), 'hotel').map(renderHotelModule)}
            {getFilteredData(getRelevantHotels(), 'hotel').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Hotel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hotels found for the selected criteria</p>
                <p className="text-sm">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sightseeing" className="mt-4">
          <div className="grid gap-4">
            {getFilteredData(getRelevantSightseeing(), 'sightseeing').map(renderSightseeingModule)}
            {getFilteredData(getRelevantSightseeing(), 'sightseeing').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Landmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sightseeing activities found for the selected criteria</p>
                <p className="text-sm">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="restaurants" className="mt-4">
          <div className="grid gap-4">
            {getFilteredData(getRelevantRestaurants(), 'restaurant').map(renderRestaurantModule)}
            {getFilteredData(getRelevantRestaurants(), 'restaurant').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No restaurants found for the selected criteria</p>
                <p className="text-sm">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartModuleSelector;
