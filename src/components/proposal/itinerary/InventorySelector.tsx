
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CentralItinerary } from '@/types/itinerary';
import { Query } from '@/types/query';
import { useTransportRoutes } from '@/hooks/useTransportRoutes';
import { Hotel, Car, Camera, Utensils, Plus, MapPin, Clock, DollarSign } from 'lucide-react';

interface InventorySelectorProps {
  query: Query;
  itinerary: CentralItinerary;
  onUpdate: (itinerary: CentralItinerary) => void;
}

export const InventorySelector: React.FC<InventorySelectorProps> = ({
  query,
  itinerary,
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState('transport');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [previewItems, setPreviewItems] = useState<any[]>([]);

  // Load transport routes based on query country and cities
  const { routes: transportRoutes = [], loading: routesLoading = false } = useTransportRoutes({
    country: query.destination?.country || '',
    cities: query.destination?.cities || []
  }) || {};

  useEffect(() => {
    console.log('Transport routes loaded:', transportRoutes.length);
  }, [transportRoutes]);

  const handleAddToDay = (item: any, dayId: string) => {
    const dayIndex = itinerary.days.findIndex(d => d.id === dayId);
    if (dayIndex === -1) return;

    const updatedDays = [...itinerary.days];
    const day = updatedDays[dayIndex];

    if (activeTab === 'transport') {
      const newTransport = {
        id: `transport_${Date.now()}`,
        type: item.transportType?.toLowerCase() || 'car',
        from: {
          id: `from_${Date.now()}`,
          name: item.from,
          country: query.destination.country,
          city: item.from
        },
        to: {
          id: `to_${Date.now()}`,
          name: item.to,
          country: query.destination.country,
          city: item.to
        },
        duration: item.duration,
        price: item.price,
        details: `${item.distance}km route`
      };
      
      day.transport = day.transport || [];
      day.transport.push(newTransport);
      day.totalCost += item.price;
    }

    updatedDays[dayIndex] = day;
    onUpdate({
      ...itinerary,
      days: updatedDays,
      updatedAt: new Date().toISOString()
    });
  };

  const handlePreview = (item: any) => {
    setPreviewItems([item]);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Inventory Selector</h3>
        <p className="text-muted-foreground">
          Add services and inventory items to your itinerary
        </p>
      </div>

      {/* Day Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Day to Add Services</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger>
              <SelectValue placeholder="Select a day to add services" />
            </SelectTrigger>
            <SelectContent>
              {itinerary.days.map((day) => (
                <SelectItem key={day.id} value={day.id}>
                  Day {day.day} - {day.date} ({day.location.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="transport" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Transport
            <Badge variant="secondary">{transportRoutes.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="hotels" className="flex items-center gap-2">
            <Hotel className="h-4 w-4" />
            Hotels
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Activities
          </TabsTrigger>
          <TabsTrigger value="dining" className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Dining
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transport" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transport Routes for {query.destination.country}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Available routes connecting {query.destination.cities.join(', ')}
              </p>
            </CardHeader>
            <CardContent>
              {routesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading transport routes...</p>
                </div>
              ) : transportRoutes.length > 0 ? (
                <div className="grid gap-4">
                  {transportRoutes.map((route) => (
                    <div key={route.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{route.from || 'Unknown'} → {route.to || 'Unknown'}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {route.distance}km
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {route.duration}
                            </div>
                            <div className="flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              {route.transportType}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 font-medium">
                            <DollarSign className="h-4 w-4" />
                            {route.price}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(route)}
                          >
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => selectedDay && handleAddToDay(route, selectedDay)}
                            disabled={!selectedDay}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add to Day
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    No transport routes found for {query.destination.country}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cities: {query.destination.cities.join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hotels" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Hotel Options</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Hotel inventory selector will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activities & Sightseeing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Activity selector will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dining" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dining Options</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Restaurant and dining selector will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Section */}
      {previewItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {previewItems.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium">{item.from} → {item.to}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.transportType} • {item.distance}km • {item.duration} • ${item.price}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
