import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Hotel, Car, MapPin, Edit, Check, X, Plus, Users, Clock, Route, Star, ChefHat, ArrowRight, Bed, Home, Calendar, Info, Image, Award, Navigation, Calculator, DollarSign, Search } from "lucide-react";
import { Query } from '@/types/query';
import { useEnhancedInventoryData } from '@/hooks/useEnhancedInventoryData';
import { getCurrencyByCountry } from '@/utils/currencyUtils';
import useTransportData from '@/pages/inventory/transport/hooks/useTransportData';
import { useSightseeingData } from '@/pages/inventory/sightseeing/hooks/useSightseeingData';
import { SightseeingDetailsPopover } from './SightseeingDetailsPopover';
import { AdvancedTransferConfiguration } from './transfer/AdvancedTransferConfiguration';
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
  sicSelected?: boolean; // New field for SIC selection
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
  const [multiVehicleSelections, setMultiVehicleSelections] = useState<{
    [key: string]: {
      vehicles: Array<{
        type: string;
        quantity: number;
        capacity: number;
        price: number;
      }>;
      totalCapacity: number;
      totalPrice: number;
      vehicleCount: number;
    };
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
  const {
    routes: allTransportRoutes
  } = useTransportData();

  // Load sightseeing data from Sightseeing Management module
  const {
    sightseeings: inventorySightseeing,
    loading: sightseeingLoading
  } = useSightseeingData();
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
    const matchesCountry = sightseeing.country?.toLowerCase() === query.destination.country.toLowerCase() ||
                          (sightseeing.country?.toLowerCase() === 'united arab emirates' && query.destination.country.toLowerCase() === 'uae') ||
                          (sightseeing.country?.toLowerCase() === 'uae' && query.destination.country.toLowerCase() === 'united arab emirates');

    // Check if it matches any of the destination cities or the specific day city
    const citiesToCheck = dayCity ? [dayCity, ...query.destination.cities] : query.destination.cities;
    const matchesCity = citiesToCheck.some(city => sightseeing.city?.toLowerCase().includes(city.toLowerCase()));

    // Search filter
    const matchesSearch = sightseeingSearchQuery.trim() === '' || sightseeing.name?.toLowerCase().includes(sightseeingSearchQuery.toLowerCase()) || sightseeing.description?.toLowerCase().includes(sightseeingSearchQuery.toLowerCase()) || sightseeing.category?.toLowerCase().includes(sightseeingSearchQuery.toLowerCase()) || sightseeing.city?.toLowerCase().includes(sightseeingSearchQuery.toLowerCase());
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
      return startLocation.includes(cityLower) || endLocation.includes(cityLower) || route.name?.toLowerCase().includes(cityLower);
    });

    // Search filter for transport routes
    const matchesSearch = transportSearchQuery.trim() === '' || route.name?.toLowerCase().includes(transportSearchQuery.toLowerCase()) || route.startLocation?.toLowerCase().includes(transportSearchQuery.toLowerCase()) || route.endLocation?.toLowerCase().includes(transportSearchQuery.toLowerCase()) || route.startLocationFullName?.toLowerCase().includes(transportSearchQuery.toLowerCase()) || route.endLocationFullName?.toLowerCase().includes(transportSearchQuery.toLowerCase()) || route.code?.toLowerCase().includes(transportSearchQuery.toLowerCase()) || route.routeCode?.toLowerCase().includes(transportSearchQuery.toLowerCase());
    return routeInvolvesCities && matchesSearch;
  }).slice(0, 8);

  // Mock restaurant data for demonstration
  const mockRestaurants = [{
    id: 1,
    name: "Local Delights Restaurant",
    city: dayCity || "Bangkok",
    cuisine: "Thai",
    rating: 4.5,
    priceRange: "$$",
    avgPrice: 25
  }, {
    id: 2,
    name: "Rooftop Fine Dining",
    city: dayCity || "Bangkok",
    cuisine: "International",
    rating: 4.8,
    priceRange: "$$$",
    avgPrice: 45
  }, {
    id: 3,
    name: "Street Food Paradise",
    city: dayCity || "Bangkok",
    cuisine: "Local",
    rating: 4.2,
    priceRange: "$",
    avgPrice: 15
  }];
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
    return selectedVehicleTypes[route.id] || route.transportTypes?.[0]?.type || 'Standard';
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

  // Multi-vehicle selection helper functions
  const calculateOptimalVehicleCombination = (route: any, requiredCapacity: number = totalPax) => {
    const availableVehicles = route.transportTypes || [{
      type: 'Standard',
      price: route.price || 50,
      seatingCapacity: 4
    }];

    // Sort vehicles by capacity descending to prefer larger vehicles first
    const sortedVehicles = [...availableVehicles].sort((a, b) => (b.seatingCapacity || 4) - (a.seatingCapacity || 4));
    const combinations: Array<{
      vehicles: Array<{
        type: string;
        quantity: number;
        capacity: number;
        price: number;
      }>;
      totalCapacity: number;
      totalPrice: number;
      vehicleCount: number;
    }> = [];

    // Generate all possible combinations
    const generateCombinations = (remaining: number, vehicleIndex: number, currentCombination: any[]) => {
      if (remaining <= 0) {
        const totalCapacity = currentCombination.reduce((sum, v) => sum + v.capacity * v.quantity, 0);
        const totalPrice = currentCombination.reduce((sum, v) => sum + v.price * v.quantity, 0);
        const vehicleCount = currentCombination.reduce((sum, v) => sum + v.quantity, 0);
        combinations.push({
          vehicles: [...currentCombination],
          totalCapacity,
          totalPrice,
          vehicleCount
        });
        return;
      }
      for (let i = vehicleIndex; i < sortedVehicles.length; i++) {
        const vehicle = sortedVehicles[i];
        const capacity = vehicle.seatingCapacity || 4;
        const price = vehicle.price || 50;
        const maxQuantity = Math.ceil(remaining / capacity);
        for (let quantity = 1; quantity <= Math.min(maxQuantity, 3); quantity++) {
          // Limit to 3 vehicles of same type
          if (capacity * quantity >= remaining || currentCombination.length + quantity <= 4) {
            // Max 4 total vehicles
            const newCombination = [...currentCombination, {
              type: vehicle.type,
              quantity,
              capacity,
              price
            }];
            generateCombinations(remaining - capacity * quantity, i + 1, newCombination);
          }
        }
      }
    };
    generateCombinations(requiredCapacity, 0, []);

    // Filter valid combinations and sort by preference
    const validCombinations = combinations.filter(combo => combo.totalCapacity >= requiredCapacity).sort((a, b) => {
      // Prefer fewer vehicles first, then lower cost
      if (a.vehicleCount !== b.vehicleCount) {
        return a.vehicleCount - b.vehicleCount;
      }
      return a.totalPrice - b.totalPrice;
    });
    return validCombinations.slice(0, 3); // Return top 3 combinations
  };
  const handleMultiVehicleSelection = (routeId: string, combination: any) => {
    setMultiVehicleSelections(prev => ({
      ...prev,
      [routeId]: combination
    }));
  };
  const getMultiVehicleSelection = (routeId: string) => {
    return multiVehicleSelections[routeId];
  };
  const formatVehicleCombination = (combination: any) => {
    return combination.vehicles.map((v: any) => `${v.quantity}x ${v.type} (${v.capacity * v.quantity} seats)`).join(' + ');
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
        price: 25,
        // Default price
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
          included: hasTransfers,
          // Default to true if transfer options exist
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

    // Check if SIC pricing should be used
    if (pricingSelection.sicSelected && sightseeing.sicPricing) {
      const sicAdultPrice = safeNumber(sightseeing.sicPricing.adult, 50);
      const sicChildPrice = safeNumber(sightseeing.sicPricing.child, sicAdultPrice * 0.7);
      basePrice = sicAdultPrice * query.paxDetails.adults + sicChildPrice * query.paxDetails.children;
    } else {
      // Calculate base activity price with proper adult/child pricing fallback
      if (pricingSelection.pricingType === 'standard') {
        // Use standard pricing with fallback logic
        if (sightseeing.pricingOptions && sightseeing.pricingOptions.length > 0) {
          const standardPricing = sightseeing.pricingOptions.find(p => p.isEnabled) || sightseeing.pricingOptions[0];
          const adultPrice = safeNumber(standardPricing.adultPrice, 50);
          const childPrice = safeNumber(standardPricing.childPrice, adultPrice * 0.7); // 30% discount for children
          basePrice = adultPrice * query.paxDetails.adults + childPrice * query.paxDetails.children;
        } else if (sightseeing.price) {
          if (typeof sightseeing.price === 'object' && sightseeing.price !== null) {
            const adultPrice = safeNumber(sightseeing.price.adult, 50);
            const childPrice = safeNumber(sightseeing.price.child, adultPrice * 0.7);
            basePrice = adultPrice * query.paxDetails.adults + childPrice * query.paxDetails.children;
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
          basePrice = adultPrice * query.paxDetails.adults + childPrice * query.paxDetails.children;
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
            basePrice = adultPrice * query.paxDetails.adults + childPrice * query.paxDetails.children;
          } else {
            basePrice = 100; // Default package price
          }
        } else {
          // Fallback if selected package not found
          basePrice = 100;
        }
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
    const affectedDays = Array.from({
      length: nights + 1
    }, (_, i) => startDay + i);
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
    const maxOccupancy = roomType.maxOccupancy || roomType.capacity?.adults + roomType.capacity?.children || 2;
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
    const perNightCost = pricing.adultPrice * config.adults + pricing.childPrice * config.children + pricing.extraBedPrice * config.extraBeds;
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
    return <Card className="w-full">
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground dark:text-foreground">Loading smart suggestions...</p>
        </CardContent>
      </Card>;
  }
  return <Card className="w-full shadow-lg border border-primary/20 bg-card dark:bg-card">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 py-2">
        <CardTitle className="text-base text-blue-900 dark:text-blue-200 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Smart Suggestions • {dayCity ? dayCity : query.destination.country} • {totalPax} PAX
        </CardTitle>
        {dayCity && <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 mt-1">
            <MapPin className="h-3 w-3" />
            <span>City allocation optimized suggestions</span>
            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300">
              {dayCity}
            </Badge>
          </div>}
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
              <Input type="text" placeholder="Search sightseeing activities..." value={sightseeingSearchQuery} onChange={e => setSightseeingSearchQuery(e.target.value)} className="pl-10 bg-background border border-border text-foreground" />
              {sightseeingSearchQuery && <Button variant="ghost" size="sm" onClick={() => setSightseeingSearchQuery('')} className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>}
            </div>
            
            <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
              {filteredSightseeing.length === 0 ? <div className="col-span-full text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-foreground dark:text-foreground">
                    {sightseeingSearchQuery ? 'No sightseeing activities match your search' : 'No sightseeing activities available'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {sightseeingSearchQuery ? `Try different search terms for "${sightseeingSearchQuery}"` : `Add activities for ${dayCity || query.destination.cities.join(', ')} in Sightseeing Management`}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Looking for: {query.destination.country}</p>
                    <p>Cities: {dayCity || query.destination.cities.join(', ')}</p>
                    <p>Total inventory items: {inventorySightseeing.length}</p>
                  </div>
                </div> : filteredSightseeing.map(sightseeing => {
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
              return <Card key={sightseeing.id} className="hover:shadow-md transition-all border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-600 bg-card dark:bg-card">
                      <CardContent className="p-2">
                        <div className="space-y-2">
                          {/* Activity Header with Enhanced Details */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                   {(sightseeing.imageUrl || sightseeing.images?.[0]?.url) ? (
                                     <img 
                                       src={sightseeing.imageUrl || sightseeing.images?.[0]?.url} 
                                       alt={sightseeing.images?.[0]?.altText || sightseeing.name}
                                       className="w-full h-full object-cover rounded-md"
                                       loading="lazy"
                                       onLoad={(e) => {
                                         // Ensure image is visible when loaded
                                         e.currentTarget.style.opacity = '1';
                                       }}
                                       onError={(e) => {
                                         const parent = e.currentTarget.parentElement;
                                         if (parent) {
                                           parent.className = "w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center shrink-0";
                                           parent.innerHTML = '<svg class="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 12 2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
                                         }
                                       }}
                                       style={{ opacity: '0', transition: 'opacity 0.3s ease-in-out' }}
                                     />
                                   ) : (
                                     <Image className="h-4 w-4 text-green-600 dark:text-green-400" />
                                   )}
                                 </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                       <h5 className="font-semibold text-sm text-foreground dark:text-foreground line-clamp-1">{sightseeing.name}</h5>
                                       <div className="flex items-center gap-1 mt-0.5">
                                         <p className="text-xs text-muted-foreground flex items-center gap-1">
                                           <MapPin className="h-3 w-3" />
                                           {sightseeing.city}
                                         </p>
                                         {sightseeing.difficultyLevel && <Badge variant="outline" className="text-xs px-1 py-0 h-4 border-orange-300 text-orange-700 dark:text-orange-300">
                                             {sightseeing.difficultyLevel}
                                           </Badge>}
                                          {hasTransfers && <Badge variant="outline" className="text-xs px-1 py-0 h-4 border-blue-300 text-blue-700 dark:text-blue-300">
                                              Transfer
                                            </Badge>}
                                          {sightseeing.sicAvailable && <Badge variant="outline" className="text-xs px-1 py-0 h-4 border-green-300 text-green-700 dark:text-green-300">
                                              SIC Available
                                            </Badge>}
                                          {(sightseeing.requiresMandatoryTransfer || sightseeing.transferMandatory) && <Badge variant="outline" className="text-xs px-1 py-0 h-4 border-orange-300 text-orange-700 dark:text-orange-300">
                                              Transfer Required
                                            </Badge>}
                                       </div>
                                    </div>
                                    
                                    {/* Info Button */}
                                    <div className="ml-2 shrink-0">
                                      <SightseeingDetailsPopover sightseeing={sightseeing} query={query} onAddActivity={onAddActivity} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Compact Activity Details */}
                              <div className="flex flex-wrap items-center gap-1 text-xs">
                                <Badge variant="outline" className="text-xs px-1 py-0 h-4 border-foreground/30 text-foreground">
                                  {sightseeing.category || 'Activity'}
                                </Badge>
                                {sightseeing.duration && <Badge variant="secondary" className="text-xs px-1 py-0 h-4 bg-secondary dark:bg-secondary text-secondary-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {sightseeing.duration}
                                  </Badge>}
                                <Badge variant="default" className="text-xs px-1 py-0 h-4 bg-green-600 text-white">
                                  Available
                                </Badge>
                              </div>

                              {/* Description Preview */}
                              {sightseeing.description && <p className="text-xs text-muted-foreground line-clamp-1">
                                  {sightseeing.description}
                                </p>}
                            </div>
                            
                            {/* Price Section */}
                            <div className="text-right space-y-0.5 ml-2">
                              {isEditing ? <div className="flex items-center gap-0.5 sm:gap-1">
                                  <Input type="number" value={currentPrice} onChange={e => handlePriceEdit(itemId, Number(e.target.value))} className="w-14 sm:w-16 h-5 sm:h-6 text-xs bg-background dark:bg-background text-foreground" />
                                  <Button size="sm" variant="ghost" onClick={confirmEditing} className="h-5 w-5 sm:h-6 sm:w-6 p-0">
                                    <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-5 w-5 sm:h-6 sm:w-6 p-0">
                                    <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600" />
                                  </Button>
                                </div> : <div className="flex items-center gap-1">
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
                                </div>}
                            </div>
                          </div>

                          {/* Enhanced Pricing Selection Options */}
                          <div className="space-y-1 pt-1.5 mt-1.5 border-t border-primary/20 bg-muted/20 rounded-b-md px-2 pb-2">
                            <div className="flex items-center gap-1 mb-0.5">
                              <Calculator className="h-3 w-3 text-muted-foreground" />
                              <h6 className="font-medium text-xs">Options</h6>
                            </div>

                            {/* Enhanced Pricing Type Selection */}
                            <div className="space-y-1.5">
                              <div className="p-1.5 rounded border">
                                <Label className="text-xs font-medium text-muted-foreground mb-0.5 block">
                                  Type
                                </Label>
                                <RadioGroup value={pricingSelection.pricingType} onValueChange={(value: 'standard' | 'option' | 'package') => updateSightseeingPricing(String(sightseeing.id), {
                            pricingType: value
                          }, sightseeing)} className="flex flex-wrap gap-1 sm:gap-2">
                                   <div className={`flex items-center space-x-1 ${pricingSelection.pricingType === 'standard' ? 'text-primary' : 'text-muted-foreground'}`}>
                                     <RadioGroupItem value="standard" id={`standard-${sightseeing.id}`} className="h-4 w-4" />
                                     <Label htmlFor={`standard-${sightseeing.id}`} className="text-xs sm:text-sm cursor-pointer font-medium">
                                       Standard
                                     </Label>
                                   </div>
                                   <div className={`flex items-center space-x-1 ${pricingSelection.pricingType === 'option' ? 'text-primary' : 'text-muted-foreground'}`}>
                                     <RadioGroupItem value="option" id={`option-${sightseeing.id}`} className="h-4 w-4" />
                                     <Label htmlFor={`option-${sightseeing.id}`} className="text-xs sm:text-sm cursor-pointer font-medium">
                                       Options
                                     </Label>
                                   </div>
                                   <div className={`flex items-center space-x-1 ${pricingSelection.pricingType === 'package' ? 'text-primary' : 'text-muted-foreground'}`}>
                                     <RadioGroupItem value="package" id={`package-${sightseeing.id}`} className="h-4 w-4" />
                                     <Label htmlFor={`package-${sightseeing.id}`} className="text-xs sm:text-sm cursor-pointer font-medium">
                                       Package
                                     </Label>
                                   </div>
                                  </RadioGroup>
                               </div>

                               {/* SIC Selection - Show only if SIC is available */}
                               {sightseeing.sicAvailable && (
                                 <div className="p-1.5 rounded border bg-blue-50 dark:bg-blue-950/20">
                                   <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-2">
                                       <Label className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                         Use SIC Pricing
                                       </Label>
                                       <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                         Available
                                       </Badge>
                                     </div>
                                     <Checkbox
                                       checked={pricingSelection.sicSelected || false}
                                       onCheckedChange={(checked) => 
                                         updateSightseeingPricing(String(sightseeing.id), {
                                           sicSelected: checked === true
                                         }, sightseeing)
                                       }
                                       className="h-4 w-4"
                                     />
                                   </div>
                                   {pricingSelection.sicSelected && sightseeing.sicPricing && (
                                     <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                       SIC: Adult {currency.symbol}{sightseeing.sicPricing.adult} | Child {currency.symbol}{sightseeing.sicPricing.child}
                                     </div>
                                   )}
                                 </div>
                               )}
                             </div>

                            {/* Enhanced Options/Package Dropdown with Proper Pricing */}
                            {pricingSelection.pricingType === 'option' && sightseeing.pricingOptions && <div className="p-2 rounded border">
                                <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                  Option
                                </Label>
                                <Select value={pricingSelection.selectedPricingOption || ''} onValueChange={value => updateSightseeingPricing(String(sightseeing.id), {
                          selectedPricingOption: value
                        }, sightseeing)}>
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Choose..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sightseeing.pricingOptions.filter((option: any) => option.isEnabled !== false).map((option: any) => {
                              const displayInfo = getPricingOptionDisplay(option, currency);
                              return <SelectItem key={option.id} value={option.id}>
                                            <div className="flex justify-between items-center w-full">
                                              <span className="text-sm font-medium">
                                                {displayInfo.name}
                                              </span>
                                              <div className="flex gap-1 ml-2">
                                                <Badge variant="secondary" className="text-xs">
                                                  A: {currency.symbol}{displayInfo.adultPrice}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                  C: {currency.symbol}{displayInfo.childPrice}
                                                </Badge>
                                              </div>
                                            </div>
                                          </SelectItem>;
                            })}
                                  </SelectContent>
                                </Select>
                              </div>}

                            {pricingSelection.pricingType === 'package' && sightseeing.packageOptions && <div className="p-2 rounded border">
                                <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                  Package
                                </Label>
                                <Select value={pricingSelection.selectedPackageOption || ''} onValueChange={value => updateSightseeingPricing(String(sightseeing.id), {
                          selectedPackageOption: value
                        }, sightseeing)}>
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Choose..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sightseeing.packageOptions.filter((pkg: any) => pkg.isEnabled !== false).map((pkg: any) => {
                              const displayInfo = getPackageOptionDisplay(pkg, currency);
                              return <SelectItem key={pkg.id} value={pkg.id}>
                                            <div className="flex justify-between items-center w-full">
                                              <span className="text-sm font-medium">
                                                {displayInfo.name}
                                              </span>
                                              <Badge variant="secondary" className="text-xs">
                                                {displayInfo.displayText.split(' - ')[1]}
                                              </Badge>
                                            </div>
                                          </SelectItem>;
                            })}
                                  </SelectContent>
                                </Select>
                              </div>}

                            {/* Enhanced PAX and Transfer Section */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2 rounded border">
                                <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                  PAX
                                </Label>
                                <Input type="number" min="1" value={pricingSelection.customPax || totalPax} onChange={e => updateSightseeingPricing(String(sightseeing.id), {
                            customPax: parseInt(e.target.value) || totalPax
                          }, sightseeing)} className="h-8 text-sm" />
                              </div>
                              
                              <div className="p-3 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium text-foreground">
                                    Transfer Included
                                  </Label>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox id={`transfer-${sightseeing.id}`} checked={pricingSelection.transferOption?.included || false} disabled={!hasTransfers} className="h-5 w-5" onCheckedChange={checked => {
                                if (hasTransfers) {
                                  updateSightseeingPricing(String(sightseeing.id), {
                                    transferOption: {
                                      ...pricingSelection.transferOption,
                                      included: checked === true,
                                      ...(checked && availableTransferOptions.length > 0 && {
                                        type: availableTransferOptions[0].type || 'private-car',
                                        priceUnit: availableTransferOptions[0].priceUnit || 'per-person',
                                        price: availableTransferOptions[0].price || 25
                                      })
                                    }
                                  }, sightseeing);
                                }
                              }} />
                                    <Label htmlFor={`transfer-${sightseeing.id}`} className="text-sm cursor-pointer font-medium">
                                      {hasTransfers ? 'Yes' : 'N/A'}
                                    </Label>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Enhanced Transfer Details */}
                            {hasTransfers && pricingSelection.transferOption?.included && <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 p-4 rounded-xl border border-blue-200/60 dark:border-blue-800/60 shadow-xl backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] space-y-3">
                                <div className="mb-4 flex items-center gap-3 pb-3 border-b border-blue-200/40 dark:border-blue-700/40">
                                  <div className="relative">
                                    <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full animate-pulse shadow-lg"></div>
                                    <div className="absolute inset-0 w-3 h-3 bg-blue-500/30 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="text-base font-bold bg-gradient-to-r from-blue-800 to-indigo-700 dark:from-blue-200 dark:to-indigo-300 bg-clip-text text-transparent">Transfer Configuration</span>
                                </div>
                                <AdvancedTransferConfiguration totalPax={pricingSelection.customPax || totalPax} availableVehicleTypes={availableTransferOptions} selectedTransfer={pricingSelection.transferOption} onTransferUpdate={updatedTransfer => {
                          updateSightseeingPricing(String(sightseeing.id), {
                            transferOption: updatedTransfer
                          }, sightseeing);
                        }} currency={currency} />
                              </div>}

                            {/* Enhanced Price Summary */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <DollarSign className="h-3 w-3 text-white" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-green-900 dark:text-green-200">
                                      Total Price
                                    </div>
                                    <div className="text-xs text-green-700 dark:text-green-300">
                                      {pricingSelection.customPax || totalPax} passengers
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {currency.symbol}{calculatedPrice}
                                  </div>
                                  <div className="text-sm text-green-700 dark:text-green-300">
                                    {currency.symbol}{(calculatedPrice / (pricingSelection.customPax || totalPax)).toFixed(2)} per person
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            {/* SIC Pricing Button - Show when SIC is selected */}
                            {pricingSelection.sicSelected && sightseeing.sicPricing && (
                              <Button size="sm" onClick={() => {
                                const sicPrice = sightseeing.sicPricing.adult * query.paxDetails.adults + 
                                               sightseeing.sicPricing.child * query.paxDetails.children;
                                const enhancedActivity = {
                                  ...sightseeing,
                                  selectedOptions: getActivityOptions(String(sightseeing.id)),
                                  pricingSelection: { ...pricingSelection, sicSelected: true },
                                  customizedPrice: Math.round(sicPrice),
                                  calculatedPrice: Math.round(sicPrice),
                                  effectivePax: totalPax,
                                  pricingType: 'SIC'
                                };
                                onAddActivity(enhancedActivity, Math.round(sicPrice));
                              }} className="flex-1 h-8 text-sm bg-blue-600 hover:bg-blue-700 text-white">
                                <Users className="h-3 w-3 mr-1" />
                                Add SIC ({currency.symbol}{Math.round(sightseeing.sicPricing.adult * query.paxDetails.adults + sightseeing.sicPricing.child * query.paxDetails.children)})
                              </Button>
                            )}
                            
                            {/* Regular Add Button - Hide when SIC is selected */}
                            {!pricingSelection.sicSelected && (
                              <Button size="sm" onClick={() => {
                                const enhancedActivity = {
                                  ...sightseeing,
                                  selectedOptions: getActivityOptions(String(sightseeing.id)),
                                  pricingSelection,
                                  customizedPrice: Math.round(currentPrice),
                                  calculatedPrice: Math.round(calculatedPrice),
                                  effectivePax: pricingSelection.customPax || totalPax
                                };
                                onAddActivity(enhancedActivity, Math.round(currentPrice));
                              }} className="flex-1 h-8 text-sm bg-green-600 hover:bg-green-700 text-white">
                                <Plus className="h-3 w-3 mr-1" />
                                Add ({currency.symbol}{Math.round(currentPrice)})
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>;
            })}
            </div>
          </TabsContent>

          {/* Enhanced Transport Routes Tab with Search Functionality */}
          <TabsContent value="transport" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <Car className="h-4 w-4" />
                Transport Routes ({relevantTransportRoutes.length})
              </h3>
              <Badge variant="outline" className="text-xs border-foreground/30 text-foreground">
                {query.destination.country}
              </Badge>
            </div>
            
            {/* Search Input for Transport Routes */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search transport routes..." value={transportSearchQuery} onChange={e => setTransportSearchQuery(e.target.value)} className="pl-10 bg-background border border-border text-foreground" />
              {transportSearchQuery && <Button variant="ghost" size="sm" onClick={() => setTransportSearchQuery('')} className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>}
            </div>
            
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
              {relevantTransportRoutes.length === 0 ? <div className="col-span-full text-center py-8">
                  <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-foreground dark:text-foreground">
                    {transportSearchQuery ? 'No transport routes match your search' : 'No transport routes available'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {transportSearchQuery ? `Try different search terms for "${transportSearchQuery}"` : `Add routes for ${query.destination.country} in Transport Management`}
                  </p>
                </div> : relevantTransportRoutes.map((transport: any) => {
              const routeCode = transport.code || transport.routeCode || transport.id || 'N/A';
              const availableVehicleTypes = transport.transportTypes || [{
                id: '1',
                type: 'Standard',
                price: transport.price || 50,
                seatingCapacity: 4
              }];
              return <Card key={transport.id} className="hover:shadow-md transition-all border border-blue-200 dark:border-blue-800 bg-card dark:bg-card">
                      <CardContent className="p-3">
                        <div className="space-y-3">
                          {/* Compact Route Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Badge variant="secondary" className="text-xs font-mono shrink-0 bg-secondary dark:bg-secondary text-secondary-foreground">
                                {routeCode}
                              </Badge>
                              <div className="flex items-center gap-1 min-w-0 flex-1">
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">
                                  {transport.startLocationFullName || transport.startLocation}
                                </span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">
                                  {transport.endLocationFullName || transport.endLocation}
                                </span>
                              </div>
                            </div>
                            {transport.duration && <Badge variant="outline" className="text-xs border-foreground/30 text-foreground shrink-0">
                                {transport.duration}
                              </Badge>}
                          </div>

                          {/* Vehicle Selection Options */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Vehicle Selection:</Label>
                              <Badge variant="outline" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {totalPax} passengers
                              </Badge>
                            </div>

                            {/* Multi-Vehicle Combinations */}
                            {(() => {
                        const combinations = calculateOptimalVehicleCombination(transport, totalPax);
                        const selectedMulti = getMultiVehicleSelection(transport.id);
                        return <div className="space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground">Smart Combinations (Minimum Vehicles):</div>
                                  {combinations.map((combination, comboIdx) => {
                            const isSelectedCombo = selectedMulti && JSON.stringify(selectedMulti.vehicles) === JSON.stringify(combination.vehicles);
                            return <div key={`combo-${transport.id}-${comboIdx}-${combination.vehicleCount}`} className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelectedCombo ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-border hover:border-green-300 dark:hover:border-green-600'}`} onClick={() => handleMultiVehicleSelection(transport.id, combination)}>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                              <div className={`w-4 h-4 rounded-full border-2 ${isSelectedCombo ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                                                {isSelectedCombo && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="font-medium text-sm">{formatVehicleCombination(combination)}</span>
                                                <span className="text-xs text-muted-foreground">
                                                  Total: {combination.totalCapacity} seats, {combination.vehicleCount} vehicle{combination.vehicleCount > 1 ? 's' : ''}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className="flex items-center gap-2">
                                            <div className="text-right">
                                              <div className="text-sm font-bold text-green-600 dark:text-green-400">
                                                {currency.symbol}{combination.totalPrice}
                                              </div>
                                              <div className="text-xs text-muted-foreground">total</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>;
                          })}
                                </div>;
                      })()}

                            {/* Separator */}
                            <div className="border-t border-border my-3"></div>

                            {/* Manual Capacity Addition */}
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-muted-foreground">Manual Vehicle Selection:</div>
                              <div className="p-3 rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-950/20">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Plus className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Add Custom Combination</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                                    Manual
                                  </Badge>
                                </div>
                                
                                {(() => {
                            const manualSelection = getMultiVehicleSelection(`${transport.id}_manual`);
                            const availableVehicleTypes = transport.transportTypes || [{
                              type: 'Standard',
                              price: transport.price || 50,
                              seatingCapacity: 4
                            }];
                            return <div className="space-y-3">
                                      {availableVehicleTypes.map((vehicleType: any, vIdx: number) => {
                                const currentQuantity = manualSelection?.vehicles.find(v => v.type === vehicleType.type)?.quantity || 0;
                                const vehicleCapacity = vehicleType.seatingCapacity || 4;
                                return <div key={`vehicle-type-${transport.id}-${vehicleType.type}-${vIdx}`} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border">
                                            <div className="flex items-center gap-3">
                                              <span className="text-sm font-medium">{vehicleType.type}</span>
                                              <Badge variant="outline" className="text-xs">
                                                <Users className="h-3 w-3 mr-1" />
                                                {vehicleCapacity} seats
                                              </Badge>
                                              <span className="text-xs text-muted-foreground">
                                                {currency.symbol}{vehicleType.price} each
                                              </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                              <Button size="sm" variant="outline" onClick={() => {
                                      const newQuantity = Math.max(0, currentQuantity - 1);
                                      const updatedVehicles = manualSelection?.vehicles.filter(v => v.type !== vehicleType.type) || [];
                                      if (newQuantity > 0) {
                                        updatedVehicles.push({
                                          type: vehicleType.type,
                                          quantity: newQuantity,
                                          capacity: vehicleCapacity,
                                          price: vehicleType.price
                                        });
                                      }
                                      const totalCapacity = updatedVehicles.reduce((sum, v) => sum + v.capacity * v.quantity, 0);
                                      const totalPrice = updatedVehicles.reduce((sum, v) => sum + v.price * v.quantity, 0);
                                      const vehicleCount = updatedVehicles.reduce((sum, v) => sum + v.quantity, 0);
                                      if (updatedVehicles.length > 0) {
                                        handleMultiVehicleSelection(`${transport.id}_manual`, {
                                          vehicles: updatedVehicles,
                                          totalCapacity,
                                          totalPrice,
                                          vehicleCount
                                        });
                                      } else {
                                        setMultiVehicleSelections(prev => {
                                          const newState = {
                                            ...prev
                                          };
                                          delete newState[`${transport.id}_manual`];
                                          return newState;
                                        });
                                      }
                                    }} className="h-6 w-6 sm:h-7 sm:w-7 p-0">
                                                <X className="h-3 w-3" />
                                              </Button>
                                              
                                              <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-medium">{currentQuantity}</span>
                                              
                                              <Button size="sm" variant="outline" onClick={() => {
                                      const newQuantity = currentQuantity + 1;
                                      const updatedVehicles = manualSelection?.vehicles.filter(v => v.type !== vehicleType.type) || [];
                                      updatedVehicles.push({
                                        type: vehicleType.type,
                                        quantity: newQuantity,
                                        capacity: vehicleCapacity,
                                        price: vehicleType.price
                                      });
                                      const totalCapacity = updatedVehicles.reduce((sum, v) => sum + v.capacity * v.quantity, 0);
                                      const totalPrice = updatedVehicles.reduce((sum, v) => sum + v.price * v.quantity, 0);
                                      const vehicleCount = updatedVehicles.reduce((sum, v) => sum + v.quantity, 0);
                                      handleMultiVehicleSelection(`${transport.id}_manual`, {
                                        vehicles: updatedVehicles,
                                        totalCapacity,
                                        totalPrice,
                                        vehicleCount
                                      });
                                    }} className="h-6 w-6 sm:h-7 sm:w-7 p-0">
                                                <Plus className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>;
                              })}
                                      
                                      {manualSelection && <div className="mt-3 p-2 bg-purple-100 dark:bg-purple-900/20 rounded border border-purple-200">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                                Selected: {formatVehicleCombination(manualSelection)}
                                              </div>
                                              <div className="text-xs text-purple-600 dark:text-purple-400">
                                                Total: {manualSelection.totalCapacity} seats, {manualSelection.vehicleCount} vehicle{manualSelection.vehicleCount > 1 ? 's' : ''}
                                                {manualSelection.totalCapacity >= totalPax ? ' ✓' : ` (${totalPax - manualSelection.totalCapacity} seats short)`}
                                              </div>
                                            </div>
                                            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                              {currency.symbol}{manualSelection.totalPrice}
                                            </div>
                                          </div>
                                        </div>}
                                    </div>;
                          })()}
                              </div>
                            </div>

                            {/* Separator */}
                            <div className="border-t border-border my-3"></div>

                            {/* Single Vehicle Options */}
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-muted-foreground">Single Vehicle Options:</div>
                              {availableVehicleTypes.map((vehicleType: any, idx: number) => {
                          const itemId = `transport_${transport.id}_${vehicleType.type}_${idx}`;
                          const currentPrice = getEditablePrice(itemId, vehicleType.price);
                          const isEditing = editingItem === itemId;
                          const capacity = vehicleType.seatingCapacity || 4;
                          const isSelected = getSelectedVehicleType(transport) === vehicleType.type && !getMultiVehicleSelection(transport.id);
                          const canAccommodateAll = capacity >= totalPax;
                          return <div key={`single-vehicle-${transport.id}-${vehicleType.type}-${idx}`} className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : canAccommodateAll ? 'border-border hover:border-blue-300 dark:hover:border-blue-600' : 'border-red-200 bg-red-50 dark:bg-red-950/10 opacity-60'}`} onClick={() => {
                            if (canAccommodateAll) {
                              handleVehicleTypeChange(transport.id, vehicleType.type);
                              setMultiVehicleSelections(prev => {
                                const newState = {
                                  ...prev
                                };
                                delete newState[transport.id];
                                return newState;
                              });
                            }
                          }}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-4 h-4 rounded-full border-2 ${isSelected ? 'border-blue-500 bg-blue-500' : canAccommodateAll ? 'border-gray-300' : 'border-red-300'}`}>
                                            {isSelected && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                                          </div>
                                          <span className={`font-medium text-sm ${!canAccommodateAll ? 'line-through' : ''}`}>
                                            {vehicleType.type}
                                          </span>
                                        </div>
                                        <Badge variant={canAccommodateAll ? "outline" : "destructive"} className="text-xs">
                                          <Users className="h-3 w-3 mr-1" />
                                          {capacity} seats
                                        </Badge>
                                        {!canAccommodateAll && <Badge variant="destructive" className="text-xs">
                                            Insufficient capacity
                                          </Badge>}
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        {isEditing ? <div className="flex items-center gap-0.5 sm:gap-1">
                                            <Input type="number" value={currentPrice} onChange={e => handlePriceEdit(itemId, Number(e.target.value))} className="w-16 sm:w-20 h-6 sm:h-7 text-xs" onClick={e => e.stopPropagation()} />
                                            <Button size="sm" variant="ghost" onClick={e => {
                                    e.stopPropagation();
                                    confirmEditing();
                                  }} className="h-6 w-6 sm:h-7 sm:w-7 p-0">
                                              <Check className="h-3 w-3 text-green-600" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={e => {
                                    e.stopPropagation();
                                    cancelEditing();
                                  }} className="h-6 w-6 sm:h-7 sm:w-7 p-0">
                                              <X className="h-3 w-3 text-red-600" />
                                            </Button>
                                          </div> : <div className="flex items-center gap-2">
                                            <span className={`text-sm font-bold ${canAccommodateAll ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                              {currency.symbol}{currentPrice}
                                            </span>
                                            {canAccommodateAll && <Button size="sm" variant="ghost" onClick={e => {
                                    e.stopPropagation();
                                    startEditing(itemId, currentPrice);
                                  }} className="h-7 w-7 p-0">
                                                <Edit className="h-3 w-3" />
                                              </Button>}
                                          </div>}
                                      </div>
                                    </div>
                                  </div>;
                        })}
                            </div>
                          </div>

                          {/* Add Transport Button */}
                          <Button size="sm" onClick={() => {
                      // Check for manual selection first
                      const manualSelection = getMultiVehicleSelection(`${transport.id}_manual`);
                      const multiVehicleSelection = getMultiVehicleSelection(transport.id);
                      if (manualSelection) {
                        // Handle manual multi-vehicle selection
                        const enhancedTransport = {
                          ...transport,
                          isMultiVehicle: true,
                          isManualSelection: true,
                          multiVehicleSelection: manualSelection,
                          selectedVehicles: manualSelection.vehicles,
                          totalCapacity: manualSelection.totalCapacity,
                          customizedPrice: manualSelection.totalPrice,
                          vehicleCount: manualSelection.vehicleCount,
                          vehicleSummary: formatVehicleCombination(manualSelection) + ' (Manual)'
                        };
                        onAddTransport(enhancedTransport, manualSelection.totalPrice);
                      } else if (multiVehicleSelection) {
                        // Handle smart multi-vehicle selection
                        const enhancedTransport = {
                          ...transport,
                          isMultiVehicle: true,
                          multiVehicleSelection: multiVehicleSelection,
                          selectedVehicles: multiVehicleSelection.vehicles,
                          totalCapacity: multiVehicleSelection.totalCapacity,
                          customizedPrice: multiVehicleSelection.totalPrice,
                          vehicleCount: multiVehicleSelection.vehicleCount,
                          vehicleSummary: formatVehicleCombination(multiVehicleSelection)
                        };
                        onAddTransport(enhancedTransport, multiVehicleSelection.totalPrice);
                      } else {
                        // Handle single vehicle selection
                        const selectedVehicleType = getSelectedVehicleType(transport);
                        const selectedVehicleData = availableVehicleTypes.find((vt: any) => vt.type === selectedVehicleType) || availableVehicleTypes[0];
                        const itemId = `transport_${transport.id}_${selectedVehicleData.type}_0`;
                        const price = getEditablePrice(itemId, selectedVehicleData.price);
                        const enhancedTransport = {
                          ...transport,
                          isMultiVehicle: false,
                          selectedVehicleType,
                          vehicleType: selectedVehicleType,
                          customizedPrice: price
                        };
                        onAddTransport(enhancedTransport, price);
                      }
                    }} className="w-full" disabled={(() => {
                      const manualSelection = getMultiVehicleSelection(`${transport.id}_manual`);
                      const multiVehicleSelection = getMultiVehicleSelection(transport.id);
                      const selectedVehicleType = getSelectedVehicleType(transport);
                      if (manualSelection) return false; // Manual selection is always valid
                      if (multiVehicleSelection) return false; // Smart multi-vehicle selection is valid

                      // Check if single vehicle can accommodate all passengers
                      const capacity = getVehicleTypeCapacity(transport, selectedVehicleType);
                      return capacity < totalPax;
                    })()}>
                            <Plus className="h-3 w-3 mr-2" />
                            {(() => {
                        const manualSelection = getMultiVehicleSelection(`${transport.id}_manual`);
                        const multiVehicleSelection = getMultiVehicleSelection(transport.id);
                        if (manualSelection) {
                          return `Add Manual Selection (${currency.symbol}${manualSelection.totalPrice})`;
                        } else if (multiVehicleSelection) {
                          return `Add Multi-Vehicle (${currency.symbol}${multiVehicleSelection.totalPrice})`;
                        } else {
                          const selectedVehicleType = getSelectedVehicleType(transport);
                          const price = getEditablePrice(`transport_${transport.id}_${selectedVehicleType}_0`, getVehicleTypePrice(transport, selectedVehicleType));
                          const capacity = getVehicleTypeCapacity(transport, selectedVehicleType);
                          if (capacity < totalPax) {
                            return `Insufficient Capacity (${capacity}/${totalPax} seats)`;
                          }
                          return `Add Transport (${currency.symbol}${price})`;
                        }
                      })()}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>;
            })}
            </div>
          </TabsContent>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                Restaurant Recommendations ({mockRestaurants.length})
              </h3>
              <Badge variant="outline" className="text-xs border-foreground/30 text-foreground">
                {dayCity || 'Local'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
              {mockRestaurants.map(restaurant => {
              const itemId = `restaurant_${restaurant.id}`;
              const currentPrice = getEditablePrice(itemId, restaurant.avgPrice);
              const isEditing = editingItem === itemId;
              return <Card key={restaurant.id} className="hover:shadow-md transition-all border border-orange-200 dark:border-orange-800 bg-card dark:bg-card">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-semibold text-orange-900 dark:text-orange-100">{restaurant.name}</h5>
                            <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:text-orange-300">
                              {restaurant.priceRange}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-orange-700 dark:text-orange-300">
                            <span>{restaurant.cuisine}</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{restaurant.rating}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isEditing ? <div className="flex items-center gap-1">
                              <Input type="number" value={currentPrice} onChange={e => handlePriceEdit(itemId, Number(e.target.value))} className="w-20 h-7 text-xs" />
                              <Button size="sm" variant="ghost" onClick={confirmEditing} className="h-7 w-7 p-0">
                                <Check className="h-3 w-3 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-7 w-7 p-0">
                                <X className="h-3 w-3 text-red-600" />
                              </Button>
                            </div> : <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                  {currency.symbol}{currentPrice}
                                </div>
                                <div className="text-xs text-muted-foreground">per person</div>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => startEditing(itemId, currentPrice)} className="h-7 w-7 p-0">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>}
                          
                          <Button size="sm" onClick={() => {
                        const enhancedRestaurant = {
                          ...restaurant,
                          customizedPrice: currentPrice
                        };
                        onAddActivity(enhancedRestaurant, currentPrice * totalPax);
                      }} className="ml-2">
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>;
            })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>;
};