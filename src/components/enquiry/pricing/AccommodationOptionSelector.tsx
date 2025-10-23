import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Hotel, Star, Bed, Clock } from 'lucide-react';
import { AccommodationPricingOption } from '@/types/enhancedMarkup';
import { formatCurrency } from '@/utils/currencyUtils';

interface AccommodationOptionSelectorProps {
  options: AccommodationPricingOption[];
  selectedOption: 'standard' | 'optional' | 'alternative';
  onOptionSelect: (option: 'standard' | 'optional' | 'alternative') => void;
  currency: string;
}

const AccommodationOptionSelector: React.FC<AccommodationOptionSelectorProps> = ({
  options,
  selectedOption,
  onOptionSelect,
  currency
}) => {
  const getOptionTitle = (type: string) => {
    switch (type) {
      case 'standard':
        return 'Standard Accommodations';
      case 'optional':
        return 'Optional Accommodations';
      case 'alternative':
        return 'Alternative Accommodations';
      default:
        return 'Unknown Option';
    }
  };

  const getOptionIcon = (type: string) => {
    switch (type) {
      case 'standard':
        return <Hotel className="h-4 w-4 text-primary" />;
      case 'optional':
        return <Hotel className="h-4 w-4 text-amber-600" />;
      case 'alternative':
        return <Hotel className="h-4 w-4 text-violet-600" />;
      default:
        return <Hotel className="h-4 w-4" />;
    }
  };

  const getOptionColor = (type: string) => {
    switch (type) {
      case 'standard':
        return 'border-primary bg-primary/5';
      case 'optional':
        return 'border-amber-600 bg-amber-50 dark:bg-amber-950/20';
      case 'alternative':
        return 'border-violet-600 bg-violet-50 dark:bg-violet-950/20';
      default:
        return 'border-gray-300';
    }
  };

  if (!options || options.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center">
          <Hotel className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No accommodation options available</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add accommodations in Day Wise Itinerary to see pricing options
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Accommodation Options</h4>
        <Badge variant="outline">{options.length} option(s) available</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((option) => (
          <Card 
            key={option.type}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedOption === option.type 
                ? `ring-2 ring-offset-2 ${getOptionColor(option.type)} ring-current` 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => onOptionSelect(option.type)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getOptionIcon(option.type)}
                  {getOptionTitle(option.type)}
                </div>
                {selectedOption === option.type && (
                  <Badge variant="default" className="text-xs">Selected</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Accommodation Summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bed className="h-3 w-3" />
                  {option.accommodations.length} accommodation(s)
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {option.serviceCosts.accommodation.totalNights} night(s) total
                </div>
              </div>

              {/* Price Summary */}
              <div className="space-y-1 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Base Total:</span>
                  <span className="font-medium">{formatCurrency(option.baseTotal, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Markup:</span>
                  <span className="font-medium text-primary">{formatCurrency(option.markup, currency)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-1 border-t">
                  <span>Final Total:</span>
                  <span className="text-green-600">{formatCurrency(option.finalTotal, currency)}</span>
                </div>
              </div>

              {/* Per Person Breakdown */}
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Adult Price:</span>
                  <span>{formatCurrency(option.distribution.adultPrice, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Child Price:</span>
                  <span>{formatCurrency(option.distribution.childPrice, currency)}</span>
                </div>
              </div>

              {/* Top Accommodations Preview */}
              {option.accommodations.slice(0, 2).map((acc, index) => (
                <div key={index} className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                  <div className="font-medium">{acc.hotelName}</div>
                  <div className="flex items-center gap-2">
                    <span>{acc.roomType}</span>
                    <span>•</span>
                    <span>{acc.nights} nights</span>
                  </div>
                </div>
              ))}
              
              {option.accommodations.length > 2 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{option.accommodations.length - 2} more accommodation(s)
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AccommodationOptionSelector;