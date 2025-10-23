import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Edit, Save, X, Calculator, DollarSign, TrendingUp, Globe, Users, AlertTriangle } from "lucide-react";
import { EnhancedPricingService } from "@/services/enhancedPricingService";
import { PricingService } from "@/services/pricingService";
import { useToast } from "@/hooks/use-toast";

interface PricingSectionProps {
  baseCost: number;
  finalCost: number;
  currency: string;
  countryCode?: string;
  paxCount: number;
  adultCount?: number;
  childCount?: number;
  onPricingUpdate: (pricing: any) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  baseCost,
  finalCost,
  currency,
  countryCode = 'TH',
  paxCount,
  adultCount = 2,
  childCount = 2,
  onPricingUpdate
}) => {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [pricingData, setPricingData] = useState({
    basePrice: baseCost,
    adultPrice: 0,
    childPrice: 0,
    markup: 0,
    markupType: 'percentage' as 'percentage' | 'fixed',
    markupCalculationMethod: 'total' as 'total' | 'per-person',
    finalPrice: finalCost,
    currency: currency,
    countryCode: countryCode,
    enableChildPricing: false,
    childDiscountPercent: 25,
    slabBasedPricing: false,
    availableSlabs: [] as any[]
  });
  const [countryRule, setCountryRule] = useState<any>(null);
  const [availableCountries, setAvailableCountries] = useState<any[]>([]);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Load pricing settings and country data
  useEffect(() => {
    const loadPricingData = () => {
      // Get country-specific pricing rule
      const rule = EnhancedPricingService.getCountryRule(countryCode);
      setCountryRule(rule);

      // Get available countries
      const countries = EnhancedPricingService.getAvailableCountries();
      setAvailableCountries(countries);

      // Get pricing settings to check for slab pricing
      const pricingSettings = PricingService.getSettings();
      const applicableSlabs = pricingSettings.markupSlabs.filter(slab => 
        slab.isActive && slab.currency === currency
      );

      // Calculate pricing based on country rules
      const calculatedPricing = EnhancedPricingService.calculateCountryBasedPricing(
        baseCost,
        paxCount,
        countryCode,
        currency
      );

      // Determine if slab pricing should be used
      const useSlabPricing = pricingSettings.useSlabPricing && applicableSlabs.length > 0;
      let finalMarkup = calculatedPricing.markup;
      let finalMarkupType: 'percentage' | 'fixed' = calculatedPricing.markupType === 'slab' ? 'percentage' : 
                           (calculatedPricing.markupType as 'percentage' | 'fixed');

      // Apply slab pricing if enabled
      if (useSlabPricing) {
        const perPersonPrice = baseCost / paxCount;
        const applicableSlab = applicableSlabs.find(slab => 
          perPersonPrice >= slab.minAmount && perPersonPrice <= slab.maxAmount
        );
        
        if (applicableSlab) {
          finalMarkup = applicableSlab.markupValue;
          finalMarkupType = applicableSlab.markupType as 'percentage' | 'fixed';
        }
      }

      // Calculate adult and child pricing
      const adultPrice = baseCost / paxCount;
      const childPrice = adultPrice * (1 - (25 / 100)); // 25% discount for children

      setPricingData({
        basePrice: calculatedPricing.basePrice,
        adultPrice: adultPrice,
        childPrice: childPrice,
        markup: finalMarkup,
        markupType: finalMarkupType,
        markupCalculationMethod: 'total',
        finalPrice: calculatedPricing.finalPrice,
        currency: calculatedPricing.currency,
        countryCode: countryCode,
        enableChildPricing: false,
        childDiscountPercent: 25,
        slabBasedPricing: useSlabPricing,
        availableSlabs: applicableSlabs
      });
    };

    loadPricingData();
  }, [baseCost, countryCode, currency, paxCount]);

  const calculatePricingBreakdown = () => {
    let baseAmount = 0;
    let markupAmount = 0;
    let totalAmount = 0;

    if (pricingData.enableChildPricing) {
      // Calculate separate adult and child costs
      const adultTotal = Math.round((pricingData.adultPrice * adultCount) * 100) / 100;
      const childTotal = Math.round((pricingData.childPrice * childCount) * 100) / 100;
      baseAmount = Math.round((adultTotal + childTotal) * 100) / 100;
    } else {
      baseAmount = Math.round(pricingData.basePrice * 100) / 100;
    }

    // Apply markup based on calculation method
    if (pricingData.markupCalculationMethod === 'per-person') {
      // Calculate markup per person then multiply by total PAX
      const perPersonBase = baseAmount / paxCount;
      let perPersonMarkup = 0;
      
      if (pricingData.markupType === 'percentage') {
        perPersonMarkup = Math.round((perPersonBase * (pricingData.markup / 100)) * 100) / 100;
      } else {
        perPersonMarkup = Math.round(pricingData.markup * 100) / 100;
      }
      
      markupAmount = Math.round((perPersonMarkup * paxCount) * 100) / 100;
    } else {
      // Calculate markup on total amount
      if (pricingData.markupType === 'percentage') {
        markupAmount = Math.round((baseAmount * (pricingData.markup / 100)) * 100) / 100;
      } else {
        markupAmount = Math.round(pricingData.markup * 100) / 100;
      }
    }

    totalAmount = Math.round((baseAmount + markupAmount) * 100) / 100;

    return {
      baseAmount,
      markupAmount,
      totalAmount,
      adultTotal: pricingData.enableChildPricing ? Math.round((pricingData.adultPrice * adultCount) * 100) / 100 : 0,
      childTotal: pricingData.enableChildPricing ? Math.round((pricingData.childPrice * childCount) * 100) / 100 : 0,
      perPersonAmount: Math.round((totalAmount / paxCount) * 100) / 100,
      perPersonMarkup: pricingData.markupCalculationMethod === 'per-person' ? Math.round((markupAmount / paxCount) * 100) / 100 : 0
    };
  };

  const calculatePricingBreakdownForData = (data: any) => {
    let baseAmount = 0;
    let markupAmount = 0;

    if (data.enableChildPricing) {
      const adultTotal = Math.round((data.adultPrice * adultCount) * 100) / 100;
      const childTotal = Math.round((data.childPrice * childCount) * 100) / 100;
      baseAmount = Math.round((adultTotal + childTotal) * 100) / 100;
    } else {
      baseAmount = Math.round(data.basePrice * 100) / 100;
    }

    // Apply markup based on calculation method
    if (data.markupCalculationMethod === 'per-person') {
      const perPersonBase = baseAmount / paxCount;
      let perPersonMarkup = 0;
      
      if (data.markupType === 'percentage') {
        perPersonMarkup = Math.round((perPersonBase * (data.markup / 100)) * 100) / 100;
      } else {
        perPersonMarkup = Math.round(data.markup * 100) / 100;
      }
      
      markupAmount = Math.round((perPersonMarkup * paxCount) * 100) / 100;
    } else {
      if (data.markupType === 'percentage') {
        markupAmount = Math.round((baseAmount * (data.markup / 100)) * 100) / 100;
      } else {
        markupAmount = Math.round(data.markup * 100) / 100;
      }
    }

    const totalAmount = Math.round((baseAmount + markupAmount) * 100) / 100;

    return {
      baseAmount,
      markupAmount,
      totalAmount,
      adultTotal: data.enableChildPricing ? Math.round((data.adultPrice * adultCount) * 100) / 100 : 0,
      childTotal: data.enableChildPricing ? Math.round((data.childPrice * childCount) * 100) / 100 : 0,
      perPersonAmount: Math.round((totalAmount / paxCount) * 100) / 100
    };
  };

  const validateCalculations = () => {
    const breakdown = calculatePricingBreakdown();
    const expectedTotal = Math.round(pricingData.finalPrice * 100) / 100;
    const calculatedTotal = breakdown.totalAmount;
    
    if (Math.abs(expectedTotal - calculatedTotal) > 0.01) {
      setCalculationError(`Calculation mismatch: Expected ${formatCurrency(expectedTotal)}, Calculated ${formatCurrency(calculatedTotal)}`);
      return false;
    } else {
      setCalculationError(null);
      return true;
    }
  };

  const calculateFinalPrice = (updatedData: any) => {
    const breakdown = calculatePricingBreakdownForData(updatedData);
    return breakdown.totalAmount;
  };

  const handlePricingChange = (field: string, value: any) => {
    const updatedPricing = { ...pricingData, [field]: value };
    
    // Recalculate child price if discount percentage changes
    if (field === 'childDiscountPercent') {
      updatedPricing.childPrice = Math.round((updatedPricing.adultPrice * (1 - (value / 100))) * 100) / 100;
    }
    
    // Recalculate final price
    updatedPricing.finalPrice = calculateFinalPrice(updatedPricing);

    setPricingData(updatedPricing);
  };

  const handleSlabSelection = (slabId: string) => {
    const selectedSlab = pricingData.availableSlabs.find(s => s.id === slabId);
    if (selectedSlab) {
      handlePricingChange('markup', selectedSlab.markupValue);
      handlePricingChange('markupType', selectedSlab.markupType);
    }
  };

  const handleCountryChange = (newCountryCode: string) => {
    const newCountry = availableCountries.find(c => c.code === newCountryCode);
    if (!newCountry) return;

    // Recalculate pricing for new country
    const calculatedPricing = EnhancedPricingService.calculateCountryBasedPricing(
      baseCost,
      paxCount,
      newCountryCode,
      newCountry.currency
    );

    const validMarkupType = calculatedPricing.markupType === 'slab' ? 'percentage' : 
                           (calculatedPricing.markupType as 'percentage' | 'fixed');

    const updatedPricing = {
      ...pricingData,
      countryCode: newCountryCode,
      currency: newCountry.currency,
      markup: calculatedPricing.markup,
      markupType: validMarkupType,
      finalPrice: calculatedPricing.finalPrice
    };

    setPricingData(updatedPricing);
    setCountryRule(EnhancedPricingService.getCountryRule(newCountryCode));
  };

  const handleSave = () => {
    if (countryRule) {
      EnhancedPricingService.updateCountryRule(countryRule.id, {
        defaultMarkup: pricingData.markup,
        markupType: pricingData.markupType
      });
    }

    onPricingUpdate(pricingData);
    setEditMode(false);
    
    toast({
      title: "Pricing Updated",
      description: "Pricing configuration has been saved successfully."
    });
  };

  const handleCancel = () => {
    const resetMarkupType = (countryRule?.markupType === 'slab' ? 'percentage' : 
                            countryRule?.markupType as 'percentage' | 'fixed') || 'percentage';
    
    setPricingData({
      basePrice: baseCost,
      adultPrice: baseCost / paxCount,
      childPrice: (baseCost / paxCount) * 0.75,
      markup: countryRule?.defaultMarkup || 0,
      markupType: resetMarkupType,
      markupCalculationMethod: 'total',
      finalPrice: finalCost,
      currency: currency,
      countryCode: countryCode,
      enableChildPricing: false,
      childDiscountPercent: 25,
      slabBasedPricing: false,
      availableSlabs: []
    });
    setEditMode(false);
  };

  const formatCurrency = (amount: number) => {
    const country = availableCountries.find(c => c.code === pricingData.countryCode);
    const symbol = country?.currencySymbol || '$';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getMarkupDisplay = () => {
    if (pricingData.markupType === 'percentage') {
      return `${pricingData.markup}%`;
    } else {
      if (pricingData.markupCalculationMethod === 'per-person') {
        return `${formatCurrency(pricingData.markup)} per person`;
      } else {
        return formatCurrency(pricingData.markup);
      }
    }
  };

  // Validate calculations on every render
  useEffect(() => {
    validateCalculations();
  }, [pricingData]);

  const breakdown = calculatePricingBreakdown();

  return (
    <div className="space-y-6">
      {/* Pricing Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <CardTitle>Pricing Configuration</CardTitle>
              {countryRule && (
                <Badge variant="outline" className="text-xs">
                  {countryRule.tier} tier
                </Badge>
              )}
              {pricingData.slabBasedPricing && (
                <Badge variant="secondary" className="text-xs">
                  Slab Pricing
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Country Selection and Child Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Country/Region
              </Label>
              {editMode ? (
                <Select 
                  value={pricingData.countryCode} 
                  onValueChange={handleCountryChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border shadow-lg z-50">
                    {availableCountries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <div className="flex items-center gap-2">
                          <span>{country.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {country.currency}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {availableCountries.find(c => c.code === pricingData.countryCode)?.name}
                    </span>
                    <Badge variant="secondary">
                      {pricingData.currency}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Enable Child Pricing
              </Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={pricingData.enableChildPricing}
                  onCheckedChange={(checked) => handlePricingChange('enableChildPricing', checked)}
                  disabled={!editMode}
                />
                <span className="text-sm text-muted-foreground">
                  Separate adult and child pricing
                </span>
              </div>
            </div>
          </div>

          {/* Child Pricing Options */}
          {pricingData.enableChildPricing && (
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200">Child Pricing Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Adult Price ({pricingData.currency})</Label>
                  {editMode ? (
                    <Input
                      type="number"
                      value={pricingData.adultPrice}
                      onChange={(e) => handlePricingChange('adultPrice', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-md">
                      <span className="font-medium">{formatCurrency(pricingData.adultPrice)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Child Discount %</Label>
                  {editMode ? (
                    <Input
                      type="number"
                      value={pricingData.childDiscountPercent}
                      onChange={(e) => handlePricingChange('childDiscountPercent', parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      step="1"
                    />
                  ) : (
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-md">
                      <span className="font-medium">{pricingData.childDiscountPercent}%</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Child Price ({pricingData.currency})</Label>
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-md">
                    <span className="font-medium">{formatCurrency(pricingData.childPrice)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Slab Pricing Section */}
          {pricingData.slabBasedPricing && pricingData.availableSlabs.length > 0 && (
            <div className="space-y-4">
              <Label>Available Pricing Slabs</Label>
              <div className="grid grid-cols-1 gap-2">
                {pricingData.availableSlabs.map((slab) => (
                  <div key={slab.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{slab.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({formatCurrency(slab.minAmount)} - {formatCurrency(slab.maxAmount)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {slab.markupType === 'percentage' ? `${slab.markupValue}%` : formatCurrency(slab.markupValue)}
                      </span>
                      {editMode && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSlabSelection(slab.id)}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Markup Configuration */}
          <div className="space-y-4">
            {/* Markup Calculation Method */}
            <div className="space-y-3">
              <Label>Markup Calculation Method</Label>
              <RadioGroup
                value={pricingData.markupCalculationMethod}
                onValueChange={(value: 'total' | 'per-person') => handlePricingChange('markupCalculationMethod', value)}
                disabled={!editMode}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="total" id="total" />
                  <Label htmlFor="total" className="text-sm">
                    Calculate markup on total amount
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="per-person" id="per-person" />
                  <Label htmlFor="per-person" className="text-sm">
                    Calculate markup per person
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Markup Type</Label>
                {editMode ? (
                  <Select 
                    value={pricingData.markupType} 
                    onValueChange={(value: 'percentage' | 'fixed') => handlePricingChange('markupType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border shadow-lg z-50">
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <span className="capitalize">{pricingData.markupType}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Markup Value {pricingData.markupType === 'percentage' ? '(%)' : 
                    pricingData.markupCalculationMethod === 'per-person' ? 
                    `(${pricingData.currency} per person)` : 
                    `(${pricingData.currency})`
                  }
                </Label>
                {editMode ? (
                  <Input
                    type="number"
                    value={pricingData.markup}
                    onChange={(e) => handlePricingChange('markup', parseFloat(e.target.value) || 0)}
                    min="0"
                    step={pricingData.markupType === 'percentage' ? '0.1' : '1'}
                  />
                ) : (
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <span className="font-medium">{getMarkupDisplay()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Country Rule Info */}
          {countryRule && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Country Pricing Rule
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Region:</span>
                  <span className="ml-2 font-medium">{countryRule.region}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tier:</span>
                  <span className="ml-2 font-medium capitalize">{countryRule.tier}</span>
                </div>
                <div>
                  <span className="text-gray-600">Default Markup:</span>
                  <span className="ml-2 font-medium">
                    {countryRule.markupType === 'percentage' ? 
                      `${countryRule.defaultMarkup}%` : 
                      formatCurrency(countryRule.defaultMarkup)
                    }
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={countryRule.isActive ? "default" : "secondary"} className="ml-2">
                    {countryRule.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Calculation Error Alert */}
          {calculationError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Calculation Error</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{calculationError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Pricing Breakdown Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Detailed Pricing Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {pricingData.enableChildPricing ? (
              <>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Adult Cost ({adultCount} × {formatCurrency(pricingData.adultPrice)}):
                  </span>
                  <span className="font-medium">{formatCurrency(breakdown.adultTotal)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Child Cost ({childCount} × {formatCurrency(pricingData.childPrice)}):
                  </span>
                  <span className="font-medium">{formatCurrency(breakdown.childTotal)}</span>
                </div>
                <div className="flex justify-between items-center py-2 font-medium border-t pt-2">
                  <span className="text-gray-600 dark:text-gray-400">Base Total:</span>
                  <span>{formatCurrency(breakdown.baseAmount)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 dark:text-gray-400">Base Cost:</span>
                <span className="font-medium">{formatCurrency(breakdown.baseAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 dark:text-gray-400">
                Markup ({getMarkupDisplay()}
                {pricingData.markupCalculationMethod === 'per-person' && breakdown.perPersonMarkup > 0 && 
                  ` = ${formatCurrency(breakdown.perPersonMarkup)} × ${paxCount} PAX`
                }):
              </span>
              <span className="font-medium text-green-600">
                +{formatCurrency(breakdown.markupAmount)}
              </span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center py-2">
              <span className="text-lg font-medium">Calculated Total:</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(breakdown.totalAmount)}
              </span>
            </div>

            {/* Calculation Method Info */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Calculation Method: {pricingData.markupCalculationMethod === 'per-person' ? 'Per Person' : 'Total Amount'}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                {pricingData.markupCalculationMethod === 'per-person' 
                  ? `Markup calculated per person (${formatCurrency(breakdown.baseAmount / paxCount)} base per person) then multiplied by ${paxCount} PAX`
                  : `Markup calculated on total base amount of ${formatCurrency(breakdown.baseAmount)}`
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Pricing Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Final Pricing Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PAX Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{paxCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Passengers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{adultCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Adults</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{childCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Children</div>
            </div>
          </div>

          <Separator />

          {/* Final Summary */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium">Total Package Cost:</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(breakdown.totalAmount)} {pricingData.currency}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Per Person:</span>
                <span className="font-medium">{formatCurrency(breakdown.perPersonAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Currency:</span>
                <span className="font-medium">{pricingData.currency}</span>
              </div>
            </div>

            {pricingData.enableChildPricing && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span className="text-green-700 dark:text-green-300">Adult Rate:</span>
                  <span className="font-medium text-green-800 dark:text-green-200">
                    {formatCurrency(pricingData.adultPrice)}
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                  <span className="text-orange-700 dark:text-orange-300">Child Rate:</span>
                  <span className="font-medium text-orange-800 dark:text-orange-200">
                    {formatCurrency(pricingData.childPrice)}
                  </span>
                </div>
              </div>
            )}

            {/* Markup Information */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Markup Information
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-yellow-700 dark:text-yellow-300">
                <div>Method: {pricingData.markupCalculationMethod === 'per-person' ? 'Per Person' : 'Total'}</div>
                <div>Type: {pricingData.markupType === 'percentage' ? 'Percentage' : 'Fixed Amount'}</div>
                <div>Value: {getMarkupDisplay()}</div>
                <div>Amount: {formatCurrency(breakdown.markupAmount)}</div>
                <div>Base: {formatCurrency(breakdown.baseAmount)}</div>
                <div>Final: {formatCurrency(breakdown.totalAmount)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
