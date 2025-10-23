import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Hotel, Bed, Star, MapPin, Wifi, Car, Dumbbell, 
  Tv, Coffee, Utensils, Phone, Plus, Edit2, Trash2,
  Calendar, Users, DollarSign, CheckCircle, Clock,
  Building, ArrowRight, ArrowLeft, RefreshCw, Database
} from 'lucide-react';
import { 
  AccommodationOption, 
  AccommodationOptionSet,
  extractAccommodationsFromDays,
  mapAccommodationsToDays,
  calculateAccommodationTimeline
} from '@/utils/accommodationUtils';
import { 
  loadComprehensiveItineraryData, 
  ensureThreeAccommodationOptions,
  ComprehensiveProposalData
} from '@/utils/enhancedItineraryUtils';

interface EnhancedAccommodationPlanningProps {
  selectedAccommodations: Array<{
    id: string;
    hotel?: any;
    name?: string;
    type?: string;
    city?: string;
    roomType: string;
    nights: number;
    rooms: number;
    checkIn: string;
    checkOut: string;
    pricing?: any;
    pricePerNight?: number;
    totalPrice?: number;
    starRating?: number;
    amenities?: string[];
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    similarOptions?: any[];
    dayIds?: string[];
    option?: 1 | 2 | 3;
  }>;
  availableHotels: any[];
  onUpdateAccommodation: (id: string, updates: any) => void;
  onRemoveAccommodation: (id: string) => void;
  queryId?: string; // Add queryId to load day-wise data
  days?: any[]; // Add days array to extract accommodation options
}

