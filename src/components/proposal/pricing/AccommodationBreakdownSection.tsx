import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Hotel, Star, Calendar, Users, MapPin, 
  Building, Bed, Check, X, RotateCcw
} from 'lucide-react';
import { extractAccommodationsFromDays, AccommodationOption } from '@/utils/accommodationUtils';

interface AccommodationBreakdownSectionProps {
  proposalData?: any;
  formatCurrency: (amount: number) => string;
}

export const AccommodationBreakdownSection: React.FC<AccommodationBreakdownSectionProps> = ({
  proposalData,
  formatCurrency
}) => {
  const [selectedOption, setSelectedOption] = useState<1 | 2 | 3>(1);

  // Extract accommodations from proposal data
  const getAccommodationOptions = () => {
    if (!proposalData?.days || !Array.isArray(proposalData.days)) {
      return { option1: [], option2: [], option3: [] };
    }

    return extractAccommodationsFromDays(proposalData.days);
  };

  const accommodationOptions = getAccommodationOptions();
  const hasMultipleOptions = 
    accommodationOptions.option2.length > 0 || 
    accommodationOptions.option3.length > 0;

  const renderAccommodationCard = (accommodation: AccommodationOption, isSelected?: boolean) => (
    <div 
      key={accommodation.id} 
      className={`p-4 border rounded-lg ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Hotel className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium">{accommodation.name}</h4>
            <Badge variant="outline" className="text-xs">
              {accommodation.type}
            </Badge>
            {accommodation.starRating > 0 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: accommodation.starRating }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {accommodation.city}
            </div>
            <div className="flex items-center gap-1">
              <Bed className="h-3 w-3" />
              {accommodation.roomType}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {accommodation.checkIn} to {accommodation.checkOut}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {accommodation.nights} nights
            </div>
          </div>

          {accommodation.amenities && accommodation.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {accommodation.amenities.slice(0, 3).map((amenity, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {accommodation.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{accommodation.amenities.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <div className="text-right">
          <div className="font-semibold text-green-600">
            {formatCurrency(accommodation.totalPrice)}
          </div>
          <div className="text-xs text-gray-500">
            {formatCurrency(accommodation.pricePerNight)}/night
          </div>
        </div>
      </div>

      {accommodation.description && (
        <div className="text-xs text-gray-600 border-t pt-2">
          {accommodation.description}
        </div>
      )}
    </div>
  );

  const renderAccommodationOption = (optionNumber: 1 | 2 | 3, accommodations: AccommodationOption[]) => {
    if (accommodations.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No accommodations available for Option {optionNumber}</p>
        </div>
      );
    }

    const totalCost = accommodations.reduce((sum, acc) => sum + acc.totalPrice, 0);
    const totalNights = accommodations.reduce((sum, acc) => sum + acc.nights, 0);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
          <div>
            <h3 className="font-medium">Option {optionNumber} - Total Cost</h3>
            <p className="text-sm text-gray-600">{totalNights} nights across {accommodations.length} properties</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-blue-700">{formatCurrency(totalCost)}</div>
            <div className="text-sm text-gray-600">
              Avg: {formatCurrency(totalCost / totalNights)}/night
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {accommodations.map(accommodation => 
            renderAccommodationCard(accommodation, selectedOption === optionNumber)
          )}
        </div>
      </div>
    );
  };

  const getTotalAccommodationCost = () => {
    const currentOptions = accommodationOptions[`option${selectedOption}` as keyof typeof accommodationOptions];
    return currentOptions.reduce((sum, acc) => sum + acc.totalPrice, 0);
  };

  if (accommodationOptions.option1.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5 text-purple-600" />
            Accommodation Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Hotel className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No accommodation options found in the itinerary.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hotel className="h-5 w-5 text-purple-600" />
            Accommodation Options
          </div>
          <Badge variant="outline" className="bg-purple-100 text-purple-700">
            {formatCurrency(getTotalAccommodationCost())}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasMultipleOptions ? (
          <Tabs value={`option${selectedOption}`} onValueChange={(value) => setSelectedOption(parseInt(value.replace('option', '')) as 1 | 2 | 3)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="option1" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Option 1
              </TabsTrigger>
              <TabsTrigger 
                value="option2" 
                disabled={accommodationOptions.option2.length === 0}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Option 2
              </TabsTrigger>
              <TabsTrigger 
                value="option3" 
                disabled={accommodationOptions.option3.length === 0}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Option 3
              </TabsTrigger>
            </TabsList>

            <TabsContent value="option1" className="mt-4">
              {renderAccommodationOption(1, accommodationOptions.option1)}
            </TabsContent>

            <TabsContent value="option2" className="mt-4">
              {renderAccommodationOption(2, accommodationOptions.option2)}
            </TabsContent>

            <TabsContent value="option3" className="mt-4">
              {renderAccommodationOption(3, accommodationOptions.option3)}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            {renderAccommodationOption(1, accommodationOptions.option1)}
          </div>
        )}

        {/* Additional Cost Calculation Information */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Building className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">Accommodation Pricing Note</span>
          </div>
          <p className="text-sm text-yellow-700">
            {hasMultipleOptions 
              ? `Multiple accommodation options available. Land package pricing will be calculated separately for the selected option.`
              : `Single accommodation option. This will be included in the total land package calculation.`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};