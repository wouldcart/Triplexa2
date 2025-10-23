
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Hotel, Star, Users, Bed, Calendar, Plus, MapPin } from 'lucide-react';
import { useEnhancedInventoryData } from '@/hooks/useEnhancedInventoryData';
import { getCurrencyByCountry } from '@/utils/currencyUtils';

interface HotelSelectionCardProps {
  city: string;
  country: string;
  dayNumber: number;
  onHotelSelect: (hotelData: any) => void;
  query?: any;
}

interface RoomSelection {
  roomType: string;
  numberOfRooms: number;
  numberOfNights: number;
  pricePerNight: number;
  totalPrice: number;
}

export const HotelSelectionCard: React.FC<HotelSelectionCardProps> = ({
  city,
  country,
  dayNumber,
  onHotelSelect,
  query
}) => {
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [roomSelections, setRoomSelections] = useState<Record<string, RoomSelection>>({});
  
  const { hotels, loading } = useEnhancedInventoryData({
    countries: [country],
    cities: [city]
  });

  const currency = getCurrencyByCountry(country);
  const totalPax = query ? query.paxDetails.adults + query.paxDetails.children : 2;

  const handleRoomSelectionChange = (hotelId: string, field: keyof RoomSelection, value: any) => {
    const hotel = hotels.find(h => h.id === hotelId);
    if (!hotel) return;

    const roomTypes = hotel.roomTypes || [];
    const defaultRoom = roomTypes[0];
    
    setRoomSelections(prev => {
      const current = prev[hotelId] || {
        roomType: defaultRoom?.name || '',
        numberOfRooms: 1,
        numberOfNights: 1,
        pricePerNight: defaultRoom?.adultPrice || 100,
        totalPrice: defaultRoom?.adultPrice || 100
      };

      let updated = { ...current };

      if (field === 'roomType') {
        const selectedRoom = roomTypes.find(r => r.name === value);
        updated.roomType = value;
        updated.pricePerNight = selectedRoom?.adultPrice || 100;
      } else if (field === 'numberOfRooms') {
        updated.numberOfRooms = Math.max(1, Number(value));
      } else if (field === 'numberOfNights') {
        updated.numberOfNights = Math.max(1, Number(value));
      } else if (field === 'pricePerNight') {
        updated.pricePerNight = Math.max(0, Number(value));
      }

      // Recalculate total price
      updated.totalPrice = updated.pricePerNight * updated.numberOfRooms * updated.numberOfNights;

      return {
        ...prev,
        [hotelId]: updated
      };
    });
  };

  const handleAddHotel = (hotel: any) => {
    const selection = roomSelections[hotel.id];
    if (!selection) return;

    const hotelData = {
      hotel,
      selection,
      startDay: dayNumber,
      endDay: dayNumber + selection.numberOfNights - 1,
      cities: [city],
      totalPrice: selection.totalPrice
    };

    onHotelSelect(hotelData);
  };

  const getSelection = (hotelId: string): RoomSelection => {
    const hotel = hotels.find(h => h.id === hotelId);
    const roomTypes = hotel?.roomTypes || [];
    const defaultRoom = roomTypes[0];
    
    return roomSelections[hotelId] || {
      roomType: defaultRoom?.name || '',
      numberOfRooms: 1,
      numberOfNights: 1,
      pricePerNight: defaultRoom?.adultPrice || 100,
      totalPrice: defaultRoom?.adultPrice || 100
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading hotels...</p>
        </CardContent>
      </Card>
    );
  }

  const cityHotels = hotels.filter(hotel => 
    hotel.city?.toLowerCase() === city.toLowerCase() || 
    hotel.country?.toLowerCase() === country.toLowerCase()
  );

  if (cityHotels.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <Hotel className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No hotels available in {city}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Hotel className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Hotel Selection - {city}</h3>
        <Badge variant="outline" className="text-xs">
          Day {dayNumber}
        </Badge>
      </div>

      {cityHotels.map(hotel => {
        const roomTypes = hotel.roomTypes || [];
        const selection = getSelection(hotel.id);
        const selectedRoom = roomTypes.find(r => r.name === selection.roomType) || roomTypes[0];

        if (roomTypes.length === 0) {
          return (
            <Card key={hotel.id} className="opacity-50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  {hotel.name} - No room types configured
                </p>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={hotel.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hotel className="h-4 w-4 text-primary" />
                  {hotel.name}
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: hotel.starRating || 4 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                  ))}
                </div>
              </CardTitle>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {hotel.city}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Room Selection Controls */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Room Type</label>
                  <Select
                    value={selection.roomType}
                    onValueChange={(value) => handleRoomSelectionChange(hotel.id, 'roomType', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map(room => (
                        <SelectItem key={room.name} value={room.name}>
                          <div className="flex items-center gap-2">
                            <span>{room.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {room.maxOccupancy || 2} pax
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Rooms</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={selection.numberOfRooms}
                    onChange={(e) => handleRoomSelectionChange(hotel.id, 'numberOfRooms', e.target.value)}
                    className="h-8"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nights</label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={selection.numberOfNights}
                    onChange={(e) => handleRoomSelectionChange(hotel.id, 'numberOfNights', e.target.value)}
                    className="h-8"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Price/Night ({currency.symbol})</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={selection.pricePerNight}
                    onChange={(e) => handleRoomSelectionChange(hotel.id, 'pricePerNight', e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>

              {/* Room Details */}
              {selectedRoom && (
                <div className="p-3 bg-muted/50 rounded-md">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Max Occupancy:</span>
                      <div className="font-medium">{selectedRoom.maxOccupancy || 2} guests</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Bed Type:</span>
                      <div className="font-medium">{selectedRoom.bedType || 'Standard'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Base Price:</span>
                      <div className="font-medium">{selectedRoom.adultPrice} {currency.symbol}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Capacity:</span>
                      <div className="font-medium">
                        {selection.numberOfRooms * (selectedRoom.maxOccupancy || 2)} guests
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stay Duration Display */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    Days {dayNumber} to {dayNumber + selection.numberOfNights - 1} 
                    ({selection.numberOfNights} night{selection.numberOfNights > 1 ? 's' : ''})
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {currency.symbol}{selection.totalPrice.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selection.numberOfRooms} room{selection.numberOfRooms > 1 ? 's' : ''} × {selection.numberOfNights} night{selection.numberOfNights > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Capacity Check */}
              {query && (
                <div className={`p-2 rounded-md text-sm ${
                  selection.numberOfRooms * (selectedRoom?.maxOccupancy || 2) >= totalPax 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>
                      Capacity: {selection.numberOfRooms * (selectedRoom?.maxOccupancy || 2)} guests 
                      / Required: {totalPax} guests
                    </span>
                    {selection.numberOfRooms * (selectedRoom?.maxOccupancy || 2) >= totalPax ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">✓ Sufficient</Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-100 text-red-800">⚠ Insufficient</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Add Button */}
              <Button 
                onClick={() => handleAddHotel(hotel)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Hotel ({selection.numberOfNights} night{selection.numberOfNights > 1 ? 's' : ''})
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
