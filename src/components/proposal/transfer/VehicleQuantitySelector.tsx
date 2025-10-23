import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Car, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleQuantitySelectorProps {
  vehicleCount: number;
  onVehicleCountChange: (count: number) => void;
  vehicleName: string;
  vehicleCapacity: number;
  totalPax: number;
  pricePerVehicle: number;
  currency?: string;
  className?: string;
  hideSelector?: boolean;
  hidePricing?: boolean;
}

export const VehicleQuantitySelector: React.FC<VehicleQuantitySelectorProps> = ({
  vehicleCount,
  onVehicleCountChange,
  vehicleName,
  vehicleCapacity,
  totalPax,
  pricePerVehicle,
  currency = 'USD',
  className,
  hideSelector = true,
  hidePricing = false
}) => {
  const totalCapacity = vehicleCount * vehicleCapacity;
  const totalPrice = vehicleCount * pricePerVehicle;
  const suggestedCount = Math.ceil(totalPax / vehicleCapacity);
  
  const formatCurrency = (amount: number) => {
    // Validate currency code and provide fallback
    let validCurrency = currency;
    
    // Common currency codes (ISO 4217)
    const validCurrencyCodes = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'THB', 'AED', 'INR', 'MYR', 'KRW', 'BRL'];
    
    // If currency is not a valid code, try to map country names to currency codes
    if (!validCurrencyCodes.includes(currency)) {
      console.warn(`Invalid currency code: ${currency}, attempting to map...`);
      
      const countryToCurrency: Record<string, string> = {
        'Thailand': 'THB',
        'United Arab Emirates': 'AED',
        'UAE': 'AED',
        'Singapore': 'SGD',
        'Malaysia': 'MYR',
        'India': 'INR',
        'United States': 'USD',
        'United Kingdom': 'GBP',
        'Japan': 'JPY',
        'Australia': 'AUD',
        'Canada': 'CAD',
        'Switzerland': 'CHF',
        'China': 'CNY',
        'South Korea': 'KRW',
        'Brazil': 'BRL'
      };
      
      validCurrency = countryToCurrency[currency] || 'USD';
      console.log(`Mapped ${currency} to ${validCurrency}`);
    }
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: validCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      console.error(`Error formatting currency with code: ${validCurrency}`, error);
      // Fallback to USD if everything fails
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }
  };

  const handleDecrease = () => {
    if (vehicleCount > 1) {
      onVehicleCountChange(vehicleCount - 1);
    }
  };

  const handleIncrease = () => {
    onVehicleCountChange(vehicleCount + 1);
  };

  const useSuggested = () => {
    onVehicleCountChange(suggestedCount);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Vehicle Count Selector */}
      {!hideSelector && (
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1 shrink-0">
            <Car className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Vehicles:</span>
          </div>
          
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-5 w-5 sm:h-6 sm:w-6 p-0"
              onClick={handleDecrease}
              disabled={vehicleCount <= 1}
            >
              <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </Button>
            
            <Badge variant="outline" className="text-xs px-1 sm:px-2 min-w-[1.5rem] sm:min-w-[2rem] text-center">
              {vehicleCount}
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              className="h-5 w-5 sm:h-6 sm:w-6 p-0"
              onClick={handleIncrease}
            >
              <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </Button>
          </div>

          {/* Auto-suggest button */}
          {vehicleCount !== suggestedCount && suggestedCount > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1 sm:h-6 sm:px-2 text-xs shrink-0"
              onClick={useSuggested}
            >
              <Calculator className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
              <span className="hidden xs:inline">Use </span>{suggestedCount}
            </Button>
          )}
        </div>
      )}

      {/* Add Quantity Button */}
      {!hideSelector && (
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVehicleCountChange(Math.max(1, vehicleCount - 1))}
            disabled={vehicleCount <= 1}
            className="h-6 w-6 sm:h-8 sm:w-8 p-0 shrink-0"
          >
            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <span className="text-xs sm:text-sm font-medium min-w-[1.5rem] sm:min-w-[2rem] text-center">
            {vehicleCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVehicleCountChange(vehicleCount + 1)}
            className="h-6 w-6 sm:h-8 sm:w-8 p-0 shrink-0"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      )}

      {/* Capacity Breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1">
          <div className="text-gray-600 dark:text-gray-400">Configuration:</div>
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {vehicleCount} × {vehicleName}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            ({vehicleCapacity} seats each)
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="text-gray-600 dark:text-gray-400">Total Capacity:</div>
          <div className={cn(
            "font-medium",
            totalCapacity >= totalPax 
              ? "text-green-600 dark:text-green-400" 
              : "text-red-600 dark:text-red-400"
          )}>
            {totalCapacity} seats
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            for {totalPax} passengers
          </div>
        </div>
      </div>

      {/* Pricing Breakdown */}
      {!hidePricing && (
        <div className="pt-1 border-t border-gray-200 dark:border-gray-700">
          {/* Pricing calculation line is now hidden */}
        </div>
      )}
    </div>
  );
};