import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hotel, Car, MapPin, Users, Star, Clock, Edit, Check, X, DollarSign } from "lucide-react";
import { Query } from '@/types/query';
import { useEnhancedInventoryData } from '@/hooks/useEnhancedInventoryData';
import { getCurrencyByCountry, formatCurrency, calculateTripDuration } from '@/utils/currencyUtils';
import { ItinerarySummaryPanel } from './ItinerarySummaryPanel';
import { AccommodationStay } from '@/utils/accommodationCalculations';
import { ItineraryDay } from './DayByDayItineraryBuilder';

interface EnhancedInventorySuggestionPanelProps {
  query: Query;
  selectedDayId: string | null;
  days?: ItineraryDay[];
  accommodations?: AccommodationStay[];
  onAddHotelToDay: (dayId: string, hotel: any) => void;
  onAddTransportToDay: (dayId: string, transport: any) => void;
  onAddSightseeingToDay: (dayId: string, sightseeing: any) => void;
}

export const EnhancedInventorySuggestionPanel: React.FC<EnhancedInventorySuggestionPanelProps> = ({
  query,
  selectedDayId,
  days = [],
  accommodations = [],
  onAddHotelToDay,
  onAddTransportToDay,
  onAddSightseeingToDay
}) => {
  const [selectedCity, setSelectedCity] = useState<string>(query.destination.cities[0] || '');
  const [selectedNights, setSelectedNights] = useState<number>(1);
  const [editingPrices, setEditingPrices] = useState<{ [key: string]: number }>({});
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'suggestions'>('summary');

  // Load inventory data filtered by query destinations
  const { hotels, transportRoutes, sightseeing, loading } = useEnhancedInventoryData({
    countries: [query.destination.country],
    cities: query.destination.cities
  });

  const currency = getCurrencyByCountry(query.destination.country);
  const tripDuration = calculateTripDuration(query.travelDates.from, query.travelDates.to);
  const totalPax = query.paxDetails.adults + query.paxDetails.children;

  const handlePriceEdit = (itemId: string, newPrice: number) => {
    setEditingPrices(prev => ({ ...prev, [itemId]: newPrice }));
  };

  const getEditablePrice = (itemId: string, originalPrice: number) => {
    return editingPrices[itemId] !== undefined ? editingPrices[itemId] : originalPrice;
  };

  const startEditing = (itemId: string, currentPrice: number) => {
    setEditingItem(itemId);
    setEditingPrices(prev => ({ ...prev, [itemId]: currentPrice }));
  };

  const cancelEditing = () => {
    setEditingItem(null);
  };

  const confirmEditing = () => {
    setEditingItem(null);
  };

  // Filter and prepare transport routes
  const availableTransports = transportRoutes.filter(route => {
    const routeFrom = (route.from || route.startLocation || '').toLowerCase();
    const routeTo = (route.to || route.endLocation || '').toLowerCase();
    return query.destination.cities.some(city => 
      routeFrom.includes(city.toLowerCase()) || routeTo.includes(city.toLowerCase())
    );
  });

  // Filter hotels by selected city
  const availableHotels = hotels.filter(hotel => {
    if (!selectedCity) return true;
    const hotelCity = hotel.city?.toLowerCase() || '';
    const hotelLocation = hotel.location?.toLowerCase() || '';
    const cityLower = selectedCity.toLowerCase();
    return hotelCity.includes(cityLower) || hotelLocation.includes(cityLower) || hotel.name.toLowerCase().includes(cityLower);
  });

  // Filter sightseeing by query cities
  const availableSightseeing = sightseeing.filter(activity => {
    const activityCity = activity.city?.toLowerCase() || '';
    return query.destination.cities.some(city => 
      activityCity.includes(city.toLowerCase()) || city.toLowerCase().includes(activityCity)
    );
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading suggestions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Panel - Always visible */}
      <ItinerarySummaryPanel
        query={query}
        days={days}
        accommodations={accommodations}
      />

      {/* Suggestions Panel */}
      <Card className="h-fit hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Smart Suggestions
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            <p>{query.destination.country} • {totalPax} PAX • {tripDuration.days}D/{tripDuration.nights}N</p>
            <p>Currency: {currency.code} ({currency.symbol})</p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transport" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transport" className="text-xs">Transport</TabsTrigger>
              <TabsTrigger value="hotels" className="text-xs">Hotels</TabsTrigger>
              <TabsTrigger value="activities" className="text-xs">Activities</TabsTrigger>
            </TabsList>

            {/* Transport Tab */}
            <TabsContent value="transport" className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Available Routes ({availableTransports.length})</h4>
                {availableTransports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transport routes found for selected destinations.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableTransports.map(transport => {
                      const itemId = `transport_${transport.id}`;
                      const originalPrice = transport.price || 0;
                      const currentPrice = getEditablePrice(itemId, originalPrice);
                      const isEditing = editingItem === itemId;

                      return (
                        <div key={transport.id} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{transport.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {transport.transportType}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {(transport.from || transport.startLocation || 'Unknown')} → {(transport.to || transport.endLocation || 'Unknown')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(transport.duration || 'N/A')} • {(transport.distance || 0)}km
                              </p>
                            </div>
                            <div className="text-right">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={currentPrice}
                                    onChange={(e) => handlePriceEdit(itemId, Number(e.target.value))}
                                    className="w-20 h-8 text-xs"
                                  />
                                  <Button size="sm" variant="ghost" onClick={confirmEditing} className="h-8 w-8 p-0">
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-8 w-8 p-0">
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-sm">
                                    {currency.symbol}{currentPrice.toLocaleString()}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing(itemId, currentPrice)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => selectedDayId && onAddTransportToDay(selectedDayId, {
                              ...transport,
                              price: currentPrice
                            })}
                            disabled={!selectedDayId}
                            className="w-full h-8 text-xs"
                          >
                            Add to {selectedDayId ? `Day ${selectedDayId.split('_')[1]}` : 'Selected Day'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Hotels Tab */}
            <TabsContent value="hotels" className="space-y-3">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {query.destination.cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedNights.toString()} onValueChange={(value) => setSelectedNights(Number(value))}>
                    <SelectTrigger className="h-8 text-xs w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(nights => (
                        <SelectItem key={nights} value={nights.toString()}>{nights}N</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <h4 className="font-medium text-sm">Available Hotels ({availableHotels.length})</h4>
                {availableHotels.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hotels found for selected city.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableHotels.map(hotel => {
                      const itemId = `hotel_${hotel.id}`;
                      const roomType = hotel.roomTypes?.[0] || { name: 'Standard Room', adultPrice: hotel.minRate || 100 };
                      const originalPrice = roomType.adultPrice * selectedNights;
                      const currentPrice = getEditablePrice(itemId, originalPrice);
                      const isEditing = editingItem === itemId;

                      return (
                        <div key={hotel.id} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Hotel className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{hotel.name}</span>
                                {hotel.starRating && (
                                  <div className="flex items-center">
                                    {Array.from({ length: hotel.starRating }).map((_, i) => (
                                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{hotel.city}</p>
                              <p className="text-xs text-muted-foreground">
                                {roomType.name} • {selectedNights} nights
                              </p>
                            </div>
                            <div className="text-right">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={currentPrice}
                                    onChange={(e) => handlePriceEdit(itemId, Number(e.target.value))}
                                    className="w-20 h-8 text-xs"
                                  />
                                  <Button size="sm" variant="ghost" onClick={confirmEditing} className="h-8 w-8 p-0">
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-8 w-8 p-0">
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-sm">
                                    {currency.symbol}{currentPrice.toLocaleString()}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing(itemId, currentPrice)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => selectedDayId && onAddHotelToDay(selectedDayId, {
                              ...hotel,
                              roomType: roomType.name,
                              nights: selectedNights,
                              price: currentPrice
                            })}
                            disabled={!selectedDayId}
                            className="w-full h-8 text-xs"
                          >
                            Add to {selectedDayId ? `Day ${selectedDayId.split('_')[1]}` : 'Selected Day'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Activities Tab */}
            <TabsContent value="activities" className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Available Activities ({availableSightseeing.length})</h4>
                {availableSightseeing.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activities found for selected destinations.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableSightseeing.map(activity => {
                      const itemId = `sightseeing_${activity.id}`;
                      const adultPrice = typeof activity.price === 'object' ? activity.price.adult : (activity.price || 0);
                      const childPrice = typeof activity.price === 'object' ? activity.price.child : (activity.price ? activity.price / 2 : 0);
                      const originalPrice = (adultPrice * query.paxDetails.adults) + (childPrice * query.paxDetails.children);
                      const currentPrice = getEditablePrice(itemId, originalPrice);
                      const isEditing = editingItem === itemId;

                      return (
                        <div key={activity.id} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{activity.name}</span>
                                {activity.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {activity.category}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{activity.city}</p>
                              {activity.duration && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {activity.duration}
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {totalPax} PAX
                              </div>
                            </div>
                            <div className="text-right">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={currentPrice}
                                    onChange={(e) => handlePriceEdit(itemId, Number(e.target.value))}
                                    className="w-20 h-8 text-xs"
                                  />
                                  <Button size="sm" variant="ghost" onClick={confirmEditing} className="h-8 w-8 p-0">
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-8 w-8 p-0">
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-sm">
                                    {currency.symbol}{currentPrice.toLocaleString()}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing(itemId, currentPrice)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => selectedDayId && onAddSightseeingToDay(selectedDayId, {
                              ...activity,
                              price: currentPrice,
                              paxBreakdown: {
                                adults: query.paxDetails.adults,
                                children: query.paxDetails.children,
                                adultPrice,
                                childPrice
                              }
                            })}
                            disabled={!selectedDayId}
                            className="w-full h-8 text-xs"
                          >
                            Add to {selectedDayId ? `Day ${selectedDayId.split('_')[1]}` : 'Selected Day'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {!selectedDayId && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                Select a day from the itinerary to add suggestions
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
