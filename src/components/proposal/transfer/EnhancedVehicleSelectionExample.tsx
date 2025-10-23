import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedVehicleSelectionDialog, VehicleSelectionResult } from './forms/EnhancedVehicleSelectionDialog';
import { VehicleOption } from './forms/SmartCombinationForm';
import { Car, Users, Settings, Calculator } from 'lucide-react';

// Example vehicle data
const sampleVehicles: VehicleOption[] = [
  {
    type: 'Sedan',
    capacity: 4,
    price: 50,
    features: ['Air Conditioning', 'GPS'],
    wheelchairAccessible: false,
    premiumLevel: 'standard'
  },
  {
    type: 'SUV',
    capacity: 7,
    price: 80,
    features: ['Air Conditioning', 'GPS', 'Extra Luggage'],
    wheelchairAccessible: false,
    premiumLevel: 'standard'
  },
  {
    type: 'Van',
    capacity: 12,
    price: 120,
    features: ['Air Conditioning', 'GPS', 'Extra Luggage', 'WiFi'],
    wheelchairAccessible: true,
    premiumLevel: 'standard'
  },
  {
    type: 'Luxury Sedan',
    capacity: 4,
    price: 100,
    features: ['Premium Interior', 'Chauffeur', 'WiFi', 'Refreshments'],
    wheelchairAccessible: false,
    premiumLevel: 'luxury'
  },
  {
    type: 'Premium Van',
    capacity: 8,
    price: 180,
    features: ['Luxury Interior', 'Professional Driver', 'WiFi', 'Refreshments'],
    wheelchairAccessible: true,
    premiumLevel: 'premium'
  }
];

interface EnhancedVehicleSelectionExampleProps {
  totalPax?: number;
  currency?: string;
  routeDistance?: number;
}

export const EnhancedVehicleSelectionExample: React.FC<EnhancedVehicleSelectionExampleProps> = ({
  totalPax = 8,
  currency = 'USD',
  routeDistance = 25
}) => {
  const [selectedResult, setSelectedResult] = React.useState<VehicleSelectionResult | null>(null);

  const handleSelectionConfirm = (result: VehicleSelectionResult) => {
    setSelectedResult(result);
    console.log('Vehicle selection confirmed:', result);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-600" />
            Enhanced Vehicle Selection Demo
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                <strong>{totalPax}</strong> passengers
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                <strong>{sampleVehicles.length}</strong> vehicle types
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                Route: <strong>{routeDistance} km</strong>
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <EnhancedVehicleSelectionDialog
              totalPax={totalPax}
              availableVehicles={sampleVehicles}
              currency={currency}
              routeDistance={routeDistance}
              onSelectionConfirm={handleSelectionConfirm}
              defaultTab="smart"
            >
              <Button className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Smart Combinations
              </Button>
            </EnhancedVehicleSelectionDialog>

            <EnhancedVehicleSelectionDialog
              totalPax={totalPax}
              availableVehicles={sampleVehicles}
              currency={currency}
              routeDistance={routeDistance}
              onSelectionConfirm={handleSelectionConfirm}
              defaultTab="manual"
            >
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Manual Selection
              </Button>
            </EnhancedVehicleSelectionDialog>
          </div>

          {selectedResult && (
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="h-5 w-5 text-green-600" />
                  Selected Configuration
                  <Badge variant={selectedResult.type === 'smart' ? 'default' : 'secondary'} className="ml-auto">
                    {selectedResult.type === 'smart' ? 'Smart' : 'Manual'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Configuration</div>
                    <div className="font-medium">{selectedResult.summary}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Vehicles</div>
                    <div className="font-medium">{selectedResult.totalVehicles}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Capacity</div>
                    <div className="font-medium">{selectedResult.totalCapacity} seats</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Price</div>
                    <div className="font-bold text-green-600">
                      {currency} {selectedResult.totalPrice}
                    </div>
                  </div>
                </div>

                {selectedResult.type === 'smart' && selectedResult.smartCombination && (
                  <div className="p-3 bg-white dark:bg-gray-900/30 rounded border">
                    <div className="text-sm font-medium mb-2">Smart Combination Details:</div>
                    <div className="text-xs text-muted-foreground">
                      <div>Efficiency Score: {Math.round(selectedResult.smartCombination.efficiency * 100)}%</div>
                      <div>Comfort Score: {Math.round(selectedResult.smartCombination.comfortScore)}</div>
                      <div>Recommendation: {selectedResult.smartCombination.recommendation}</div>
                    </div>
                  </div>
                )}

                {selectedResult.type === 'manual' && selectedResult.manualSelection && (
                  <div className="p-3 bg-white dark:bg-gray-900/30 rounded border">
                    <div className="text-sm font-medium mb-2">Manual Selection Details:</div>
                    <div className="space-y-1">
                      {selectedResult.manualSelection.selections.map((sel, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground flex justify-between">
                          <span>{sel.quantity}x {sel.vehicleType}</span>
                          <span>{currency} {sel.subtotal}</span>
                        </div>
                      ))}
                    </div>
                    {selectedResult.manualSelection.warnings.length > 0 && (
                      <div className="mt-2 text-xs text-yellow-600">
                        Warnings: {selectedResult.manualSelection.warnings.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Available Vehicles Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Vehicle Types</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleVehicles.map((vehicle) => (
              <div key={vehicle.type} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{vehicle.type}</div>
                  <Badge variant={
                    vehicle.premiumLevel === 'luxury' ? 'default' :
                    vehicle.premiumLevel === 'premium' ? 'secondary' : 'outline'
                  }>
                    {vehicle.premiumLevel}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Capacity:</span>
                    <span>{vehicle.capacity} seats</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span>{currency} {vehicle.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wheelchair:</span>
                    <span>{vehicle.wheelchairAccessible ? '✓' : '✗'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};