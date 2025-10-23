import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AccommodationOption } from '@/types/enhancedMarkup';

interface AccommodationSummaryProps {
  accommodations: AccommodationOption[];
  formatCurrency: (amount: number) => string;
}

export const AccommodationSummary: React.FC<AccommodationSummaryProps> = ({
  accommodations,
  formatCurrency
}) => {
  // Ensure all numeric values are properly handled
  const totalPrice = accommodations.reduce((sum, acc) => {
    const price = typeof acc.totalPrice === 'number' ? acc.totalPrice : 0;
    return sum + price;
  }, 0);
  
  const totalNights = accommodations.reduce((sum, acc) => {
    const nights = typeof acc.nights === 'number' ? acc.nights : 0;
    return sum + nights;
  }, 0);
  
  const totalRooms = accommodations.reduce((sum, acc) => {
    const rooms = typeof acc.numberOfRooms === 'number' ? acc.numberOfRooms : 0;
    return sum + rooms;
  }, 0);

  if (accommodations.length === 0) {
    return null;
  }

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Accommodation Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Total Hotels:</span>
          <span className="font-medium">{accommodations.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Total Nights:</span>
          <span className="font-medium">{totalNights}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Total Rooms:</span>
          <span className="font-medium">{totalRooms}</span>
        </div>
        <div className="flex justify-between font-bold text-base pt-2 border-t">
          <span>Total Cost:</span>
          <span className="text-primary">{formatCurrency(totalPrice)}</span>
        </div>
      </CardContent>
    </Card>
  );
};