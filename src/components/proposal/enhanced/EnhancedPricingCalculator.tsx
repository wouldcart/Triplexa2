import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Query } from '@/types/query';
import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';
import { EnhancedPricingService } from '@/services/enhancedPricingService';
import { formatCurrency } from '@/lib/formatters';
import { 
  Calculator, Users, Baby, DollarSign, Percent, 
  TrendingUp, Info, Settings, RefreshCw 
} from 'lucide-react';

interface PricingBreakdown {
  adults: {
    basePrice: number;
    markup: number;
    finalPrice: number;
    perPerson: number;
  };
  children: {
    basePrice: number;
    markup: number;
    finalPrice: number;
    perPerson: number;
    discountPercent: number;
  };
  total: {
    basePrice: number;
    markup: number;
    finalPrice: number;
  };
}

interface EnhancedPricingCalculatorProps {
  query: Query;
  days: ItineraryDay[];
  onPricingUpdate: (pricing: PricingBreakdown) => void;
}

const EnhancedPricingCalculator: React.FC<EnhancedPricingCalculatorProps> = ({
  query,
  days,
  onPricingUpdate
}) => {
  const [pricingMode, setPricingMode] = useState<'combined' | 'separate'>('separate');
  const [childDiscountPercent, setChildDiscountPercent] = useState(25);
  const [markupType, setMarkupType] = useState<'percentage' | 'fixed'>('percentage');
  const [adultMarkup, setAdultMarkup] = useState(15);
  const [childMarkup, setChildMarkup] = useState(10);
  const [enableCountryPricing, setEnableCountryPricing] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [pricingBreakdown, setPricingBreakdown] = useState<PricingBreakdown | null>(null);
  const [showPerPersonFirst, setShowPerPersonFirst] = useState(true);

  const baseCost = days.reduce((sum, day) => sum + day.totalCost, 0);
  const adultsCount = query.paxDetails.adults;
  const childrenCount = query.paxDetails.children;
  const totalPax = adultsCount + childrenCount;

  useEffect(() => {
    calculatePricing();
  }, [
    pricingMode, childDiscountPercent, markupType, adultMarkup, 
    childMarkup, enableCountryPricing, selectedCurrency, baseCost
  ]);

  const calculatePricing = () => {
    if (baseCost === 0) return;

    let breakdown: PricingBreakdown;

    // Always calculate per-person pricing first, then apply markup
    const perPersonBasePrice = baseCost / totalPax;

    if (pricingMode === 'combined') {
      // Combined pricing - same calculation for all passengers
      const countryPricing = enableCountryPricing 
        ? EnhancedPricingService.calculateCountryBasedPricing(
            baseCost, 
            totalPax, 
            query.destination.country,
            selectedCurrency
          )
        : null;

      const finalMarkup = countryPricing?.markup || 
        (markupType === 'percentage' ? (baseCost * adultMarkup / 100) : adultMarkup);
      
      const finalPrice = baseCost + finalMarkup;
      const perPersonPrice = finalPrice / totalPax;

      breakdown = {
        adults: {
          basePrice: (baseCost / totalPax) * adultsCount,
          markup: (finalMarkup / totalPax) * adultsCount,
          finalPrice: perPersonPrice * adultsCount,
          perPerson: perPersonPrice
        },
        children: {
          basePrice: (baseCost / totalPax) * childrenCount,
          markup: (finalMarkup / totalPax) * childrenCount,
          finalPrice: perPersonPrice * childrenCount,
          perPerson: perPersonPrice,
          discountPercent: 0
        },
        total: {
          basePrice: baseCost,
          markup: finalMarkup,
          finalPrice: finalPrice
        }
      };
    } else {
      // Separate pricing for adults and children - calculate per person first
      const adultPerPersonBase = perPersonBasePrice;
      const childPerPersonBase = perPersonBasePrice;

      // Apply child discount to per-person base price
      const discountedChildPerPersonBase = childPerPersonBase * (1 - childDiscountPercent / 100);

      // Calculate total base prices
      const adultBasePrice = adultPerPersonBase * adultsCount;
      const discountedChildBasePrice = discountedChildPerPersonBase * childrenCount;

      // Calculate markups
      const adultMarkupAmount = markupType === 'percentage' 
        ? (adultBasePrice * adultMarkup / 100)
        : (adultMarkup * adultsCount);

      const childMarkupAmount = markupType === 'percentage'
        ? (discountedChildBasePrice * childMarkup / 100)
        : (childMarkup * childrenCount);

      // Apply country pricing if enabled
      let finalAdultMarkup = adultMarkupAmount;
      let finalChildMarkup = childMarkupAmount;

      if (enableCountryPricing) {
        const adultCountryPricing = EnhancedPricingService.calculateCountryBasedPricing(
          adultBasePrice, adultsCount, query.destination.country, selectedCurrency
        );
        const childCountryPricing = EnhancedPricingService.calculateCountryBasedPricing(
          discountedChildBasePrice, childrenCount, query.destination.country, selectedCurrency
        );

        finalAdultMarkup = adultCountryPricing.markup;
        finalChildMarkup = childCountryPricing.markup;
      }

      // Calculate final per-person prices after markup
      const adultFinalPerPerson = (adultBasePrice + finalAdultMarkup) / adultsCount;
      const childFinalPerPerson = childrenCount > 0 ? (discountedChildBasePrice + finalChildMarkup) / childrenCount : 0;

      breakdown = {
        adults: {
          basePrice: adultBasePrice,
          markup: finalAdultMarkup,
          finalPrice: adultBasePrice + finalAdultMarkup,
          perPerson: adultFinalPerPerson
        },
        children: {
          basePrice: discountedChildBasePrice,
          markup: finalChildMarkup,
          finalPrice: discountedChildBasePrice + finalChildMarkup,
          perPerson: childFinalPerPerson,
          discountPercent: childDiscountPercent
        },
        total: {
          basePrice: adultBasePrice + discountedChildBasePrice,
          markup: finalAdultMarkup + finalChildMarkup,
          finalPrice: (adultBasePrice + finalAdultMarkup) + (discountedChildBasePrice + finalChildMarkup)
        }
      };
    }

    setPricingBreakdown(breakdown);
    onPricingUpdate(breakdown);
  };

  const resetToDefaults = () => {
    setPricingMode('separate');
    setChildDiscountPercent(25);
    setMarkupType('percentage');
    setAdultMarkup(15);
    setChildMarkup(10);
    setEnableCountryPricing(true);
    setSelectedCurrency('USD');
  };

  const availableCountries = EnhancedPricingService.getAvailableCountries();
  const countryRule = EnhancedPricingService.getCountryRule(query.destination.country);

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Pricing Configuration
            </span>
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pricing Mode */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Pricing Mode</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="combined"
                  checked={pricingMode === 'combined'}
                  onChange={() => setPricingMode('combined')}
                />
                <Label htmlFor="combined">Combined (Same rate for all)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="separate"
                  checked={pricingMode === 'separate'}
                  onChange={() => setPricingMode('separate')}
                />
                <Label htmlFor="separate">Separate (Adult/Child rates)</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Currency and Country Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="THB">THB - Thai Baht</SelectItem>
                  <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                  <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Enable Country-based Pricing
                <Switch
                  checked={enableCountryPricing}
                  onCheckedChange={setEnableCountryPricing}
                />
              </Label>
              {enableCountryPricing && countryRule && (
                <div className="text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {countryRule.countryName}: {countryRule.defaultMarkup}% default markup
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Markup Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Markup Settings</Label>
              <Select value={markupType} onValueChange={(value: 'percentage' | 'fixed') => setMarkupType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Adult Markup {markupType === 'percentage' ? '(%)' : `(${selectedCurrency})`}
                </Label>
                <Input
                  type="number"
                  value={adultMarkup}
                  onChange={(e) => setAdultMarkup(Number(e.target.value))}
                  min="0"
                  step={markupType === 'percentage' ? '0.1' : '1'}
                />
              </div>

              {pricingMode === 'separate' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Baby className="h-4 w-4" />
                    Child Markup {markupType === 'percentage' ? '(%)' : `(${selectedCurrency})`}
                  </Label>
                  <Input
                    type="number"
                    value={childMarkup}
                    onChange={(e) => setChildMarkup(Number(e.target.value))}
                    min="0"
                    step={markupType === 'percentage' ? '0.1' : '1'}
                  />
                </div>
              )}
            </div>

            {pricingMode === 'separate' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Percent className="h-4 w-4" />
                  Child Discount (%)
                </Label>
                <Input
                  type="number"
                  value={childDiscountPercent}
                  onChange={(e) => setChildDiscountPercent(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="1"
                />
                <p className="text-xs text-muted-foreground">
                  Discount applied to base price before markup calculation
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      {pricingBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Detailed Pricing Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Per-Person Pricing Display First */}
            {showPerPersonFirst && (
              <div className="mb-6">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Per-Person Pricing
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-blue-700 mb-1">Adult Rate</div>
                        <div className="text-3xl font-bold text-blue-900">
                          {formatCurrency(pricingBreakdown.adults.perPerson)}
                        </div>
                        <div className="text-xs text-blue-600">per person</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {childrenCount > 0 && (
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-green-700 mb-1">Child Rate</div>
                          <div className="text-3xl font-bold text-green-900">
                            {formatCurrency(pricingBreakdown.children.perPerson)}
                          </div>
                          <div className="text-xs text-green-600">per child</div>
                          {pricingMode === 'separate' && pricingBreakdown.children.discountPercent > 0 && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {pricingBreakdown.children.discountPercent}% discount
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Adults */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Adults ({adultsCount})</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formatCurrency(pricingBreakdown.adults.finalPrice)}
                    </div>
                    <div className="text-sm text-blue-700">
                      {formatCurrency(pricingBreakdown.adults.perPerson)} per person
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Children */}
              {childrenCount > 0 && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Baby className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">Children ({childrenCount})</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        {formatCurrency(pricingBreakdown.children.finalPrice)}
                      </div>
                      <div className="text-sm text-green-700">
                        {formatCurrency(pricingBreakdown.children.perPerson)} per child
                      </div>
                      {pricingMode === 'separate' && pricingBreakdown.children.discountPercent > 0 && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {pricingBreakdown.children.discountPercent}% discount
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Total */}
              <Card className="border-primary bg-primary/5">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-medium">Total PP Costing</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(pricingBreakdown.total.finalPrice)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(pricingBreakdown.total.finalPrice / totalPax)} average per person
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Detailed Breakdown */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Cost Breakdown
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Adults Breakdown */}
                <div className="space-y-3">
                  <h5 className="font-medium text-blue-800">Adults ({adultsCount} pax)</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span>{formatCurrency(pricingBreakdown.adults.basePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Markup:</span>
                      <span className="text-green-600">+{formatCurrency(pricingBreakdown.adults.markup)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Final Price:</span>
                      <span>{formatCurrency(pricingBreakdown.adults.finalPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Children Breakdown */}
                {childrenCount > 0 && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-green-800">Children ({childrenCount} pax)</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>{formatCurrency(pricingBreakdown.children.basePrice)}</span>
                      </div>
                      {pricingMode === 'separate' && pricingBreakdown.children.discountPercent > 0 && (
                        <div className="flex justify-between">
                          <span>Child Discount ({pricingBreakdown.children.discountPercent}%):</span>
                          <span className="text-orange-600">Applied to base</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Markup:</span>
                        <span className="text-green-600">+{formatCurrency(pricingBreakdown.children.markup)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Final Price:</span>
                        <span>{formatCurrency(pricingBreakdown.children.finalPrice)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedPricingCalculator;