
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hotel, Plus, ArrowRight } from 'lucide-react';

interface AccommodationBridgeProps {
  accommodationsFromItinerary: any[];
  onMoveToAccommodationPlanning: (accommodation: any) => void;
  onSwitchToAccommodationTab: () => void;
}

const AccommodationBridge: React.FC<AccommodationBridgeProps> = ({
  accommodationsFromItinerary,
  onMoveToAccommodationPlanning,
  onSwitchToAccommodationTab
}) => {
  if (accommodationsFromItinerary.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6 bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
          <Hotel className="h-5 w-5" />
          Move Hotels to Accommodation Planning
        </CardTitle>
        <p className="text-sm text-blue-600">
          Add similar hotel options and enhance your accommodation selections
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {accommodationsFromItinerary.map((accommodation, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Hotel className="h-4 w-4 text-blue-600" />
              <div>
                <p className="font-medium">{accommodation.hotel?.name || accommodation.name}</p>
                <p className="text-sm text-muted-foreground">
                  {accommodation.roomType} • Day {accommodation.dayNumber}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-700">
                ${accommodation.price}
              </Badge>
              <Button
                size="sm"
                onClick={() => onMoveToAccommodationPlanning(accommodation)}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Options
              </Button>
            </div>
          </div>
        ))}
        
        <div className="flex justify-center pt-4">
          <Button 
            onClick={onSwitchToAccommodationTab}
            className="flex items-center gap-2"
          >
            Go to Accommodation Planning
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccommodationBridge;
