
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Hotel, Star, Users, Calendar, MapPin, Plus, Check, X } from 'lucide-react';
import { Hotel as HotelType } from '@/components/inventory/hotels/types/hotel';

interface AccommodationOption {
  id: string;
  hotel: HotelType;
  roomType: string;
  numberOfRooms: number;
  numberOfNights: number;
  pricePerNight: number;
  totalPrice: number;
  isSelected: boolean;
  isAlternative: boolean;
  priority: number;
}

interface AccommodationOptionSelectorProps {
  city: string;
  availableHotels: HotelType[];
  selectedOptions: AccommodationOption[];
  onOptionSelect: (option: AccommodationOption) => void;
  onOptionDeselect: (optionId: string) => void;
  onOptionUpdate: (optionId: string, updates: Partial<AccommodationOption>) => void;
  maxAlternatives?: number;
}

const AccommodationOptionSelector: React.FC<AccommodationOptionSelectorProps> = ({
  city,
  availableHotels,
  selectedOptions,
  onOptionSelect,
  onOptionDeselect,
  onOptionUpdate,
  maxAlternatives = 3
}) => {
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');
  const [numberOfRooms, setNumberOfRooms] = useState<number>(1);
  const [numberOfNights, setNumberOfNights] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [useCustomPrice, setUseCustomPrice] = useState<boolean>(false);

  const selectedHotel = availableHotels.find(h => h.id === selectedHotelId);
  const selectedRoom = selectedHotel?.roomTypes?.find(rt => rt.name === selectedRoomType);

  const primaryOptions = selectedOptions.filter(opt => !opt.isAlternative);
  const alternativeOptions = selectedOptions.filter(opt => opt.isAlternative);

  const calculatePrice = () => {
    if (useCustomPrice) return customPrice * numberOfRooms * numberOfNights;
    if (!selectedRoom) return 0;
    return selectedRoom.adultPrice * numberOfRooms * numberOfNights;
  };

  const handleAddOption = (isAlternative: boolean = false) => {
    if (!selectedHotel || !selectedRoom) return;

    const option: AccommodationOption = {
      id: `accommodation_${Date.now()}_${Math.random()}`,
      hotel: selectedHotel,
      roomType: selectedRoom.name,
      numberOfRooms,
      numberOfNights,
      pricePerNight: useCustomPrice ? customPrice : selectedRoom.adultPrice,
      totalPrice: calculatePrice(),
      isSelected: true,
      isAlternative,
      priority: isAlternative ? alternativeOptions.length + 1 : primaryOptions.length + 1
    };

    onOptionSelect(option);
    
    // Reset form
    setSelectedHotelId('');
    setSelectedRoomType('');
    setCustomPrice(0);
    setUseCustomPrice(false);
  };

  const toggleOptionSelection = (optionId: string) => {
    const option = selectedOptions.find(opt => opt.id === optionId);
    if (!option) return;

    if (option.isSelected) {
      onOptionDeselect(optionId);
    } else {
      onOptionUpdate(optionId, { isSelected: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Option */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5" />
            Add Accommodation Option - {city}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hotel Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Select Hotel</Label>
              <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose hotel" />
                </SelectTrigger>
                <SelectContent>
                  {availableHotels.map(hotel => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      <div className="flex items-center gap-2">
                        <span>{hotel.name}</span>
                        <div className="flex items-center">
                          {Array.from({ length: hotel.starRating || 0 }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedHotel && (
              <div>
                <Label>Room Type</Label>
                <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedHotel.roomTypes?.map(roomType => (
                      <SelectItem key={roomType.name} value={roomType.name}>
                        <div className="flex items-center justify-between w-full">
                          <span>{roomType.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ${roomType.adultPrice}/night
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Room Configuration */}
          {selectedRoom && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Number of Rooms</Label>
                <Input
                  type="number"
                  min="1"
                  value={numberOfRooms}
                  onChange={(e) => setNumberOfRooms(Number(e.target.value))}
                />
              </div>
              
              <div>
                <Label>Number of Nights</Label>
                <Input
                  type="number"
                  min="1"
                  value={numberOfNights}
                  onChange={(e) => setNumberOfNights(Number(e.target.value))}
                />
              </div>

              <div>
                <Label>Total Price</Label>
                <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center">
                  <span className="font-medium">${calculatePrice().toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Custom Pricing */}
          {selectedRoom && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="custom-price"
                  checked={useCustomPrice}
                  onCheckedChange={(checked) => setUseCustomPrice(checked === true)}
                />
                <Label htmlFor="custom-price">Use custom pricing</Label>
              </div>
              
              {useCustomPrice && (
                <div className="w-full md:w-1/3">
                  <Label>Price per night per room</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    placeholder="Enter custom price"
                  />
                </div>
              )}
            </div>
          )}

          {/* Add Buttons */}
          {selectedHotel && selectedRoom && (
            <div className="flex gap-3">
              <Button 
                onClick={() => handleAddOption(false)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add as Primary Option
              </Button>
              
              {alternativeOptions.length < maxAlternatives && (
                <Button 
                  variant="outline"
                  onClick={() => handleAddOption(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add as Alternative
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Options */}
      {selectedOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Accommodation Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Primary Options */}
            {primaryOptions.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Primary Options</h4>
                <div className="space-y-3">
                  {primaryOptions.map(option => (
                    <AccommodationOptionCard
                      key={option.id}
                      option={option}
                      onToggleSelection={toggleOptionSelection}
                      onRemove={onOptionDeselect}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Alternative Options */}
            {alternativeOptions.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Alternative Options</h4>
                  <div className="space-y-3">
                    {alternativeOptions.map(option => (
                      <AccommodationOptionCard
                        key={option.id}
                        option={option}
                        onToggleSelection={toggleOptionSelection}
                        onRemove={onOptionDeselect}
                        isAlternative
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface AccommodationOptionCardProps {
  option: AccommodationOption;
  onToggleSelection: (optionId: string) => void;
  onRemove: (optionId: string) => void;
  isAlternative?: boolean;
}

const AccommodationOptionCard: React.FC<AccommodationOptionCardProps> = ({
  option,
  onToggleSelection,
  onRemove,
  isAlternative = false
}) => {
  return (
    <div className={`p-4 border rounded-lg ${isAlternative ? 'bg-blue-50/50 border-blue-200' : 'bg-white'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h5 className="font-medium">{option.hotel.name}</h5>
            <div className="flex items-center">
              {Array.from({ length: option.hotel.starRating || 0 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
              ))}
            </div>
            {isAlternative && (
              <Badge variant="outline" className="text-xs">
                Alternative Option
              </Badge>
            )}
            {option.isSelected && (
              <Badge variant="default" className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Selected
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{option.hotel.city}</span>
            </div>
            <div>
              <span>Room: {option.roomType}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{option.numberOfRooms} room{option.numberOfRooms !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{option.numberOfNights} night{option.numberOfNights !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-semibold text-lg">
            ${option.totalPrice.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">
            ${option.pricePerNight}/night
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleSelection(option.id)}
        >
          {option.isSelected ? 'Deselect' : 'Select'}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onRemove(option.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AccommodationOptionSelector;
