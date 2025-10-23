
import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Query } from '@/types/query';
import { getCurrencySymbolByCountry } from '@/pages/inventory/transport/utils/currencyUtils';
import { useInventoryData } from '@/pages/queries/hooks/useInventoryData';
import TransportModuleTab from './TransportModuleTab';
import HotelModuleTab from './HotelModuleTab';
import SightseeingModuleTab from './SightseeingModuleTab';
import RestaurantModuleTab from './RestaurantModuleTab';
import ServicesOverview from './ServicesOverview';
import { 
  Car, Hotel, Landmark, Utensils, Plus, Search
} from 'lucide-react';

interface SmartModuleSelectorProps {
  query: Query;
  selectedModules: any[];
  onAddModule: (module: any) => void;
  onRemoveModule: (id: string) => void;
  onUpdatePricing: (id: string, pricing: any) => void;
}

const SmartModuleSelector: React.FC<SmartModuleSelectorProps> = ({
  query,
  selectedModules,
  onAddModule,
  onRemoveModule,
  onUpdatePricing,
}) => {
  const [activeTab, setActiveTab] = useState('transport');
  const country = query.destination.country;

  // Use real inventory data
  const { 
    hotels, 
    restaurants, 
    sightseeing, 
    transportRoutes, 
    loading 
  } = useInventoryData();

  // Filter real transport routes by country and destination cities
  const allTransport = useMemo(() => {
    return transportRoutes.filter(route => {
      const routeCountry = route.country || '';
      const queryCities = query.destination.cities;
      
      // Match by country and cities
      const matchesCountry = routeCountry.toLowerCase() === country.toLowerCase();
      const routeFrom = route.from || route.startLocation || '';
      const routeTo = route.to || route.endLocation || '';
      const matchesCities = queryCities.some(city => 
        routeFrom.toLowerCase().includes(city.toLowerCase()) ||
        routeTo.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(routeFrom.toLowerCase()) ||
        city.toLowerCase().includes(routeTo.toLowerCase())
      );
      
      return matchesCountry || matchesCities;
    });
  }, [transportRoutes, country, query.destination.cities]);

  // Filter real hotels by destination cities
  const allHotels = useMemo(() => {
    return hotels.filter(hotel => {
      const hotelCity = hotel.city || hotel.location;
      return query.destination.cities.some(city => 
        hotelCity?.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(hotelCity?.toLowerCase() || '')
      );
    });
  }, [hotels, query.destination.cities]);

  // Filter real sightseeing by destination cities and transform to expected type
  const allSightseeing = useMemo(() => {
    return sightseeing.filter(sight => {
      const sightCity = sight.city;
      return query.destination.cities.some(city => 
        sightCity?.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(sightCity?.toLowerCase() || '')
      );
    }).map(sight => ({
      ...sight,
      id: String(sight.id), // Convert to string to match expected type
      location: sight.city,
      basePrice: typeof sight.price === 'object' ? sight.price.adult : sight.price || 30,
      currency: getCurrencySymbolByCountry(country),
      cities: [sight.city]
    }));
  }, [sightseeing, query.destination.cities, country]);

  // Filter real restaurants by destination cities  
  const allRestaurants = useMemo(() => {
    return restaurants.filter(restaurant => {
      const restaurantCity = restaurant.city || restaurant.location;
      return query.destination.cities.some(city => 
        restaurantCity?.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(restaurantCity?.toLowerCase() || '')
      );
    });
  }, [restaurants, query.destination.cities]);

  const selectedCities = query.destination.cities;
  const transportPresent = selectedModules.some((m) => m.type === "transport");

  const currencySymbol = getCurrencySymbolByCountry(country);

  // Counts for badges - using real data
  const transportCount = allTransport.length;
  const hotelCount = allHotels.length;
  const sightseeingCount = allSightseeing.length;
  const restaurantCount = allRestaurants.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading inventory data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Services Overview */}
      <ServicesOverview
        query={query}
        selectedModules={selectedModules}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        transportCount={transportCount}
        hotelCount={hotelCount}
        sightseeingCount={sightseeingCount}
      />

      {/* Tabs for modules */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="transport" className="flex items-center gap-1">
            <Car className="h-4 w-4" />
            <span className="hidden sm:inline">Transport</span>
            <Badge variant="secondary" className="ml-1 text-xs">{transportCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="hotel" className="flex items-center gap-1">
            <Hotel className="h-4 w-4" />
            <span className="hidden sm:inline">Hotels</span>
            <Badge variant="secondary" className="ml-1 text-xs">{hotelCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sightseeing" className="flex items-center gap-1">
            <Landmark className="h-4 w-4" />
            <span className="hidden sm:inline">Sightseeing</span>
            <Badge variant="secondary" className="ml-1 text-xs">{sightseeingCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="restaurant" className="flex items-center gap-1">
            <Utensils className="h-4 w-4" />
            <span className="hidden sm:inline">Restaurants</span>
            <Badge variant="secondary" className="ml-1 text-xs">{restaurantCount}</Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="transport" className="mt-6">
          <TransportModuleTab
            country={country}
            allRoutes={allTransport}
            selectedModules={selectedModules}
            onAddModule={onAddModule}
            onRemoveModule={onRemoveModule}
            onUpdatePricing={onUpdatePricing}
          />
        </TabsContent>
        <TabsContent value="hotel" className="mt-6">
          <HotelModuleTab
            country={country}
            hotels={allHotels}
            selectedModules={selectedModules}
            onAddModule={onAddModule}
            onRemoveModule={onRemoveModule}
            onUpdatePricing={onUpdatePricing}
            query={query}
          />
        </TabsContent>
        <TabsContent value="sightseeing" className="mt-6">
          <SightseeingModuleTab
            country={country}
            sightseeing={allSightseeing}
            selectedCities={selectedCities}
            selectedModules={selectedModules}
            transportAdded={transportPresent}
            onAddModule={onAddModule}
            onRemoveModule={onRemoveModule}
            onUpdatePricing={onUpdatePricing}
            query={query}
          />
        </TabsContent>
        <TabsContent value="restaurant" className="mt-6">
          <RestaurantModuleTab
            country={country}
            selectedModules={selectedModules}
            onAddModule={onAddModule}
            onRemoveModule={onRemoveModule}
            onUpdatePricing={onUpdatePricing}
            query={query}
          />
        </TabsContent>
      </Tabs>

      {/* Selected Modules Summary */}
      {selectedModules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Services ({selectedModules.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {selectedModules.map((module) => (
                <div key={module.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span className="truncate">{module.data?.hotel?.name || module.data?.route?.name || module.data?.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{module.pricing.finalPrice} {currencySymbol}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveModule(module.id)}
                      className="h-6 w-6 p-0 text-red-500"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartModuleSelector;
