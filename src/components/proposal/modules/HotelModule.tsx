import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Query } from '@/types/query';
import { formatCurrency } from '@/lib/formatters';
import { formatPriceForCountry } from '@/pages/inventory/transport/utils/currencyUtils';
import { Hotel, Star, Users, Calendar, MapPin, Plus, Edit, Lightbulb } from 'lucide-react';
import { useHotelCrud } from '@/components/inventory/hotels/hooks/useHotelCrud';

interface HotelData {
  id: string;
  name: string;
  city: string;
  country: string;
  starRating: number;
  category: string;
  roomTypes: RoomType[];
  amenities: string[];
  images: string[];
  address: string;
  coordinates?: { lat: number; lng: number };
}

interface RoomType {
  id: string;
  name: string;
  capacity: number;
  bedConfiguration: string;
  price: number;
  currency: string;
  amenities: string[];
  images: string[];
  availability: boolean;
}

interface HotelModuleProps {
  query: Query;
  onAddModule: (module: any) => void;
  selectedModules: any[];
  onUpdatePricing: (moduleId: string, pricing: any) => void;
}

const HotelModule: React.FC<HotelModuleProps> = ({ 
  query, 
  onAddModule, 
  selectedModules, 
  onUpdatePricing 
}) => {
  // Use hotel CRUD to get actual hotels from Supabase
  const { hotels: supabaseHotels } = useHotelCrud();
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');
  const [nights, setNights] = useState<number>(query.tripDuration.nights);
  const [rooms, setRooms] = useState<number>(query.hotelDetails.rooms);
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [editingMode, setEditingMode] = useState<boolean>(false);
  const [similarHotels, setSimilarHotels] = useState<HotelData[]>([]);

  useEffect(() => {
    if (query.destination.cities.length > 0) {
      setSelectedCity(query.destination.cities[0]);
    }
  }, [query.destination.cities]);

  useEffect(() => {
    if (selectedCity) {
      loadHotelsForCity(selectedCity);
    }
  }, [selectedCity]);

  useEffect(() => {
    if (selectedHotel) {
      loadSimilarHotels(selectedHotel);
    }
  }, [selectedHotel]);

  const loadHotelsForCity = (city: string) => {
    // Filter Supabase hotels by city instead of using mock data
    const cityHotels = supabaseHotels
      .filter(hotel => hotel.city && hotel.city.toLowerCase().includes(city.toLowerCase()))
      .map(hotel => ({
        id: hotel.id,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country || query.destination.country,
        starRating: hotel.starRating || 4,
        category: hotel.category || 'Standard',
        address: hotel.address || `${hotel.city || city}`,
        amenities: hotel.amenities || ['WiFi', 'AC'],
        images: hotel.images || ['/placeholder.svg'],
        roomTypes: hotel.roomTypes || [{
          id: 'default',
          name: 'Standard Room',
          capacity: 2,
          bedConfiguration: '1 King Bed',
          price: hotel.minRate || 2000,
          currency: hotel.currency || 'THB',
          amenities: ['AC', 'WiFi'],
          images: ['/placeholder.svg'],
          availability: true
        }]
      }));

    setHotels(cityHotels);
  };

  const loadSimilarHotels = (hotelId: string) => {
    const currentHotel = hotels.find(h => h.id === hotelId);
    if (currentHotel) {
      // Filter similar hotels by category and star rating
      const similar = hotels.filter(h => 
        h.id !== hotelId && 
        (h.category === currentHotel.category || h.starRating === currentHotel.starRating)
      );
      setSimilarHotels(similar);
    }
  };

  const getSelectedHotel = () => hotels.find(h => h.id === selectedHotel);
  const getSelectedRoomType = () => {
    const hotel = getSelectedHotel();
    return hotel?.roomTypes.find(r => r.id === selectedRoomType);
  };

  const calculateRoomPrice = () => {
    const roomType = getSelectedRoomType();
    if (!roomType) return 0;
    
    const basePrice = editingMode ? customPrice : roomType.price;
    return basePrice * nights * rooms;
  };

  const formatRoomPrice = (price: number) => {
    return formatPriceForCountry(price, query.destination.country);
  };

  const handleAddHotel = () => {
    const hotel = getSelectedHotel();
    const roomType = getSelectedRoomType();
    
    if (hotel && roomType) {
      const totalPrice = calculateRoomPrice();
      
      onAddModule({
        id: `hotel_${Date.now()}`,
        type: 'hotel',
        data: {
          hotel,
          roomType,
          nights,
          rooms,
          isCustomPrice: editingMode,
          checkIn: query.travelDates.from,
          checkOut: query.travelDates.to
        },
        pricing: {
          basePrice: totalPrice,
          finalPrice: totalPrice,
          currency: roomType.currency
        }
      });

      // Reset selections
      setSelectedHotel('');
      setSelectedRoomType('');
      setCustomPrice(0);
      setEditingMode(false);
      setSimilarHotels([]);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5" />
            Hotel Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* City Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {query.destination.cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Nights</label>
              <Input
                type="number"
                value={nights}
                onChange={(e) => setNights(Number(e.target.value))}
                min="1"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Rooms</label>
              <Input
                type="number"
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                min="1"
              />
            </div>
          </div>

          {/* Hotel Selection */}
          {selectedCity && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Hotel</label>
              <div className="grid gap-3">
                {hotels.map(hotel => (
                  <div
                    key={hotel.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedHotel === hotel.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedHotel(hotel.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{hotel.name}</h4>
                          <div className="flex items-center">
                            {[...Array(hotel.starRating)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <Badge variant="outline">{hotel.category}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {hotel.address}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {hotel.amenities.slice(0, 4).map(amenity => (
                            <Badge key={amenity} variant="secondary" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                          {hotel.amenities.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{hotel.amenities.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room Type Selection */}
          {selectedHotel && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Room Type</label>
              <div className="grid gap-3">
                {getSelectedHotel()?.roomTypes.map(roomType => (
                  <div
                    key={roomType.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRoomType === roomType.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedRoomType(roomType.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">{roomType.name}</h5>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Up to {roomType.capacity} guests
                          </span>
                          <span>{roomType.bedConfiguration}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {roomType.amenities.slice(0, 3).map(amenity => (
                            <Badge key={amenity} variant="secondary" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatRoomPrice(roomType.price)}
                        </div>
                        <div className="text-xs text-muted-foreground">per night</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Hotels Suggestions */}
          {similarHotels.length > 0 && (
            <div className="space-y-2 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <label className="text-sm font-medium">Similar Hotel Suggestions</label>
              </div>
              <div className="grid gap-2">
                {similarHotels.map(hotel => (
                  <div key={hotel.id} className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{hotel.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(hotel.starRating)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <Badge variant="outline" className="text-xs">{hotel.category}</Badge>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedHotel(hotel.id)}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Pricing & Total */}
          {selectedRoomType && (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Pricing</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMode(!editingMode)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {editingMode ? 'Use Standard' : 'Edit Price'}
                </Button>
              </div>
              
              {editingMode && (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Price per night"
                    value={customPrice || ''}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                  />
                  <div className="flex items-center px-3 bg-muted rounded">
                    {getSelectedRoomType()?.currency}
                  </div>
                </div>
              )}
              
              <div className="bg-muted p-3 rounded">
                <div className="flex justify-between text-sm">
                  <span>Price per night:</span>
                  <span>{formatRoomPrice(editingMode ? customPrice : getSelectedRoomType()?.price || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Nights: {nights} × Rooms: {rooms}</span>
                  <span></span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatRoomPrice(calculateRoomPrice())}</span>
                </div>
              </div>
              
              <Button 
                onClick={handleAddHotel} 
                className="w-full"
                disabled={!selectedHotel || !selectedRoomType}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Hotel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Hotels Preview */}
      {selectedModules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Hotels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedModules.map(module => (
                <div key={module.id} className="p-3 bg-muted rounded">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{module.data.hotel.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {module.data.roomType.name} • {module.data.nights} nights • {module.data.rooms} room(s)
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(module.data.checkIn).toLocaleDateString()} - {new Date(module.data.checkOut).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatRoomPrice(module.pricing.finalPrice)}
                      </div>
                      <div className="text-xs text-muted-foreground">total</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HotelModule;
