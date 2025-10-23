import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Info, 
  MapPin, 
  Clock, 
  Users, 
  Car, 
  Utensils, 
  Star, 
  Calendar,
  Navigation,
  DollarSign,
  CheckCircle,
  X,
  Plus,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Database,
  AlertCircle
} from "lucide-react";
import { getCurrencyByCountry } from '@/utils/currencyUtils';
import { useEnhancedSightseeing } from './hooks/useEnhancedSightseeing';

interface SightseeingDetailsPopoverProps {
  sightseeing: any;
  query: any;
  onAddActivity: (activity: any, price: number) => void;
}

interface DetailedPricingSelection {
  pricingType: 'standard' | 'option' | 'package';
  selectedPricingOption?: string;
  selectedPackageOption?: string;
  transportOption: {
    included: boolean;
    type: string;
    priceUnit: 'per-vehicle' | 'per-person';
    price: number;
  };
  lunchOption: {
    included: boolean;
    price: number;
  };
  customPax: number;
  pickupLocation: string;
  dropoffLocation: string;
}

export const SightseeingDetailsPopover: React.FC<SightseeingDetailsPopoverProps> = ({
  sightseeing,
  query,
  onAddActivity
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isTransportOpen, setIsTransportOpen] = useState(false);
  const [isLunchOpen, setIsLunchOpen] = useState(false);
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);
  const [useRealTimeData, setUseRealTimeData] = useState(true);
  
  // Enhanced sightseeing data from management system
  const { 
    enhancedData, 
    loading: enhancedLoading, 
    error: enhancedError,
    refreshData,
    getRealPricingOptions,
    getRecommendations,
    getMatchingActivities,
    isAvailable,
    getCacheStatus
  } = useEnhancedSightseeing({ sightseeing, query });
  
  const [pricing, setPricing] = useState<DetailedPricingSelection>({
    pricingType: 'standard',
    transportOption: {
      included: false,
      type: 'private-car',
      priceUnit: 'per-vehicle',
      price: 0
    },
    lunchOption: {
      included: false,
      price: 0
    },
    customPax: query.paxDetails.adults + query.paxDetails.children,
    pickupLocation: '',
    dropoffLocation: ''
  });

  const currency = getCurrencyByCountry(query.destination.country);
  const totalPax = query.paxDetails.adults + query.paxDetails.children;

  // Get current sightseeing data (enhanced or fallback to original)
  const getCurrentSightseeing = () => {
    if (useRealTimeData && enhancedData?.matchingActivities?.length > 0) {
      return enhancedData.matchingActivities[0];
    }
    return sightseeing;
  };

  // Get enhanced transport options
  const getAvailableTransportOptions = () => {
    const currentSightseeing = getCurrentSightseeing();
    const baseOptions = [
      { value: 'private-car', label: 'Private Car', basePrice: 150 },
      { value: 'private-van', label: 'Private Van', basePrice: 200 },
      { value: 'sic-transfer', label: 'SIC Transfer', basePrice: 75 },
      { value: 'walking', label: 'Walking Tour', basePrice: 0 },
      { value: 'none', label: 'No Transport', basePrice: 0 }
    ];

    // Use real transfer options if available
    if (useRealTimeData && currentSightseeing.transferOptions && currentSightseeing.transferOptions.length > 0) {
      return currentSightseeing.transferOptions
        .filter((option: any) => option.isEnabled)
        .map((option: any) => ({
          value: option.vehicleType.toLowerCase().replace(/\s+/g, '-'),
          label: option.vehicleType,
          basePrice: option.price || 0,
          capacity: option.capacity,
          priceUnit: option.priceUnit,
          realTimeData: true
        }));
    }

    // Fallback to base options with filtering
    if (currentSightseeing.transferTypes && currentSightseeing.transferTypes.length > 0) {
      return baseOptions.filter(option => 
        currentSightseeing.transferTypes.some((type: string) => 
          type.toLowerCase().includes(option.value.replace('-', ''))
        )
      );
    }

    return baseOptions;
  };

  const calculateTotalPrice = () => {
    let basePrice = 0;
    let transportPrice = 0;
    let lunchPrice = 0;
    
    const currentSightseeing = getCurrentSightseeing();

    // Calculate base activity price with enhanced data
    if (pricing.pricingType === 'standard') {
      if (useRealTimeData && enhancedData?.enrichedPricingOptions?.length > 0) {
        // Use enhanced pricing from real data
        const standardPricing = enhancedData.enrichedPricingOptions.find((p: any) => 
          p.type === 'Standard Rate' || p.id === 'standard'
        ) || enhancedData.enrichedPricingOptions[0];
        
        if (standardPricing.totalPrice) {
          basePrice = standardPricing.totalPrice;
        } else {
          const adultPrice = standardPricing.adultPrice || 0;
          const childPrice = standardPricing.childPrice || adultPrice;
          basePrice = (adultPrice * query.paxDetails.adults) + (childPrice * query.paxDetails.children);
        }
      } else {
        // Fallback to original logic
        if (currentSightseeing.pricingOptions && currentSightseeing.pricingOptions.length > 0) {
          const standardPricing = currentSightseeing.pricingOptions.find((p: any) => p.isEnabled) || currentSightseeing.pricingOptions[0];
          const adultPrice = standardPricing.adultPrice || 0;
          const childPrice = standardPricing.childPrice || adultPrice;
          basePrice = (adultPrice * query.paxDetails.adults) + (childPrice * query.paxDetails.children);
        } else if (currentSightseeing.price) {
          if (typeof currentSightseeing.price === 'object') {
            const adultPrice = currentSightseeing.price.adult || 0;
            const childPrice = currentSightseeing.price.child || adultPrice;
            basePrice = (adultPrice * query.paxDetails.adults) + (childPrice * query.paxDetails.children);
          } else {
            basePrice = currentSightseeing.price * pricing.customPax;
          }
        }
      }
    } else if (pricing.pricingType === 'option' && pricing.selectedPricingOption) {
      // Use enhanced or fallback pricing options
      const pricingOptions = useRealTimeData && enhancedData?.enrichedPricingOptions?.length > 0 
        ? enhancedData.enrichedPricingOptions 
        : currentSightseeing.pricingOptions;
        
      const selectedOption = pricingOptions?.find((p: any) => p.id === pricing.selectedPricingOption);
      if (selectedOption) {
        if (selectedOption.totalPrice) {
          basePrice = selectedOption.totalPrice;
        } else {
          const adultPrice = selectedOption.adultPrice || 0;
          const childPrice = selectedOption.childPrice || adultPrice;
          basePrice = (adultPrice * query.paxDetails.adults) + (childPrice * query.paxDetails.children);
        }
      }
    } else if (pricing.pricingType === 'package' && pricing.selectedPackageOption) {
      const selectedPackage = sightseeing.packageOptions?.find((p: any) => p.id === pricing.selectedPackageOption);
      if (selectedPackage) {
        if (selectedPackage.totalPrice) {
          basePrice = selectedPackage.totalPrice;
        } else if (selectedPackage.pricePerPerson) {
          basePrice = selectedPackage.pricePerPerson * pricing.customPax;
        } else if (selectedPackage.adultPrice !== undefined) {
          const adultPrice = selectedPackage.adultPrice || 0;
          const childPrice = selectedPackage.childPrice || adultPrice;
          basePrice = (adultPrice * query.paxDetails.adults) + (childPrice * query.paxDetails.children);
        }
      }
    }

    // Calculate transport price
    if (pricing.transportOption.included) {
      if (pricing.transportOption.priceUnit === 'per-vehicle') {
        transportPrice = pricing.transportOption.price;
      } else {
        transportPrice = pricing.transportOption.price * pricing.customPax;
      }
    }

    // Calculate lunch price
    if (pricing.lunchOption.included) {
      lunchPrice = pricing.lunchOption.price * pricing.customPax;
    }

    return basePrice + transportPrice + lunchPrice;
  };

  const updatePricing = (updates: Partial<DetailedPricingSelection>) => {
    setPricing(prev => ({ ...prev, ...updates }));
  };

  const handleAddToItinerary = () => {
    const totalPrice = calculateTotalPrice();
    const enhancedActivity = {
      ...sightseeing,
      selectedPricing: pricing,
      customizedPrice: totalPrice,
      effectivePax: pricing.customPax,
      transportIncluded: pricing.transportOption.included,
      lunchIncluded: pricing.lunchOption.included,
      pickupLocation: pricing.pickupLocation,
      dropoffLocation: pricing.dropoffLocation
    };
    
    onAddActivity(enhancedActivity, totalPrice);
    setIsOpen(false);
  };

  // Helper function to get selected package name
  const getSelectedPackageName = () => {
    if (pricing.pricingType === 'package' && pricing.selectedPackageOption) {
      const selectedPackage = sightseeing.packageOptions?.find((p: any) => p.id === pricing.selectedPackageOption);
      return selectedPackage?.name || 'Selected Package';
    }
    return null;
  };

  // Helper function to get package price display
  const getPackagePriceDisplay = (pkg: any) => {
    if (pkg.totalPrice) {
      return `${currency.symbol}${pkg.totalPrice}`;
    } else if (pkg.pricePerPerson) {
      return `${currency.symbol}${pkg.pricePerPerson}/person`;
    } else if (pkg.adultPrice !== undefined) {
      return `A:${currency.symbol}${pkg.adultPrice} | C:${currency.symbol}${pkg.childPrice || pkg.adultPrice}`;
    }
    return 'Price TBD';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20"
        >
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[420px] p-0 bg-background dark:bg-background border border-border z-50" 
        side="right"
        align="start"
      >
        <div className="relative">
          {/* Compact Header */}
          <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm text-blue-900 dark:text-blue-100 line-clamp-2 mb-1">
                  {sightseeing.name}
                </CardTitle>
                <div className="flex items-center gap-1 flex-wrap">
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:text-blue-300 px-1 py-0">
                    {sightseeing.city}
                  </Badge>
                  {sightseeing.category && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {sightseeing.category}
                    </Badge>
                  )}
                  {sightseeing.duration && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1 px-1 py-0">
                      <Clock className="h-2 w-2" />
                      {sightseeing.duration}
                    </Badge>
                  )}
                  {/* Show selected package name in header */}
                  {getSelectedPackageName() && (
                    <Badge variant="default" className="text-xs bg-purple-600 text-white px-1 py-0">
                      📦 {getSelectedPackageName()}
                    </Badge>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0 ml-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>

          <ScrollArea className="h-[380px]">
            <CardContent className="p-3 space-y-3">
              {/* Real-time Data Status */}
              {enhancedData && (
                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Database className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                      Real-time Data {enhancedLoading ? 'Loading...' : 'Active'}
                    </span>
                    {enhancedData.matchingActivities?.length > 0 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {enhancedData.matchingActivities.length} match{enhancedData.matchingActivities.length > 1 ? 'es' : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUseRealTimeData(!useRealTimeData)}
                      className="h-5 px-2 text-xs"
                    >
                      {useRealTimeData ? 'Use Original' : 'Use Real Data'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={refreshData}
                      className="h-5 w-5 p-0"
                      disabled={enhancedLoading}
                    >
                      <RefreshCw className={`h-3 w-3 ${enhancedLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Error State */}
              {enhancedError && (
                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-3 w-3 text-red-600" />
                  <span className="text-xs text-red-800 dark:text-red-200">{enhancedError}</span>
                </div>
              )}

              {/* Description - Compact */}
              {getCurrentSightseeing().description && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground line-clamp-2">{getCurrentSightseeing().description}</p>
                </div>
              )}

              {/* Key Details - Compact Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    PAX
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={pricing.customPax}
                    onChange={(e) => updatePricing({ customPax: parseInt(e.target.value) || totalPax })}
                    className="h-6 text-xs"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Total Price
                    {useRealTimeData && enhancedData?.matchingActivities?.length > 0 && (
                      <Badge variant="outline" className="text-xs px-1 py-0 ml-1">Live</Badge>
                    )}
                  </Label>
                  <div className="h-6 px-2 py-1 bg-green-50 dark:bg-green-950/20 rounded-md flex items-center text-xs font-bold text-green-600 dark:text-green-400">
                    {currency.symbol}{calculateTotalPrice()}
                  </div>
                </div>
              </div>

              <Separator className="my-1" />

              {/* Collapsible Pricing Section */}
              <Collapsible open={isPricingOpen} onOpenChange={setIsPricingOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between h-6 px-2 py-1">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-medium">Pricing Options</span>
                    </div>
                    {isPricingOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-2 pt-1">
                  <RadioGroup
                    value={pricing.pricingType}
                    onValueChange={(value: 'standard' | 'option' | 'package') => 
                      updatePricing({ pricingType: value })
                    }
                    className="flex flex-row gap-3"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="standard" id="standard" className="h-3 w-3" />
                      <Label htmlFor="standard" className="text-xs">Standard</Label>
                    </div>
                    {sightseeing.pricingOptions && sightseeing.pricingOptions.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="option" id="option" className="h-3 w-3" />
                        <Label htmlFor="option" className="text-xs">Options</Label>
                      </div>
                    )}
                    {sightseeing.packageOptions && sightseeing.packageOptions.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="package" id="package" className="h-3 w-3" />
                        <Label htmlFor="package" className="text-xs">Packages</Label>
                      </div>
                    )}
                  </RadioGroup>

                  {/* Pricing Options Dropdown - Enhanced with Real Data */}
                  {pricing.pricingType === 'option' && (
                    <Select
                      value={pricing.selectedPricingOption || ''}
                      onValueChange={(value) => updatePricing({ selectedPricingOption: value })}
                    >
                      <SelectTrigger className="h-6 text-xs bg-background">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border z-50">
                        {(useRealTimeData && enhancedData?.enrichedPricingOptions?.length > 0 
                          ? enhancedData.enrichedPricingOptions 
                          : getCurrentSightseeing().pricingOptions || []
                        )
                          .filter((option: any) => option.isEnabled !== false)
                          .map((option: any) => (
                            <SelectItem key={option.id} value={option.id}>
                              <div className="flex justify-between items-center w-full text-xs">
                                <span className="font-medium">
                                  {option.name || option.type}
                                  {option.realTimeData && <span className="ml-1 text-blue-600">●</span>}
                                </span>
                                <span className="ml-2 text-muted-foreground">
                                  {option.totalPrice ? `${currency.symbol}${option.totalPrice}` : `A:${currency.symbol}${option.adultPrice}`}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Package Options Dropdown - Enhanced with Real Data */}
                  {pricing.pricingType === 'package' && (
                    <div className="space-y-2">
                      <Select
                        value={pricing.selectedPackageOption || ''}
                        onValueChange={(value) => updatePricing({ selectedPackageOption: value })}
                      >
                        <SelectTrigger className="h-6 text-xs bg-background">
                          <SelectValue placeholder="Select package" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border z-50">
                          {(useRealTimeData && enhancedData?.enrichedPricingOptions?.filter((opt: any) => opt.type === 'package').length > 0
                            ? enhancedData.enrichedPricingOptions.filter((opt: any) => opt.type === 'package')
                            : getCurrentSightseeing().packageOptions || []
                          ).map((pkg: any) => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              <div className="flex flex-col items-start w-full text-xs">
                                <div className="flex justify-between items-center w-full">
                                  <span className="font-semibold text-purple-700 dark:text-purple-300">
                                    📦 {pkg.name || `Package ${pkg.id}`}
                                    {pkg.realTimeData && <span className="ml-1 text-blue-600">●</span>}
                                  </span>
                                  <span className="ml-2 text-muted-foreground font-medium">
                                    {getPackagePriceDisplay(pkg)}
                                  </span>
                                </div>
                                {pkg.description && (
                                  <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                    {pkg.description}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Show selected package details */}
                      {pricing.selectedPackageOption && (
                        <div className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded-md border border-purple-200 dark:border-purple-800">
                          <div className="text-xs space-y-1">
                            <div className="font-medium text-purple-800 dark:text-purple-200">
                              Selected: {getSelectedPackageName()}
                            </div>
                            {(() => {
                              const selectedPackage = sightseeing.packageOptions?.find((p: any) => p.id === pricing.selectedPackageOption);
                              return selectedPackage?.description && (
                                <div className="text-muted-foreground">
                                  {selectedPackage.description}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Collapsible Transport Section */}
              <Collapsible open={isTransportOpen} onOpenChange={setIsTransportOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between h-6 px-2 py-1">
                    <div className="flex items-center gap-1">
                      <Car className="h-3 w-3 text-purple-600" />
                      <span className="text-xs font-medium">Transport</span>
                      {pricing.transportOption.included && (
                        <Badge variant="secondary" className="text-xs px-1 py-0 ml-1">Included</Badge>
                      )}
                    </div>
                    {isTransportOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-2 pt-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-transport"
                      checked={pricing.transportOption.included}
                      onChange={(e) => updatePricing({
                        transportOption: {
                          ...pricing.transportOption,
                          included: e.target.checked
                        }
                      })}
                      className="rounded border-border h-3 w-3"
                    />
                    <Label htmlFor="include-transport" className="text-xs">Include Transport</Label>
                  </div>

                  {pricing.transportOption.included && (
                    <div className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded-md space-y-2">
                      {/* Enhanced Transport Type Selection */}
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={pricing.transportOption.type}
                          onValueChange={(value) => {
                            const selectedOption = getAvailableTransportOptions().find(opt => opt.value === value);
                            updatePricing({
                              transportOption: {
                                ...pricing.transportOption,
                                type: value,
                                price: selectedOption?.basePrice || 0,
                                priceUnit: selectedOption?.priceUnit || pricing.transportOption.priceUnit
                              }
                            });
                          }}
                        >
                          <SelectTrigger className="h-6 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background border border-border z-50">
                            {getAvailableTransportOptions().map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex justify-between items-center w-full text-xs">
                                  <span className="font-medium">
                                    {option.label}
                                    {option.realTimeData && <span className="ml-1 text-blue-600">●</span>}
                                  </span>
                                  {option.capacity && (
                                    <span className="ml-2 text-muted-foreground text-xs">
                                      {option.capacity} pax
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={pricing.transportOption.price}
                          onChange={(e) => updatePricing({
                            transportOption: {
                              ...pricing.transportOption,
                              price: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="h-6 text-xs bg-background"
                          placeholder="Price"
                        />
                      </div>

                      {/* Enhanced Pricing Unit Selection */}
                      <RadioGroup
                        value={pricing.transportOption.priceUnit}
                        onValueChange={(value: 'per-vehicle' | 'per-person') => 
                          updatePricing({
                            transportOption: {
                              ...pricing.transportOption,
                              priceUnit: value
                            }
                          })
                        }
                        className="flex flex-row gap-3"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="per-person" id="pp" className="h-3 w-3" />
                          <Label htmlFor="pp" className="text-xs">Per Person</Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="per-vehicle" id="pv" className="h-3 w-3" />
                          <Label htmlFor="pv" className="text-xs">Per Vehicle</Label>
                        </div>
                      </RadioGroup>

                      {/* Transport Details from Real Data */}
                      {useRealTimeData && (() => {
                        const currentSightseeing = getCurrentSightseeing();
                        const realTransportOptions = currentSightseeing.transferOptions?.filter((opt: any) => opt.isEnabled) || [];
                        const selectedTransport = realTransportOptions.find((opt: any) => 
                          opt.vehicleType.toLowerCase().replace(/\s+/g, '-') === pricing.transportOption.type
                        );

                        return selectedTransport && (
                          <div className="space-y-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                            <div className="text-xs font-medium text-purple-800 dark:text-purple-200">
                              Transport Details (Live Data)
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="font-medium text-purple-700 dark:text-purple-300">Vehicle:</span>
                                <div className="text-muted-foreground">{selectedTransport.vehicleType}</div>
                              </div>
                              <div>
                                <span className="font-medium text-purple-700 dark:text-purple-300">Capacity:</span>
                                <div className="text-muted-foreground">{selectedTransport.capacity || 'Not specified'}</div>
                              </div>
                              <div>
                                <span className="font-medium text-purple-700 dark:text-purple-300">Price Unit:</span>
                                <div className="text-muted-foreground">{selectedTransport.priceUnit}</div>
                              </div>
                              <div>
                                <span className="font-medium text-purple-700 dark:text-purple-300">Base Price:</span>
                                <div className="text-muted-foreground">{currency.symbol}{selectedTransport.price}</div>
                              </div>
                            </div>

                            {/* Transport Features */}
                            {selectedTransport.type && (
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Type:</span>
                                <Badge variant="outline" className="text-xs">
                                  {selectedTransport.type}
                                </Badge>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Transport Features Section */}
                      {(() => {
                        const transportOption = getAvailableTransportOptions().find(opt => opt.value === pricing.transportOption.type);
                        if (!transportOption || !transportOption.realTimeData) return null;

                        return (
                          <div className="space-y-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                            <div className="text-xs font-medium text-purple-800 dark:text-purple-200">
                              Features & Amenities
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {['Air conditioning', 'Professional driver', 'Door-to-door service'].map((feature, index) => (
                                <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Transport Cost Breakdown */}
                      <div className="space-y-1 pt-2 border-t border-purple-200 dark:border-purple-700">
                        <div className="text-xs font-medium text-purple-800 dark:text-purple-200">
                          Cost Calculation
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Base Price:</span>
                            <span>{currency.symbol}{pricing.transportOption.price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Unit:</span>
                            <span>{pricing.transportOption.priceUnit}</span>
                          </div>
                          {pricing.transportOption.priceUnit === 'per-person' && (
                            <div className="flex justify-between">
                              <span>Total PAX:</span>
                              <span>{pricing.customPax}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold border-t border-purple-300 dark:border-purple-700 pt-1">
                            <span>Total Transport:</span>
                            <span>
                              {currency.symbol}
                              {pricing.transportOption.priceUnit === 'per-person' 
                                ? pricing.transportOption.price * pricing.customPax
                                : pricing.transportOption.price
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Collapsible Lunch Section */}
              <Collapsible open={isLunchOpen} onOpenChange={setIsLunchOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between h-6 px-2 py-1">
                    <div className="flex items-center gap-1">
                      <Utensils className="h-3 w-3 text-orange-600" />
                      <span className="text-xs font-medium">Lunch</span>
                      {pricing.lunchOption.included && (
                        <Badge variant="secondary" className="text-xs px-1 py-0 ml-1">Included</Badge>
                      )}
                    </div>
                    {isLunchOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-2 pt-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-lunch"
                      checked={pricing.lunchOption.included}
                      onChange={(e) => updatePricing({
                        lunchOption: {
                          ...pricing.lunchOption,
                          included: e.target.checked
                        }
                      })}
                      className="rounded border-border h-3 w-3"
                    />
                    <Label htmlFor="include-lunch" className="text-xs">Include Lunch</Label>
                  </div>

                  {pricing.lunchOption.included && (
                    <div className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded-md">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={pricing.lunchOption.price}
                        onChange={(e) => updatePricing({
                          lunchOption: {
                            ...pricing.lunchOption,
                            price: parseFloat(e.target.value) || 0
                          }
                        })}
                        className="h-6 text-xs bg-background"
                        placeholder="Price per person"
                      />
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Recommendations Section */}
              {getRecommendations().length > 0 && (
                <Collapsible open={isRecommendationsOpen} onOpenChange={setIsRecommendationsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between h-6 px-2 py-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-600" />
                        <span className="text-xs font-medium">Recommendations</span>
                        <Badge variant="secondary" className="text-xs px-1 py-0 ml-1">
                          {getRecommendations().length}
                        </Badge>
                      </div>
                      {isRecommendationsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-1 pt-1">
                    {getRecommendations().slice(0, 3).map((rec: any, index: number) => (
                      <div key={rec.id} className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-md border border-yellow-200 dark:border-yellow-800 text-xs">
                        <div className="font-medium text-yellow-800 dark:text-yellow-200">{rec.name}</div>
                        <div className="text-yellow-600 dark:text-yellow-400">{rec.city} • {rec.category}</div>
                        {rec.price && (
                          <div className="text-yellow-700 dark:text-yellow-300">
                            From {currency.symbol}{rec.price.adult}/adult
                          </div>
                        )}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Compact Location Section */}
              <div className="space-y-1">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Navigation className="h-3 w-3 text-indigo-600" />
                  Locations
                </Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Pickup"
                    value={pricing.pickupLocation}
                    onChange={(e) => updatePricing({ pickupLocation: e.target.value })}
                    className="h-6 text-xs bg-background"
                  />
                  <Input
                    placeholder="Drop-off"
                    value={pricing.dropoffLocation}
                    onChange={(e) => updatePricing({ dropoffLocation: e.target.value })}
                    className="h-6 text-xs bg-background"
                  />
                </div>
              </div>

              {/* Ultra Compact Price Summary */}
              <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-green-800 dark:text-green-200">Total:</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">{currency.symbol}{calculateTotalPrice()}</span>
                </div>
                {/* Show package name in price summary */}
                {getSelectedPackageName() && (
                  <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Including: {getSelectedPackageName()}
                  </div>
                )}
              </div>

              {/* Compact Action Button */}
              <Button 
                onClick={handleAddToItinerary}
                className="w-full h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add to Itinerary ({currency.symbol}{calculateTotalPrice()})
              </Button>
            </CardContent>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};
