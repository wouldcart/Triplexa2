import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Hotel, Plus, Star, Building, AlertCircle } from 'lucide-react';
import { Hotel as HotelType } from '@/components/inventory/hotels/types/hotel';

interface SimilarHotelOption {
  id: string;
  hotel: HotelType;
  roomType: string;
  pricing: {
    basePrice: number;
    finalPrice: number;
    currency: string;
  };
  isAlternative: boolean;
  priority: number;
}

interface SimilarHotelOptionsProps {
  primaryHotel: {
    hotel: HotelType;
    roomType: string;
    pricing: any;
  };
  availableHotels: HotelType[];
  onAddSimilarOption: (option: SimilarHotelOption) => void;
  existingOptions: SimilarHotelOption[];
}

const SimilarHotelOptions: React.FC<SimilarHotelOptionsProps> = ({
  primaryHotel,
  availableHotels,
  onAddSimilarOption,
  existingOptions
}) => {
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');

  // Filter hotels by similar criteria (same city, similar star rating)
  const getSimilarHotels = () => {
    if (!primaryHotel.hotel) return [];
    
    return availableHotels.filter(hotel => 
      hotel.id !== primaryHotel.hotel.id &&
      hotel.city === primaryHotel.hotel.city &&
      Math.abs((hotel.starRating || 0) - (primaryHotel.hotel.starRating || 0)) <= 1 &&
      !existingOptions.some(option => option.hotel.id === hotel.id)
    );
  };

  const handleAddSimilarHotel = () => {
    const selectedHotel = availableHotels.find(h => h.id === selectedHotelId);
    if (!selectedHotel) return;

    // Find matching room type or use the first available one
    const matchingRoomType = selectedHotel.roomTypes?.find(rt => 
      rt.name.toLowerCase().includes(primaryHotel.roomType.toLowerCase())
    ) || selectedHotel.roomTypes?.[0];

    if (!matchingRoomType) return;

    const similarOption: SimilarHotelOption = {
      id: `similar_${Date.now()}`,
      hotel: selectedHotel,
      roomType: matchingRoomType.name,
      pricing: {
        basePrice: primaryHotel.pricing.basePrice * 1.1, // 10% higher for similar hotels
        finalPrice: primaryHotel.pricing.finalPrice * 1.1,
        currency: primaryHotel.pricing.currency
      },
      isAlternative: true,
      priority: existingOptions.length + 1
    };

    onAddSimilarOption(similarOption);
    setSelectedHotelId('');
  };

  const similarHotels = getSimilarHotels();

  if (similarHotels.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-4">
          <div className="text-center py-4 text-muted-foreground">
            <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No similar hotels available in this city</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Hotel className="h-5 w-5" />
          Add Similar Hotel Options
          <Badge variant="secondary" className="text-xs">Subject to Availability</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Add alternative hotels with same room type and pricing structure
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Similar Hotel */}
        <div className="flex gap-3">
          <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select similar hotel" />
            </SelectTrigger>
            <SelectContent>
              {similarHotels.map(hotel => (
                <SelectItem key={hotel.id} value={hotel.id}>
                  <div className="flex items-center gap-2">
                    <span>{hotel.name}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: hotel.starRating || 0 }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleAddSimilarHotel}
            disabled={!selectedHotelId}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Option
          </Button>
        </div>

        {/* Existing Similar Options */}
        {existingOptions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Alternative Options:</h4>
            {existingOptions.map((option, index) => (
              <div key={option.id} className="p-3 border rounded-lg bg-blue-50/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{option.hotel.name}</span>
                      <Badge variant="outline" className="text-xs">Option {index + 1}</Badge>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: option.hotel.starRating || 0 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {option.roomType} • {option.hotel.city}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <AlertCircle className="h-3 w-3 text-blue-600" />
                      <span className="text-blue-700">Subject to availability</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      {option.pricing.currency} {option.pricing.finalPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      (+10% premium)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pricing Note */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Pricing Note:</p>
              <p className="text-yellow-700">
                Similar hotel options are priced 10% higher than the primary hotel for calculation purposes.
                Final pricing will be confirmed based on availability.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimilarHotelOptions;
