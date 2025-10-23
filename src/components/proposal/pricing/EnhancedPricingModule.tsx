
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Users, TrendingUp, Calculator, Settings, AlertCircle } from 'lucide-react';
import { AdvancedPricingEngine } from '@/components/proposal/advanced/services/PricingEngine';
import { Query } from '@/types/query';
import { getCurrencyByCountry } from '@/utils/currencyUtils';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  responsibilities: string[];
}

interface PricingBreakdown {
  basePrice: number;
  teamMarkup: number;
  seasonalAdjustment: number;
  groupDiscount: number;
  advanceBookingDiscount: number;
  conditionAdjustments: number;
  finalPrice: number;
}

interface EnhancedPricingModuleProps {
  proposalData?: any;
  query?: Query;
  team?: TeamMember[];
  currencyCode?: string;
  onPricingUpdate?: (pricing: PricingBreakdown) => void;
}

export const EnhancedPricingModule: React.FC<EnhancedPricingModuleProps> = ({
  proposalData,
  query,
  team = [],
  currencyCode,
  onPricingUpdate
}) => {
  const [pricingBreakdown, setPricingBreakdown] = useState<PricingBreakdown>({
    basePrice: 0,
    teamMarkup: 0,
    seasonalAdjustment: 0,
    groupDiscount: 0,
    advanceBookingDiscount: 0,
    conditionAdjustments: 0,
    finalPrice: 0
  });

  const [pricingOptions, setPricingOptions] = useState({
    enableSeasonalPricing: true,
    enableGroupDiscounts: true,
    enableAdvanceBooking: true,
    enableDemandPricing: false,
    teamMarkupPercentage: 15,
    currencyCode: currencyCode || 'USD'
  });

  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('');
  const [customAdjustments, setCustomAdjustments] = useState({
    discount: 0,
    markup: 0,
    reason: ''
  });

  const pricingEngine = AdvancedPricingEngine.getInstance();

  // Update currency when prop changes
  useEffect(() => {
    if (currencyCode && currencyCode !== pricingOptions.currencyCode) {
      setPricingOptions(prev => ({ ...prev, currencyCode }));
    }
  }, [currencyCode]);

  useEffect(() => {
    calculatePricing();
  }, [proposalData, pricingOptions, customAdjustments]);

  const calculatePricing = () => {
    if (!proposalData || !query) return;

    let basePrice = 0;

    // Calculate base price from itinerary days
    if (proposalData.days && Array.isArray(proposalData.days)) {
      basePrice = proposalData.days.reduce((total: number, day: any) => total + (day.totalCost || 0), 0);
    }

    // Apply dynamic pricing
    const dynamicPrice = pricingEngine.calculateDynamicPricing(
      { pricing: { basePrice, finalPrice: basePrice } },
      query,
      {
        enableSeasonalPricing: pricingOptions.enableSeasonalPricing,
        enableGroupDiscounts: pricingOptions.enableGroupDiscounts,
        enableAdvanceBooking: pricingOptions.enableAdvanceBooking,
        enableDemandPricing: pricingOptions.enableDemandPricing
      }
    );

    // Calculate team markup
    const teamMarkup = (basePrice * pricingOptions.teamMarkupPercentage) / 100;

    // Calculate seasonal adjustment
    const seasonalAdjustment = dynamicPrice - basePrice;

    // Calculate group discount
    const totalPax = query.paxDetails.adults + query.paxDetails.children;
    let groupDiscount = 0;
    if (totalPax >= 6) {
      groupDiscount = basePrice * 0.1; // 10% discount
    } else if (totalPax >= 4) {
      groupDiscount = basePrice * 0.05; // 5% discount
    }

    // Calculate advance booking discount
    let advanceBookingDiscount = 0;
    if (query.travelDates?.from) {
      const bookingDate = new Date();
      const travelDate = new Date(query.travelDates.from);
      const daysInAdvance = Math.floor((travelDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysInAdvance >= 60) {
        advanceBookingDiscount = basePrice * 0.1; // 10% early bird
      } else if (daysInAdvance >= 30) {
        advanceBookingDiscount = basePrice * 0.05; // 5% advance booking
      }
    }

    // Apply custom adjustments
    const conditionAdjustments = (basePrice * customAdjustments.discount / 100) - (basePrice * customAdjustments.markup / 100);

    const finalPrice = Math.max(0, 
      basePrice + 
      teamMarkup + 
      seasonalAdjustment - 
      groupDiscount - 
      advanceBookingDiscount + 
      conditionAdjustments
    );

    const breakdown: PricingBreakdown = {
      basePrice,
      teamMarkup,
      seasonalAdjustment,
      groupDiscount,
      advanceBookingDiscount,
      conditionAdjustments,
      finalPrice
    };

    setPricingBreakdown(breakdown);
    onPricingUpdate?.(breakdown);
  };

  const getCountryCurrency = () => {
    // Get country from query data
    const country = query?.destination?.country || 'Thailand';
    return getCurrencyByCountry(country);
  };

  const formatCurrency = (amount: number) => {
    const { symbol, code } = getCountryCurrency();
    
    // Handle different currency formatting based on the country
    if (code === 'THB') {
      return `${symbol}${amount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`;
    } else if (code === 'AED') {
      return `${symbol}${amount.toLocaleString('ar-AE', { minimumFractionDigits: 0 })}`;
    } else if (code === 'SGD') {
      return `${symbol}${amount.toLocaleString('en-SG', { minimumFractionDigits: 0 })}`;
    } else if (code === 'INR') {
      return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: 0,
      }).format(amount);
    }
  };

  const getPricingResponsibleTeamMember = () => {
    return team.find(member => 
      member.responsibilities.includes('Cost Analysis') || 
      member.responsibilities.includes('Vendor Negotiations') ||
      member.role === 'Pricing Specialist'
    );
  };

  const responsibleMember = getPricingResponsibleTeamMember();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h3 className="text-xl font-semibold">Enhanced Pricing</h3>
          <Badge variant="outline" className="bg-green-100 text-green-700">
            {formatCurrency(pricingBreakdown.finalPrice)}
          </Badge>
        </div>
        {responsibleMember && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Managed by {responsibleMember.name}</span>
          </div>
        )}
      </div>

      {/* Pricing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pricing Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="seasonal">Seasonal Pricing</Label>
              <Switch
                id="seasonal"
                checked={pricingOptions.enableSeasonalPricing}
                onCheckedChange={(checked) => 
                  setPricingOptions({ ...pricingOptions, enableSeasonalPricing: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="group">Group Discounts</Label>
              <Switch
                id="group"
                checked={pricingOptions.enableGroupDiscounts}
                onCheckedChange={(checked) => 
                  setPricingOptions({ ...pricingOptions, enableGroupDiscounts: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="advance">Advance Booking</Label>
              <Switch
                id="advance"
                checked={pricingOptions.enableAdvanceBooking}
                onCheckedChange={(checked) => 
                  setPricingOptions({ ...pricingOptions, enableAdvanceBooking: checked })
                }
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="teamMarkup">Team Markup (%)</Label>
              <Input
                id="teamMarkup"
                type="number"
                value={pricingOptions.teamMarkupPercentage}
                onChange={(e) => 
                  setPricingOptions({ ...pricingOptions, teamMarkupPercentage: Number(e.target.value) })
                }
                min="0"
                max="100"
              />
            </div>
            
            <div>
              <Label htmlFor="currency">Currency ({getCountryCurrency().code})</Label>
              <div className="flex items-center gap-2 p-2 border rounded">
                <span className="font-medium">{getCountryCurrency().symbol}</span>
                <span className="text-sm text-muted-foreground">{getCountryCurrency().code}</span>
                <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Auto-detected</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Pricing Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Base Price</span>
              <span className="font-semibold">{formatCurrency(pricingBreakdown.basePrice)}</span>
            </div>
            
            <div className="flex justify-between items-center text-green-600">
              <span className="text-sm">Team Markup ({pricingOptions.teamMarkupPercentage}%)</span>
              <span>+{formatCurrency(pricingBreakdown.teamMarkup)}</span>
            </div>
            
            {pricingBreakdown.seasonalAdjustment !== 0 && (
              <div className={`flex justify-between items-center ${
                pricingBreakdown.seasonalAdjustment > 0 ? 'text-orange-600' : 'text-green-600'
              }`}>
                <span className="text-sm">Seasonal Adjustment</span>
                <span>{pricingBreakdown.seasonalAdjustment > 0 ? '+' : ''}{formatCurrency(pricingBreakdown.seasonalAdjustment)}</span>
              </div>
            )}
            
            {pricingBreakdown.groupDiscount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm">Group Discount</span>
                <span>-{formatCurrency(pricingBreakdown.groupDiscount)}</span>
              </div>
            )}
            
            {pricingBreakdown.advanceBookingDiscount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm">Early Booking Discount</span>
                <span>-{formatCurrency(pricingBreakdown.advanceBookingDiscount)}</span>
              </div>
            )}
            
            {pricingBreakdown.conditionAdjustments !== 0 && (
              <div className={`flex justify-between items-center ${
                pricingBreakdown.conditionAdjustments > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                <span className="text-sm">Custom Adjustments</span>
                <span>{pricingBreakdown.conditionAdjustments > 0 ? '+' : ''}{formatCurrency(pricingBreakdown.conditionAdjustments)}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Final Price</span>
              <span className="text-green-600">{formatCurrency(pricingBreakdown.finalPrice)}</span>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              Per person: {formatCurrency(pricingBreakdown.finalPrice / Math.max(1, (query?.paxDetails.adults || 0) + (query?.paxDetails.children || 0)))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Adjustments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Custom Adjustments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount">Additional Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                value={customAdjustments.discount}
                onChange={(e) => 
                  setCustomAdjustments({ ...customAdjustments, discount: Number(e.target.value) })
                }
                min="0"
                max="100"
              />
            </div>
            
            <div>
              <Label htmlFor="markup">Additional Markup (%)</Label>
              <Input
                id="markup"
                type="number"
                value={customAdjustments.markup}
                onChange={(e) => 
                  setCustomAdjustments({ ...customAdjustments, markup: Number(e.target.value) })
                }
                min="0"
                max="100"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="reason">Reason for Adjustment</Label>
            <Input
              id="reason"
              value={customAdjustments.reason}
              onChange={(e) => 
                setCustomAdjustments({ ...customAdjustments, reason: e.target.value })
              }
              placeholder="Enter reason for price adjustment..."
            />
          </div>
          
          {responsibleMember && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                Adjustments will be reviewed by {responsibleMember.name} ({responsibleMember.role})
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Assignment */}
      {team.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {team.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{member.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">({member.role})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {member.responsibilities.map((resp, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {resp}
                      </Badge>
                    ))}
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
