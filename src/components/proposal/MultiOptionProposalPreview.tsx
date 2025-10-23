import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign,
  Package,
  Hotel,
  Star,
  Bed,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Query } from '@/types/query';
import { OptionPricingBreakdown } from '@/utils/accommodationPricingUtils';
import { formatCurrency } from '@/utils/currencyUtils';
import { AccommodationStay } from '@/utils/accommodationCalculations';

interface MultiOptionProposalPreviewProps {
  query: Query;
  optionsPricing: Array<OptionPricingBreakdown & {
    withMarkup: number;
    withTax: number;
    finalTotal: number;
  }>;
  settings: {
    showPricingBreakdown: boolean;
    separateAdultChild: boolean;
    includeMarkup: boolean;
    markupPercentage: number;
    applyTax: boolean;
    includeAllOptions: boolean;
  };
}

export const MultiOptionProposalPreview: React.FC<MultiOptionProposalPreviewProps> = ({
  query,
  optionsPricing,
  settings
}) => {
  const getOptionTitle = (optionNumber: number) => {
    const titles = {
      1: 'Standard Package',
      2: 'Premium Package', 
      3: 'Luxury Package'
    };
    return titles[optionNumber as keyof typeof titles] || `Option ${optionNumber}`;
  };

  const getOptionIcon = (optionNumber: number) => {
    const icons = {
      1: <Hotel className="h-5 w-5 text-primary" />,
      2: <Star className="h-5 w-5 text-amber-600" />,
      3: <CheckCircle2 className="h-5 w-5 text-violet-600" />
    };
    return icons[optionNumber as keyof typeof icons] || <Hotel className="h-5 w-5" />;
  };

  const getOptionColor = (optionNumber: number) => {
    const colors = {
      1: 'border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10',
      2: 'border-amber-300/50 bg-gradient-to-r from-amber-50/50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/30',
      3: 'border-violet-300/50 bg-gradient-to-r from-violet-50/50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-900/30'
    };
    return colors[optionNumber as keyof typeof colors] || 'border-gray-300';
  };

  const renderAccommodationCard = (accommodation: AccommodationStay, optionNumber: number) => (
    <div key={accommodation.id} className="p-4 bg-card/50 rounded-lg border border-border/30">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1">
          <h5 className="font-semibold text-base">{accommodation.hotelName}</h5>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {accommodation.hotelCategory}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3" />
              {accommodation.city}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-primary">
            {formatCurrency(accommodation.totalPrice, query.destination.country || 'USA')}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatCurrency(accommodation.pricePerNightPerRoom || 0, query.destination.country || 'USA')}/night
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="flex items-center gap-2 p-2 bg-accent/30 rounded-md">
          <Calendar className="h-3 w-3 text-primary" />
          <span>{accommodation.numberOfNights} nights</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-accent/30 rounded-md">
          <Hotel className="h-3 w-3 text-primary" />
          <span>{accommodation.numberOfRooms} rooms</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-accent/30 rounded-md">
          <Bed className="h-3 w-3 text-primary" />
          <span>{accommodation.roomType}</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-md">
          <Clock className="h-3 w-3 text-primary" />
          <span>Day {accommodation.checkInDay}-{accommodation.checkOutDay}</span>
        </div>
      </div>

      {/* Additional Details */}
      {(accommodation.numberOfChildren > 0 || accommodation.extraBeds > 0) && (
        <div className="flex gap-2 mt-3">
          {accommodation.numberOfChildren > 0 && (
            <Badge variant="secondary" className="text-xs">
              {accommodation.numberOfChildren} Child{accommodation.numberOfChildren > 1 ? 'ren' : ''}
            </Badge>
          )}
          {accommodation.extraBeds > 0 && (
            <Badge variant="outline" className="text-xs">
              {accommodation.extraBeds} Extra Bed{accommodation.extraBeds > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}
    </div>
  );

  const renderPricingBreakdown = (option: OptionPricingBreakdown & {
    withMarkup: number;
    withTax: number;
    finalTotal: number;
  }) => {
    if (!settings.showPricingBreakdown) {
      return (
        <div className="text-center p-4 bg-primary/10 rounded-lg">
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(option.finalTotal, query.destination.country || 'USA')}
          </div>
          <div className="text-sm text-muted-foreground">
            Total package cost
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {settings.separateAdultChild ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="text-sm font-medium">Adult Pricing</div>
              <div className="text-lg font-bold text-primary">
                {formatCurrency(option.pricingBreakdown.adults.pricePerPerson, query.destination.country || 'USA')} per person
              </div>
              <div className="text-xs text-muted-foreground">
                {option.pricingBreakdown.adults.count} adults × {formatCurrency(option.pricingBreakdown.adults.pricePerPerson, query.destination.country || 'USA')} = {formatCurrency(option.pricingBreakdown.adults.totalPrice, query.destination.country || 'USA')}
              </div>
            </div>
            
            {option.pricingBreakdown.children.count > 0 && (
              <div className="p-3 bg-secondary/20 rounded-lg">
                <div className="text-sm font-medium">Child Pricing</div>
                <div className="text-lg font-bold text-secondary-foreground">
                  {formatCurrency(option.pricingBreakdown.children.pricePerPerson, query.destination.country || 'USA')} per person
                </div>
                <div className="text-xs text-muted-foreground">
                  {option.pricingBreakdown.children.count} children × {formatCurrency(option.pricingBreakdown.children.pricePerPerson, query.destination.country || 'USA')} = {formatCurrency(option.pricingBreakdown.children.totalPrice, query.destination.country || 'USA')}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Base Cost:</span>
              <span>{formatCurrency(option.totalCost, query.destination.country || 'USA')}</span>
            </div>
            {settings.includeMarkup && (
              <div className="flex justify-between text-sm">
                <span>Markup ({settings.markupPercentage}%):</span>
                <span className="text-primary">{formatCurrency(option.withMarkup - option.totalCost, query.destination.country || 'USA')}</span>
              </div>
            )}
            {settings.applyTax && (
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span className="text-accent-foreground">{formatCurrency(option.withTax, query.destination.country || 'USA')}</span>
              </div>
            )}
          </div>
        )}
        
        <Separator />
        <div className="flex justify-between items-center font-semibold text-lg">
          <span>Total Cost:</span>
          <span className="text-primary">{formatCurrency(option.finalTotal, query.destination.country || 'USA')}</span>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Per person: {formatCurrency(option.finalTotal / (query.paxDetails.adults + query.paxDetails.children), query.destination.country || 'USA')}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Travel Proposal - {query.id}</h2>
        <p className="text-muted-foreground">Multiple Accommodation Options Available</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Destination</div>
                <div className="text-sm text-muted-foreground">
                  {query.destination.cities.join(', ')}, {query.destination.country}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Duration</div>
                <div className="text-sm text-muted-foreground">
                  {query.tripDuration.days} days / {query.tripDuration.nights} nights
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Travelers</div>
                <div className="text-sm text-muted-foreground">
                  {query.paxDetails.adults} adults, {query.paxDetails.children} children
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Travel Dates</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(query.travelDates.from).toLocaleDateString()} - {new Date(query.travelDates.to).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Options Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Package Options Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {optionsPricing.map((option) => (
              <div key={option.optionNumber} className="text-center p-4 bg-accent/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getOptionIcon(option.optionNumber)}
                  <h4 className="font-semibold">{getOptionTitle(option.optionNumber)}</h4>
                </div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatCurrency(option.finalTotal, query.destination.country || 'USA')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {option.accommodations.length} accommodations
                </div>
                <div className="text-xs text-muted-foreground">
                  From {formatCurrency(option.finalTotal / (query.paxDetails.adults + query.paxDetails.children), query.destination.country || 'USA')} per person
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Options */}
      {optionsPricing.map((option) => (
        <Card key={option.optionNumber} className={`${getOptionColor(option.optionNumber)} border-l-4`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getOptionIcon(option.optionNumber)}
                {getOptionTitle(option.optionNumber)}
                <Badge variant="outline" className="ml-2">
                  Option {option.optionNumber}
                </Badge>
              </div>
              <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                {formatCurrency(option.finalTotal, query.destination.country || 'USA')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Accommodations */}
            <div>
              <h5 className="font-semibold mb-3">Accommodations ({option.accommodations.length})</h5>
              <div className="grid gap-4">
                {option.accommodations.map((accommodation) => 
                  renderAccommodationCard(accommodation, option.optionNumber)
                )}
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div>
              <h5 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing Information
              </h5>
              {renderPricingBreakdown(option)}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Choose Your Perfect Package</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {optionsPricing.map((option) => (
                <div key={option.optionNumber} className="text-center">
                  <div className="text-sm text-muted-foreground">{getOptionTitle(option.optionNumber)}</div>
                  <div className="text-xl font-bold text-primary">
                    {formatCurrency(option.finalTotal, query.destination.country || 'USA')}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              All prices are final and include applicable taxes and service charges
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t">
        This proposal was generated on {new Date().toLocaleString()}
        <br />
        Proposal ID: {query.id} | {optionsPricing.length} options available
      </div>
    </div>
  );
};

export default MultiOptionProposalPreview;