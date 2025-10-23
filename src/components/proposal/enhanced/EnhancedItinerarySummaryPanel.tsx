
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Query } from '@/types/query';
import { PricingService } from '@/services/pricingService';
import ProposalService from '@/services/proposalService';
import { formatCurrency } from '@/lib/formatters';
import { getCurrencySymbolByCountry } from '@/pages/inventory/transport/utils/currencyUtils';
import {
  TransportRouteItem,
  SightseeingPackageItem,
  HotelOptionItem,
  ChildPricingConfig,
  MarkupConfig,
  PricingBreakdown
} from '@/types/enhancedSummary';
import {
  Car, MapPin, Clock, Users, DollarSign, Calculator,
  Hotel, Camera, Route, Settings, Save, FileText,
  ChevronDown, ChevronRight, Edit2, Check, X
} from 'lucide-react';

interface EnhancedItinerarySummaryPanelProps {
  query: Query;
  selectedModules: any[];
  onSaveProposal?: (proposalData: any) => void;
  className?: string;
}

const EnhancedItinerarySummaryPanel: React.FC<EnhancedItinerarySummaryPanelProps> = ({
  query,
  selectedModules,
  onSaveProposal,
  className
}) => {
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [transportRoutes, setTransportRoutes] = useState<TransportRouteItem[]>([]);
  const [sightseeingPackages, setSightseeingPackages] = useState<SightseeingPackageItem[]>([]);
  const [hotelOptions, setHotelOptions] = useState<HotelOptionItem[]>([]);
  const [childPricingConfig, setChildPricingConfig] = useState<ChildPricingConfig>({
    equalCostMode: false,
    childDiscountPercentage: 25,
    infantDiscountPercentage: 90
  });
  const [markupConfig, setMarkupConfig] = useState<MarkupConfig>({
    type: 'percentage',
    value: 7,
    applyTo: 'total',
    currency: 'THB',
    isEditable: true
  });
  const [editingMarkup, setEditingMarkup] = useState(false);
  const [tempMarkupValue, setTempMarkupValue] = useState(7);

  const country = query.destination.country;
  const currencySymbol = getCurrencySymbolByCountry(country);
  const totalPax = query.paxDetails.adults + query.paxDetails.children + query.paxDetails.infants;

  // Load initial data and settings
  useEffect(() => {
    loadPricingSettings();
    extractModuleData();
  }, [selectedModules, query]);

  const loadPricingSettings = () => {
    const settings = PricingService.getSettings();
    const countryBasedMarkup = getCountryMarkup(country);
    
    setMarkupConfig(prev => ({
      ...prev,
      value: countryBasedMarkup.value,
      type: countryBasedMarkup.type,
      currency: countryBasedMarkup.currency
    }));
  };

  const getCountryMarkup = (country: string) => {
    // Default markup based on country
    const countryDefaults: { [key: string]: any } = {
      'Thailand': { value: 7, type: 'percentage', currency: 'THB' },
      'India': { value: 8, type: 'percentage', currency: 'INR' },
      'Dubai': { value: 10, type: 'percentage', currency: 'AED' },
      'Singapore': { value: 12, type: 'percentage', currency: 'SGD' }
    };
    
    return countryDefaults[country] || { value: 7, type: 'percentage', currency: 'USD' };
  };

  const extractModuleData = () => {
    const routes: TransportRouteItem[] = [];
    const sightseeing: SightseeingPackageItem[] = [];
    const hotels: HotelOptionItem[] = [
      { optionNumber: 1, hotels: [], totalCost: 0, isSelected: false },
      { optionNumber: 2, hotels: [], totalCost: 0, isSelected: false },
      { optionNumber: 3, hotels: [], totalCost: 0, isSelected: false }
    ];

    selectedModules.forEach(module => {
      if (module.type === 'transport') {
        routes.push({
          id: module.id,
          from: module.data.from || 'Unknown',
          to: module.data.to || 'Unknown',
          vehicleType: module.data.vehicleType || 'Car',
          duration: module.data.duration || '1 hour',
          distance: module.data.distance || 0,
          basePrice: module.pricing.basePrice || 0,
          finalPrice: module.pricing.finalPrice || 0,
          currency: module.pricing.currency || 'THB',
          paxCount: totalPax,
          routeDetails: {
            pickup: module.data.pickup || module.data.from,
            dropoff: module.data.dropoff || module.data.to,
            stops: module.data.stops || []
          }
        });
      } else if (module.type === 'sightseeing') {
        sightseeing.push({
          id: module.id,
          name: module.data.name || 'Sightseeing Activity',
          location: module.data.location || 'Unknown',
          duration: module.data.duration || '2 hours',
          basePrice: module.pricing.basePrice || 0,
          finalPrice: module.pricing.finalPrice || 0,
          currency: module.pricing.currency || 'THB',
          includesTransport: module.data.includesTransport || false,
          transportCost: module.data.transportCost || 0,
          entryFees: module.data.entryFees || 0,
          guideCost: module.data.guideCost || 0,
          addOns: module.data.addOns || []
        });
      } else if (module.type === 'hotel') {
        const optionIndex = (module.data.optionNumber || 1) - 1;
        if (hotels[optionIndex]) {
          hotels[optionIndex].hotels.push({
            id: module.id,
            name: module.data.name || 'Hotel',
            location: module.data.location || 'Unknown',
            checkIn: module.data.checkIn || query.travelDates.from,
            checkOut: module.data.checkOut || query.travelDates.to,
            nights: module.data.nights || 1,
            roomType: module.data.roomType || 'Standard',
            roomCount: module.data.roomCount || 1,
            basePrice: module.pricing.basePrice || 0,
            finalPrice: module.pricing.finalPrice || 0,
            currency: module.pricing.currency || 'THB'
          });
          hotels[optionIndex].totalCost += module.pricing.finalPrice || 0;
          hotels[optionIndex].isSelected = true;
        }
      }
    });

    setTransportRoutes(routes);
    setSightseeingPackages(sightseeing);
    setHotelOptions(hotels);
  };

  const pricingBreakdown = useMemo((): PricingBreakdown => {
    const landPackageSubtotal = transportRoutes.reduce((sum, route) => sum + route.finalPrice, 0);
    const sightseeingSubtotal = sightseeingPackages.reduce((sum, pkg) => sum + pkg.finalPrice, 0);
    const hotelSubtotal = hotelOptions.reduce((sum, option) => sum + (option.isSelected ? option.totalCost : 0), 0);
    
    const baseTotal = landPackageSubtotal + sightseeingSubtotal + hotelSubtotal;
    
    let markupAmount = 0;
    if (markupConfig.applyTo === 'per-person') {
      const costPerPerson = baseTotal / totalPax;
      if (markupConfig.type === 'percentage') {
        markupAmount = (costPerPerson * markupConfig.value / 100) * totalPax;
      } else {
        markupAmount = markupConfig.value * totalPax;
      }
    } else {
      if (markupConfig.type === 'percentage') {
        markupAmount = baseTotal * markupConfig.value / 100;
      } else {
        markupAmount = markupConfig.value;
      }
    }

    const finalTotal = baseTotal + markupAmount;

    // Calculate per-person breakdown
    let adultsTotal = 0, childrenTotal = 0, infantsTotal = 0;
    
    if (childPricingConfig.equalCostMode) {
      const costPerPerson = finalTotal / totalPax;
      adultsTotal = costPerPerson * query.paxDetails.adults;
      childrenTotal = costPerPerson * query.paxDetails.children;
      infantsTotal = costPerPerson * query.paxDetails.infants;
    } else {
      const adultCost = finalTotal / (
        query.paxDetails.adults + 
        query.paxDetails.children * (1 - childPricingConfig.childDiscountPercentage / 100) +
        query.paxDetails.infants * (1 - childPricingConfig.infantDiscountPercentage / 100)
      );
      
      adultsTotal = adultCost * query.paxDetails.adults;
      childrenTotal = adultCost * (1 - childPricingConfig.childDiscountPercentage / 100) * query.paxDetails.children;
      infantsTotal = adultCost * (1 - childPricingConfig.infantDiscountPercentage / 100) * query.paxDetails.infants;
    }

    return {
      landPackageSubtotal,
      sightseeingSubtotal,
      hotelSubtotal,
      baseTotal,
      markupAmount,
      finalTotal,
      currency: markupConfig.currency,
      perPersonBreakdown: {
        adults: {
          count: query.paxDetails.adults,
          costPerPerson: query.paxDetails.adults > 0 ? adultsTotal / query.paxDetails.adults : 0,
          total: adultsTotal
        },
        children: {
          count: query.paxDetails.children,
          costPerPerson: query.paxDetails.children > 0 ? childrenTotal / query.paxDetails.children : 0,
          total: childrenTotal
        },
        infants: {
          count: query.paxDetails.infants,
          costPerPerson: query.paxDetails.infants > 0 ? infantsTotal / query.paxDetails.infants : 0,
          total: infantsTotal
        }
      }
    };
  }, [transportRoutes, sightseeingPackages, hotelOptions, markupConfig, childPricingConfig, query.paxDetails, totalPax]);

  const handleSaveMarkup = () => {
    setMarkupConfig(prev => ({ ...prev, value: tempMarkupValue }));
    setEditingMarkup(false);
    toast({
      title: "Markup Updated",
      description: `Markup set to ${tempMarkupValue}${markupConfig.type === 'percentage' ? '%' : ` ${markupConfig.currency}`}`
    });
  };

  const handleSaveProposal = async () => {
    try {
      const proposalData = {
        queryId: query.id,
        query,
        modules: selectedModules,
        summary: {
          transportRoutes,
          sightseeingPackages,
          hotelOptions: hotelOptions.filter(opt => opt.isSelected),
          pricingBreakdown,
          childPricingConfig,
          markupConfig
        },
        totals: {
          subtotal: pricingBreakdown.baseTotal,
          discountAmount: 0,
          total: pricingBreakdown.finalTotal,
          moduleCount: selectedModules.length,
          markup: pricingBreakdown.markupAmount
        }
      };

      const proposalId = ProposalService.saveProposal(proposalData);
      
      toast({
        title: "Proposal Saved",
        description: `Proposal ${proposalId} has been saved successfully`
      });

      if (onSaveProposal) {
        onSaveProposal(proposalData);
      }
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast({
        title: "Error",
        description: "Failed to save proposal",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className={`${className} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Enhanced Itinerary Summary
            <Badge variant="outline">{selectedModules.length} items</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveProposal}
              className="flex items-center gap-1"
            >
              <Save className="h-4 w-4" />
              Save Proposal
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-6">
          {/* Land Package Section */}
          {transportRoutes.length > 0 && (
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <Car className="h-4 w-4 text-green-600" />
                Land Package - Transport Routes
              </h4>
              <div className="space-y-2">
                {transportRoutes.map((route) => (
                  <div key={route.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Route className="h-3 w-3 text-gray-500" />
                          <span className="font-medium">{route.from} → {route.to}</span>
                          <Badge variant="outline" className="text-xs">{route.vehicleType}</Badge>
                        </div>
                        <div className="text-xs text-gray-600 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {route.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {route.paxCount} PAX
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {currencySymbol}{formatCurrency(route.finalPrice)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {currencySymbol}{formatCurrency(route.finalPrice / route.paxCount)}/person
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-right font-semibold text-green-600">
                  Transport Subtotal: {currencySymbol}{formatCurrency(pricingBreakdown.landPackageSubtotal)}
                </div>
              </div>
            </div>
          )}

          {/* Sightseeing Section */}
          {sightseeingPackages.length > 0 && (
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <Camera className="h-4 w-4 text-purple-600" />
                Sightseeing Packages
              </h4>
              <div className="space-y-2">
                {sightseeingPackages.map((pkg) => (
                  <div key={pkg.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <span className="font-medium">{pkg.name}</span>
                          {pkg.includesTransport && (
                            <Badge className="text-xs bg-blue-100 text-blue-700">
                              Transport Included
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center gap-4">
                          <span>{pkg.location}</span>
                          <span>{pkg.duration}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {currencySymbol}{formatCurrency(pkg.finalPrice)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {currencySymbol}{formatCurrency(pkg.finalPrice / totalPax)}/person
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-right font-semibold text-purple-600">
                  Sightseeing Subtotal: {currencySymbol}{formatCurrency(pricingBreakdown.sightseeingSubtotal)}
                </div>
              </div>
            </div>
          )}

          {/* Hotel Options Section */}
          {hotelOptions.some(opt => opt.isSelected) && (
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <Hotel className="h-4 w-4 text-orange-600" />
                Hotel Accommodations
              </h4>
              <div className="space-y-4">
                {hotelOptions.filter(opt => opt.isSelected).map((option) => (
                  <div key={option.optionNumber} className="border rounded-lg p-3 bg-gray-50">
                    <div className="font-medium mb-2">Option {option.optionNumber}</div>
                    <div className="space-y-2">
                      {option.hotels.map((hotel) => (
                        <div key={hotel.id} className="flex items-center justify-between bg-white p-2 rounded">
                          <div className="flex-1">
                            <div className="font-medium">{hotel.name}</div>
                            <div className="text-xs text-gray-600">
                              {hotel.location} • {hotel.nights} nights • {hotel.roomType}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {currencySymbol}{formatCurrency(hotel.finalPrice)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {currencySymbol}{formatCurrency(hotel.finalPrice / hotel.nights)}/night
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-right font-semibold text-orange-600 mt-2">
                      Option {option.optionNumber} Total: {currencySymbol}{formatCurrency(option.totalCost)}
                    </div>
                  </div>
                ))}
                <div className="text-right font-semibold text-orange-600">
                  Accommodation Subtotal: {currencySymbol}{formatCurrency(pricingBreakdown.hotelSubtotal)}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Child Pricing Options */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-blue-600" />
              Child Pricing Configuration
            </h4>
            <div className="space-y-3 bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Equal cost for all passengers (adults & children)</Label>
                <Switch
                  checked={childPricingConfig.equalCostMode}
                  onCheckedChange={(checked) => 
                    setChildPricingConfig(prev => ({ ...prev, equalCostMode: checked }))
                  }
                />
              </div>
              
              {!childPricingConfig.equalCostMode && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Child Discount %</Label>
                    <Input
                      type="number"
                      value={childPricingConfig.childDiscountPercentage}
                      onChange={(e) => 
                        setChildPricingConfig(prev => ({ 
                          ...prev, 
                          childDiscountPercentage: Number(e.target.value) 
                        }))
                      }
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Infant Discount %</Label>
                    <Input
                      type="number"
                      value={childPricingConfig.infantDiscountPercentage}
                      onChange={(e) => 
                        setChildPricingConfig(prev => ({ 
                          ...prev, 
                          infantDiscountPercentage: Number(e.target.value) 
                        }))
                      }
                      className="h-8"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Markup Configuration */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-green-600" />
              Markup Configuration
            </h4>
            <div className="space-y-3 bg-green-50 p-3 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Markup Type</Label>
                  <Select 
                    value={markupConfig.type} 
                    onValueChange={(value: 'percentage' | 'fixed') => 
                      setMarkupConfig(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Apply To</Label>
                  <Select 
                    value={markupConfig.applyTo} 
                    onValueChange={(value: 'per-person' | 'total') => 
                      setMarkupConfig(prev => ({ ...prev, applyTo: value }))
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="total">Total Package</SelectItem>
                      <SelectItem value="per-person">Per Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Label className="text-xs min-w-0">
                  Markup Value ({markupConfig.type === 'percentage' ? '%' : markupConfig.currency}):
                </Label>
                {editingMarkup ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={tempMarkupValue}
                      onChange={(e) => setTempMarkupValue(Number(e.target.value))}
                      className="h-8 w-20"
                    />
                    <Button size="sm" onClick={handleSaveMarkup} className="h-8 w-8 p-0">
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setEditingMarkup(false)} 
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      {markupConfig.value}{markupConfig.type === 'percentage' ? '%' : ` ${markupConfig.currency}`}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingMarkup(true);
                        setTempMarkupValue(markupConfig.value);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Total Cost Summary */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Calculator className="h-4 w-4 text-red-600" />
              Total Cost Summary
            </h4>
            <div className="space-y-3">
              {/* Service Breakdown */}
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Land Package (Transport):</span>
                  <span>{currencySymbol}{formatCurrency(pricingBreakdown.landPackageSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sightseeing:</span>
                  <span>{currencySymbol}{formatCurrency(pricingBreakdown.sightseeingSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Accommodation:</span>
                  <span>{currencySymbol}{formatCurrency(pricingBreakdown.hotelSubtotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Base Total:</span>
                  <span>{currencySymbol}{formatCurrency(pricingBreakdown.baseTotal)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>
                    Markup ({markupConfig.value}{markupConfig.type === 'percentage' ? '%' : ` ${markupConfig.currency}`}):
                  </span>
                  <span>+{currencySymbol}{formatCurrency(pricingBreakdown.markupAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold text-red-600">
                  <span>Final Total:</span>
                  <span>{currencySymbol}{formatCurrency(pricingBreakdown.finalTotal)}</span>
                </div>
              </div>

              {/* Per Person Breakdown */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h5 className="font-medium mb-2">Per Person Cost Breakdown</h5>
                <div className="space-y-1 text-sm">
                  {pricingBreakdown.perPersonBreakdown.adults.count > 0 && (
                    <div className="flex justify-between">
                      <span>Adults ({pricingBreakdown.perPersonBreakdown.adults.count}):</span>
                      <span>
                        {currencySymbol}{formatCurrency(pricingBreakdown.perPersonBreakdown.adults.costPerPerson)}/person
                        <span className="text-gray-600 ml-2">
                          (Total: {currencySymbol}{formatCurrency(pricingBreakdown.perPersonBreakdown.adults.total)})
                        </span>
                      </span>
                    </div>
                  )}
                  {pricingBreakdown.perPersonBreakdown.children.count > 0 && (
                    <div className="flex justify-between">
                      <span>Children ({pricingBreakdown.perPersonBreakdown.children.count}):</span>
                      <span>
                        {currencySymbol}{formatCurrency(pricingBreakdown.perPersonBreakdown.children.costPerPerson)}/person
                        <span className="text-gray-600 ml-2">
                          (Total: {currencySymbol}{formatCurrency(pricingBreakdown.perPersonBreakdown.children.total)})
                        </span>
                      </span>
                    </div>
                  )}
                  {pricingBreakdown.perPersonBreakdown.infants.count > 0 && (
                    <div className="flex justify-between">
                      <span>Infants ({pricingBreakdown.perPersonBreakdown.infants.count}):</span>
                      <span>
                        {currencySymbol}{formatCurrency(pricingBreakdown.perPersonBreakdown.infants.costPerPerson)}/person
                        <span className="text-gray-600 ml-2">
                          (Total: {currencySymbol}{formatCurrency(pricingBreakdown.perPersonBreakdown.infants.total)})
                        </span>
                      </span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Average per Person:</span>
                    <span>{currencySymbol}{formatCurrency(pricingBreakdown.finalTotal / totalPax)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default EnhancedItinerarySummaryPanel;
