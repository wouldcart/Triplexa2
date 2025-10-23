
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Hotel, Car, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import { Query } from '@/types/query';
import { useInventorySuggestions } from '@/hooks/useInventorySuggestions';
import { HotelSuggestionCard, TransportSuggestionCard, SightseeingSuggestionCard } from './SuggestionCards';

interface InventorySuggestionPanelProps {
  query: Query;
  selectedDayId: string | null;
  onAddHotelToDay: (dayId: string, hotel: any, price: number) => void;
  onAddTransportToDay: (dayId: string, transport: any, price: number) => void;
  onAddSightseeingToDay: (dayId: string, activity: any, price: number) => void;
}

export const InventorySuggestionPanel: React.FC<InventorySuggestionPanelProps> = ({
  query,
  selectedDayId,
  onAddHotelToDay,
  onAddTransportToDay,
  onAddSightseeingToDay
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    suggestedHotels,
    suggestedTransport,
    suggestedSightseeing,
    calculateHotelPrice,
    calculateTransportPrice,
    calculateSightseeingPrice
  } = useInventorySuggestions(query);

  const handleAddHotel = (hotel: any, price: number) => {
    if (!selectedDayId) {
      alert('Please select a day first by clicking on a day card');
      return;
    }
    onAddHotelToDay(selectedDayId, hotel, price);
  };

  const handleAddTransport = (transport: any, price: number) => {
    if (!selectedDayId) {
      alert('Please select a day first by clicking on a day card');
      return;
    }
    onAddTransportToDay(selectedDayId, transport, price);
  };

  const handleAddSightseeing = (activity: any, price: number) => {
    if (!selectedDayId) {
      alert('Please select a day first by clicking on a day card');
      return;
    }
    onAddSightseeingToDay(selectedDayId, activity, price);
  };

  if (isCollapsed) {
    return (
      <Card className="sticky top-4">
        <CardContent className="p-4">
          <Button 
            variant="outline" 
            onClick={() => setIsCollapsed(false)}
            className="w-full flex items-center justify-between"
          >
            <span>Show Suggestions</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Smart Suggestions</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
        {selectedDayId ? (
          <Badge className="bg-blue-100 text-blue-800 w-fit">
            Adding to Selected Day
          </Badge>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click on a day to start adding suggestions
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hotels" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hotels" className="flex items-center gap-1">
              <Hotel className="h-3 w-3" />
              Hotels
            </TabsTrigger>
            <TabsTrigger value="transport" className="flex items-center gap-1">
              <Car className="h-3 w-3" />
              Transport
            </TabsTrigger>
            <TabsTrigger value="sightseeing" className="flex items-center gap-1">
              <Camera className="h-3 w-3" />
              Activities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hotels" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Hotels in {query.destination.country}</h4>
              <Badge variant="outline">{suggestedHotels.length} options</Badge>
            </div>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {suggestedHotels.map((hotel, index) => (
                <HotelSuggestionCard
                  key={index}
                  hotel={hotel}
                  price={calculateHotelPrice(hotel)}
                  country={query.destination.country}
                  onAddToDay={handleAddHotel}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="transport" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Transport Options</h4>
              <Badge variant="outline">{suggestedTransport.length} options</Badge>
            </div>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {suggestedTransport.map((transport, index) => (
                <TransportSuggestionCard
                  key={index}
                  transport={transport}
                  price={calculateTransportPrice(transport)}
                  country={query.destination.country}
                  onAddToDay={handleAddTransport}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sightseeing" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Activities & Sightseeing</h4>
              <Badge variant="outline">{suggestedSightseeing.length} options</Badge>
            </div>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {suggestedSightseeing.map((activity, index) => (
                <SightseeingSuggestionCard
                  key={index}
                  activity={activity}
                  price={calculateSightseeingPrice(activity)}
                  country={query.destination.country}
                  onAddToDay={handleAddSightseeing}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