const EnhancedAccommodationPlanning: React.FC<EnhancedAccommodationPlanningProps> = ({
  selectedAccommodations,
  availableHotels,
  onUpdateAccommodation,
  onRemoveAccommodation,
  queryId,
  days
}) => {
  const { toast } = useToast();
  const [activeOption, setActiveOption] = useState<1 | 2 | 3>(1);
  const [accommodationOptions, setAccommodationOptions] = useState<AccommodationOptionSet>({
    option1: [],
    option2: [],
    option3: []
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newAccommodation, setNewAccommodation] = useState<Partial<AccommodationOption>>({
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
    email: '',
    option: 1
  });
  const [enhancedData, setEnhancedData] = useState<ComprehensiveProposalData | null>(null);

  const accommodationTypes = [
    { value: 'hotel', label: 'Hotel', icon: Hotel },
    { value: 'resort', label: 'Resort', icon: Hotel },
    { value: 'guesthouse', label: 'Guesthouse', icon: Bed },
    { value: 'apartment', label: 'Apartment', icon: Building },
    { value: 'villa', label: 'Villa', icon: Building },
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

  // Load enhanced data from day-wise itinerary on mount
  useEffect(() => {
    if (queryId) {
      const loadedData = loadComprehensiveItineraryData(queryId);
      if (loadedData) {
        const dataWithOptions = ensureThreeAccommodationOptions(loadedData);
        setEnhancedData(dataWithOptions);
        console.log('Loaded accommodation data from day-wise itinerary:', {
          queryId,
          accommodationOptionsCount: Object.keys(dataWithOptions.enhancedData?.accommodationOptions || {}).length
        });
      }
    }
  }, [queryId]);

  // Load accommodation options from enhanced data or fallback to selectedAccommodations
  useEffect(() => {
    if (enhancedData && enhancedData.enhancedData?.accommodationOptions) {
      // Load from day-wise itinerary data
      const loadedOptions: AccommodationOptionSet = {
        option1: [],
        option2: [],
        option3: []
      };

      // Collect all accommodation options from all days
      Object.values(enhancedData.enhancedData.accommodationOptions).forEach((dayOptions: any[]) => {
        dayOptions.forEach((acc) => {
          const accommodation: AccommodationOption = {
            id: acc.id || `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: acc.hotelName || acc.name || 'Hotel Selection',
            type: acc.hotelType || acc.type || 'hotel',
            city: acc.city || '',
            checkIn: acc.checkInDate || acc.checkIn || '',
            checkOut: acc.checkOutDate || acc.checkOut || '',
            nights: acc.numberOfNights || acc.nights || 1,
            roomType: acc.roomType || '',
            starRating: acc.starRating || 3,
            pricePerNight: acc.pricePerNight || acc.price || 0,
            totalPrice: (acc.pricePerNight || acc.price || 0) * (acc.numberOfNights || acc.nights || 1),
            amenities: acc.amenities || [],
            description: acc.description || '',
            address: acc.address || '',
            phone: acc.phone || '',
            email: acc.email || '',
            dayIds: [acc.dayId || ''],
            option: acc.option || 1
          };

          const optionKey = `option${accommodation.option}` as keyof AccommodationOptionSet;
          if (loadedOptions[optionKey]) {
            loadedOptions[optionKey].push(accommodation);
          }
        });
      });

      setAccommodationOptions(loadedOptions);
    } else {
      // Fallback to existing logic for selectedAccommodations
      const loadedOptions: AccommodationOptionSet = {
        option1: [],
        option2: [],
        option3: []
      };

      selectedAccommodations.forEach((acc, index) => {
        const accommodation: AccommodationOption = {
          id: acc.id,
          name: acc.hotel?.name || acc.name || 'Hotel Selection',
          type: acc.hotel?.type || acc.type || 'hotel',
          city: acc.hotel?.location?.city || acc.hotel?.city || acc.city || '',
          checkIn: acc.checkIn || acc.hotel?.checkIn || '',
          checkOut: acc.checkOut || acc.hotel?.checkOut || '',
          nights: acc.nights || acc.hotel?.nights || 1,
          roomType: acc.roomType || acc.hotel?.roomType || '',
          starRating: acc.hotel?.starRating || acc.starRating || 3,
          pricePerNight: acc.pricing?.basePrice || acc.pricePerNight || acc.hotel?.pricePerNight || 0,
          totalPrice: acc.pricing?.finalPrice || acc.totalPrice || acc.hotel?.totalPrice || 0,
          amenities: acc.hotel?.amenities || acc.amenities || [],
          description: acc.hotel?.description || acc.description || '',
          address: acc.hotel?.location?.address || acc.hotel?.address || acc.address || '',
          phone: acc.hotel?.contact?.phone || acc.hotel?.phone || acc.phone || '',
          email: acc.hotel?.contact?.email || acc.hotel?.email || acc.email || '',
          dayIds: acc.dayIds || [],
          option: acc.option || 1,
          similarOptions: acc.similarOptions || []
        };

        const optionKey = `option${accommodation.option}` as keyof AccommodationOptionSet;
        if (loadedOptions[optionKey]) {
          loadedOptions[optionKey].push(accommodation);
        }
      });

      setAccommodationOptions(loadedOptions);
    }
  }, [selectedAccommodations, enhancedData]);

  const getCurrentAccommodations = () => {
    return accommodationOptions[`option${activeOption}` as keyof AccommodationOptionSet];
  };

  const handleAddAccommodation = () => {
    if (!newAccommodation.name || !newAccommodation.city) {
      toast({
        title: "Missing Information",
        description: "Please provide accommodation name and city",
        variant: "destructive"
      });
      return;
    }

    const accommodation: AccommodationOption = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newAccommodation.name!,
      type: newAccommodation.type || 'hotel',
      city: newAccommodation.city!,
      checkIn: newAccommodation.checkIn || '',
      checkOut: newAccommodation.checkOut || '',
      nights: newAccommodation.nights || 1,
      roomType: newAccommodation.roomType || '',
      starRating: newAccommodation.starRating || 3,
      pricePerNight: newAccommodation.pricePerNight || 0,
      totalPrice: (newAccommodation.pricePerNight || 0) * (newAccommodation.nights || 1),
      amenities: newAccommodation.amenities || [],
      description: newAccommodation.description || '',
      address: newAccommodation.address || '',
      phone: newAccommodation.phone || '',
      email: newAccommodation.email || '',
      dayIds: [],
      option: activeOption
    };

    const optionKey = `option${activeOption}` as keyof AccommodationOptionSet;
    const updatedOptions = {
      ...accommodationOptions,
      [optionKey]: [...accommodationOptions[optionKey], accommodation]
    };

    setAccommodationOptions(updatedOptions);
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
      email: '',
      option: activeOption
    });
    setIsAdding(false);

    toast({
      title: "Accommodation Added",
      description: `${accommodation.name} has been added to Option ${activeOption}`
    });
  };

  const handleDeleteAccommodation = (id: string) => {
    const optionKey = `option${activeOption}` as keyof AccommodationOptionSet;
    const updated = accommodationOptions[optionKey].filter(acc => acc.id !== id);
    
    setAccommodationOptions({
      ...accommodationOptions,
      [optionKey]: updated
    });

    // Also remove from original selected accommodations if it exists there
    onRemoveAccommodation(id);
    
    toast({
      title: "Accommodation Removed",
      description: "Accommodation has been removed from your plan"
    });
  };

  const toggleAmenity = (amenityId: string) => {
    const amenities = newAccommodation.amenities?.includes(amenityId)
      ? newAccommodation.amenities.filter(a => a !== amenityId)
      : [...(newAccommodation.amenities || []), amenityId];
    
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

  const getTotalCostForOption = (option: 1 | 2 | 3) => {
    const optionKey = `option${option}` as keyof AccommodationOptionSet;
    return accommodationOptions[optionKey].reduce((sum, acc) => sum + acc.totalPrice, 0);
  };

  const refreshAccommodationData = () => {
    if (queryId) {
      const loadedData = loadComprehensiveItineraryData(queryId);
      if (loadedData) {
        const dataWithOptions = ensureThreeAccommodationOptions(loadedData);
        setEnhancedData(dataWithOptions);
        toast({
          title: "Data Refreshed",
          description: "Accommodation data loaded from day-wise itinerary",
        });
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const currentAccommodations = getCurrentAccommodations();

  return (
    <div className="space-y-6">
      {/* Header with Option Tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Hotel className="h-5 w-5 text-blue-600" />
            Enhanced Accommodation Planning
            {enhancedData && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Database className="h-3 w-3 mr-1" />
                Day-wise Data Loaded
              </Badge>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            {enhancedData 
              ? "Managing accommodation options from day-wise itinerary data" 
              : "Manage and compare accommodation options for the trip"
            }
          </p>
        </div>
        {queryId && (
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAccommodationData}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh from Day-wise Data
          </Button>
        )}
      </div>

      {/* Option Selection Tabs */}
      <Tabs value={`option${activeOption}`} onValueChange={(value) => setActiveOption(parseInt(value.replace('option', '')) as 1 | 2 | 3)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="option1" className="flex items-center gap-2">
            Option 1
            <Badge variant="outline">{accommodationOptions.option1.length}</Badge>
            <span className="text-xs">{formatCurrency(getTotalCostForOption(1))}</span>
          </TabsTrigger>
          <TabsTrigger value="option2" className="flex items-center gap-2">
            Option 2
            <Badge variant="outline">{accommodationOptions.option2.length}</Badge>
            <span className="text-xs">{formatCurrency(getTotalCostForOption(2))}</span>
          </TabsTrigger>
          <TabsTrigger value="option3" className="flex items-center gap-2">
            Option 3
            <Badge variant="outline">{accommodationOptions.option3.length}</Badge>
            <span className="text-xs">{formatCurrency(getTotalCostForOption(3))}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={`option${activeOption}`} className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-lg font-bold">{formatCurrency(getTotalCostForOption(activeOption))}</p>
                <p className="text-sm text-muted-foreground">Option {activeOption} Total</p>
              </div>
            </div>
            <Button onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Accommodation
            </Button>
          </div>

          {/* Add New Accommodation Form */}
          {isAdding && (
            <Card className="border-green-200 bg-green-50 mb-6">
              <CardHeader>
                <CardTitle className="text-green-800">Add New Accommodation - Option {activeOption}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Accommodation Name *</Label>
                    <Input
                      id="name"
                      value={newAccommodation.name || ''}
                      onChange={(e) => setNewAccommodation({ ...newAccommodation, name: e.target.value })}
                      placeholder="Hotel name..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={newAccommodation.type} onValueChange={(value) => setNewAccommodation({ ...newAccommodation, type: value as any })}>
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
                      value={newAccommodation.city || ''}
                      onChange={(e) => setNewAccommodation({ ...newAccommodation, city: e.target.value })}
                      placeholder="City..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="roomType">Room Type</Label>
                    <Input
                      id="roomType"
                      value={newAccommodation.roomType || ''}
                      onChange={(e) => setNewAccommodation({ ...newAccommodation, roomType: e.target.value })}
                      placeholder="Deluxe Room, Suite..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkIn">Check-in Date</Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={newAccommodation.checkIn || ''}
                      onChange={(e) => setNewAccommodation({ ...newAccommodation, checkIn: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkOut">Check-out Date</Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={newAccommodation.checkOut || ''}
                      onChange={(e) => setNewAccommodation({ ...newAccommodation, checkOut: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nights">Number of Nights</Label>
                    <Input
                      id="nights"
                      type="number"
                      min="1"
                      value={newAccommodation.nights || 1}
                      onChange={(e) => setNewAccommodation({ ...newAccommodation, nights: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pricePerNight">Price per Night</Label>
                    <Input
                      id="pricePerNight"
                      type="number"
                      min="0"
                      value={newAccommodation.pricePerNight || 0}
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
                          className={`h-5 w-5 ${star <= (newAccommodation.starRating || 3) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
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
                        variant={newAccommodation.amenities?.includes(amenity.id) ? "default" : "outline"}
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

                <div className="flex gap-2">
                  <Button onClick={handleAddAccommodation} className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Add to Option {activeOption}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAdding(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Accommodations List */}
          <div className="space-y-4">
            {currentAccommodations.length === 0 && !isAdding && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Hotel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No accommodations in Option {activeOption}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add hotels, resorts, or other accommodations for this option
                  </p>
                  <Button onClick={() => setIsAdding(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add First Accommodation
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentAccommodations.map((accommodation) => (
              <Card key={accommodation.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Hotel className="h-5 w-5 text-green-600" />
                        {accommodation.name}
                        <Badge variant="outline" className="capitalize">{accommodation.type}</Badge>
                        <Badge variant="secondary">Option {accommodation.option}</Badge>
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
                        {accommodation.amenities.map((amenityId) => {
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

                  {/* Similar Hotel Options */}
                  {accommodation.similarOptions && accommodation.similarOptions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <span>Similar Hotel Options:</span>
                        <Badge variant="outline" className="text-xs">
                          {accommodation.similarOptions.length} alternatives
                        </Badge>
                      </p>
                      <div className="space-y-2">
                        {accommodation.similarOptions.slice(0, 3).map((similar: any, idx: number) => (
                          <div key={idx} className="p-2 border rounded-lg bg-muted/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Hotel className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs font-medium">
                                  {similar.name || `Alternative ${idx + 1}`}
                                </span>
                                {similar.starRating && (
                                  <div className="flex items-center gap-1">
                                    {getStarDisplay(similar.starRating).slice(0, similar.starRating)}
                                  </div>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {formatCurrency(similar.pricePerNight || 0)}/night
                              </Badge>
                            </div>
                            {similar.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {similar.description}
                              </p>
                            )}
                          </div>
                        ))}
                        {accommodation.similarOptions.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{accommodation.similarOptions.length - 3} more similar options available
                          </p>
                        )}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAccommodationPlanning;
