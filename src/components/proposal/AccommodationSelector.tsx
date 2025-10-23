
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Hotel, MapPin, Users, Calendar, Star, Plus, Trash2, Bed, LogIn, LogOut, BedDouble, Baby, Shuffle, Edit3 } from "lucide-react";
import { Query } from '@/types/query';
import { useInventoryData } from '@/pages/queries/hooks/useInventoryData';
import { AccommodationStay, calculateAccommodationStay } from '@/utils/accommodationCalculations';
import { formatCurrency } from '@/utils/currencyUtils';
import { PricingEditor, PriceBreakdown, AccommodationPricing, PricingData } from './pricing';
import { useProposalPersistence } from '@/hooks/useProposalPersistence';
import { AccommodationProposalManager } from './AccommodationProposalManager';

interface AccommodationSelectorProps {
  query: Query;
  days: any[];
  accommodations: AccommodationStay[];
  onAccommodationAdd: (accommodation: AccommodationStay) => void;
  onAccommodationRemove: (accommodationId: string) => void;
  onAccommodationUpdate?: (accommodation: AccommodationStay) => void;
  queryId?: string; // Added to support persistence loading
}

interface HotelSelection {
  city: string;
  numberOfNights: number;
  startDay: number;
  selectedHotel: any;
  selectedRoomType: any;
  numberOfRooms: number;
  numberOfChildren: number;
  extraBeds: number;
  hotelCategory: '3-star' | '4-star' | '5-star' | 'luxury';
  optionNumber: 1 | 2 | 3;
}

interface AccommodationOption {
  optionNumber: 1 | 2 | 3;
  accommodations: AccommodationStay[];
  totalCost: number;
}

