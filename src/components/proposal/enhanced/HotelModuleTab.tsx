
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrencySymbolByCountry } from "@/pages/inventory/transport/utils/currencyUtils";
import { Hotel } from "@/components/inventory/hotels/types/hotel";
import { Query } from "@/types/query";
import { Hotel as HotelIcon, Star, Users, Bed, Plus, CheckCircle } from "lucide-react";

interface HotelSelection {
  roomType: string;
  numRooms: number;
  pricePerRoom: number;
  totalPrice: number;
}

interface HotelModuleTabProps {
  country: string;
  hotels: Hotel[];
  selectedModules: any[];
  onAddModule: (module: any) => void;
  onRemoveModule: (id: string) => void;
  onUpdatePricing: (id: string, pricing: any) => void;
  query?: Query;
}

const HotelModuleTab: React.FC<HotelModuleTabProps> = ({
  country,
  hotels,
  selectedModules,
  onAddModule,
  onRemoveModule,
  onUpdatePricing,
  query,
}) => {
  const currencySymbol = getCurrencySymbolByCountry(country) ?? "";
  const [selections, setSelections] = useState<Record<string, HotelSelection>>({});

  // Calculate suggested room count based on PAX
  const getSuggestedRooms = (adults: number, children: number) => {
    if (!adults && !children) return 1;
    
    // Basic logic: 2 adults per room, children share with adults
    const baseRooms = Math.ceil(adults / 2);
    
    // If children > adults, might need extra room
    if (children > adults) {
      return baseRooms + Math.ceil((children - adults) / 2);
    }
    
    return Math.max(1, baseRooms);
  };

  const paxCount = query ? query.paxDetails.adults + query.paxDetails.children : 2;
  const suggestedRooms = query ? getSuggestedRooms(query.paxDetails.adults, query.paxDetails.children) : 1;

  const handleSelection = (hotelId: string, field: keyof HotelSelection, value: any) => {
    setSelections((prev) => {
      const hotel = hotels.find((h) => h.id === hotelId);
      const roomTypes = hotel?.roomTypes ?? [];
      const defaultRoomType = roomTypes[0]?.name || "";
      const defaultPrice = roomTypes[0]?.adultPrice ?? 0;
      
      const currentSel = prev[hotelId] || {
        roomType: defaultRoomType,
        numRooms: suggestedRooms,
        pricePerRoom: defaultPrice,
        totalPrice: defaultPrice * suggestedRooms,
      };

      let newSel = { ...currentSel };

      if (field === "roomType") {
        const selectedRoom = roomTypes.find((r) => r.name === value) || roomTypes[0];
        newSel.roomType = value;
        newSel.pricePerRoom = selectedRoom?.adultPrice ?? 0;
        newSel.totalPrice = newSel.pricePerRoom * newSel.numRooms;
      } else if (field === "numRooms") {
        newSel.numRooms = Math.max(1, Number(value));
        newSel.totalPrice = newSel.pricePerRoom * newSel.numRooms;
      } else if (field === "pricePerRoom") {
        newSel.pricePerRoom = Math.max(0, Number(value));
        newSel.totalPrice = newSel.pricePerRoom * newSel.numRooms;
      }

      return {
        ...prev,
        [hotelId]: newSel,
      };
    });
  };

  const handleAdd = (hotel: Hotel) => {
    const roomTypes = hotel.roomTypes ?? [];
    const sel = selections[hotel.id] || {
      roomType: roomTypes[0]?.name ?? "",
      numRooms: suggestedRooms,
      pricePerRoom: roomTypes[0]?.adultPrice ?? 0,
      totalPrice: (roomTypes[0]?.adultPrice ?? 0) * suggestedRooms,
    };

    const module = {
      id: `${hotel.id}:${sel.roomType}:${Date.now()}`,
      type: "hotel",
      data: {
        hotel,
        roomType: sel.roomType,
        numRooms: sel.numRooms,
        pricePerRoom: sel.pricePerRoom,
        name: `${hotel.name} - ${sel.roomType} (${sel.numRooms} rooms)`,
        location: hotel.city || hotel.address?.city || 'N/A',
      },
      pricing: {
        basePrice: sel.totalPrice,
        finalPrice: sel.totalPrice,
        currency: hotel.currency || country,
        breakdown: {
          pricePerRoom: sel.pricePerRoom,
          numRooms: sel.numRooms,
          totalPrice: sel.totalPrice,
        }
      },
      nights: query?.tripDuration?.days ? query.tripDuration.days - 1 : 1,
    };
    onAddModule(module);
  };

  const isAdded = (hotel: Hotel, roomType: string) =>
    selectedModules.some(
      (sm) =>
        sm.type === "hotel" &&
        sm.data.hotel.id === hotel.id &&
        sm.data.roomType === roomType
    );

  const getSelection = (hotelId: string): HotelSelection => {
    const hotel = hotels.find(h => h.id === hotelId);
    const roomTypes = hotel?.roomTypes ?? [];
    const defaultPrice = roomTypes[0]?.adultPrice ?? 0;
    
    return selections[hotelId] || {
      roomType: roomTypes[0]?.name ?? "",
      numRooms: suggestedRooms,
      pricePerRoom: defaultPrice,
      totalPrice: defaultPrice * suggestedRooms,
    };
  };

  if (hotels.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <HotelIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hotels found for {country}</p>
        <p className="text-sm">Add hotels in Hotel Management first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PAX Information */}
      {query && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">
                  {query.paxDetails.adults} Adults, {query.paxDetails.children} Children
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700">Suggested: {suggestedRooms} rooms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hotels Grid */}
      <div className="grid gap-6">
        {hotels.map((hotel) => {
          const roomTypes = hotel.roomTypes ?? [];
          const sel = getSelection(hotel.id);
          const selectedRoom = roomTypes.find(r => r.name === sel.roomType) || roomTypes[0];

          if (roomTypes.length === 0) {
            return (
              <Card key={hotel.id} className="opacity-50">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">
                    Hotel "{hotel.name}" has no room types configured
                  </div>
                </CardContent>
              </Card>
            );
          }

          return (
            <Card key={hotel.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HotelIcon className="h-5 w-5 text-primary" />
                    {hotel.name}
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: hotel.starRating || 4 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {hotel.city || hotel.address?.city}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Room Type Selection */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Room Type</Label>
                    <Select
                      value={sel.roomType}
                      onValueChange={(value) => handleSelection(hotel.id, "roomType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes.map((room) => (
                          <SelectItem key={room.name} value={room.name}>
                            <div className="flex items-center gap-2">
                              <span>{room.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                Max {room.maxOccupancy || room.capacity?.adults + room.capacity?.children || 2} guests
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Number of Rooms</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={sel.numRooms}
                      onChange={(e) => handleSelection(hotel.id, "numRooms", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Price per Room ({currencySymbol})</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={sel.pricePerRoom}
                      onChange={(e) => handleSelection(hotel.id, "pricePerRoom", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Total Price</Label>
                    <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center">
                      <span className="font-medium">{sel.totalPrice.toFixed(2)} {currencySymbol}</span>
                    </div>
                  </div>
                </div>

                {/* Room Details */}
                {selectedRoom && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/50 rounded-md">
                    <div>
                      <div className="text-xs text-muted-foreground">Max Occupancy</div>
                      <div className="text-sm font-medium">
                        {selectedRoom.maxOccupancy || selectedRoom.capacity?.adults + selectedRoom.capacity?.children || 2} guests
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Bed Type</div>
                      <div className="text-sm font-medium">{selectedRoom.bedType || 'Standard'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Base Price</div>
                      <div className="text-sm font-medium">{selectedRoom.adultPrice} {currencySymbol}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Room Configuration</div>
                      <div className="text-sm font-medium">{selectedRoom.configuration || 'Standard'}</div>
                    </div>
                  </div>
                )}

                {/* Room Capacity Check */}
                {selectedRoom && query && (
                  <div className="p-3 rounded-md bg-green-50 border border-green-200">
                    <div className="text-sm">
                      <strong>Capacity Check:</strong> {sel.numRooms} × {selectedRoom.maxOccupancy || selectedRoom.capacity?.adults + selectedRoom.capacity?.children || 2} = {sel.numRooms * (selectedRoom.maxOccupancy || selectedRoom.capacity?.adults + selectedRoom.capacity?.children || 2)} guests capacity
                      {sel.numRooms * (selectedRoom.maxOccupancy || selectedRoom.capacity?.adults + selectedRoom.capacity?.children || 2) >= paxCount ? (
                        <span className="text-green-700 ml-2">✓ Sufficient</span>
                      ) : (
                        <span className="text-red-700 ml-2">⚠ Insufficient for {paxCount} guests</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Add Button */}
                <div className="flex justify-end">
                  {isAdded(hotel, sel.roomType) ? (
                    <Button variant="outline" disabled className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Added to Services
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleAdd(hotel)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add to Services
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default HotelModuleTab;
