
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TransportRoute } from '@/pages/inventory/transport/types/transportTypes';

interface TransportSelectorProps {
  fromCity: string;
  toCity: string;
  onSelectRoute: (route: TransportRoute | null, price?: number, vehicleType?: string) => void;
  selectedRouteId?: string;
}

const TransportSelector: React.FC<TransportSelectorProps> = ({
  fromCity,
  toCity,
  onSelectRoute,
  selectedRouteId
}) => {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("");
  const [customPrice, setCustomPrice] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  // Load routes from localStorage
  useEffect(() => {
    const loadRoutes = () => {
      try {
        const savedRoutes = localStorage.getItem('transportRoutes');
        if (savedRoutes) {
          const parsedRoutes = JSON.parse(savedRoutes) as TransportRoute[];
          // Filter routes based on fromCity and toCity if they exist
          let filteredRoutes = parsedRoutes;
          
          if (fromCity && toCity) {
            filteredRoutes = parsedRoutes.filter(route => {
              const matchesStart = route.startLocation.toLowerCase().includes(fromCity.toLowerCase()) || 
                                  route.startLocationFullName?.toLowerCase().includes(fromCity.toLowerCase());
              const matchesEnd = route.endLocation.toLowerCase().includes(toCity.toLowerCase()) || 
                               route.endLocationFullName?.toLowerCase().includes(toCity.toLowerCase());
              return matchesStart && matchesEnd;
            });
          }
          
          setRoutes(filteredRoutes);
          
          // If there's a selectedRouteId, find and select that route
          if (selectedRouteId) {
            const route = filteredRoutes.find(r => r.id === selectedRouteId);
            if (route) {
              setSelectedRoute(route);
              // If the route has transport types, select the first one by default
              if (route.transportTypes && route.transportTypes.length > 0) {
                setSelectedVehicleType(route.transportTypes[0].type);
                setCustomPrice(route.transportTypes[0].price);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading transport routes:', error);
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };

    loadRoutes();
  }, [fromCity, toCity, selectedRouteId]);

  // When a route is selected
  const handleRouteChange = (routeId: string) => {
    if (routeId === "none") {
      setSelectedRoute(null);
      setSelectedVehicleType("");
      setCustomPrice(undefined);
      onSelectRoute(null);
      return;
    }
    
    const route = routes.find(r => r.id === routeId);
    if (route) {
      setSelectedRoute(route);
      
      // Reset vehicle type and price
      if (route.transportTypes && route.transportTypes.length > 0) {
        setSelectedVehicleType(route.transportTypes[0].type);
        setCustomPrice(route.transportTypes[0].price);
        onSelectRoute(route, route.transportTypes[0].price, route.transportTypes[0].type);
      } else {
        setSelectedVehicleType("");
        setCustomPrice(route.price);
        onSelectRoute(route, route.price);
      }
    } else {
      setSelectedRoute(null);
      setSelectedVehicleType("");
      setCustomPrice(undefined);
      onSelectRoute(null);
    }
  };

  // When a vehicle type is selected
  const handleVehicleTypeChange = (vehicleType: string) => {
    if (selectedRoute && selectedRoute.transportTypes) {
      const vehicleDetails = selectedRoute.transportTypes.find(t => t.type === vehicleType);
      if (vehicleDetails) {
        setSelectedVehicleType(vehicleType);
        setCustomPrice(vehicleDetails.price);
        onSelectRoute(selectedRoute, vehicleDetails.price, vehicleType);
      }
    }
  };

  // When price is changed manually
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = parseFloat(e.target.value);
    setCustomPrice(isNaN(price) ? undefined : price);
    if (selectedRoute && !isNaN(price)) {
      onSelectRoute(selectedRoute, price, selectedVehicleType);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading transport options...</div>;
  }

  if (routes.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No transport routes found between {fromCity} and {toCity}. 
        <span className="block mt-1">
          Please add routes in Transport Management or select different cities.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="transport-route">Select Route</Label>
        <Select 
          value={selectedRoute?.id || "none"}
          onValueChange={handleRouteChange}
        >
          <SelectTrigger id="transport-route">
            <SelectValue placeholder="Select a route" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {routes.map(route => (
              <SelectItem key={route.id} value={route.id}>
                {route.name || `${route.startLocationFullName || route.startLocation} to ${route.endLocationFullName || route.endLocation}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedRoute && selectedRoute.transportTypes && selectedRoute.transportTypes.length > 0 && (
        <div>
          <Label htmlFor="vehicle-type">Vehicle Type</Label>
          <Select 
            value={selectedVehicleType} 
            onValueChange={handleVehicleTypeChange}
          >
            <SelectTrigger id="vehicle-type">
              <SelectValue placeholder="Select vehicle type" />
            </SelectTrigger>
            <SelectContent>
              {selectedRoute.transportTypes.map((transport, idx) => (
                <SelectItem key={idx} value={transport.type}>
                  {transport.type} ({transport.seatingCapacity} seats)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="transport-price">Price</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {/* Use a default currency symbol if route doesn't have one */}
            $
          </span>
          <Input 
            id="transport-price"
            type="number"
            className="pl-8"
            value={customPrice !== undefined ? customPrice : ''}
            onChange={handlePriceChange}
            placeholder="Enter price"
          />
        </div>
      </div>

      {selectedRoute && (
        <div className="text-sm text-gray-500 mt-2">
          <p className="font-medium">Route Details:</p>
          <p>Distance: {selectedRoute.distance} km</p>
          <p>Duration: {selectedRoute.duration}</p>
        </div>
      )}
    </div>
  );
};

export default TransportSelector;
