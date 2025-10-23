import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Hotel, Users, Calendar, MapPin, DollarSign, Baby } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { Query } from '@/types/query';
import { AccommodationStay } from '@/utils/accommodationCalculations';
import { 
  OptionPricingBreakdown, 
  getOptionDisplayConfig 
} from '@/utils/accommodationPricingUtils';

interface AccommodationPricingBreakdownProps {
  optionBreakdown: OptionPricingBreakdown;
  query: Query;
  showDetailedBreakdown?: boolean;
}

export const AccommodationPricingBreakdown: React.FC<AccommodationPricingBreakdownProps> = ({
  optionBreakdown,
  query,
  showDetailedBreakdown = true
}) => {
  // Validate data integrity
  if (!optionBreakdown || !optionBreakdown.pricingBreakdown) {
    console.warn('AccommodationPricingBreakdown: Missing pricing breakdown data', optionBreakdown);
    return null;
  }

  const { optionNumber, accommodations, pricingBreakdown } = optionBreakdown;
  const config = getOptionDisplayConfig(optionNumber);
  const uniqueAccommodations = [...new Map(accommodations.map(acc => [acc.hotelId, acc])).values()];

  // Get pricing breakdown data with validation
  const { adults, children, totalPrice } = pricingBreakdown;

  // Additional validation for pricing data
  if (!adults || !children || totalPrice === undefined) {
    console.warn('AccommodationPricingBreakdown: Invalid pricing data structure', pricingBreakdown);
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Option Header with Pricing Summary */}
      <Card className="p-4 card-gradient border-primary/20 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Hotel className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-card-foreground">
              {config.title} ({uniqueAccommodations.length})
              {optionNumber > 1 && (
                <Badge variant="outline" className={`ml-2 text-xs ${config.badgeClass}`}>
                  Option {optionNumber}
                </Badge>
              )}
            </h4>
          </div>
          <Badge variant="outline" className="text-xs px-2 py-1 bg-primary/5 border-primary/20 text-primary">
            {formatCurrency(totalPrice, query?.destination.country || 'USA')}
          </Badge>
        </div>

        {/* Adult/Child Pricing Breakdown */}
        {showDetailedBreakdown && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Adults Pricing */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <span className="text-sm font-medium">Adults ({adults.count})</span>
                    <p className="text-xs text-muted-foreground">Room charges included</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatCurrency(adults.totalPrice, query?.destination.country || 'USA')}
                  </div>
                  {adults.count > 1 && (
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(adults.pricePerPerson, query?.destination.country || 'USA')}/person
                    </div>
                  )}
                </div>
              </div>

              {/* Children Pricing */}
              {children.count > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2">
                    <Baby className="h-4 w-4 text-purple-600" />
                    <div>
                      <span className="text-sm font-medium">Children ({children.count})</span>
                      <p className="text-xs text-muted-foreground">
                        {children.totalPrice > 0 ? 'Extra bed charges' : 'Included in room'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(children.totalPrice, query?.destination.country || 'USA')}
                    </div>
                    {children.count > 1 && children.totalPrice > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(children.pricePerPerson, query?.destination.country || 'USA')}/child
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Total Summary */}
            <Separator />
            <div className="flex justify-between items-center font-semibold">
              <span>Option {optionNumber} Total:</span>
              <span className="text-primary font-semibold">
                {formatCurrency(totalPrice, query?.destination.country || 'USA')}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Accommodation Details */}
      <div className="space-y-3">
        {uniqueAccommodations.map((accommodation, idx) => (
          <div 
            key={accommodation.id} 
            className={`${config.borderClass} shadow-sm hover:shadow-md transition-all duration-200 ${config.bgClass} rounded-lg`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-semibold text-base text-foreground">
                      {accommodation.hotelName || 'Hotel TBD'}
                    </h5>
                    <Badge variant="outline" className={`text-xs ${config.badgeClass}`}>
                      {accommodation.hotelCategory || 'Standard'}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-accent">
                      <MapPin className="h-3 w-3" />
                      {accommodation.city}
                    </Badge>
                    {optionNumber === 1 && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        Stay #{idx + 1}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-md border border-border/30">
                      <Calendar className="h-3 w-3 text-primary" />
                      <span className="font-medium">
                        {accommodation.numberOfNights} night{accommodation.numberOfNights > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-md border border-border/30">
                      <Hotel className="h-3 w-3 text-primary" />
                      <span className="font-medium">
                        {accommodation.numberOfRooms} room{accommodation.numberOfRooms > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-md border border-border/30">
                      <span className="truncate font-medium">{accommodation.roomType}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 bg-primary/10 rounded-md border border-primary/20">
                      <span className="font-bold text-primary text-base">
                        {formatCurrency(accommodation.totalPrice || 0, query?.destination.country || 'USA')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(accommodation.pricePerNightPerRoom || 0, query?.destination.country || 'USA')}/night
                      </span>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md border border-border/30">
                      <Users className="h-3 w-3 text-secondary-foreground" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Configuration</span>
                        <span className="font-medium text-xs">
                          {accommodation.configuration || 
                           (accommodation.roomType?.includes('King') ? '1 King Bed' : 
                            accommodation.roomType?.includes('Queen') ? '1 Queen Bed' :
                            accommodation.roomType?.includes('Twin') ? '2 Twin Beds' : '1 King Bed')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-md border border-border/30">
                      <DollarSign className="h-3 w-3 text-accent-foreground" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Meal Plan</span>
                        <span className="font-medium text-xs">
                          {accommodation.mealPlan || 'Room Only'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Check-in/Check-out Timeline */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default" className="text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20">
                      Day {accommodation.checkInDay}: Check-in
                    </Badge>
                    {accommodation.stayDays && accommodation.stayDays.slice(1, -1).map(day => (
                      <Badge key={day} variant="secondary" className="text-xs px-2 py-1 bg-secondary/50 text-secondary-foreground">
                        Day {day}: Stay
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-xs px-2 py-1 bg-accent/30 text-accent-foreground border-border">
                      Day {accommodation.checkOutDay}: Check-out
                    </Badge>
                  </div>

                  {/* Children and Extra Beds Info */}
                  {(accommodation.numberOfChildren > 0 || accommodation.extraBeds > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {accommodation.numberOfChildren > 0 && (
                        <Badge variant="secondary" className="text-xs px-2 py-1 bg-secondary/50 text-secondary-foreground">
                          {accommodation.numberOfChildren} Child{accommodation.numberOfChildren > 1 ? 'ren' : ''}
                        </Badge>
                      )}
                      {accommodation.extraBeds > 0 && (
                        <Badge variant="secondary" className="text-xs px-2 py-1 bg-muted text-muted-foreground">
                          {accommodation.extraBeds} Extra Bed{accommodation.extraBeds > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};