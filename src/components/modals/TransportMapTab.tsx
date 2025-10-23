import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RouteMap from './RouteMap';
import { useTransportData } from '@/pages/inventory/transport/hooks/useTransportData';
import { TransportRoute } from '@/pages/inventory/transport/types/transportTypes';
import { MapPin, Filter, Map } from 'lucide-react';

const TransportMapTab: React.FC = () => {
  const transportData = useTransportData({ itemsPerPage: 50 });
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);
  const [countryFilter, setCountryFilter] = useState<string>('all');

  // Get unique countries for filter
  const countries = Array.from(new Set(transportData.routes.map(route => route.country))).filter(Boolean);

  // Filter routes by country
  const filteredRoutes = countryFilter === 'all' 
    ? transportData.routes 
    : transportData.routes.filter(route => route.country === countryFilter);

  // Get active routes only
  const activeRoutes = filteredRoutes.filter(route => 
    (typeof route.status === 'string' && route.status === 'active') || 
    (typeof route.status === 'boolean' && route.status === true)
  );

  const handleRouteSelect = (routeId: string) => {
    const route = transportData.routes.find(r => r.id === routeId);
    setSelectedRoute(route || null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Map className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Transport Routes Map</h2>
        <Badge variant="secondary">{activeRoutes.length} routes</Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-4 h-4" />
            Route Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Country Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Country</label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Route Selection */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Select Route</label>
              <Select onValueChange={handleRouteSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a route to view on map" />
                </SelectTrigger>
                <SelectContent>
                  {activeRoutes.map(route => (
                    <SelectItem key={route.id} value={route.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {route.startLocation || route.from} → {route.endLocation || route.to}
                        {route.distance && (
                          <Badge variant="outline" className="ml-2">
                            {route.distance} km
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Route Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Select</label>
            <div className="flex flex-wrap gap-2">
              {activeRoutes.slice(0, 6).map(route => (
                <Button
                  key={route.id}
                  variant={selectedRoute?.id === route.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRoute(route)}
                  className="text-xs"
                >
                  {route.startLocation || route.from} → {route.endLocation || route.to}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Display */}
      {selectedRoute ? (
        <RouteMap
          startLocation={selectedRoute.startLocation || selectedRoute.from || ''}
          endLocation={selectedRoute.endLocation || selectedRoute.to || ''}
          intermediateStops={selectedRoute.intermediateStops || []}
          distance={selectedRoute.distance}
          duration={selectedRoute.duration}
          transportType={selectedRoute.transportTypes?.[0]?.name || selectedRoute.transportTypes?.[0]?.type || 'Vehicle'}
          className="min-h-[400px]"
        />
      ) : (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Map className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Select a Route</h3>
              <p className="text-muted-foreground">
                Choose a transport route from the dropdown above to view it on the map
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Route Summary */}
      {selectedRoute && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Route Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Route Code</div>
                <div className="font-medium">{selectedRoute.code || selectedRoute.id}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Distance</div>
                <div className="font-medium">{selectedRoute.distance || 'N/A'} km</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Duration</div>
                <div className="font-medium">{selectedRoute.duration || 'N/A'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Transfer Type</div>
                <div className="font-medium">{selectedRoute.transferType || 'Direct'}</div>
              </div>
            </div>

            {selectedRoute.description && (
              <div className="mt-4 space-y-1">
                <div className="text-sm text-muted-foreground">Description</div>
                <div className="text-sm">{selectedRoute.description}</div>
              </div>
            )}

            {selectedRoute.transportTypes && selectedRoute.transportTypes.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-sm text-muted-foreground">Available Transport Types</div>
                <div className="flex flex-wrap gap-2">
                  {selectedRoute.transportTypes.map((type, index) => (
                    <Badge key={index} variant="outline">
                      {type.name || type.type} - {type.seatingCapacity} seats
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TransportMapTab;