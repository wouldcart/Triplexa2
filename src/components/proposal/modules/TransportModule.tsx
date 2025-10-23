
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Query } from '@/types/query';
import { formatCurrency } from '@/lib/formatters';
import { Car, Users, Clock, MapPin, Plus, Edit } from 'lucide-react';

interface TransportRoute {
  id: string;
  from: string;
  to: string;
  distance: number;
  duration: string;
  vehicleTypes: VehicleType[];
  transferType: 'airport' | 'city' | 'intercity' | 'sightseeing';
}

interface VehicleType {
  id: string;
  name: string;
  capacity: number;
  type: 'sedan' | 'suv' | 'van' | 'bus' | 'minibus';
  price: number;
  currency: string;
  features: string[];
}

interface TransportModuleProps {
  query: Query;
  onAddModule: (module: any) => void;
  selectedModules: any[];
}

const TransportModule: React.FC<TransportModuleProps> = ({ query, onAddModule, selectedModules }) => {
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [editingMode, setEditingMode] = useState<boolean>(false);

  useEffect(() => {
    loadTransportRoutes();
  }, [query.destination.cities]);

  const loadTransportRoutes = () => {
    // Mock transport routes based on query cities
    const cities = query.destination.cities;
    const mockRoutes: TransportRoute[] = [
      {
        id: '1',
        from: 'Bangkok Airport (BKK)',
        to: cities[0],
        distance: 35,
        duration: '45 mins',
        transferType: 'airport',
        vehicleTypes: [
          {
            id: 'v1',
            name: 'Standard Sedan',
            capacity: 3,
            type: 'sedan',
            price: 1200,
            currency: 'THB',
            features: ['AC', 'English Speaking Driver']
          },
          {
            id: 'v2',
            name: 'Premium SUV',
            capacity: 6,
            type: 'suv',
            price: 1800,
            currency: 'THB',
            features: ['AC', 'English Speaking Driver', 'WiFi', 'Refreshments']
          },
          {
            id: 'v3',
            name: 'Tourist Van',
            capacity: 10,
            type: 'van',
            price: 2500,
            currency: 'THB',
            features: ['AC', 'English Speaking Driver', 'Large Luggage Space']
          }
        ]
      }
    ];

    // Add intercity routes if multiple cities
    if (cities.length > 1) {
      for (let i = 0; i < cities.length - 1; i++) {
        mockRoutes.push({
          id: `intercity_${i}`,
          from: cities[i],
          to: cities[i + 1],
          distance: 150,
          duration: '2.5 hours',
          transferType: 'intercity',
          vehicleTypes: [
            {
              id: `iv${i}_1`,
              name: 'AC Coach',
              capacity: 40,
              type: 'bus',
              price: 800,
              currency: 'THB',
              features: ['AC', 'Reclining Seats', 'Onboard Restroom']
            },
            {
              id: `iv${i}_2`,
              name: 'Private Van',
              capacity: 12,
              type: 'van',
              price: 3500,
              currency: 'THB',
              features: ['AC', 'English Speaking Driver', 'Flexible Timing']
            }
          ]
        });
      }
    }

    setTransportRoutes(mockRoutes);
  };

  const handleAddTransport = () => {
    const route = transportRoutes.find(r => r.id === selectedRoute);
    const vehicle = route?.vehicleTypes.find(v => v.id === selectedVehicle);
    
    if (route && vehicle) {
      const finalPrice = editingMode ? customPrice : vehicle.price;
      
      onAddModule({
        id: `transport_${Date.now()}`,
        type: 'transport',
        data: {
          route,
          vehicle,
          isCustomPrice: editingMode,
          passengers: query.paxDetails.adults + query.paxDetails.children
        },
        pricing: {
          basePrice: finalPrice,
          finalPrice: finalPrice,
          currency: vehicle.currency
        }
      });

      // Reset selections
      setSelectedRoute('');
      setSelectedVehicle('');
      setCustomPrice(0);
      setEditingMode(false);
    }
  };

  const getSelectedRoute = () => transportRoutes.find(r => r.id === selectedRoute);
  const getSelectedVehicle = () => {
    const route = getSelectedRoute();
    return route?.vehicleTypes.find(v => v.id === selectedVehicle);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Transport Routes & Vehicles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Route Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Route</label>
            <Select value={selectedRoute} onValueChange={setSelectedRoute}>
              <SelectTrigger>
                <SelectValue placeholder="Choose transport route" />
              </SelectTrigger>
              <SelectContent>
                {transportRoutes.map(route => (
                  <SelectItem key={route.id} value={route.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{route.from} → {route.to}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {route.duration}
                        <MapPin className="h-3 w-3" />
                        {route.distance}km
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle Selection */}
          {selectedRoute && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Vehicle</label>
              <div className="grid gap-3">
                {getSelectedRoute()?.vehicleTypes.map(vehicle => (
                  <div
                    key={vehicle.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedVehicle === vehicle.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{vehicle.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Up to {vehicle.capacity} passengers
                          </span>
                          <Badge variant="outline" className="capitalize">
                            {vehicle.type}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {vehicle.features.map(feature => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(vehicle.price)} {vehicle.currency}
                        </div>
                        <div className="text-xs text-muted-foreground">per trip</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Pricing */}
          {selectedVehicle && (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Custom Pricing</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMode(!editingMode)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {editingMode ? 'Use Standard' : 'Edit Price'}
                </Button>
              </div>
              
              {editingMode && (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Enter custom price"
                    value={customPrice || ''}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                  />
                  <div className="flex items-center px-3 bg-muted rounded">
                    {getSelectedVehicle()?.currency}
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleAddTransport} 
                className="w-full"
                disabled={!selectedRoute || !selectedVehicle}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transport
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Transports Preview */}
      {selectedModules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Transports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedModules.map(module => (
                <div key={module.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <div className="font-medium text-sm">
                      {module.data.route.from} → {module.data.route.to}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {module.data.vehicle.name} • {module.data.vehicle.capacity} PAX
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(module.pricing.finalPrice)} {module.pricing.currency}
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

export default TransportModule;
