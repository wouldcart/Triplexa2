import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Users, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedVehicleSummary } from './EnhancedVehicleSummary';
import { VehicleCapacityOptimizer } from './VehicleCapacityOptimizer';
import { VehiclePerformanceAnalytics } from './VehiclePerformanceAnalytics';

interface CapacityValidatorProps {
  totalPax: number;
  vehicleCapacity: number;
  vehicleName: string;
  vehicleCount?: number;
  className?: string;
  enhancedMode?: boolean;
  vehicles?: Array<{
    type: string;
    name: string;
    capacity: number;
    count: number;
    price: number;
    pricePerKm?: number;
    fuelEfficiency?: number;
  }>;
  distance?: number;
  duration?: number;
  route?: string;
  onOptimizationSelect?: (result: any) => void;
}

export const CapacityValidator: React.FC<CapacityValidatorProps> = ({
  totalPax,
  vehicleCapacity,
  vehicleName,
  vehicleCount = 1,
  className,
  enhancedMode = false,
  vehicles = [],
  distance,
  duration,
  route,
  onOptimizationSelect
}) => {
  // Validate numeric inputs
  const validTotalPax = Number(totalPax) || 0;
  const validVehicleCapacity = Number(vehicleCapacity) || 0;
  const validVehicleCount = Number(vehicleCount) || 1;
  
  const totalCapacity = validVehicleCount * validVehicleCapacity;
  const requiredVehicles = validVehicleCapacity > 0 ? Math.ceil(validTotalPax / validVehicleCapacity) : 1;
  const isOverCapacity = validTotalPax > totalCapacity;
  const utilizationPercent = totalCapacity > 0 ? Math.min((validTotalPax / totalCapacity) * 100, 100) : 0;

  const getCapacityStatus = () => {
    if (validTotalPax <= totalCapacity * 0.8) return 'sufficient';
    if (validTotalPax <= totalCapacity) return 'tight';
    return 'exceeded';
  };

  const status = getCapacityStatus();

  const getStatusColor = () => {
    switch (status) {
      case 'sufficient': return 'text-green-600 dark:text-green-400';
      case 'tight': return 'text-yellow-600 dark:text-yellow-400';
      case 'exceeded': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getBadgeVariant = () => {
    switch (status) {
      case 'sufficient': return 'default';
      case 'tight': return 'secondary';
      case 'exceeded': return 'destructive';
      default: return 'outline';
    }
  };

  // Enhanced mode with detailed breakdown
  if (enhancedMode && vehicles.length > 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <EnhancedVehicleSummary
          totalPax={validTotalPax}
          vehicles={vehicles}
          distance={distance}
          duration={duration}
          route={route}
        />
        
        {onOptimizationSelect && (
          <VehicleCapacityOptimizer
            totalPax={validTotalPax}
            availableVehicles={vehicles.map(v => ({
              id: v.type,
              name: v.name,
              capacity: v.capacity,
              pricePerDay: v.price,
              type: 'standard' as const
            }))}
            currentSelection={vehicles.map(v => ({
              option: {
                id: v.type,
                name: v.name,
                capacity: v.capacity,
                pricePerDay: v.price,
                type: 'standard' as const
              },
              count: v.count
            }))}
            onOptimizationSelect={onOptimizationSelect}
          />
        )}
        
        <VehiclePerformanceAnalytics 
          vehicleType={vehicleName}
          route={route}
        />
      </div>
    );
  }

  // Standard mode (existing functionality)
  return (
    <div className={cn("space-y-2 hidden", className)}>
      {/* Capacity Status Badge */}
      <div className="flex items-center gap-2">
        {/* Hidden section as requested */}
        {false && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Capacity:</span>
          </div>
        )}
        <Badge variant={getBadgeVariant()} className="text-xs h-4">
          {validTotalPax}/{totalCapacity} seats
        </Badge>
        {isOverCapacity && (
          <AlertTriangle className="h-3 w-3 text-red-500" />
        )}
      </div>

      {/* Capacity Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
        <div 
          className={cn(
            "h-1 rounded-full transition-all duration-300",
            status === 'sufficient' && "bg-green-500",
            status === 'tight' && "bg-yellow-500", 
            status === 'exceeded' && "bg-red-500"
          )}
          style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
        />
      </div>

      {/* Multiple Vehicle Suggestion - Hidden */}
      {false && isOverCapacity && (
        <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
          <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-xs text-red-800 dark:text-red-200">
            <div className="space-y-1">
              <div>Capacity exceeded! Suggested solution:</div>
              <div className="flex items-center gap-1 font-medium">
                <Car className="h-3 w-3" />
                <span>{requiredVehicles} x {vehicleName}</span>
                <span className="text-gray-600 dark:text-gray-400">
                  ({requiredVehicles * validVehicleCapacity} total seats)
                </span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};