import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Car, Plus, X, Users, Calculator, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CapacityValidator } from './CapacityValidator';
import { VehicleQuantitySelector } from './VehicleQuantitySelector';
interface VehicleType {
  id: string;
  type: string;
  capacity: number;
  price: number;
  quantity: number;
  priceUnit: 'per-person' | 'per-vehicle';
}
interface AdvancedTransferConfigurationProps {
  totalPax: number;
  availableVehicleTypes: any[];
  selectedTransfer: any;
  onTransferUpdate: (transfer: any) => void;
  currency: {
    symbol: string;
    code: string;
  };
  className?: string;
}
export const AdvancedTransferConfiguration: React.FC<AdvancedTransferConfigurationProps> = ({
  totalPax,
  availableVehicleTypes,
  selectedTransfer,
  onTransferUpdate,
  currency,
  className
}) => {
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleType[]>([]);
  const [pricingUnit, setPricingUnit] = useState<'per-person' | 'per-vehicle'>(selectedTransfer?.priceUnit || 'per-person');

  // Helper function to parse capacity from string format like "1-4" or "1-10"
  const parseCapacity = (capacity: any): number => {
    if (typeof capacity === 'number') return capacity;
    if (typeof capacity === 'string') {
      // Handle formats like "1-4", "1-10", etc.
      const match = capacity.match(/(\d+)-(\d+)/);
      if (match) {
        return parseInt(match[2]); // Return the maximum capacity
      }
      // Handle single numbers as strings
      const parsed = parseInt(capacity);
      return isNaN(parsed) ? 4 : parsed;
    }
    return 4; // Default fallback
  };

  // Helper function to normalize pricing unit
  const normalizePricingUnit = (unit: string): 'per-person' | 'per-vehicle' => {
    if (!unit) return 'per-person';
    const normalized = unit.toLowerCase().replace(/\s+/g, '-');
    return normalized === 'per-vehicle' || normalized === 'per-unit' ? 'per-vehicle' : 'per-person';
  };
  useEffect(() => {
    // Initialize with current selected transfer if exists
    if (selectedTransfer?.type && availableVehicleTypes.length > 0) {
      const vehicleType = availableVehicleTypes.find(v => v.type === selectedTransfer.type || v.vehicleType === selectedTransfer.type);
      if (vehicleType && selectedVehicles.length === 0) {
        const vehiclePricingUnit = normalizePricingUnit(vehicleType.priceUnit || selectedTransfer.priceUnit || 'per-person');
        setSelectedVehicles([{
          id: vehicleType.id || vehicleType.type,
          type: vehicleType.vehicleType || vehicleType.type,
          capacity: parseCapacity(vehicleType.capacity),
          price: selectedTransfer.price || vehicleType.price || 25,
          quantity: 1,
          priceUnit: vehiclePricingUnit
        }]);

        // Auto-set the pricing unit based on the vehicle's natural pricing
        setPricingUnit(vehiclePricingUnit);
      }
    }
  }, [selectedTransfer, availableVehicleTypes]);
  const addVehicleType = (vehicleTypeId?: string) => {
    if (availableVehicleTypes.length > 0) {
      // Use specified vehicle type or default to first available
      const selectedVehicleType = vehicleTypeId ? availableVehicleTypes.find(v => (v.id || v.type) === vehicleTypeId) : availableVehicleTypes[0];
      if (!selectedVehicleType) return;
      const vehiclePricingUnit = normalizePricingUnit(selectedVehicleType.priceUnit || 'per-person');
      const newVehicle: VehicleType = {
        id: `${selectedVehicleType.id || selectedVehicleType.type}-${Date.now()}`,
        type: selectedVehicleType.vehicleType || selectedVehicleType.type,
        capacity: parseCapacity(selectedVehicleType.capacity),
        price: selectedVehicleType.price || 25,
        quantity: 1,
        priceUnit: vehiclePricingUnit
      };

      // Auto-set pricing unit if this is the first vehicle or if all vehicles have the same pricing unit
      if (selectedVehicles.length === 0 || selectedVehicles.every(v => v.priceUnit === vehiclePricingUnit)) {
        setPricingUnit(vehiclePricingUnit);
      }
      setSelectedVehicles([...selectedVehicles, newVehicle]);
    }
  };

  // Smart suggestion for optimal vehicle combination
  const suggestOptimalVehicles = () => {
    const validTotalPax = Number(totalPax) || 0;
    if (validTotalPax === 0 || availableVehicleTypes.length === 0) return;

    // Sort vehicles by efficiency (capacity vs cost)
    const sortedVehicles = [...availableVehicleTypes].sort((a, b) => {
      const aCapacity = parseCapacity(a.capacity);
      const bCapacity = parseCapacity(b.capacity);
      const aEfficiency = aCapacity / (a.price || 1);
      const bEfficiency = bCapacity / (b.price || 1);
      return bEfficiency - aEfficiency;
    });
    const suggestion: VehicleType[] = [];
    let remainingPax = validTotalPax;

    // Greedy algorithm to find optimal combination
    for (const vehicleType of sortedVehicles) {
      if (remainingPax <= 0) break;
      const capacity = parseCapacity(vehicleType.capacity);
      if (capacity > 0) {
        const quantity = Math.floor(remainingPax / capacity);
        if (quantity > 0) {
          suggestion.push({
            id: `${vehicleType.id || vehicleType.type}-suggested`,
            type: vehicleType.vehicleType || vehicleType.type,
            capacity,
            price: vehicleType.price || 25,
            quantity,
            priceUnit: normalizePricingUnit(vehicleType.priceUnit || 'per-person')
          });
          remainingPax -= quantity * capacity;
        }
      }
    }

    // Add one more vehicle if there are remaining passengers
    if (remainingPax > 0 && sortedVehicles.length > 0) {
      const bestForRemaining = sortedVehicles.find(v => parseCapacity(v.capacity) >= remainingPax) || sortedVehicles[0];
      suggestion.push({
        id: `${bestForRemaining.id || bestForRemaining.type}-final`,
        type: bestForRemaining.vehicleType || bestForRemaining.type,
        capacity: parseCapacity(bestForRemaining.capacity),
        price: bestForRemaining.price || 25,
        quantity: 1,
        priceUnit: normalizePricingUnit(bestForRemaining.priceUnit || 'per-person')
      });
    }
    setSelectedVehicles(suggestion);
  };
  const removeVehicleType = (vehicleId: string) => {
    setSelectedVehicles(selectedVehicles.filter(v => v.id !== vehicleId));
  };
  const updateVehicleType = (vehicleId: string, updates: Partial<VehicleType>) => {
    setSelectedVehicles(selectedVehicles.map(v => v.id === vehicleId ? {
      ...v,
      ...updates
    } : v));
  };
  const updateVehicleQuantity = (vehicleId: string, quantity: number) => {
    updateVehicleType(vehicleId, {
      quantity
    });
  };

  // Calculate totals with proper validation
  const totalCapacity = selectedVehicles.reduce((sum, v) => {
    const capacity = Number(v.capacity) || 0;
    const quantity = Number(v.quantity) || 0;
    return sum + capacity * quantity;
  }, 0);
  const totalCost = selectedVehicles.reduce((sum, v) => {
    const price = Number(v.price) || 0;
    const quantity = Number(v.quantity) || 0;
    const validTotalPax = Number(totalPax) || 0;
    if (v.priceUnit === 'per-vehicle') {
      return sum + price * quantity;
    } else {
      return sum + price * validTotalPax;
    }
  }, 0);
  const getCapacityStatus = () => {
    const validTotalPax = Number(totalPax) || 0;
    if (totalCapacity < validTotalPax) return 'insufficient';
    if (totalCapacity <= validTotalPax * 1.2) return 'optimal';
    return 'excess';
  };
  const capacityStatus = getCapacityStatus();
  const getSuggestion = () => {
    const validTotalPax = Number(totalPax) || 0;
    switch (capacityStatus) {
      case 'insufficient':
        const needed = validTotalPax - totalCapacity;
        return {
          type: 'warning',
          icon: AlertTriangle,
          title: 'Insufficient Capacity',
          message: `Need ${needed} more seat${needed > 1 ? 's' : ''} to accommodate all passengers.`
        };
      case 'optimal':
        return {
          type: 'success',
          icon: CheckCircle,
          title: 'Optimal Configuration',
          message: 'Perfect capacity utilization with minimal excess seats.'
        };
      case 'excess':
        const excess = totalCapacity - validTotalPax;
        return {
          type: 'info',
          icon: TrendingUp,
          title: 'Excess Capacity',
          message: `${excess} extra seat${excess > 1 ? 's' : ''} available. Consider optimizing for cost efficiency.`
        };
      default:
        return null;
    }
  };
  const suggestion = getSuggestion();

  // Update parent component when changes occur
  useEffect(() => {
    if (selectedVehicles.length > 0) {
      const mainVehicle = selectedVehicles[0];
      const validTotalPax = Number(totalPax) || 0;
      onTransferUpdate({
        ...selectedTransfer,
        type: mainVehicle.type,
        price: pricingUnit === 'per-person' && validTotalPax > 0 ? totalCost / validTotalPax : totalCost,
        priceUnit: pricingUnit,
        vehicleConfiguration: selectedVehicles,
        totalCapacity,
        totalCost
      });
    }
  }, [selectedVehicles, pricingUnit, totalPax, totalCost, totalCapacity]);
  return <div className={cn("space-y-3", className)}>
      {/* Compact Header with Summary */}
      <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/20 p-2 rounded-lg">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
            <Car className="h-2 w-2 text-white" />
          </div>
          <span className="text-xs font-semibold text-blue-900 dark:text-blue-200 truncate">Transfer Config</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-3 text-xs flex-wrap">
          <Badge variant="outline" className="text-xs px-1 shrink-0">
            {Number(totalPax) || 0} pax
          </Badge>
          {selectedVehicles.length > 0 && <>
              <span className="text-blue-600 dark:text-blue-400 hidden sm:inline">{totalCapacity} seats</span>
              <span className="font-semibold text-green-600 dark:text-green-400 text-xs">
                {currency.symbol}{totalCost.toLocaleString()}
              </span>
            </>}
        </div>
      </div>

      {/* Compact Vehicle Configuration */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 shrink-0">Vehicles</Label>
            <div className="flex items-center gap-1 min-w-0">
              <Button variant="outline" size="sm" onClick={suggestOptimalVehicles} className="h-6 px-1 sm:px-2 text-xs text-blue-600 hover:text-blue-700 shrink-0" disabled={availableVehicleTypes.length === 0 || !totalPax} title="Auto-optimize vehicle selection">
                <Calculator className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Optimize</span>
              </Button>
              <Select onValueChange={value => addVehicleType(value)}>
                <SelectTrigger className="h-6 w-20 sm:w-28 text-xs">
                  <SelectValue placeholder="Add" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicleTypes.map(vehicleType => <SelectItem key={vehicleType.id || vehicleType.type} value={vehicleType.id || vehicleType.type}>
                      <div className="flex items-center justify-between w-full">
                        <span>{vehicleType.vehicleType || vehicleType.type}</span>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge variant="secondary" className="text-xs">
                            {parseCapacity(vehicleType.capacity)} seats
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {currency.symbol}{vehicleType.price || 0}
                          </span>
                        </div>
                      </div>
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
        </div>

        {selectedVehicles.map(vehicle => <div key={vehicle.id} className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-sm">
            {/* Vehicle Type and Removal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Select value={vehicle.type} onValueChange={value => {
              const vehicleType = availableVehicleTypes.find(v => (v.vehicleType || v.type) === value);
              if (vehicleType) {
                const vehiclePricingUnit = normalizePricingUnit(vehicleType.priceUnit || 'per-person');
                updateVehicleType(vehicle.id, {
                  type: value,
                  capacity: parseCapacity(vehicleType.capacity),
                  price: vehicleType.price || 25,
                  priceUnit: vehiclePricingUnit
                });

                // Auto-update pricing unit if this vehicle type has a different natural pricing
                if (selectedVehicles.length === 1 || selectedVehicles.every(v => v.id === vehicle.id || v.priceUnit === vehiclePricingUnit)) {
                  setPricingUnit(vehiclePricingUnit);
                }
              }
            }}>
                  <SelectTrigger className="h-8 min-w-32 w-auto max-w-48 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicleTypes.map(option => <SelectItem key={option.id || option.type} value={option.vehicleType || option.type}>
                        {option.vehicleType || option.type}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                <Badge variant="secondary" className="text-xs px-1">
                  {vehicle.capacity}
                </Badge>
              </div>
              
              {/* Quantity Controls */}
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <Button variant="outline" size="sm" onClick={() => updateVehicleQuantity(vehicle.id, Math.max(1, vehicle.quantity - 1))} disabled={vehicle.quantity <= 1} className="h-5 w-5 sm:h-6 sm:w-6 p-0">
                  <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </Button>
                <span className="text-xs font-medium min-w-[1rem] sm:min-w-[1.5rem] text-center">
                  {vehicle.quantity}
                </span>
                <Button variant="outline" size="sm" onClick={() => updateVehicleQuantity(vehicle.id, vehicle.quantity + 1)} className="h-5 w-5 sm:h-6 sm:w-6 p-0">
                  <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </Button>
                
                <Button variant="ghost" size="sm" onClick={() => removeVehicleType(vehicle.id)} disabled={selectedVehicles.length === 1} className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-red-500 hover:text-red-700 ml-0.5 sm:ml-1">
                  <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </Button>
              </div>
            </div>

            {/* Compact Quantity and Capacity */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <VehicleQuantitySelector vehicleCount={vehicle.quantity} onVehicleCountChange={count => updateVehicleQuantity(vehicle.id, count)} vehicleName={vehicle.type} vehicleCapacity={vehicle.capacity} totalPax={Number(totalPax) || 0} pricePerVehicle={vehicle.price} currency={currency.code} className="text-xs" />
              </div>
              
            </div>
          </div>)}

        {selectedVehicles.length === 0 && <div className="text-center py-3 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
            <Car className="h-6 w-6 mx-auto mb-1 opacity-50" />
            <p className="text-xs mb-2">No vehicles selected</p>
            <Button variant="outline" size="sm" onClick={() => addVehicleType()} className="h-6 px-2 text-xs" disabled={availableVehicleTypes.length === 0}>
              <Plus className="h-3 w-3 mr-1" />
              Add Vehicle
            </Button>
          </div>}
      </div>

      {/* Compact Pricing Unit */}
      {selectedVehicles.length > 0 && <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 shrink-0">Price:</Label>
          <div className="flex flex-wrap gap-1">
            <label className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded text-xs border cursor-pointer transition-all ${pricingUnit === 'per-person' ? 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-600' : 'bg-white border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-600'}`}>
              <input type="radio" checked={pricingUnit === 'per-person'} onChange={() => setPricingUnit('per-person')} className="h-3 w-3 text-blue-600 focus:ring-blue-500" />
              <span className="whitespace-nowrap">Per Person</span>
            </label>
            <label className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded text-xs border cursor-pointer transition-all ${pricingUnit === 'per-vehicle' ? 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-600' : 'bg-white border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-600'}`}>
              <input type="radio" checked={pricingUnit === 'per-vehicle'} onChange={() => setPricingUnit('per-vehicle')} className="h-3 w-3 text-blue-600 focus:ring-blue-500" />
              <span className="whitespace-nowrap">Per Vehicle</span>
            </label>
          </div>
        </div>}

      {/* Compact Summary Row */}
      {selectedVehicles.length > 0 && <div className="bg-gray-50 dark:bg-gray-900/50 rounded-md p-2 hidden">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="font-bold text-blue-600 dark:text-blue-400">{totalCapacity}</div>
              <div className="text-gray-600 dark:text-gray-400">Seats</div>
            </div>
            <div>
              <div className="font-bold text-gray-800 dark:text-gray-200">{Number(totalPax) || 0}</div>
              <div className="text-gray-600 dark:text-gray-400">Pax</div>
            </div>
            <div>
              <div className={cn("font-bold", capacityStatus === 'insufficient' && "text-red-600 dark:text-red-400", capacityStatus === 'optimal' && "text-green-600 dark:text-green-400", capacityStatus === 'excess' && "text-yellow-600 dark:text-yellow-400")}>
                {totalCapacity > 0 && totalPax > 0 ? Math.round((Number(totalPax) || 0) / totalCapacity * 100) : 0}%
              </div>
              <div className="text-gray-600 dark:text-gray-400">Usage</div>
            </div>
            <div>
              <div className="font-bold text-green-600 dark:text-green-400">
                {currency.symbol}{totalCost.toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total</div>
            </div>
          </div>
          <div className="text-center mt-1 text-xs text-green-700 dark:text-green-300">
            {(Number(totalPax) || 0) > 0 ? currency.symbol + (totalCost / (Number(totalPax) || 1)).toFixed(2) : currency.symbol + '0.00'} per person
          </div>
        </div>}

      {/* Compact Smart Suggestions */}
      {suggestion && selectedVehicles.length > 0 && <Alert className={cn("p-2", suggestion.type === 'warning' && "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30", suggestion.type === 'success' && "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30", suggestion.type === 'info' && "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30")}>
          <suggestion.icon className={cn("h-3 w-3", suggestion.type === 'warning' && "text-red-600 dark:text-red-400", suggestion.type === 'success' && "text-green-600 dark:text-green-400", suggestion.type === 'info' && "text-yellow-600 dark:text-yellow-400")} />
          <AlertDescription className="text-xs">
            <div className="font-medium">{suggestion.title}</div>
            <div>{suggestion.message}</div>
          </AlertDescription>
        </Alert>}
    </div>;
};
export default AdvancedTransferConfiguration;