export const AccommodationSelector: React.FC<AccommodationSelectorProps> = ({
  query,
  days,
  accommodations,
  onAccommodationAdd,
  onAccommodationRemove,
  onAccommodationUpdate,
  queryId
}) => {
  const [selections, setSelections] = useState<HotelSelection[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeOption, setActiveOption] = useState<1 | 2 | 3>(1);
  const [expandedSimilarOptions, setExpandedSimilarOptions] = useState<string | null>(null);
  const [useSimilarHotel, setUseSimilarHotel] = useState(false);
  const [similarHotelName, setSimilarHotelName] = useState('');
  const [editingPricing, setEditingPricing] = useState<string | null>(null);
  const [editingAccommodation, setEditingAccommodation] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{
    hotelName?: string;
    roomType?: string;
    numberOfNights?: number;
    numberOfRooms?: number;
    totalPrice?: number;
  }>({});
  const [newSelection, setNewSelection] = useState<Partial<HotelSelection>>({
    numberOfRooms: 1,
    numberOfChildren: 0,
    extraBeds: 0,
    hotelCategory: '4-star',
    optionNumber: 1
  });

  // Load real-time hotel data from Hotel module
  const { hotels, loading } = useInventoryData();

  // Load persistence data for accommodation pre-filling
  const queryIdToUse = queryId || query.id || '';
  const persistence = useProposalPersistence(queryIdToUse, 'daywise');

  // Load accommodation data from persistence on component mount
  useEffect(() => {
    if (queryIdToUse && persistence.data.accommodationData?.selectedAccommodations?.length > 0) {
      const persistedAccommodations = persistence.data.accommodationData.selectedAccommodations;
      console.log('AccommodationSelector: Loading accommodations from persistence:', persistedAccommodations.length);
      
      // Convert and add persisted accommodations if not already present
      persistedAccommodations.forEach(acc => {
        const existingAccommodation = accommodations.find(existing => existing.id === acc.id);
        if (!existingAccommodation) {
          const convertedAccommodation: AccommodationStay = {
            id: acc.id,
            city: acc.city || '',
            hotelId: acc.id,
            hotelName: acc.hotelName,
            hotelCategory: acc.type === 'standard' ? '4-star' : acc.type === 'optional' ? '5-star' : '3-star',
            numberOfNights: acc.nights,
            numberOfRooms: acc.numberOfRooms,
            roomType: acc.roomType,
            pricePerNightPerRoom: acc.pricePerNight,
            totalPrice: acc.totalPrice,
            checkInDay: parseInt(acc.dayId) || 1,
            checkOutDay: (parseInt(acc.dayId) || 1) + acc.nights,
            stayDays: Array.from({ length: acc.nights }, (_, i) => (parseInt(acc.dayId) || 1) + i),
            optionNumber: acc.type === 'standard' ? 1 : acc.type === 'optional' ? 2 : 3
          };
          
          onAccommodationAdd(convertedAccommodation);
        }
      });
    }
  }, [queryIdToUse, persistence.data.accommodationData, accommodations.length]);

  // Get available cities from days
  const availableCities = Array.from(new Set(days.map(day => day.city).filter(Boolean)));

  // Organize accommodations by options
  const accommodationOptions: AccommodationOption[] = [1, 2, 3].map(optionNumber => {
    const optionAccommodations = accommodations.filter(acc => acc.optionNumber === optionNumber);
    return {
      optionNumber: optionNumber as 1 | 2 | 3,
      accommodations: optionAccommodations,
      totalCost: optionAccommodations.reduce((sum, acc) => sum + acc.totalPrice, 0)
    };
  });

  // Get available options (only those with accommodations)
  const availableOptions = [1, 2, 3].filter(optionNum => 
    accommodationOptions.find(opt => opt.optionNumber === optionNum)?.accommodations.length > 0
  );

  const getAccommodationTimeline = (optionNumber: 1 | 2 | 3) => {
    const optionAccommodations = accommodations.filter(acc => acc.optionNumber === optionNumber);
    const timeline: Array<{
      day: number;
      type: 'checkin' | 'stay' | 'checkout';
      accommodation: AccommodationStay;
    }> = [];

    optionAccommodations.forEach(acc => {
      timeline.push({
        day: acc.checkInDay,
        type: 'checkin',
        accommodation: acc
      });

      acc.stayDays.slice(1, -1).forEach(day => {
        timeline.push({
          day,
          type: 'stay',
          accommodation: acc
        });
      });

      timeline.push({
        day: acc.checkOutDay,
        type: 'checkout',
        accommodation: acc
      });
    });

    return timeline.sort((a, b) => a.day - b.day);
  };

  // Filter hotels by selected criteria with real-time data
  const getFilteredHotels = (city: string, category: string) => {
    return hotels.filter(hotel => {
      const matchesCity = hotel.city?.toLowerCase() === city.toLowerCase();
      const matchesCategory = getCategoryFromHotel(hotel) === category;
      return matchesCity && matchesCategory;
    });
  };

  const getCategoryFromHotel = (hotel: any): string => {
    const rating = hotel.rating || hotel.starRating || 4;
    if (rating >= 5) return 'luxury';
    if (rating >= 4.5) return '5-star';
    if (rating >= 3.5) return '4-star';
    return '3-star';
  };

  const getHotelDisplayName = (hotel: any) => {
    const category = getCategoryFromHotel(hotel);
    return `${hotel.name} (${category})`;
  };

  // Get room types for selected hotel
  const getAvailableRoomTypes = (hotelId: string) => {
    const hotel = hotels.find(h => h.id === hotelId);
    return hotel?.roomTypes || [];
  };

  // Get default pricing for new accommodations
  const getDefaultPricing = (roomType: any = null): PricingData => {
    if (roomType) {
      return {
        adultPrice: roomType.adultPrice || 0,
        childPrice: roomType.childPrice || (roomType.adultPrice * 0.5) || 0,
        extraBedPrice: roomType.extraBedPrice || 0,
        currency: query.destination.country || 'THB',
        isEditable: true
      };
    }
    
    // Default pricing when no hotel data is available
    // These are reasonable defaults that can be edited
    return {
      adultPrice: 0,
      childPrice: 0,
      extraBedPrice: 0,
      currency: query.destination.country || 'THB',
      isEditable: true
    };
  };

  // Calculate total price including children and extra beds using real inventory pricing
  const calculateTotalPrice = () => {
    if (!newSelection.selectedRoomType || !newSelection.numberOfNights || !newSelection.numberOfRooms) {
      return 0;
    }

    const pricing = getDefaultPricing(newSelection.selectedRoomType);
    const numberOfChildren = newSelection.numberOfChildren || 0;
    const numberOfExtraBeds = newSelection.extraBeds || 0;
    const numberOfRooms = newSelection.numberOfRooms || 1;
    const numberOfNights = newSelection.numberOfNights || 1;
    
    // Calculate per-room per-night cost
    const baseRoomCost = pricing.adultPrice; // Base adult rate per room
    const childrenCost = pricing.childPrice * numberOfChildren; // Total children cost per night
    const extraBedCost = pricing.extraBedPrice * numberOfExtraBeds; // Extra bed cost per night
    
    // Total per night cost
    const perNightCost = (baseRoomCost * numberOfRooms) + childrenCost + extraBedCost;
    
    // Total cost for all nights
    return perNightCost * numberOfNights;
  };

  // Get similar hotels for a given accommodation
  const getSimilarHotels = (accommodation: AccommodationStay) => {
    const currentHotelCategory = accommodation.hotelCategory;
    const city = accommodation.city;
    
    // Get all hotels in the same city and category
    const sameCategory = getFilteredHotels(city, currentHotelCategory);
    
    // Get hotels in adjacent categories for variety
    const categories = ['3-star', '4-star', '5-star', 'luxury'];
    const currentIndex = categories.indexOf(currentHotelCategory);
    const adjacentCategories = categories.filter((_, index) => 
      Math.abs(index - currentIndex) <= 1 && index !== currentIndex
    );
    
    const adjacentHotels = adjacentCategories.flatMap(category => 
      getFilteredHotels(city, category)
    );
    
    // Combine and filter out the currently selected hotel
    const allSimilarHotels = [...sameCategory, ...adjacentHotels]
      .filter(hotel => hotel.id !== accommodation.hotelId)
      .filter((hotel, index, self) => self.findIndex(h => h.id === hotel.id) === index) // Remove duplicates
      .slice(0, 4); // Limit to 4 similar options
    
    return allSimilarHotels;
  };

  // Calculate pricing for similar hotel option
  const calculateSimilarHotelPrice = (hotel: any, accommodation: AccommodationStay) => {
    const roomTypes = getAvailableRoomTypes(hotel.id);
    if (roomTypes.length === 0) return 0;
    
    // Find similar room type or use the first available
    const similarRoomType = roomTypes.find(rt => 
      rt.name.toLowerCase().includes('deluxe') || 
      rt.name.toLowerCase().includes('standard')
    ) || roomTypes[0];
    
    const adultPrice = similarRoomType.adultPrice || 0;
    const numberOfNights = accommodation.numberOfNights;
    const numberOfRooms = accommodation.numberOfRooms;
    
    return adultPrice * numberOfNights * numberOfRooms;
  };

  // Handle replacing accommodation with similar hotel
  const handleSelectSimilarHotel = (accommodation: AccommodationStay, similarHotel: any) => {
    const roomTypes = getAvailableRoomTypes(similarHotel.id);
    const selectedRoomType = roomTypes.find(rt => 
      rt.name.toLowerCase().includes('deluxe') || 
      rt.name.toLowerCase().includes('standard')
    ) || roomTypes[0];
    
    if (!selectedRoomType) return;
    
    const newPrice = calculateSimilarHotelPrice(similarHotel, accommodation);
    const newAccommodation = {
      ...accommodation,
      hotelId: similarHotel.id,
      hotelName: similarHotel.name,
      hotelCategory: getCategoryFromHotel(similarHotel) as any,
      roomType: selectedRoomType.name,
      pricePerNight: newPrice / (accommodation.numberOfNights * accommodation.numberOfRooms),
      totalPrice: newPrice
    };
    
    // Remove old accommodation and add new one
    onAccommodationRemove(accommodation.id);
    onAccommodationAdd(newAccommodation);
    setExpandedSimilarOptions(null);
  };

  // Toggle similar options display
  const toggleSimilarOptions = (accommodationId: string) => {
    setExpandedSimilarOptions(
      expandedSimilarOptions === accommodationId ? null : accommodationId
    );
  };

  const handleAddSelection = () => {
    if (!newSelection.city || !newSelection.numberOfNights || !newSelection.startDay || 
        !newSelection.selectedRoomType || (!newSelection.selectedHotel && !useSimilarHotel)) {
      return;
    }

    const childrenText = newSelection.numberOfChildren > 0 ? ` + ${newSelection.numberOfChildren} Child(ren)` : '';
    const extraBedText = newSelection.extraBeds > 0 ? ` + ${newSelection.extraBeds} Extra Bed(s)` : '';
    const roomTypeDisplay = `${newSelection.selectedRoomType.name}${childrenText}${extraBedText}`;
    const totalPrice = calculateTotalPrice();

    // Handle similar hotel case
    const hotelId = useSimilarHotel ? 'similar-hotel' : newSelection.selectedHotel!.id;
    const hotelName = useSimilarHotel ? `${similarHotelName || 'Similar Hotel'} / Similar Hotel` : newSelection.selectedHotel!.name;

    const accommodation = {
      ...calculateAccommodationStay(
        newSelection.city,
        hotelId,
        hotelName,
        newSelection.hotelCategory || '4-star',
        newSelection.numberOfNights!,
        newSelection.numberOfRooms || 1,
        roomTypeDisplay,
        totalPrice / (newSelection.numberOfNights! * newSelection.numberOfRooms!),
        newSelection.startDay!,
        newSelection.optionNumber || activeOption
      ),
      totalPrice,
      numberOfChildren: newSelection.numberOfChildren || 0,
      extraBeds: newSelection.extraBeds || 0,
      configuration: newSelection.selectedRoomType?.configuration || '1 King Bed',
      mealPlan: newSelection.selectedRoomType?.mealPlan || 'Room Only'
    };

    onAccommodationAdd(accommodation);
    setShowAddForm(false);
    setNewSelection({
      numberOfRooms: 1,
      numberOfChildren: 0,
      extraBeds: 0,
      hotelCategory: '4-star',
      optionNumber: activeOption
    });
    setUseSimilarHotel(false);
    setSimilarHotelName('');
  };

  // Compact timeline event renderer
  const renderTimelineEvent = (event: { day: number; type: 'checkin' | 'stay' | 'checkout'; accommodation: AccommodationStay }) => {
    const { day, type, accommodation } = event;
    const dayInfo = days.find(d => d.dayNumber === day);
    
    const getEventIcon = () => {
      switch (type) {
        case 'checkin': return <LogIn className="h-3 w-3 text-green-600" />;
        case 'checkout': return <LogOut className="h-3 w-3 text-orange-600" />;
        default: return <Bed className="h-3 w-3 text-blue-600" />;
      }
    };

    const getEventBadge = () => {
      switch (type) {
        case 'checkin': return <Badge variant="default" className="bg-green-600 text-xs px-1 py-0">In</Badge>;
        case 'checkout': return <Badge variant="outline" className="border-orange-300 text-orange-700 text-xs px-1 py-0">Out</Badge>;
        default: return <Badge variant="secondary" className="text-xs px-1 py-0">Stay</Badge>;
      }
    };

    return (
      <div key={`${accommodation.id}-${day}-${type}`} className="hidden flex items-center gap-3 p-3 border border-border/50 rounded-lg bg-gradient-to-r from-card to-accent/5 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-1">
          {getEventIcon()}
          <span className="text-sm font-medium">Day {day}</span>
          {getEventBadge()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground truncate">
            {accommodation.hotelName} • {dayInfo?.city || accommodation.city}
          </div>
        </div>
        {type === 'checkin' && (
          <div className="text-right">
            <div className="text-xs font-medium text-green-600">
              {accommodation.numberOfNights}n
            </div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(accommodation.totalPrice, query.destination.country)}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Enhanced price breakdown component with edit capability
  const renderPriceBreakdown = () => {
    if (!newSelection.selectedRoomType || !newSelection.numberOfNights) {
      return null;
    }

    const pricing = getDefaultPricing(newSelection.selectedRoomType);
    const numberOfChildren = newSelection.numberOfChildren || 0;
    const numberOfExtraBeds = newSelection.extraBeds || 0;
    const numberOfRooms = newSelection.numberOfRooms || 1;
    const numberOfNights = newSelection.numberOfNights || 1;

    const accommodationPricing: AccommodationPricing = {
      id: 'preview',
      numberOfRooms,
      numberOfNights,
      numberOfChildren,
      numberOfExtraBeds,
      pricing,
      customPricing: { totalPrice: calculateTotalPrice(), isCustom: false }
    };

    return (
      <PriceBreakdown
        accommodation={accommodationPricing}
        destinationCountry={query.destination.country}
        compact={true}
      />
    );
  };

  // Handle editing pricing for existing accommodations
  const handleEditPricing = (accommodationId: string) => {
    setEditingPricing(accommodationId);
  };

  const handleSavePricing = (updatedAccommodation: AccommodationPricing) => {
    // Find the original accommodation and update it with new pricing
    const originalAccommodation = accommodations.find(acc => acc.id === updatedAccommodation.id);
    if (originalAccommodation) {
      const newTotalPrice = updatedAccommodation.customPricing?.totalPrice || 0;
      const newPricePerNight = newTotalPrice / (originalAccommodation.numberOfNights * originalAccommodation.numberOfRooms);
      
      const updatedAccommodationStay: AccommodationStay = {
        ...originalAccommodation,
        totalPrice: newTotalPrice,
        pricePerNightPerRoom: newPricePerNight
      };

      // Use update handler if available, otherwise fallback to remove/add
      if (onAccommodationUpdate) {
        onAccommodationUpdate(updatedAccommodationStay);
      } else {
        onAccommodationRemove(originalAccommodation.id);
        onAccommodationAdd(updatedAccommodationStay);
      }
    }
    setEditingPricing(null);
  };

  // Handle editing accommodation
  const handleEditAccommodation = (accommodationId: string) => {
    const accommodation = accommodations.find(acc => acc.id === accommodationId);
    if (accommodation) {
      setEditingAccommodation(accommodationId);
      setEditingData({
        hotelName: accommodation.hotelName,
        roomType: accommodation.roomType,
        numberOfNights: accommodation.numberOfNights,
        numberOfRooms: accommodation.numberOfRooms,
        totalPrice: accommodation.totalPrice
      });
    }
  };

  const handleSaveAccommodation = (accommodationId: string) => {
    const originalAccommodation = accommodations.find(acc => acc.id === accommodationId);
    if (originalAccommodation && editingData) {
      // Validate required fields
      const updatedNights = editingData.numberOfNights || originalAccommodation.numberOfNights;
      const updatedRooms = editingData.numberOfRooms || originalAccommodation.numberOfRooms;
      const updatedPrice = editingData.totalPrice || originalAccommodation.totalPrice;
      
      const updatedAccommodation: AccommodationStay = {
        ...originalAccommodation,
        hotelName: editingData.hotelName || originalAccommodation.hotelName,
        roomType: editingData.roomType || originalAccommodation.roomType,
        numberOfNights: updatedNights,
        numberOfRooms: updatedRooms,
        totalPrice: updatedPrice,
        pricePerNightPerRoom: updatedPrice / (updatedNights * updatedRooms),
        checkOutDay: originalAccommodation.checkInDay + updatedNights,
        stayDays: Array.from(
          { length: updatedNights }, 
          (_, i) => originalAccommodation.checkInDay + i
        )
      };

      // Use update handler if available, otherwise fallback to remove/add
      if (onAccommodationUpdate) {
        onAccommodationUpdate(updatedAccommodation);
      } else {
        onAccommodationRemove(accommodationId);
        onAccommodationAdd(updatedAccommodation);
      }
    }
    setEditingAccommodation(null);
    setEditingData({});
  };

  const handleCancelEdit = () => {
    setEditingAccommodation(null);
    setEditingData({});
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="py-6 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-muted-foreground text-sm">Loading hotel data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Accommodation Proposal Manager - Show when 2+ options exist */}
      {availableOptions.length >= 2 && (
        <div className="mb-6">
          <AccommodationProposalManager
            query={query}
            accommodations={accommodations}
            onSendProposal={(options) => {
              console.log('Sending proposal with options:', options);
              // Handle proposal sending logic
            }}
          />
        </div>
      )}
      
      <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Hotel className="h-4 w-4" />
          Accommodation Planning
          <Badge variant="secondary" className="text-xs">
            {accommodations.length} selections
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Compact Multi-Option Tabs */}
        <Tabs value={activeOption.toString()} onValueChange={(value) => setActiveOption(parseInt(value) as 1 | 2 | 3)}>
          <TabsList className="grid w-full grid-cols-3 h-8">
            {[1, 2, 3].map(optionNum => {
              const option = accommodationOptions.find(opt => opt.optionNumber === optionNum);
              return (
                <TabsTrigger key={optionNum} value={optionNum.toString()} className="text-xs relative">
                  Option {optionNum}
                  {option && option.accommodations.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs px-1 py-0 h-4">
                      {option.accommodations.length}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {[1, 2, 3].map(optionNum => {
            const option = accommodationOptions.find(opt => opt.optionNumber === optionNum);
            const timeline = getAccommodationTimeline(optionNum as 1 | 2 | 3);

            return (
              <TabsContent key={optionNum} value={optionNum.toString()} className="space-y-3 mt-3">
                {/* Compact Option Summary */}
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                  <div>
                    <span className="font-medium">Option {optionNum}</span>
                    <span className="text-muted-foreground ml-2">
                      {option?.accommodations.length || 0} accommodations
                    </span>
                  </div>
                  {option && option.totalCost > 0 && (
                    <div className="font-semibold text-green-600">
                      {formatCurrency(option.totalCost, query.destination.country)}
                    </div>
                  )}
                </div>

                {/* Compact Timeline */}
                {timeline.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm sr-only">Timeline</h4>
                    <div className="space-y-1">
                      {timeline.map(event => renderTimelineEvent(event))}
                    </div>
                  </div>
                )}

                {/* Enhanced Accommodations List */}
                {option && option.accommodations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Hotel className="h-4 w-4 text-primary" />
                      Selected Accommodations
                    </h4>
                    {option.accommodations.map((accommodation) => (
                      <Card key={accommodation.id} className="border-l-4 border-l-primary/60 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-r from-card to-primary/5">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {editingAccommodation === accommodation.id ? (
                                  <div className="flex items-center gap-2 flex-1">
                                    <Input
                                      value={editingData.hotelName || ''}
                                      onChange={(e) => setEditingData(prev => ({ ...prev, hotelName: e.target.value }))}
                                      className="font-semibold text-base h-8"
                                      placeholder="Hotel name"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveAccommodation(accommodation.id)}
                                      className="h-7 px-2 text-xs"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelEdit}
                                      className="h-7 px-2 text-xs"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <h5 className="font-semibold text-base text-foreground">{accommodation.hotelName}</h5>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditAccommodation(accommodation.id)}
                                      className="h-6 w-6 p-0 text-primary hover:text-primary/80"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                                <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">{accommodation.hotelCategory}</Badge>
                                <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-accent">
                                  <MapPin className="h-3 w-3" />
                                  {accommodation.city}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
                                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                  <Calendar className="h-3 w-3 text-primary" />
                                  {editingAccommodation === accommodation.id ? (
                                    <Input
                                      type="number"
                                      min="1"
                                      value={editingData.numberOfNights || ''}
                                      onChange={(e) => setEditingData(prev => ({ ...prev, numberOfNights: parseInt(e.target.value) }))}
                                      className="h-6 w-16 text-xs"
                                    />
                                  ) : (
                                    <span className="font-medium">{accommodation.numberOfNights} night{accommodation.numberOfNights > 1 ? 's' : ''}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                  <BedDouble className="h-3 w-3 text-primary" />
                                  {editingAccommodation === accommodation.id ? (
                                    <Input
                                      type="number"
                                      min="1"
                                      value={editingData.numberOfRooms || ''}
                                      onChange={(e) => setEditingData(prev => ({ ...prev, numberOfRooms: parseInt(e.target.value) }))}
                                      className="h-6 w-16 text-xs"
                                    />
                                  ) : (
                                    <span className="font-medium">{accommodation.numberOfRooms} room{accommodation.numberOfRooms > 1 ? 's' : ''}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                  <Bed className="h-3 w-3 text-primary" />
                                  {editingAccommodation === accommodation.id ? (
                                    <Input
                                      value={editingData.roomType || ''}
                                      onChange={(e) => setEditingData(prev => ({ ...prev, roomType: e.target.value }))}
                                      className="h-6 text-xs"
                                      placeholder="Room type"
                                    />
                                  ) : (
                                    <span className="truncate font-medium">{accommodation.roomType}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                                  <BedDouble className="h-3 w-3 text-blue-600" />
                                  <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">Configuration</span>
                                    <span className="font-medium text-xs">
                                      {accommodation.configuration || accommodation.roomType?.includes('King') ? '1 King Bed' : 
                                       accommodation.roomType?.includes('Queen') ? '1 Queen Bed' :
                                       accommodation.roomType?.includes('Twin') ? '2 Twin Beds' : '1 King Bed'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-md">
                                  <Users className="h-3 w-3 text-orange-600" />
                                  <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">Meal Plan</span>
                                    <span className="font-medium text-xs">
                                      {accommodation.mealPlan || 'Room Only'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-center gap-1 p-2 bg-green-50 dark:bg-green-950/20 rounded-md">
                                  {editingAccommodation === accommodation.id ? (
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={editingData.totalPrice || ''}
                                      onChange={(e) => setEditingData(prev => ({ ...prev, totalPrice: parseFloat(e.target.value) || 0 }))}
                                      className="h-6 text-xs font-bold text-green-600"
                                      placeholder="Total price"
                                    />
                                  ) : (
                                    <>
                                      <span className="font-bold text-green-600 text-base">
                                        {formatCurrency(accommodation.totalPrice, query.destination.country)}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatCurrency(accommodation.pricePerNightPerRoom, query.destination.country)}/night
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditPricing(accommodation.id)}
                                        className="h-5 w-5 p-0 text-primary hover:text-primary/80 hidden"
                                      >
                                        <Edit3 className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="default" className="text-xs px-2 py-1 bg-green-100 text-green-800 border-green-200">
                                  <LogIn className="h-3 w-3 mr-1" />
                                  Day {accommodation.checkInDay}: Check-in
                                </Badge>
                                {accommodation.stayDays.slice(1, -1).map(day => (
                                  <Badge key={day} variant="secondary" className="text-xs px-2 py-1 bg-blue-50 text-blue-700">
                                    Day {day}: Stay
                                  </Badge>
                                ))}
                                <Badge variant="outline" className="text-xs px-2 py-1 bg-orange-50 text-orange-700 border-orange-200">
                                  <LogOut className="h-3 w-3 mr-1" />
                                  Day {accommodation.checkOutDay}: Check-out
                                </Badge>
                              </div>

                              {/* Enhanced Similar Hotels Toggle */}
                              <div className="flex items-center gap-3 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleSimilarOptions(accommodation.id)}
                                  className="text-xs h-7 px-3 bg-secondary/50 hover:bg-secondary border-primary/30"
                                >
                                  <Shuffle className="h-3 w-3 mr-1" />
                                  Similar Hotels ({getSimilarHotels(accommodation).length})
                                </Button>
                                {expandedSimilarOptions === accommodation.id && (
                                  <Badge variant="secondary" className="text-xs animate-pulse">
                                    Showing alternatives
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                             <div className="flex flex-col gap-2">
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => onAccommodationRemove(accommodation.id)}
                                 className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                                 title={`Remove ${accommodation.hotelName} (${accommodation.roomType})`}
                               >
                                 <Trash2 className="h-3 w-3" />
                               </Button>
                             </div>
                          </div>

                          {/* Enhanced Similar Hotels Expanded Section */}
                          {expandedSimilarOptions === accommodation.id && (
                            <div className="mt-4 pt-4 border-t border-border/50 bg-gradient-to-r from-accent/20 to-secondary/20 rounded-lg p-3">
                              <h6 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                                <Shuffle className="h-4 w-4 text-primary" />
                                Alternative Hotel Options
                              </h6>
                              <div className="space-y-3">
                                {getSimilarHotels(accommodation).map((similarHotel) => {
                                  const price = calculateSimilarHotelPrice(similarHotel, accommodation);
                                  const savings = accommodation.totalPrice - price;
                                  
                                  return (
                                    <div 
                                      key={similarHotel.id} 
                                      className="flex items-center gap-3 p-3 bg-card/50 border border-border/30 rounded-lg hover:bg-card hover:shadow-sm transition-all duration-200"
                                    >
                                      <Checkbox 
                                        id={`similar-${similarHotel.id}-${accommodation.id}`}
                                        className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            handleSelectSimilarHotel(accommodation, similarHotel);
                                          }
                                        }}
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-semibold text-sm text-foreground">{similarHotel.name}</span>
                                          <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">
                                            {getCategoryFromHotel(similarHotel)}
                                          </Badge>
                                          <div className="flex items-center gap-0.5">
                                            {Array.from({ length: similarHotel.starRating || 4 }).map((_, i) => (
                                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                            ))}
                                          </div>
                                        </div>
                                         <div className="flex items-center gap-4 text-sm">
                                           <div className="flex flex-col">
                                             <span className="font-medium text-green-600">
                                               {formatCurrency(price, query.destination.country)} total
                                             </span>
                                             <span className="text-xs text-muted-foreground">
                                               {formatCurrency(price / (accommodation.numberOfNights * accommodation.numberOfRooms), query.destination.country)}/night per room
                                             </span>
                                           </div>
                                           {savings !== 0 && (
                                             <span className={`font-medium px-2 py-1 rounded-md text-xs ${
                                               savings > 0 
                                                 ? "bg-green-100 text-green-700 border border-green-200" 
                                                 : "bg-red-100 text-red-700 border border-red-200"
                                             }`}>
                                               {savings > 0 ? "💰 Save " : "⚠️ Extra "}{formatCurrency(Math.abs(savings), query.destination.country)}
                                             </span>
                                           )}
                                         </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleSelectSimilarHotel(accommodation, similarHotel)}
                                        className="text-xs h-7 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
                                      >
                                        Select This Hotel
                                      </Button>
                                    </div>
                                  );
                                })}
                                 {getSimilarHotels(accommodation).length === 0 && (
                                   <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-dashed border-border">
                                     <div className="text-sm text-muted-foreground text-center">
                                       🏨 No similar hotels available in {accommodation.city}
                                     </div>
                                     <div className="flex items-center space-x-2">
                                       <Checkbox 
                                         id={`text-similar-${accommodation.id}`}
                                         className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                       />
                                       <label 
                                         htmlFor={`text-similar-${accommodation.id}`} 
                                         className="text-sm font-medium cursor-pointer flex-1"
                                       >
                                         Use text selection: {accommodation.hotelName} / Similar Hotel
                                       </label>
                                     </div>
                                     <div className="text-xs text-muted-foreground">
                                       This will display the current hotel as "{accommodation.hotelName} / Similar Hotel" in the proposal
                                     </div>
                                   </div>
                                 )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Compact Add New Accommodation */}
        {!showAddForm ? (
          <Button 
            onClick={() => {
              setShowAddForm(true);
              setNewSelection(prev => ({ ...prev, optionNumber: activeOption }));
            }}
            className="w-full h-8"
            variant="outline"
          >
            <Plus className="h-3 w-3 mr-2" />
            Add to Option {activeOption}
          </Button>
        ) : (
          <Card className="border-2 border-dashed border-primary/20">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Add New Accommodation</h4>
                <Badge variant="default" className="text-xs">Option {activeOption}</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* City & Category */}
                <div>
                  <label className="text-xs font-medium block mb-1">City</label>
                  <Select
                    value={newSelection.city || ''}
                    onValueChange={(value) => setNewSelection(prev => ({ 
                      ...prev, 
                      city: value, 
                      selectedHotel: null, 
                      selectedRoomType: null 
                    }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map(city => (
                        <SelectItem key={city} value={city}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {city}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1">Category</label>
                  <Select
                    value={newSelection.hotelCategory || '4-star'}
                    onValueChange={(value) => setNewSelection(prev => ({ 
                      ...prev, 
                      hotelCategory: value as any,
                      selectedHotel: null,
                      selectedRoomType: null 
                    }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3-star">3 Star</SelectItem>
                      <SelectItem value="4-star">4 Star</SelectItem>
                      <SelectItem value="5-star">5 Star</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nights & Start Day */}
                <div>
                  <label className="text-xs font-medium block mb-1">Nights</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newSelection.numberOfNights || ''}
                    onChange={(e) => setNewSelection(prev => ({ ...prev, numberOfNights: parseInt(e.target.value) }))}
                    placeholder="Nights"
                    className="h-8"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1">Start Day</label>
                  <Select
                    value={newSelection.startDay?.toString() || ''}
                    onValueChange={(value) => setNewSelection(prev => ({ ...prev, startDay: parseInt(value) }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map(day => (
                        <SelectItem key={day.id} value={day.dayNumber.toString()}>
                          Day {day.dayNumber} - {day.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Hotel Selection */}
              {newSelection.city && newSelection.hotelCategory && (
                <div>
                  <label className="text-xs font-medium block mb-1">Hotel</label>
                  {getFilteredHotels(newSelection.city, newSelection.hotelCategory).length > 0 ? (
                    <Select
                      value={newSelection.selectedHotel?.id || ''}
                      onValueChange={(value) => {
                        const hotel = getFilteredHotels(newSelection.city!, newSelection.hotelCategory!).find(h => h.id === value);
                        setNewSelection(prev => ({ ...prev, selectedHotel: hotel, selectedRoomType: null }));
                        setUseSimilarHotel(false);
                        setSimilarHotelName('');
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Choose hotel" />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilteredHotels(newSelection.city, newSelection.hotelCategory).map(hotel => (
                          <SelectItem key={hotel.id} value={hotel.id}>
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm">{hotel.name}</span>
                              <div className="flex items-center ml-2">
                                {Array.from({ length: hotel.starRating || 4 }).map((_, i) => (
                                  <Star key={i} className="h-2 w-2 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground text-center py-2 border border-dashed rounded">
                        No {newSelection.hotelCategory} hotels found in {newSelection.city}
                      </div>
                      
                      {/* Similar Hotel Checkbox */}
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="similar-hotel"
                          checked={useSimilarHotel}
                          onCheckedChange={(checked) => {
                            setUseSimilarHotel(checked as boolean);
                            if (!checked) {
                              setSimilarHotelName('');
                              setNewSelection(prev => ({ ...prev, selectedHotel: null, selectedRoomType: null }));
                            }
                          }}
                        />
                        <label 
                          htmlFor="similar-hotel" 
                          className="text-xs font-medium cursor-pointer"
                        >
                          Use Similar Hotel
                        </label>
                      </div>
                      
                      {/* Similar Hotel Name Input */}
                      {useSimilarHotel && (
                        <div>
                          <label className="text-xs font-medium block mb-1">Hotel Name</label>
                          <Input
                            value={similarHotelName}
                            onChange={(e) => setSimilarHotelName(e.target.value)}
                            placeholder="Enter hotel name"
                            className="h-8"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            Display: {similarHotelName || 'Hotel Name'} / Similar Hotel
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Room Type Selection */}
              {(newSelection.selectedHotel || useSimilarHotel) && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium block mb-2">Room Type</label>
                    {newSelection.selectedHotel ? (
                      <Select
                        value={newSelection.selectedRoomType?.id || ''}
                        onValueChange={(value) => {
                          const roomType = getAvailableRoomTypes(newSelection.selectedHotel.id).find(rt => rt.id === value);
                          setNewSelection(prev => ({ ...prev, selectedRoomType: roomType }));
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Choose room type" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableRoomTypes(newSelection.selectedHotel.id).map(roomType => (
                            <SelectItem key={roomType.id} value={roomType.id}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">{roomType.name}</span>
                                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <BedDouble className="h-2 w-2" />
                                      <span>{roomType.configuration || `${roomType.capacity?.adults || 2} adults`}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs">•</span>
                                      <span>{roomType.mealPlan || 'Room Only'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right ml-2">
                                  <div className="text-xs text-green-600 font-medium">
                                    {formatCurrency(roomType.adultPrice || 0, query.destination.country)}/night
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-medium block mb-2">Room Type Name</label>
                          <Input
                            value={newSelection.selectedRoomType?.name || ''}
                            onChange={(e) => {
                              const defaultPricing = getDefaultPricing();
                              setNewSelection(prev => ({ 
                                ...prev, 
                                selectedRoomType: { 
                                  name: e.target.value, 
                                  adultPrice: defaultPricing.adultPrice,
                                  childPrice: defaultPricing.childPrice,
                                  extraBedPrice: defaultPricing.extraBedPrice,
                                  id: 'similar-room',
                                  capacity: { adults: 2, children: 0 },
                                  configuration: prev.selectedRoomType?.configuration || '1 King Bed',
                                  mealPlan: prev.selectedRoomType?.mealPlan || 'Room Only'
                                } 
                              }));
                            }}
                            placeholder="Enter room type (e.g., Deluxe Room)"
                            className="h-9"
                          />
                        </div>

                        {/* Room Details Configuration */}
                        {newSelection.selectedRoomType?.name && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium block mb-2">Bed Configuration</label>
                                <Select
                                  value={newSelection.selectedRoomType?.configuration || '1 King Bed'}
                                  onValueChange={(value) => {
                                    setNewSelection(prev => ({
                                      ...prev,
                                      selectedRoomType: prev.selectedRoomType ? {
                                        ...prev.selectedRoomType,
                                        configuration: value
                                      } : null
                                    }));
                                  }}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select bed configuration" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1 King Bed">1 King Bed</SelectItem>
                                    <SelectItem value="1 Queen Bed">1 Queen Bed</SelectItem>
                                    <SelectItem value="2 Twin Beds">2 Twin Beds</SelectItem>
                                    <SelectItem value="2 Single Beds">2 Single Beds</SelectItem>
                                    <SelectItem value="1 Double Bed">1 Double Bed</SelectItem>
                                    <SelectItem value="2 Queen Beds">2 Queen Beds</SelectItem>
                                    <SelectItem value="1 King Bed + 1 Sofa Bed">1 King Bed + 1 Sofa Bed</SelectItem>
                                    <SelectItem value="1 Queen Bed + 1 Sofa Bed">1 Queen Bed + 1 Sofa Bed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <label className="text-xs font-medium block mb-2">Meal Plan</label>
                                <Select
                                  value={newSelection.selectedRoomType?.mealPlan || 'Room Only'}
                                  onValueChange={(value) => {
                                    setNewSelection(prev => ({
                                      ...prev,
                                      selectedRoomType: prev.selectedRoomType ? {
                                        ...prev.selectedRoomType,
                                        mealPlan: value
                                      } : null
                                    }));
                                  }}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select meal plan" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Room Only">Room Only</SelectItem>
                                    <SelectItem value="Bed & Breakfast">Bed & Breakfast</SelectItem>
                                    <SelectItem value="Half Board">Half Board</SelectItem>
                                    <SelectItem value="Full Board">Full Board</SelectItem>
                                    <SelectItem value="All Inclusive">All Inclusive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Custom Pricing Section */}
                            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-medium text-foreground">Custom Pricing</h5>
                                <Badge variant="secondary" className="text-xs">Per Night</Badge>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="text-xs font-medium block mb-2">Adult Rate</label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newSelection.selectedRoomType?.adultPrice || ''}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setNewSelection(prev => ({
                                        ...prev,
                                        selectedRoomType: prev.selectedRoomType ? {
                                          ...prev.selectedRoomType,
                                          adultPrice: value
                                        } : null
                                      }));
                                    }}
                                    placeholder="0.00"
                                    className="h-9 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs font-medium block mb-2">Child Rate</label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newSelection.selectedRoomType?.childPrice || ''}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setNewSelection(prev => ({
                                        ...prev,
                                        selectedRoomType: prev.selectedRoomType ? {
                                          ...prev.selectedRoomType,
                                          childPrice: value
                                        } : null
                                      }));
                                    }}
                                    placeholder="0.00"
                                    className="h-9 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs font-medium block mb-2">Extra Bed</label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newSelection.selectedRoomType?.extraBedPrice || ''}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setNewSelection(prev => ({
                                        ...prev,
                                        selectedRoomType: prev.selectedRoomType ? {
                                          ...prev.selectedRoomType,
                                          extraBedPrice: value
                                        } : null
                                      }));
                                    }}
                                    placeholder="0.00"
                                    className="h-9 text-sm"
                                  />
                                </div>
                              </div>

                              {/* Pricing Preview */}
                              {newSelection.numberOfNights && newSelection.numberOfRooms && (
                                <div className="pt-3 border-t border-border/50 space-y-2">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Total per night:</span>
                                    <span className="font-medium">
                                      {formatCurrency(
                                        (newSelection.selectedRoomType?.adultPrice || 0) * (newSelection.numberOfRooms || 1) +
                                        (newSelection.selectedRoomType?.childPrice || 0) * (newSelection.numberOfChildren || 0) +
                                        (newSelection.selectedRoomType?.extraBedPrice || 0) * (newSelection.extraBeds || 0),
                                        query.destination.country
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Total cost ({newSelection.numberOfNights} nights):</span>
                                    <span className="font-bold text-primary text-base">
                                      {formatCurrency(calculateTotalPrice(), query.destination.country)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Room Type Summary */}
              {newSelection.selectedRoomType && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
                  <div className="flex items-start gap-3">
                    <BedDouble className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-base text-primary mb-2">{newSelection.selectedRoomType.name}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground font-medium">Configuration:</span>
                          <div className="font-medium text-foreground mt-1">
                            {newSelection.selectedRoomType.configuration || `${newSelection.selectedRoomType.capacity?.adults || 2} adults`}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium">Meal Plan:</span>
                          <div className="font-medium text-foreground mt-1">
                            {newSelection.selectedRoomType.mealPlan || 'Room Only'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Room Configuration Inputs */}
              {newSelection.selectedRoomType && (
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-foreground">Room Configuration</h5>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium block mb-2">Rooms</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={newSelection.numberOfRooms || 1}
                        onChange={(e) => setNewSelection(prev => ({ ...prev, numberOfRooms: parseInt(e.target.value) }))}
                        className="h-9"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium block mb-2 flex items-center gap-1">
                        <Baby className="h-3 w-3" />
                        Children
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="6"
                        value={newSelection.numberOfChildren || 0}
                        onChange={(e) => setNewSelection(prev => ({ ...prev, numberOfChildren: parseInt(e.target.value) }))}
                        className="h-9"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium block mb-2">Extra Beds</label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        value={newSelection.extraBeds || 0}
                        onChange={(e) => setNewSelection(prev => ({ ...prev, extraBeds: parseInt(e.target.value) }))}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Compact Price Summary */}
              {newSelection.selectedRoomType && renderPriceBreakdown()}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddSelection}
                  disabled={!newSelection.city || !newSelection.numberOfNights || !newSelection.startDay || 
                           !newSelection.selectedRoomType || (!newSelection.selectedHotel && !useSimilarHotel)}
                  className="flex-1 h-8"
                  size="sm"
                >
                  Add to Option {activeOption}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  className="h-8"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Editor Dialog */}
        <Dialog open={!!editingPricing} onOpenChange={(open) => !open && setEditingPricing(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Accommodation Pricing</DialogTitle>
            </DialogHeader>
            {editingPricing && (() => {
              const accommodation = accommodations.find(acc => acc.id === editingPricing);
              if (!accommodation) return null;

              // Convert AccommodationStay to AccommodationPricing format
              const accommodationPricing: AccommodationPricing = {
                id: accommodation.id,
                numberOfRooms: accommodation.numberOfRooms,
                numberOfNights: accommodation.numberOfNights,
                numberOfChildren: accommodation.numberOfChildren || 0,
                numberOfExtraBeds: accommodation.extraBeds || 0,
                pricing: getDefaultPricing(), // Use current pricing or default
                customPricing: {
                  totalPrice: accommodation.totalPrice,
                  isCustom: true
                }
              };

              return (
                <PricingEditor
                  accommodation={accommodationPricing}
                  destinationCountry={query.destination.country}
                  onSave={handleSavePricing}
                  onCancel={() => setEditingPricing(null)}
                />
              );
            })()}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
    </div>
  );
};
