import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Hotel, MapPin, Calendar, Bed } from 'lucide-react';
import { AccommodationOption } from '@/types/enhancedMarkup';

interface AccommodationCardProps {
  accommodation: AccommodationOption;
  formatCurrency: (amount: number) => string;
}

export const AccommodationCard: React.FC<AccommodationCardProps> = ({
  accommodation,
  formatCurrency
}) => {
  return (
    <Card className="transition-all hover:shadow-md dark:hover:shadow-lg border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Hotel className="h-4 w-4 text-primary" />
            <h4 className="font-medium">{accommodation.hotelName}</h4>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="h-3 w-3" />
          {accommodation.city}
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div className="flex items-center gap-2">
            <Bed className="h-3 w-3 text-muted-foreground" />
            {accommodation.roomType}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            {accommodation.nights} nights
          </div>
        </div>

        <div className="space-y-2 pt-3 border-t">
          <div className="flex justify-between text-sm">
            <span>Per night:</span>
            <span className="font-medium">{formatCurrency(accommodation.pricePerNight)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Rooms:</span>
            <span>{accommodation.numberOfRooms}</span>
          </div>
          <div className="flex justify-between font-medium pt-2 border-t">
            <span>Total:</span>
            <span className="text-primary">{formatCurrency(accommodation.totalPrice)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};