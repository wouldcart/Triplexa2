import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Hotel, Car, MapPin, Edit, Check, X, Plus, Users, Clock, Route, Star, ChefHat, ArrowRight, Bed, Home, Calendar, Info, Image, Award, Navigation, Calculator, DollarSign, Search } from "lucide-react";
import { Query } from '@/types/query';
import { useEnhancedInventoryData } from '@/hooks/useEnhancedInventoryData';
import { getCurrencyByCountry } from '@/utils/currencyUtils';
import useTransportData from '@/pages/inventory/transport/hooks/useTransportData';
import { useSightseeingData } from '@/pages/inventory/sightseeing/hooks/useSightseeingData';
import { SightseeingDetailsPopover } from './SightseeingDetailsPopover';

interface SmartSuggestionsPopoverProps {
  query: Query;
  dayCity: string;
  onAddHotel: (hotel: any, price: number) => void;
  onAddTransport: (transport: any, price: number) => void;
  onAddActivity: (activity: any, price: number) => void;
}

interface RoomPaxConfiguration {
  adults: number;
  children: number;
  extraBeds: number;
}

interface RoomPricingData {
  adultPrice: number;
  childPrice: number;
  extraBedPrice: number;
}

interface RoomNightsData {
  numberOfNights: number;
  startDay: number;
  endDay: number;
  affectedDays: number[];
}

interface SightseeingPricingSelection {
  pricingType: 'standard' | 'option' | 'package';
  selectedPricingOption?: string;
  selectedPackageOption?: string;
  transferOption?: {
    included: boolean;
    type?: string;
    priceUnit?: 'per-vehicle' | 'per-person';
    price?: number;
  };
  customPax?: number;
}

