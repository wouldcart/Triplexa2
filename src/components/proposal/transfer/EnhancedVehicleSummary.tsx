import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Users, Car, AlertTriangle, TrendingUp, 
  ChevronDown, ChevronUp, Zap, Leaf,
  DollarSign, Clock, MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleDetails {
  type: string;
  name: string;
  capacity: number;
  count: number;
  price: number;
  pricePerKm?: number;
  fuelEfficiency?: number;
}

interface EnhancedVehicleSummaryProps {
  totalPax: number;
  vehicles: VehicleDetails[];
  distance?: number;
  duration?: number;
  route?: string;
  className?: string;
}

export const EnhancedVehicleSummary: React.FC<EnhancedVehicleSummaryProps> = ({
  totalPax,
  vehicles,
  distance = 0,
  duration = 0,
  route = '',
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOptimization, setShowOptimization] = useState(false);

  // Calculate metrics
  const totalCapacity = vehicles.reduce((sum, v) => sum + (v.capacity * v.count), 0);
  const totalCost = vehicles.reduce((sum, v) => sum + (v.price * v.count), 0);
  const utilizationPercent = totalCapacity > 0 ? (totalPax / totalCapacity) * 100 : 0;
  const emptySeats = Math.max(0, totalCapacity - totalPax);
  const costPerPassenger = totalPax > 0 ? totalCost / totalPax : 0;
  const efficiencyScore = utilizationPercent >= 80 ? 'Excellent' : utilizationPercent >= 60 ? 'Good' : 'Poor';

  // Optimization suggestions
  const isUnderUtilized = utilizationPercent < 60;
  const isOverCapacity = totalPax > totalCapacity;

  const getUtilizationColor = () => {
    if (utilizationPercent >= 80) return 'text-green-600 dark:text-green-400';
    if (utilizationPercent >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getEfficiencyBadgeVariant = () => {
    if (efficiencyScore === 'Excellent') return 'default';
    if (efficiencyScore === 'Good') return 'secondary';
    return 'destructive';
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              Vehicle Summary
            </CardTitle>
            <Badge variant={getEfficiencyBadgeVariant()} className="text-xs">
              {efficiencyScore} Efficiency
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalPax}</div>
              <div className="text-xs text-muted-foreground">Passengers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalCapacity}</div>
              <div className="text-xs text-muted-foreground">Total Seats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{vehicles.length}</div>
              <div className="text-xs text-muted-foreground">Vehicle Types</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">${costPerPassenger.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">Cost/Person</div>
            </div>
          </div>

          {/* Capacity Utilization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Capacity Utilization</span>
              <span className={cn("text-sm font-bold", getUtilizationColor())}>
                {utilizationPercent.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(utilizationPercent, 100)} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{totalPax} occupied</span>
              <span>{emptySeats} empty seats</span>
            </div>
          </div>

          {/* Alerts */}
          {(isUnderUtilized || isOverCapacity) && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                {isOverCapacity && (
                  <p className="text-red-800 dark:text-red-200 font-medium">
                    Capacity exceeded! Need {Math.ceil(totalPax / Math.max(...vehicles.map(v => v.capacity)))} more vehicles.
                  </p>
                )}
                {isUnderUtilized && !isOverCapacity && (
                  <p className="text-yellow-800 dark:text-yellow-200">
                    Low utilization detected. Consider optimizing vehicle selection.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1"
            >
              <TrendingUp className="h-3 w-3" />
              Detailed Breakdown
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            
            {isUnderUtilized && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOptimization(!showOptimization)}
                className="flex items-center gap-1"
              >
                <Zap className="h-3 w-3" />
                Optimize
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vehicle Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vehicles.map((vehicle, index) => {
                  const vehicleUtilization = (totalPax / (vehicle.capacity * vehicle.count)) * 100;
                  const totalVehicleCost = vehicle.price * vehicle.count;
                  
                  return (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Car className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium">{vehicle.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {vehicle.count} x {vehicle.capacity} seats
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${totalVehicleCost}</div>
                          <div className="text-sm text-muted-foreground">
                            ${vehicle.price} each
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Capacity:</span>
                          <div className="font-medium">{vehicle.capacity * vehicle.count} seats</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Utilization:</span>
                          <div className="font-medium">{Math.min(vehicleUtilization, 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cost/Seat:</span>
                          <div className="font-medium">${(totalVehicleCost / (vehicle.capacity * vehicle.count)).toFixed(0)}</div>
                        </div>
                      </div>

                      {vehicle.fuelEfficiency && distance > 0 && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Leaf className="h-3 w-3" />
                          <span>{(distance / vehicle.fuelEfficiency * vehicle.count).toFixed(1)}L fuel estimated</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Route Information */}
              {route && distance > 0 && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Route Details
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Distance:</span>
                      <div className="font-medium">{distance} km</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <div className="font-medium">{duration} hrs</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cost/km:</span>
                      <div className="font-medium">${(totalCost / distance).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Optimization Suggestions */}
      <Collapsible open={showOptimization} onOpenChange={setShowOptimization}>
        <CollapsibleContent>
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-lg text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Optimization Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isUnderUtilized && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <h5 className="font-medium text-blue-900 dark:text-blue-100">
                      Reduce Vehicle Count
                    </h5>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Consider using fewer larger vehicles to improve efficiency and reduce costs.
                    </p>
                    <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                      Potential savings: $50-150 per day
                    </div>
                  </div>
                )}
                
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <h5 className="font-medium text-green-900 dark:text-green-100">
                    Environmental Impact
                  </h5>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Current selection will produce approximately {(distance * vehicles.length * 0.2).toFixed(1)} kg CO₂
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};