import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Hotel, Bed, Star, MapPin, Wifi, Car, Dumbbell, 
  Tv, Coffee, Utensils, Phone, Plus, Edit2, Trash2,
  Calendar, Users, DollarSign, CheckCircle
} from 'lucide-react';

interface AccommodationPlanningProps {
  days: any[];
  onUpdate?: (accommodationData: any) => void;
  formatCurrency: (amount: number) => string;
}

const AccommodationPlanning: React.FC<AccommodationPlanningProps> = ({
  days,
  onUpdate,
  formatCurrency
}) => {
  const { toast } = useToast();
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAccommodation, setNewAccommodation] = useState({
    name: '',
    type: 'hotel',
    city: '',
    checkIn: '',
    checkOut: '',
    nights: 1,
    roomType: '',
    starRating: 3,
    pricePerNight: 0,
    totalPrice: 0,
    amenities: [] as string[],
    description: '',
    address: '',
    phone: '',
    email: ''
  });

  const accommodationTypes = [
    { value: 'hotel', label: 'Hotel', icon: Hotel },
    { value: 'resort', label: 'Resort', icon: Hotel },
    { value: 'guesthouse', label: 'Guesthouse', icon: Bed },
    { value: 'apartment', label: 'Apartment', icon: Bed },
    { value: 'villa', label: 'Villa', icon: Bed },
    { value: 'hostel', label: 'Hostel', icon: Bed }
  ];

  const availableAmenities = [
    { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'gym', label: 'Gym', icon: Dumbbell },
    { id: 'tv', label: 'TV', icon: Tv },
    { id: 'breakfast', label: 'Breakfast', icon: Coffee },
    { id: 'restaurant', label: 'Restaurant', icon: Utensils },
    { id: 'phone', label: 'Phone', icon: Phone }
  ];

  const handleAddAccommodation = () => {
    if (!newAccommodation.name || !newAccommodation.city) {
      toast({
        title: "Missing Information",
        description: "Please provide accommodation name and city",
        variant: "destructive"
      });
      return;
    }

    const accommodation = {
      ...newAccommodation,
      id: Date.now().toString(),
      totalPrice: newAccommodation.pricePerNight * newAccommodation.nights
    };

    setAccommodations([...accommodations, accommodation]);
    setNewAccommodation({
      name: '',
      type: 'hotel',
      city: '',
      checkIn: '',
      checkOut: '',
      nights: 1,
      roomType: '',
      starRating: 3,
      pricePerNight: 0,
      totalPrice: 0,
      amenities: [],
      description: '',
      address: '',
      phone: '',
      email: ''
    });
    setIsAdding(false);

    toast({
      title: "Accommodation Added",
      description: `${accommodation.name} has been added to your accommodation plan`
    });

    onUpdate?.(accommodations);
  };

  const handleDeleteAccommodation = (id: string) => {
    const updated = accommodations.filter(acc => acc.id !== id);
    setAccommodations(updated);
    onUpdate?.(updated);
    
    toast({
      title: "Accommodation Removed",
      description: "Accommodation has been removed from your plan"
    });
  };

  const toggleAmenity = (amenityId: string) => {
    const amenities = newAccommodation.amenities.includes(amenityId)
      ? newAccommodation.amenities.filter(a => a !== amenityId)
      : [...newAccommodation.amenities, amenityId];
    
    setNewAccommodation({ ...newAccommodation, amenities });
  };

  const getStarDisplay = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  const getTotalAccommodationCost = () => {
    return accommodations.reduce((sum, acc) => sum + acc.totalPrice, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Hotel className="h-5 w-5 text-blue-600" />
            Accommodation Planning
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage hotels, resorts, and other accommodations for the trip
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold">{formatCurrency(getTotalAccommodationCost())}</p>
            <p className="text-sm text-muted-foreground">Total Accommodation</p>
          </div>
          <Button onClick={() => setIsAdding(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Accommodation
          </Button>
        </div>
      </div>

      {/* Add New Accommodation Form */}
      {isAdding && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Add New Accommodation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Accommodation Name *</Label>
                <Input
                  id="name"
                  value={newAccommodation.name}
                  onChange={(e) => setNewAccommodation({ ...newAccommodation, name: e.target.value })}
                  placeholder="Hotel name..."
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={newAccommodation.type} onValueChange={(value) => setNewAccommodation({ ...newAccommodation, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accommodationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={newAccommodation.city}
                  onChange={(e) => setNewAccommodation({ ...newAccommodation, city: e.target.value })}
                  placeholder="City..."
                />
              </div>
              <div>
                <Label htmlFor="roomType">Room Type</Label>
                <Input
                  id="roomType"
                  value={newAccommodation.roomType}
                  onChange={(e) => setNewAccommodation({ ...newAccommodation, roomType: e.target.value })}
                  placeholder="Deluxe Room, Suite..."
                />
              </div>
              <div>
                <Label htmlFor="checkIn">Check-in Date</Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={newAccommodation.checkIn}
                  onChange={(e) => setNewAccommodation({ ...newAccommodation, checkIn: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="checkOut">Check-out Date</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={newAccommodation.checkOut}
                  onChange={(e) => setNewAccommodation({ ...newAccommodation, checkOut: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="nights">Number of Nights</Label>
                <Input
                  id="nights"
                  type="number"
                  min="1"
                  value={newAccommodation.nights}
                  onChange={(e) => setNewAccommodation({ ...newAccommodation, nights: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="pricePerNight">Price per Night</Label>
                <Input
                  id="pricePerNight"
                  type="number"
                  min="0"
                  value={newAccommodation.pricePerNight}
                  onChange={(e) => setNewAccommodation({ ...newAccommodation, pricePerNight: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label>Star Rating</Label>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewAccommodation({ ...newAccommodation, starRating: star })}
                  >
                    <Star 
                      className={`h-5 w-5 ${star <= newAccommodation.starRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {availableAmenities.map((amenity) => (
                  <Button
                    key={amenity.id}
                    type="button"
                    variant={newAccommodation.amenities.includes(amenity.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleAmenity(amenity.id)}
                    className="gap-2"
                  >
                    <amenity.icon className="h-3 w-3" />
                    {amenity.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newAccommodation.description}
                onChange={(e) => setNewAccommodation({ ...newAccommodation, description: e.target.value })}
                placeholder="Additional details about the accommodation..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddAccommodation} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Add Accommodation
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Accommodations */}
      <div className="space-y-4">
        {accommodations.length === 0 && !isAdding && (
          <Card>
            <CardContent className="p-8 text-center">
              <Hotel className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No accommodations planned</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add hotels, resorts, or other accommodations for your trip
              </p>
              <Button onClick={() => setIsAdding(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add First Accommodation
              </Button>
            </CardContent>
          </Card>
        )}

        {accommodations.map((accommodation) => (
          <Card key={accommodation.id} className="border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Hotel className="h-5 w-5 text-green-600" />
                    {accommodation.name}
                    <Badge variant="outline" className="capitalize">{accommodation.type}</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {accommodation.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {accommodation.nights} nights
                    </span>
                    <div className="flex items-center gap-1">
                      {getStarDisplay(accommodation.starRating)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(accommodation.totalPrice)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(accommodation.pricePerNight)}/night
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAccommodation(accommodation.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {accommodation.roomType && (
                <p className="text-sm">
                  <span className="font-medium">Room Type:</span> {accommodation.roomType}
                </p>
              )}
              
              {accommodation.amenities.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Amenities:</p>
                  <div className="flex flex-wrap gap-1">
                    {accommodation.amenities.map((amenityId: string) => {
                      const amenity = availableAmenities.find(a => a.id === amenityId);
                      return amenity ? (
                        <Badge key={amenityId} variant="secondary" className="text-xs gap-1">
                          <amenity.icon className="h-3 w-3" />
                          {amenity.label}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {accommodation.description && (
                <p className="text-sm text-muted-foreground">{accommodation.description}</p>
              )}

              {(accommodation.checkIn || accommodation.checkOut) && (
                <div className="flex gap-4 text-sm">
                  {accommodation.checkIn && (
                    <span>Check-in: {new Date(accommodation.checkIn).toLocaleDateString()}</span>
                  )}
                  {accommodation.checkOut && (
                    <span>Check-out: {new Date(accommodation.checkOut).toLocaleDateString()}</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AccommodationPlanning;