export const SmartSuggestionsPopover: React.FC<SmartSuggestionsPopoverProps> = ({
  query,
  dayCity,
  onAddHotel,
  onAddTransport,
  onAddActivity
}) => {
  const [editingPrices, setEditingPrices] = useState<{
    [key: string]: number;
  }>({});
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<{
    [key: string]: string;
  }>({});
  const [expandedRooms, setExpandedRooms] = useState<{
    [key: string]: boolean;
  }>({});
  const [editingRooms, setEditingRooms] = useState<{
    [key: string]: boolean;
  }>({});
  const [roomPaxConfig, setRoomPaxConfig] = useState<{
    [key: string]: RoomPaxConfiguration;
  }>({});
  const [roomPricing, setRoomPricing] = useState<{
    [key: string]: RoomPricingData;
  }>({});
  const [roomNights, setRoomNights] = useState<{
    [key: string]: RoomNightsData;
  }>({});
  const [editingRoomPrice, setEditingRoomPrice] = useState<string | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<{
    [key: string]: {
      duration: string;
      timeSlot: string;
      groupSize: string;
      addOns: string[];
    };
  }>({});
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  
  // New state for sightseeing pricing selections
  const [sightseeingPricing, setSightseeingPricing] = useState<{
    [key: string]: SightseeingPricingSelection;
  }>({});

  // New state for search functionality
  const [sightseeingSearchQuery, setSightseeingSearchQuery] = useState('');
  const [transportSearchQuery, setTransportSearchQuery] = useState('');

  // Load transport routes from Transport Management module
  const { routes: allTransportRoutes } = useTransportData();

  // Load sightseeing data from Sightseeing Management module
  const { sightseeings: inventorySightseeing, loading: sightseeingLoading } = useSightseeingData();

  const {
    hotels,
    loading: inventoryLoading
  } = useEnhancedInventoryData({
    countries: [query.destination.country],
    cities: dayCity ? [dayCity] : query.destination.cities
  });

  const currency = getCurrencyByCountry(query.destination.country);
  const totalPax = query.paxDetails.adults + query.paxDetails.children;

  // Calculate trip duration for night selection limits
  const tripStartDate = new Date(query.travelDates.from);
  const tripEndDate = new Date(query.travelDates.to);
  const maxTripNights = Math.ceil((tripEndDate.getTime() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24));

  // Limit suggestions for better performance
  const limitedHotels = hotels.slice(0, 6);
  
  // Filter sightseeing from inventory based on location, active status, and search query
  const filteredSightseeing = inventorySightseeing.filter(sightseeing => {
    // Only show active sightseeing
    if (sightseeing.status !== 'active') {
      return false;
    }

    const matchesCountry = sightseeing.country?.toLowerCase() === query.destination.country.toLowerCase();
    
    // Check if it matches any of the destination cities or the specific day city
    const citiesToCheck = dayCity ? [dayCity, ...query.destination.cities] : query.destination.cities;
    const matchesCity = citiesToCheck.some(city => 
      sightseeing.city?.toLowerCase().includes(city.toLowerCase())
    );

    // Search filter
    const matchesSearch = sightseeingSearchQuery.trim() === '' || 
      sightseeing.name?.toLowerCase().includes(sightseeingSearchQuery.toLowerCase()) ||
      sightseeing.description?.toLowerCase().includes(sightseeingSearchQuery.toLowerCase()) ||
      sightseeing.category?.toLowerCase().includes(sightseeingSearchQuery.toLowerCase()) ||
      sightseeing.city?.toLowerCase().includes(sightseeingSearchQuery.toLowerCase());
    
    console.log('Filtering sightseeing:', {
      name: sightseeing.name,
      country: sightseeing.country,
      city: sightseeing.city,
      status: sightseeing.status,
      matchesCountry,
      matchesCity,
      matchesSearch,
      queryCountry: query.destination.country,
      citiesToCheck
    });
    
    return matchesCountry && matchesCity && matchesSearch;
  }).slice(0, 12); // Limit to 12 for better performance

  console.log('Filtered sightseeing results:', filteredSightseeing.length, 'items');
  
  // Filter transport routes based on query country and cities with search functionality
  const relevantTransportRoutes = allTransportRoutes.filter((route: any) => {
    const matchesCountry = !route.country || route.country.toLowerCase() === query.destination.country.toLowerCase();
    
    if (!matchesCountry) return false;
    
    const citiesToCheck = dayCity ? [dayCity, ...query.destination.cities] : query.destination.cities;
    
    const routeInvolvesCities = citiesToCheck.some(city => {
      const cityLower = city.toLowerCase();
      const startLocation = route.startLocation?.toLowerCase() || route.startLocationFullName?.toLowerCase() || '';
      const endLocation = route.endLocation?.toLowerCase() || route.endLocationFullName?.toLowerCase() || '';
      
      return startLocation.includes(cityLower) || 
             endLocation.includes(cityLower) ||
             route.name?.toLowerCase().includes(cityLower);
    });
    
    // Search filter for transport routes
    const matchesSearch = transportSearchQuery.trim() === '' || 
      route.name?.toLowerCase().includes(transportSearchQuery.toLowerCase()) ||
      route.startLocation?.toLowerCase().includes(transportSearchQuery.toLowerCase()) ||
      route.endLocation?.toLowerCase().includes(transportSearchQuery.toLowerCase()) ||
      route.startLocationFullName?.toLowerCase().includes(transportSearchQuery.toLowerCase()) ||
      route.endLocationFullName?.toLowerCase().includes(transportSearchQuery.toLowerCase()) ||
      route.code?.toLowerCase().includes(transportSearchQuery.toLowerCase()) ||
      route.routeCode?.toLowerCase().includes(transportSearchQuery.toLowerCase());
    
    return routeInvolvesCities && matchesSearch;
  }).slice(0, 8);
  
  // Mock restaurant data for demonstration
  const mockRestaurants = [
    { id: 1, name: "Local Delights Restaurant", city: dayCity || "Bangkok", cuisine: "Thai", rating: 4.5, priceRange: "$$", avgPrice: 25 },
    { id: 2, name: "Rooftop Fine Dining", city: dayCity || "Bangkok", cuisine: "International", rating: 4.8, priceRange: "$$$", avgPrice: 45 },
    { id: 3, name: "Street Food Paradise", city: dayCity || "Bangkok", cuisine: "Local", rating: 4.2, priceRange: "$", avgPrice: 15 }
  ];

  const handlePriceEdit = (itemId: string, newPrice: number) => {
    setEditingPrices(prev => ({
      ...prev,
      [itemId]: newPrice
    }));
  };

  const getEditablePrice = (itemId: string, originalPrice: number) => {
    return editingPrices[itemId] !== undefined ? editingPrices[itemId] : originalPrice;
  };

  const startEditing = (itemId: string, currentPrice: number) => {
    setEditingItem(itemId);
    setEditingPrices(prev => ({
      ...prev,
      [itemId]: currentPrice
    }));
  };

  const confirmEditing = () => {
    setEditingItem(null);
  };

  const cancelEditing = () => {
    setEditingItem(null);
  };

  const handleVehicleTypeChange = (routeId: string, vehicleType: string) => {
    setSelectedVehicleTypes(prev => ({
      ...prev,
      [routeId]: vehicleType
    }));
  };

  const getSelectedVehicleType = (route: any) => {
    return selectedVehicleTypes[route.id] || (route.transportTypes?.[0]?.type) || 'Standard';
  };

  const getVehicleTypePrice = (route: any, vehicleType: string) => {
    if (route.transportTypes) {
      const vehicleTypeData = route.transportTypes.find((vt: any) => vt.type === vehicleType);
      return vehicleTypeData?.price || 50;
    }
    return route.price || 50;
  };

  const getVehicleTypeCapacity = (route: any, vehicleType: string) => {
    if (route.transportTypes) {
      const vehicleTypeData = route.transportTypes.find((vt: any) => vt.type === vehicleType);
      return vehicleTypeData?.seatingCapacity || 4;
    }
    return 4;
  };

  // Activity selection functions
  const handleActivitySelect = (activityId: string) => {
    setExpandedActivity(expandedActivity === activityId ? null : activityId);
    if (!selectedActivities[activityId]) {
      setSelectedActivities(prev => ({
        ...prev,
        [activityId]: {
          duration: '2 hours',
          timeSlot: 'morning',
          groupSize: 'private',
          addOns: []
        }
      }));
    }
  };

  const updateActivityOption = (activityId: string, field: string, value: string | string[]) => {
    setSelectedActivities(prev => ({
      ...prev,
      [activityId]: {
        ...prev[activityId],
        [field]: value
      }
    }));
  };

  const getActivityOptions = (activityId: string) => {
    return selectedActivities[activityId] || {
      duration: '2 hours',
      timeSlot: 'morning',
      groupSize: 'private',
      addOns: []
    };
  };

  // Helper function to get available transfer options for a sightseeing
  const getAvailableTransferOptions = (sightseeing: any) => {
    console.log('Getting transfer options for:', sightseeing.name, {
      transferOptions: sightseeing.transferOptions,
      transferTypes: sightseeing.transferTypes
    });

    // First check transferOptions (new format)
    if (sightseeing.transferOptions && Array.isArray(sightseeing.transferOptions) && sightseeing.transferOptions.length > 0) {
      const enabledOptions = sightseeing.transferOptions.filter((option: any) => option.isEnabled);
      if (enabledOptions.length > 0) {
        return enabledOptions.map((option: any) => ({
          ...option,
          // Normalize priceUnit to consistent format
          priceUnit: option.priceUnit === 'Per Vehicle' ? 'per-vehicle' : 'per-person',
          type: option.type || option.vehicleType || option.id
        }));
      }
    }
    
    // Fallback to transferTypes if transferOptions not available or empty
    if (sightseeing.transferTypes && Array.isArray(sightseeing.transferTypes) && sightseeing.transferTypes.length > 0) {
      return sightseeing.transferTypes.map((type: string, index: number) => ({
        id: `transfer_${index}`,
        vehicleType: type,
        type: type,
        price: 25, // Default price
        priceUnit: 'per-person',
        isEnabled: true
      }));
    }
    
    // Return empty array if no transfer options available
    return [];
  };

  // Helper function to check if sightseeing has transfer options
  const hasTransferOptions = (sightseeing: any) => {
    const options = getAvailableTransferOptions(sightseeing);
    return options.length > 0;
  };

  // New sightseeing pricing functions with default transfer selection
  const getSightseeingPricing = (sightseeingId: string, sightseeing: any): SightseeingPricingSelection => {
    if (!sightseeingPricing[sightseeingId]) {
      // Check if this sightseeing has transfer options and set default
      const hasTransfers = hasTransferOptions(sightseeing);
      const availableTransfers = getAvailableTransferOptions(sightseeing);
      
      return {
        pricingType: 'standard',
        transferOption: {
          included: hasTransfers, // Default to true if transfer options exist
          priceUnit: 'per-person',
          ...(hasTransfers && availableTransfers.length > 0 && {
            type: availableTransfers[0].type,
            price: availableTransfers[0].price
          })
        }
      };
    }
    
    return sightseeingPricing[sightseeingId];
  };

  const updateSightseeingPricing = (sightseeingId: string, updates: Partial<SightseeingPricingSelection>, sightseeing?: any) => {
    setSightseeingPricing(prev => ({
      ...prev,
      [sightseeingId]: {
        ...getSightseeingPricing(sightseeingId, sightseeing),
        ...updates
      }
    }));
  };

  const calculateSightseeingPrice = (sightseeing: any, pricingSelection: SightseeingPricingSelection) => {
    const effectivePax = pricingSelection.customPax || totalPax;
    let basePrice = 0;
    let transferPrice = 0;

    // Helper function to safely get numeric value
    const safeNumber = (value: any, fallback = 0) => {
      const num = typeof value === 'number' ? value : parseFloat(value);
      return isNaN(num) ? fallback : num;
    };

    // Calculate base activity price with proper adult/child pricing fallback
    if (pricingSelection.pricingType === 'standard') {
      // Use standard pricing with fallback logic
      if (sightseeing.pricingOptions && sightseeing.pricingOptions.length > 0) {
        const standardPricing = sightseeing.pricingOptions.find(p => p.isEnabled) || sightseeing.pricingOptions[0];
        const adultPrice = safeNumber(standardPricing.adultPrice, 50);
        const childPrice = safeNumber(standardPricing.childPrice, adultPrice * 0.7); // 30% discount for children
        basePrice = (adultPrice * query.paxDetails.adults) + (childPrice * query.paxDetails.children);
      } else if (sightseeing.price) {
        if (typeof sightseeing.price === 'object' && sightseeing.price !== null) {
          const adultPrice = safeNumber(sightseeing.price.adult, 50);
          const childPrice = safeNumber(sightseeing.price.child, adultPrice * 0.7);
          basePrice = (adultPrice * query.paxDetails.adults) + (childPrice * query.paxDetails.children);
        } else {
          // If price is a single number, use it for all pax
          const pricePerPerson = safeNumber(sightseeing.price, 50);
          basePrice = pricePerPerson * effectivePax;
        }
      } else {
        // Fallback to a default price structure
        const defaultPrice = 50;
        basePrice = defaultPrice * effectivePax;
      }
    } else if (pricingSelection.pricingType === 'option' && pricingSelection.selectedPricingOption) {
      // Use selected pricing option with fallback logic
      const selectedOption = sightseeing.pricingOptions?.find((p: any) => p.id === pricingSelection.selectedPricingOption);
      if (selectedOption) {
        const adultPrice = safeNumber(selectedOption.adultPrice, 50);
        const childPrice = safeNumber(selectedOption.childPrice, adultPrice * 0.7);
        basePrice = (adultPrice * query.paxDetails.adults) + (childPrice * query.paxDetails.children);
      } else {
        // Fallback if selected option not found
        basePrice = 50 * effectivePax;
      }
    } else if (pricingSelection.pricingType === 'package' && pricingSelection.selectedPackageOption) {
      // Use package pricing
      const selectedPackage = sightseeing.packageOptions?.find((p: any) => p.id === pricingSelection.selectedPackageOption);
      if (selectedPackage) {
        if (selectedPackage.totalPrice) {
          basePrice = safeNumber(selectedPackage.totalPrice, 100);
        } else if (selectedPackage.pricePerPerson) {
          basePrice = safeNumber(selectedPackage.pricePerPerson, 50) * effectivePax;
        } else if (selectedPackage.adultPrice !== undefined) {
          const adultPrice = safeNumber(selectedPackage.adultPrice, 50);
          const childPrice = safeNumber(selectedPackage.childPrice, adultPrice * 0.7);
          basePrice = (adultPrice * query.paxDetails.adults) + (childPrice * query.paxDetails.children);
        } else {
          basePrice = 100; // Default package price
        }
      } else {
        // Fallback if selected package not found
        basePrice = 100;
      }
    }

    // Calculate transfer price if applicable
    if (pricingSelection.transferOption?.included && pricingSelection.transferOption.price) {
      const transferPriceValue = safeNumber(pricingSelection.transferOption.price, 25);
      if (pricingSelection.transferOption.priceUnit === 'per-vehicle') {
        transferPrice = transferPriceValue;
      } else {
        transferPrice = transferPriceValue * effectivePax;
      }
    }

    const finalPrice = basePrice + transferPrice;
    return safeNumber(finalPrice, 50); // Ensure we never return NaN
  };

  // Helper function to get proper pricing display for options
  const getPricingOptionDisplay = (option: any, currency: any) => {
    const adultPrice = option.adultPrice || 0;
    const childPrice = option.childPrice || 0;
    
    return {
      name: option.name || option.type || 'Standard Option',
      adultPrice: Math.round(adultPrice),
      childPrice: Math.round(childPrice),
      displayText: `${option.name || option.type} - A:${currency.symbol}${Math.round(adultPrice)} C:${currency.symbol}${Math.round(childPrice)}`
    };
  };

  // Helper function to get proper pricing display for packages
  const getPackageOptionDisplay = (pkg: any, currency: any) => {
    let price = 0;
    let priceText = '';
    
    if (pkg.totalPrice) {
      price = Math.round(pkg.totalPrice);
      priceText = `${currency.symbol}${price} total`;
    } else if (pkg.pricePerPerson) {
      price = Math.round(pkg.pricePerPerson);
      priceText = `${currency.symbol}${price} per person`;
    } else if (pkg.adultPrice !== undefined) {
      const adultPrice = Math.round(pkg.adultPrice || 0);
      const childPrice = Math.round(pkg.childPrice || 0);
      priceText = `A:${currency.symbol}${adultPrice} C:${currency.symbol}${childPrice}`;
    } else {
      price = 100; // fallback
      priceText = `${currency.symbol}${price} estimated`;
    }
    
    return {
      name: pkg.name || 'Package Option',
      price,
      displayText: `${pkg.name} - ${priceText}`
    };
  };

  const toggleRoomExpansion = (roomKey: string) => {
    setExpandedRooms(prev => ({
      ...prev,
      [roomKey]: !prev[roomKey]
    }));
  };

  const startRoomEditing = (roomKey: string) => {
    setEditingRooms(prev => ({
      ...prev,
      [roomKey]: true
    }));
    if (!roomNights[roomKey]) {
      updateRoomNights(roomKey, 1, 1);
    }
  };

  const stopRoomEditing = (roomKey: string) => {
    setEditingRooms(prev => ({
      ...prev,
      [roomKey]: false
    }));
  };

  const isRoomBeingEdited = (roomKey: string) => {
    return editingRooms[roomKey] || false;
  };

  const getRoomNights = (roomKey: string): RoomNightsData => {
    return roomNights[roomKey] || {
      numberOfNights: 1,
      startDay: 1,
      endDay: 2,
      affectedDays: [1, 2]
    };
  };

  const updateRoomNights = (roomKey: string, numberOfNights: number, startDay: number = 1) => {
    const nights = Math.max(1, Math.min(numberOfNights, maxTripNights));
    const endDay = startDay + nights;
    const affectedDays = Array.from({ length: nights + 1 }, (_, i) => startDay + i);

    setRoomNights(prev => ({
      ...prev,
      [roomKey]: {
        numberOfNights: nights,
        startDay,
        endDay,
        affectedDays
      }
    }));
  };

  const getRoomPaxConfig = (roomKey: string): RoomPaxConfiguration => {
    return roomPaxConfig[roomKey] || {
      adults: Math.min(query.paxDetails.adults, 2),
      children: Math.min(query.paxDetails.children, 1),
      extraBeds: 0
    };
  };

  const updateRoomPaxConfig = (roomKey: string, field: keyof RoomPaxConfiguration, value: number) => {
    setRoomPaxConfig(prev => ({
      ...prev,
      [roomKey]: {
        ...getRoomPaxConfig(roomKey),
        [field]: Math.max(0, value)
      }
    }));
  };

  const getRoomPricing = (roomKey: string, roomType: any): RoomPricingData => {
    return roomPricing[roomKey] || {
      adultPrice: roomType.adultPrice || 100,
      childPrice: roomType.childPrice || 50,
      extraBedPrice: roomType.extraBedPrice || 25
    };
  };

  const updateRoomPricing = (roomKey: string, field: keyof RoomPricingData, value: number) => {
    const currentPricing = getRoomPricing(roomKey, {});
    setRoomPricing(prev => ({
      ...prev,
      [roomKey]: {
        ...currentPricing,
        [field]: Math.max(0, value)
      }
    }));
  };

  const calculateRoomCapacity = (roomType: any, config: RoomPaxConfiguration) => {
    const maxOccupancy = roomType.maxOccupancy || (roomType.capacity?.adults + roomType.capacity?.children) || 2;
    const totalGuests = config.adults + config.children;
    const baseCapacity = maxOccupancy;
    const totalCapacity = baseCapacity + config.extraBeds;
    
    return {
      fits: totalGuests <= totalCapacity,
      needsExtraBed: totalGuests > baseCapacity && totalGuests <= totalCapacity,
      insufficient: totalGuests > totalCapacity,
      totalCapacity,
      baseCapacity
    };
  };

  const calculateRoomTotal = (roomKey: string, roomType: any) => {
    const config = getRoomPaxConfig(roomKey);
    const pricing = getRoomPricing(roomKey, roomType);
    const nights = getRoomNights(roomKey);
    
    const perNightCost = (pricing.adultPrice * config.adults) + 
                        (pricing.childPrice * config.children) + 
                        (pricing.extraBedPrice * config.extraBeds);
    
    return perNightCost * nights.numberOfNights;
  };

  const getCapacityStatusBadge = (capacity: any) => {
    if (capacity.fits && !capacity.needsExtraBed) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Perfect fit</Badge>;
    } else if (capacity.needsExtraBed) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Needs extra bed</Badge>;
    } else {
      return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Insufficient</Badge>;
    }
  };

  const loading = inventoryLoading || sightseeingLoading;

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground dark:text-foreground">Loading smart suggestions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border border-primary/20 bg-card dark:bg-card">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 pb-4">
        <CardTitle className="text-lg text-blue-900 dark:text-blue-200 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Smart Suggestions
        </CardTitle>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {dayCity ? `Recommendations for ${dayCity}` : `Recommendations for ${query.destination.country}`} • {totalPax} PAX
        </p>
      </CardHeader>
      
      <CardContent className="p-6 bg-background dark:bg-card text-foreground dark:text-foreground">
        <Tabs defaultValue="sightseeing" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted dark:bg-muted">
            <TabsTrigger value="sightseeing" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Sightseeing</span>
              <span className="sm:hidden">Activities</span>
            </TabsTrigger>
            <TabsTrigger value="transport" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Car className="h-4 w-4" />
              <span className="hidden sm:inline">Transport</span>
              <span className="sm:hidden">Routes</span>
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ChefHat className="h-4 w-4" />
              <span className="hidden sm:inline">Dining</span>
              <span className="sm:hidden">Food</span>
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Sightseeing Tab with Search Functionality */}
          <TabsContent value="sightseeing" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Available Sightseeing & Activities ({filteredSightseeing.length})
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-foreground/30 text-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {totalPax} PAX
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {query.destination.country}
                </Badge>
              </div>
            </div>
            
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search sightseeing activities..."
                value={sightseeingSearchQuery}
                onChange={(e) => setSightseeingSearchQuery(e.target.value)}
                className="pl-10 bg-background border border-border text-foreground"
              />
              {sightseeingSearchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSightseeingSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
              {filteredSightseeing.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-foreground dark:text-foreground">
                    {sightseeingSearchQuery ? 'No sightseeing activities match your search' : 'No sightseeing activities available'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {sightseeingSearchQuery ? 
                      `Try different search terms for "${sightseeingSearchQuery}"` :
                      `Add activities for ${dayCity || query.destination.cities.join(', ')} in Sightseeing Management`
                    }
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Looking for: {query.destination.country}</p>
                    <p>Cities: {dayCity || query.destination.cities.join(', ')}</p>
                    <p>Total inventory items: {inventorySightseeing.length}</p>
                  </div>
                </div>
              ) : (
                filteredSightseeing.map(sightseeing => {
                  const itemId = `sightseeing_${sightseeing.id}`;
                  const pricingSelection = getSightseeingPricing(String(sightseeing.id), sightseeing);
                  const calculatedPrice = calculateSightseeingPrice(sightseeing, pricingSelection);
                  const currentPrice = getEditablePrice(itemId, calculatedPrice);
                  const isEditing = editingItem === itemId;
                  const isExpanded = expandedActivity === String(sightseeing.id);
                  const availableTransferOptions = getAvailableTransferOptions(sightseeing);
                  const hasTransfers = hasTransferOptions(sightseeing);

                  console.log('Rendering sightseeing:', {
                    name: sightseeing.name,
                    hasTransfers,
                    availableTransferOptions,
                    pricingSelection: pricingSelection.transferOption
                  });

                  return (
                    <Card key={sightseeing.id} className="hover:shadow-md transition-all border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-600 bg-card dark:bg-card">
                      <CardContent className="p-3">
                        <div className="space-y-3">
                          {/* Activity Header with Enhanced Details */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start gap-2">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center shrink-0">
                                  <Image className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-semibold text-sm text-foreground dark:text-foreground line-clamp-1">{sightseeing.name}</h5>
                                      <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {sightseeing.city}
                                        </p>
                                        {sightseeing.difficultyLevel && (
                                          <Badge variant="outline" className="text-xs px-1 py-0 border-orange-300 text-orange-700 dark:text-orange-300">
                                            {sightseeing.difficultyLevel}
                                          </Badge>
                                        )}
                                        {hasTransfers && (
                                          <Badge variant="outline" className="text-xs px-1 py-0 border-blue-300 text-blue-700 dark:text-blue-300">
                                            Transfer Available
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Info Button */}
                                    <div className="ml-2 shrink-0">
                                      <SightseeingDetailsPopover
                                        sightseeing={sightseeing}
                                        query={query}
                                        onAddActivity={onAddActivity}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Compact Activity Details */}
                              <div className="flex flex-wrap items-center gap-1 text-xs">
                                <Badge variant="outline" className="text-xs px-1 py-0 border-foreground/30 text-foreground">
                                  {sightseeing.category || 'Activity'}
                                </Badge>
                                {sightseeing.duration && (
                                  <Badge variant="secondary" className="text-xs px-1 py-0 bg-secondary dark:bg-secondary text-secondary-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {sightseeing.duration}
                                  </Badge>
                                )}
                                <Badge variant="default" className="text-xs px-1 py-0 bg-green-600 text-white">
                                  Available
                                </Badge>
                              </div>

                              {/* Description Preview */}
                              {sightseeing.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {sightseeing.description}
                                </p>
                              )}
                            </div>
                            
                            {/* Price Section */}
                            <div className="text-right space-y-1 ml-3">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <Input 
                                    type="number" 
                                    value={currentPrice} 
                                    onChange={(e) => handlePriceEdit(itemId, Number(e.target.value))} 
                                    className="w-16 h-6 text-xs bg-background dark:bg-background text-foreground" 
                                  />
                                  <Button size="sm" variant="ghost" onClick={confirmEditing} className="h-6 w-6 p-0">
                                    <Check className="h-3 w-3 text-green-600" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-6 w-6 p-0">
                                    <X className="h-3 w-3 text-red-600" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <div className="text-right">
                                    <div className="text-sm font-bold text-green-600 dark:text-green-400">
                                      {currency.symbol}{Math.round(currentPrice)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {pricingSelection.customPax || totalPax} pax
                                    </div>
                                  </div>
                                  <Button size="sm" variant="ghost" onClick={() => startEditing(itemId, currentPrice)} className="h-6 w-6 p-0">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Enhanced Pricing Selection Options */}
                          <div className="space-y-3 pt-3 border-t border-border/60">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <Calculator className="h-3 w-3 text-white" />
                              </div>
                              <h6 className="font-semibold text-sm text-blue-900 dark:text-blue-200">Pricing Configuration</h6>
                            </div>

                            {/* Enhanced Pricing Type Selection */}
                            <div className="space-y-3">
                              <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                  Pricing Type
                                </Label>
                                <RadioGroup
                                  value={pricingSelection.pricingType}
                                  onValueChange={(value: 'standard' | 'option' | 'package') => 
                                    updateSightseeingPricing(String(sightseeing.id), { pricingType: value }, sightseeing)
                                  }
                                  className="flex flex-wrap gap-4"
                                >
                                  <div className={`flex items-center space-x-2 p-2 rounded-lg border transition-all ${
                                    pricingSelection.pricingType === 'standard' 
                                      ? 'bg-blue-50 border-blue-300 shadow-sm dark:bg-blue-950/30 dark:border-blue-600' 
                                      : 'bg-white border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-600'
                                  }`}>
                                    <RadioGroupItem value="standard" id={`standard-${sightseeing.id}`} className="h-4 w-4" />
                                    <Label htmlFor={`standard-${sightseeing.id}`} className="text-sm font-medium cursor-pointer">
                                      Standard
                                    </Label>
                                  </div>
                                  <div className={`flex items-center space-x-2 p-2 rounded-lg border transition-all ${
                                    pricingSelection.pricingType === 'option' 
                                      ? 'bg-blue-50 border-blue-300 shadow-sm dark:bg-blue-950/30 dark:border-blue-600' 
                                      : 'bg-white border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-600'
                                  }`}>
                                    <RadioGroupItem value="option" id={`option-${sightseeing.id}`} className="h-4 w-4" />
                                    <Label htmlFor={`option-${sightseeing.id}`} className="text-sm font-medium cursor-pointer">
                                      Options
                                    </Label>
                                  </div>
                                  <div className={`flex items-center space-x-2 p-2 rounded-lg border transition-all ${
                                    pricingSelection.pricingType === 'package' 
                                      ? 'bg-blue-50 border-blue-300 shadow-sm dark:bg-blue-950/30 dark:border-blue-600' 
                                      : 'bg-white border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-600'
                                  }`}>
                                    <RadioGroupItem value="package" id={`package-${sightseeing.id}`} className="h-4 w-4" />
                                    <Label htmlFor={`package-${sightseeing.id}`} className="text-sm font-medium cursor-pointer">
                                      Package
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </div>
                            </div>

                            {/* Enhanced Options/Package Dropdown with Proper Pricing */}
                            {pricingSelection.pricingType === 'option' && sightseeing.pricingOptions && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                                  Select Pricing Option
                                </Label>
                                <Select
                                  value={pricingSelection.selectedPricingOption || ''}
                                  onValueChange={(value) => updateSightseeingPricing(String(sightseeing.id), { selectedPricingOption: value }, sightseeing)}
                                >
                                  <SelectTrigger className="h-8 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                    <SelectValue placeholder="Choose an option..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 z-[100] shadow-lg max-h-48 overflow-y-auto">
                                    {sightseeing.pricingOptions
                                      .filter((option: any) => option.isEnabled !== false)
                                      .map((option: any) => {
                                        const displayInfo = getPricingOptionDisplay(option, currency);
                                        return (
                                          <SelectItem 
                                            key={option.id} 
                                            value={option.id} 
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700 py-2"
                                          >
                                            <div className="flex flex-col w-full">
                                              <div className="flex justify-between items-center w-full">
                                                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                                  {displayInfo.name}
                                                </span>
                                                <div className="flex gap-1 ml-2">
                                                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                                    A: {currency.symbol}{displayInfo.adultPrice}
                                                  </span>
                                                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">
                                                    C: {currency.symbol}{displayInfo.childPrice}
                                                  </span>
                                                </div>
                                              </div>
                                              {option.description && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                                  {option.description}
                                                </span>
                                              )}
                                            </div>
                                          </SelectItem>
                                        );
                                      })}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {pricingSelection.pricingType === 'package' && sightseeing.packageOptions && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                                  Select Package
                                </Label>
                                <Select
                                  value={pricingSelection.selectedPackageOption || ''}
                                  onValueChange={(value) => updateSightseeingPricing(String(sightseeing.id), { selectedPackageOption: value }, sightseeing)}
                                >
                                  <SelectTrigger className="h-8 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                    <SelectValue placeholder="Choose a package..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 z-[100] shadow-lg max-h-48 overflow-y-auto">
                                    {sightseeing.packageOptions
                                      .filter((pkg: any) => pkg.isEnabled !== false)
                                      .map((pkg: any) => {
                                        const displayInfo = getPackageOptionDisplay(pkg, currency);
                                        return (
                                          <SelectItem 
                                            key={pkg.id} 
                                            value={pkg.id} 
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700 py-2"
                                          >
                                            <div className="flex flex-col w-full">
                                              <div className="flex justify-between items-center w-full">
                                                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                                  {displayInfo.name}
                                                </span>
                                                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-medium">
                                                  {displayInfo.displayText.split(' - ')[1]}
                                                </span>
                                              </div>
                                              {pkg.description && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                                  {pkg.description}
                                                </span>
                                              )}
                                              {pkg.inclusions && pkg.inclusions.length > 0 && (
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                                                  Includes: {pkg.inclusions.slice(0, 2).join(', ')}
                                                  {pkg.inclusions.length > 2 && ` +${pkg.inclusions.length - 2} more`}
                                                </div>
                                              )}
                                            </div>
                                          </SelectItem>
                                        );
                                      })}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Enhanced PAX and Transfer Section */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                                  PAX Count
                                </Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={pricingSelection.customPax || totalPax}
                                  onChange={(e) => updateSightseeingPricing(String(sightseeing.id), { 
                                    customPax: parseInt(e.target.value) || totalPax 
                                  }, sightseeing)}
                                  className="h-8 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                />
                              </div>
                              
                              <div className={`p-2 rounded-lg border transition-all ${
                                pricingSelection.transferOption?.included 
                                  ? 'bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-600' 
                                  : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-600'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Transfer
                                  </Label>
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="checkbox"
                                      id={`transfer-${sightseeing.id}`}
                                      checked={pricingSelection.transferOption?.included || false}
                                      disabled={!hasTransfers}
                                      onChange={(e) => {
                                        if (hasTransfers) {
                                          updateSightseeingPricing(String(sightseeing.id), {
                                            transferOption: {
                                              ...pricingSelection.transferOption,
                                              included: e.target.checked,
                                              // Set default values from first available option when enabling
                                              ...(e.target.checked && availableTransferOptions.length > 0 && {
                                                type: availableTransferOptions[0].type || 'private-car',
                                                priceUnit: availableTransferOptions[0].priceUnit || 'per-person',
                                                price: availableTransferOptions[0].price || 25
                                              })
                                            }
                                          }, sightseeing);
                                        }
                                      }}
                                      className="h-3 w-3 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    />
                                    <Label 
                                      htmlFor={`transfer-${sightseeing.id}`} 
                                      className={`text-xs cursor-pointer ${
                                        !hasTransfers 
                                          ? 'text-gray-400 dark:text-gray-500' 
                                          : 'text-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                     {hasTransfers ? 'Include' : 'N/A'}
                                    </Label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
