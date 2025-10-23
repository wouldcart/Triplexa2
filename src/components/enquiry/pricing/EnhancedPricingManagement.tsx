import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calculator, DollarSign, Percent, Users, Settings, Package } from 'lucide-react';
import { Query } from '@/types/query';
import { PricingService } from '@/services/pricingService';
import { formatCurrency } from '@/lib/formatters';
import { getCurrencyByCountry } from '@/utils/currencyUtils';
import { toast } from 'sonner';
import { EnhancedPricingService } from '@/services/enhancedPricingService';
import { useProposalRealtimeSync } from '@/hooks/useProposalRealtimeSync';
import { useDebounce } from '@/hooks/useDebounce';
import AccommodationOptionSelector from './AccommodationOptionSelector';
import { TaxCalculationService } from '@/services/taxCalculationService';
import { SimpleTaxSelector } from './SimpleTaxSelector';

interface EnhancedPricingManagementProps {
  query: Query;
  pricing: any;
  onUpdate: (pricing: any) => void;
}

interface PricingCalculation {
  baseCost: number;
  perPersonMarkup: number;
  markupType: 'percentage' | 'fixed' | 'slab' | 'country-based';
  totalMarkup: number;
  totalPackageCost: number; // Base Cost + Markup
  discount: number;
  netPackageCost: number; // Total Package Cost - Discount
  taxAmount: number;
  finalPrice: number; // Net Package Cost + Tax
  perPersonPrice: number;
  adultPrice: number;
  childPrice: number;
  currency: string;
  currencySymbol: string;
}

const EnhancedPricingManagement: React.FC<EnhancedPricingManagementProps> = ({
  query,
  pricing,
  onUpdate
}) => {
  // Get proper currency based on destination country
  const currencyInfo = getCurrencyByCountry(query.destination?.country || 'USA');
  
  const [pricingCalc, setPricingCalc] = useState<PricingCalculation>({
    baseCost: 0,
    perPersonMarkup: 0,
    markupType: 'percentage',
    totalMarkup: 0,
    totalPackageCost: 0,
    discount: 0,
    netPackageCost: 0,
    taxAmount: 0,
    finalPrice: 0,
    perPersonPrice: 0,
    adultPrice: 0,
    childPrice: 0,
    currency: currencyInfo.code,
    currencySymbol: currencyInfo.symbol
  });
  
  const [pricingSettings, setPricingSettings] = useState<any>(null);
  const [customMarkup, setCustomMarkup] = useState<number>(0);
  const [useCustomMarkup, setUseCustomMarkup] = useState(false);
  const [selectedPackageOption, setSelectedPackageOption] = useState<number>(1);
  const [discountSettings, setDiscountSettings] = useState({
    enableDiscount: false,
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    totalDiscount: 0
  });

  const [taxSettings, setTaxSettings] = useState({
    enableTax: true,
    countryCode: query.destination?.country || 'IN',
    serviceType: 'all',
    taxInclusive: false,
    taxAmount: 0
  });

  const [perPersonMarkup, setPerPersonMarkup] = useState({
    enableSeparateMarkup: false,
    adultMarkupType: 'percentage' as 'percentage' | 'fixed',
    childMarkupType: 'percentage' as 'percentage' | 'fixed',
    adultMarkup: 15,
    childMarkup: 10,
    adultPerPersonCost: 0,
    childPerPersonCost: 0
  });

  // Calculate totalPax at component level for consistent access
  const totalPax = query.paxDetails.adults + query.paxDetails.children;

  // Use real-time sync to get actual proposal data
  const { snapshot, hasData, refresh } = useProposalRealtimeSync(query.id, 'enhanced');

  // Debounce the onUpdate calls to prevent rapid firing
  const { debouncedFn: debouncedOnUpdate } = useDebounce(onUpdate, 500);

  useEffect(() => {
    // Load pricing settings from /settings/pricing module
    loadPricingSettings();
    
    // Initialize pricing calculation
    if (pricing) {
      setPricingCalc(pricing);
    } else if (hasData && snapshot) {
      // Use real package data from proposal summary
      calculatePricingFromSnapshot();
    } else {
      calculateInitialPricing();
    }
  }, [query, hasData, snapshot, selectedPackageOption]);

  // React to real-time changes in proposal data and discount settings
  useEffect(() => {
    if (hasData && snapshot) {
      calculatePricingFromSnapshot();
    }
  }, [snapshot, selectedPackageOption, hasData]);

  // Update pricing when discount settings or per-person markup change
  useEffect(() => {
    if (pricingCalc.baseCost > 0) {
      // Recalculate pricing when settings change
      updatePricingCalculation({});
    }
  }, [discountSettings, perPersonMarkup, taxSettings]);

  const loadPricingSettings = () => {
    try {
      const settings = PricingService.getSettings();
      setPricingSettings(settings);
      
      // Set initial markup from settings
      if (settings.defaultMarkupPercentage) {
        setCustomMarkup(settings.defaultMarkupPercentage);
      }
    } catch (error) {
      console.error('Error loading pricing settings:', error);
      toast.error('Failed to load pricing settings');
    }
  };

  const calculatePricingFromSnapshot = () => {
    if (!snapshot || !snapshot.accommodationOptions) return;

    // Get the selected package option or fallback to base cost
    let baseCost = snapshot.baseCost;
    
    if (snapshot.accommodationOptions.length > 0) {
      // Find the selected option (1, 2, 3 maps to standard, optional, alternative)
      const optionTypes = ['standard', 'optional', 'alternative'];
      const selectedOptionType = optionTypes[selectedPackageOption - 1];
      const selectedOption = snapshot.accommodationOptions.find(opt => opt.type === selectedOptionType);
      
      if (selectedOption) {
        baseCost = selectedOption.baseTotal;
      }
    }

    const settings = PricingService.getSettings();
    const defaultMarkup = settings?.defaultMarkupPercentage || 15;
    
    updatePricingCalculation({
      baseCost,
      perPersonMarkup: defaultMarkup,
      markupType: 'percentage'
    });
  };

  const calculateInitialPricing = () => {
    // Calculate base cost from accommodations, transport, activities, etc.
    const baseCost = estimateBaseCost();
    
    const settings = PricingService.getSettings();
    const defaultMarkup = settings?.defaultMarkupPercentage || 15;
    
    updatePricingCalculation({
      baseCost,
      perPersonMarkup: defaultMarkup,
      markupType: 'percentage'
    });
  };

  const estimateBaseCost = () => {
    // Estimate base cost based on query details
    const { adults, children } = query.paxDetails;
    const { days } = query.tripDuration;
    const { min, max } = query.budget;
    
    // Use average of budget range as base estimate
    const avgBudget = (min + max) / 2;
    
    // Calculate per person per day cost
    const totalPax = adults + children;
    const perPersonPerDay = avgBudget / (totalPax * days);
    
    // Base cost is 70% of budget (leaving room for markup)
    return avgBudget * 0.7;
  };

  const updatePricingCalculation = (updates: Partial<PricingCalculation>) => {
    const newCalc = { ...pricingCalc, ...updates };
    
    // STEP 1: Base Cost is set from input
    // STEP 2: Calculate Markup (Per Person)
    const adults = query.paxDetails.adults;
    const children = query.paxDetails.children;
    const totalPax = adults + children;
    
    if (newCalc.markupType === 'country-based') {
      const countryCode = query.destination?.country || 'US';
      const countryBasedCalc = EnhancedPricingService.calculateCountryBasedPricing(
        newCalc.baseCost,
        totalPax,
        countryCode,
        newCalc.currency
      );
      
      newCalc.totalMarkup = countryBasedCalc.markup;
      newCalc.perPersonMarkup = countryBasedCalc.markup / newCalc.baseCost * 100;
    } else if (newCalc.markupType === 'percentage') {
      newCalc.totalMarkup = newCalc.baseCost * (newCalc.perPersonMarkup / 100);
    } else {
      newCalc.totalMarkup = newCalc.perPersonMarkup * totalPax;
    }
    
    // STEP 3: Total Package Cost = Base Cost + Markup
    newCalc.totalPackageCost = newCalc.baseCost + newCalc.totalMarkup;
    
    // STEP 4: Apply Discount (if enabled)
    if (discountSettings.enableDiscount) {
      if (discountSettings.discountType === 'percentage') {
        newCalc.discount = newCalc.totalPackageCost * (discountSettings.discountValue / 100);
      } else {
        newCalc.discount = discountSettings.discountValue;
      }
    } else {
      newCalc.discount = 0;
    }
    
    // STEP 5: Net Package Cost = Total Package Cost - Discount
    newCalc.netPackageCost = newCalc.totalPackageCost - newCalc.discount;
    
    // STEP 6: Calculate Tax (if enabled)
    if (taxSettings.enableTax) {
      const taxResult = TaxCalculationService.calculateTax(
        newCalc.netPackageCost,
        taxSettings.countryCode,
        taxSettings.serviceType,
        taxSettings.taxInclusive
      );
      newCalc.taxAmount = taxResult.taxAmount;
      newCalc.finalPrice = taxResult.totalAmount;
    } else {
      newCalc.taxAmount = 0;
      newCalc.finalPrice = newCalc.netPackageCost;
    }
    
    // STEP 7: Calculate Adult & Child Breakdown with Equal Division
    if (totalPax > 0) {
      // Equal base cost division for all passengers
      const basePerPersonCost = newCalc.baseCost / totalPax;
      
      if (perPersonMarkup.enableSeparateMarkup) {
        // Apply separate markup for adults and children
        let adultMarkupAmount = 0;
        let childMarkupAmount = 0;
        
        if (perPersonMarkup.adultMarkupType === 'percentage') {
          adultMarkupAmount = basePerPersonCost * (perPersonMarkup.adultMarkup / 100);
        } else {
          adultMarkupAmount = perPersonMarkup.adultMarkup;
        }
        
        if (perPersonMarkup.childMarkupType === 'percentage') {
          childMarkupAmount = basePerPersonCost * (perPersonMarkup.childMarkup / 100);
        } else {
          childMarkupAmount = perPersonMarkup.childMarkup;
        }
        
        const adultTotalPerPerson = basePerPersonCost + adultMarkupAmount;
        const childTotalPerPerson = basePerPersonCost + childMarkupAmount;
        
        // Calculate adult and child portions from final price
        const totalMarkupUsed = (adults * adultMarkupAmount) + (children * childMarkupAmount);
        const adultRatio = (adults * adultTotalPerPerson) / (newCalc.baseCost + totalMarkupUsed);
        const childRatio = (children * childTotalPerPerson) / (newCalc.baseCost + totalMarkupUsed);
        
        newCalc.adultPrice = newCalc.finalPrice * adultRatio;
        newCalc.childPrice = newCalc.finalPrice * childRatio;
        
        // Update per-person markup state
        setPerPersonMarkup(prev => ({
          ...prev,
          adultPerPersonCost: newCalc.adultPrice / adults,
          childPerPersonCost: children > 0 ? newCalc.childPrice / children : 0
        }));
      } else {
        // Equal division of final price
        const finalPerPersonPrice = newCalc.finalPrice / totalPax;
        newCalc.adultPrice = finalPerPersonPrice * adults;
        newCalc.childPrice = finalPerPersonPrice * children;
      }
      
      newCalc.perPersonPrice = newCalc.finalPrice / totalPax;
    } else {
      newCalc.adultPrice = newCalc.finalPrice;
      newCalc.childPrice = 0;
      newCalc.perPersonPrice = newCalc.finalPrice;
    }
    
    // Update currency from destination
    newCalc.currency = currencyInfo.code;
    newCalc.currencySymbol = currencyInfo.symbol;
    
    // Only call onUpdate if the data has actually changed to prevent infinite loops
    const hasChanged = JSON.stringify(pricingCalc) !== JSON.stringify(newCalc);
    setPricingCalc(newCalc);
    
    if (hasChanged) {
      debouncedOnUpdate(newCalc);
    }
  };

  const handleBaseCostChange = (value: string) => {
    const baseCost = parseFloat(value) || 0;
    updatePricingCalculation({ baseCost });
  };

  const handleMarkupChange = (value: string) => {
    const markup = parseFloat(value) || 0;
    updatePricingCalculation({ perPersonMarkup: markup });
    setCustomMarkup(markup);
  };

  const handlePackageOptionChange = (optionType: 'standard' | 'optional' | 'alternative') => {
    const optionNumber = optionType === 'standard' ? 1 : optionType === 'optional' ? 2 : 3;
    setSelectedPackageOption(optionNumber);
  };

  const handleMarkupTypeChange = (type: 'percentage' | 'fixed' | 'slab' | 'country-based') => {
    if (type === 'country-based') {
      // Apply country-based pricing using EnhancedPricingService
      const countryCode = query.destination?.country || 'US';
      const countryBasedCalc = EnhancedPricingService.calculateCountryBasedPricing(
        pricingCalc.baseCost,
        totalPax,
        countryCode,
        pricingCalc.currency
      );
      
      updatePricingCalculation({
        markupType: type,
        perPersonMarkup: countryBasedCalc.markup / pricingCalc.baseCost * 100,
        totalMarkup: countryBasedCalc.markup,
        finalPrice: countryBasedCalc.finalPrice
      });
    } else {
      updatePricingCalculation({ markupType: type });
    }
  };

  const applySettingsMarkup = () => {
    if (pricingSettings) {
      updatePricingCalculation({
        perPersonMarkup: pricingSettings.defaultMarkupPercentage,
        markupType: pricingSettings.useSlabPricing ? 'slab' : 'percentage'
      });
      setUseCustomMarkup(false);
      toast.success('Applied pricing settings');
    }
  };

  const refreshProposalData = () => {
    refresh();
    toast.success('Refreshed proposal data');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Enhanced Pricing Management
          </h3>
          <p className="text-sm text-muted-foreground">
            {hasData ? 'Using real proposal data from Proposal Summary' : 'Calculate pricing with per person markup from pricing settings'}
          </p>
        </div>
      <div className="flex items-center gap-2">
        {hasData && (
          <Button
            variant="outline"
            size="sm"
            onClick={refreshProposalData}
            className="flex items-center gap-1"
          >
            <Package className="h-3 w-3" />
            Refresh Data
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={applySettingsMarkup}
          className="flex items-center gap-1"
        >
          <Settings className="h-3 w-3" />
          Apply Settings
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleMarkupTypeChange('country-based')}
          className="flex items-center gap-1"
        >
          <DollarSign className="h-3 w-3" />
          Country Rules
        </Button>
        <Badge variant="outline">
          {totalPax} travelers
        </Badge>
      </div>
      </div>

      {/* Real Data Status */}
      {hasData && snapshot && (
        <Card className="bg-success/10 border-success/30">
          <CardHeader>
            <CardTitle className="text-sm text-success-foreground">Real-time Proposal Data Connected</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-success-foreground/80">
              <span className="font-medium">Base Services Cost:</span> {formatCurrency(snapshot.baseCost, pricingCalc.currency)}
            </div>
            <div className="text-sm text-success-foreground/80">
              <span className="font-medium">Currency:</span> {pricingCalc.currencySymbol} {pricingCalc.currency}
            </div>
            {snapshot.accommodationOptions.length > 0 && (
              <div className="text-sm text-success-foreground/80">
                <span className="font-medium">Package Options:</span> {snapshot.accommodationOptions.length} available
              </div>
            )}
            <div className="text-sm text-success-foreground/80">
              <span className="font-medium">Last Updated:</span> {new Date(snapshot.lastCalculated).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Accommodation Options - Auto Display */}
      {hasData && snapshot?.accommodationOptions && snapshot.accommodationOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              All Accommodation Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {snapshot.accommodationOptions.map((option, index) => (
              <Card key={`${option.type}-${index}`} className="border-l-4 border-l-primary/60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Option {index + 1}
                      </Badge>
                      <h4 className="font-medium">
                        {option.type.charAt(0).toUpperCase() + option.type.slice(1)} Accommodations
                      </h4>
                    </div>
                    <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                      {formatCurrency(option.baseTotal, pricingCalc.currency)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">Base Cost Analysis</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Total Base:</span>
                          <span className="font-medium">{formatCurrency(option.baseTotal, pricingCalc.currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Per Person:</span>
                          <span className="font-medium">{formatCurrency(option.baseTotal / totalPax, pricingCalc.currency)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">Adult Pricing</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Per Adult:</span>
                          <span className="font-medium">{formatCurrency(option.baseTotal / totalPax, pricingCalc.currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Adults Total ({query.paxDetails.adults}):</span>
                          <span className="font-semibold text-primary">{formatCurrency((option.baseTotal / totalPax) * query.paxDetails.adults, pricingCalc.currency)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {query.paxDetails.children > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Children Pricing</div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Per Child:</span>
                            <span className="font-medium">{formatCurrency(option.baseTotal / totalPax, pricingCalc.currency)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Children Total ({query.paxDetails.children}):</span>
                            <span className="font-semibold text-secondary-foreground">{formatCurrency((option.baseTotal / totalPax) * query.paxDetails.children, pricingCalc.currency)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Markup Application Preview */}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
                    <div className="text-xs text-muted-foreground mb-2">With Current Markup ({pricingCalc.perPersonMarkup}%)</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-primary">
                          {formatCurrency(option.baseTotal + (option.baseTotal * pricingCalc.perPersonMarkup / 100), pricingCalc.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">Final Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold">
                          {formatCurrency((option.baseTotal + (option.baseTotal * pricingCalc.perPersonMarkup / 100)) / totalPax, pricingCalc.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">Per Person</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold">
                          {formatCurrency(((option.baseTotal + (option.baseTotal * pricingCalc.perPersonMarkup / 100)) / totalPax) * query.paxDetails.adults, pricingCalc.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">Adults Final</div>
                      </div>
                      {query.paxDetails.children > 0 && (
                        <div className="text-center">
                          <div className="text-sm font-semibold">
                            {formatCurrency(((option.baseTotal + (option.baseTotal * pricingCalc.perPersonMarkup / 100)) / totalPax) * query.paxDetails.children, pricingCalc.currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">Children Final</div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pricing Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing Calculation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Per-Person Markup Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h4 className="font-semibold">Per-Person Markup Management</h4>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="enable-separate-markup" className="text-sm">Enable Separate Markup</Label>
                <input
                  id="enable-separate-markup"
                  type="checkbox"
                  checked={perPersonMarkup.enableSeparateMarkup}
                  onChange={(e) => setPerPersonMarkup(prev => ({ ...prev, enableSeparateMarkup: e.target.checked }))}
                  className="rounded border-border"
                />
              </div>
            </div>
            
            {perPersonMarkup.enableSeparateMarkup ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Adult Markup */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-primary">Adult Markup ({query.paxDetails.adults})</Label>
                      <Badge variant="outline" className="text-xs">Per Person</Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Select
                        value={perPersonMarkup.adultMarkupType}
                        onValueChange={(value: 'percentage' | 'fixed') => 
                          setPerPersonMarkup(prev => ({ ...prev, adultMarkupType: value }))
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="fixed">Fixed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Markup"
                        value={perPersonMarkup.adultMarkup}
                        onChange={(e) => setPerPersonMarkup(prev => ({ 
                          ...prev, 
                          adultMarkup: parseFloat(e.target.value) || 0 
                        }))}
                        min="0"
                        step="0.5"
                        className="flex-1"
                      />
                    </div>
                    
                    <div className="text-xs space-y-1">
                      <div className="text-muted-foreground">
                        Base: {formatCurrency((pricingCalc.baseCost * 0.6) / query.paxDetails.adults, pricingCalc.currency)}
                      </div>
                      <div className="font-medium text-primary">
                        Final Per Person: {formatCurrency(perPersonMarkup.adultPerPersonCost || 0, pricingCalc.currency)}
                      </div>
                      <div className="text-muted-foreground">
                        Total Adults: {formatCurrency((perPersonMarkup.adultPerPersonCost || 0) * query.paxDetails.adults, pricingCalc.currency)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Child Markup */}
                <Card className="bg-secondary/20 border-secondary/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-secondary-foreground">Child Markup ({query.paxDetails.children})</Label>
                      <Badge variant="outline" className="text-xs">Per Person</Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Select
                        value={perPersonMarkup.childMarkupType}
                        onValueChange={(value: 'percentage' | 'fixed') => 
                          setPerPersonMarkup(prev => ({ ...prev, childMarkupType: value }))
                        }
                        disabled={query.paxDetails.children === 0}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="fixed">Fixed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Markup"
                        value={perPersonMarkup.childMarkup}
                        onChange={(e) => setPerPersonMarkup(prev => ({ 
                          ...prev, 
                          childMarkup: parseFloat(e.target.value) || 0 
                        }))}
                        min="0"
                        step="0.5"
                        disabled={query.paxDetails.children === 0}
                        className="flex-1"
                      />
                    </div>
                    
                    <div className="text-xs space-y-1">
                      <div className="text-muted-foreground">
                        Base: {query.paxDetails.children > 0 ? formatCurrency((pricingCalc.baseCost * 0.4) / query.paxDetails.children, pricingCalc.currency) : 'N/A'}
                      </div>
                      <div className="font-medium text-secondary-foreground">
                        Final Per Person: {formatCurrency(perPersonMarkup.childPerPersonCost || 0, pricingCalc.currency)}
                      </div>
                      <div className="text-muted-foreground">
                        Total Children: {formatCurrency((perPersonMarkup.childPerPersonCost || 0) * query.paxDetails.children, pricingCalc.currency)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground text-center">
                  Enable separate markup to set different markup rates for adults and children
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Optional Discount Section */}
          <Card className="bg-accent/20 border-accent/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Percent className="h-4 w-4 text-accent-foreground" />
                  Optional Discounts
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableDiscount"
                    checked={discountSettings.enableDiscount}
                    onChange={(e) => setDiscountSettings(prev => ({
                      ...prev,
                      enableDiscount: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="enableDiscount" className="text-sm">Enable Discounts</Label>
                </div>
              </div>
            </CardHeader>
            
            {discountSettings.enableDiscount && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select 
                      value={discountSettings.discountType} 
                      onValueChange={(value: 'percentage' | 'fixed') => 
                        setDiscountSettings(prev => ({ ...prev, discountType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="discount-value">
                      Discount Value {discountSettings.discountType === 'percentage' ? '(%)' : `(${pricingCalc.currencySymbol})`}
                    </Label>
                    <Input
                      id="discount-value"
                      type="number"
                      value={discountSettings.discountValue}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setDiscountSettings(prev => ({
                          ...prev,
                          discountValue: value
                        }));
                        updatePricingCalculation({});
                      }}
                      min="0"
                      max={discountSettings.discountType === 'percentage' ? "100" : undefined}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDiscountSettings(prev => ({
                        ...prev,
                        discountValue: 0
                      }));
                      updatePricingCalculation({});
                    }}
                  >
                    Clear Discount
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDiscountSettings(prev => ({
                        ...prev,
                        discountValue: 10
                      }));
                      updatePricingCalculation({});
                    }}
                  >
                    10% Discount
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDiscountSettings(prev => ({
                        ...prev,
                        discountValue: 15
                      }));
                      updatePricingCalculation({});
                    }}
                  >
                    15% Discount
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          <Separator />

          {/* Total Base Cost & Country Markup */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseCost">Total Base Cost ({pricingCalc.currency})</Label>
              <Input
                id="baseCost"
                type="number"
                value={pricingCalc.baseCost}
                onChange={(e) => handleBaseCostChange(e.target.value)}
                min="0"
                step="100"
                className="font-semibold"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="markupType">Markup Type</Label>
              <Select value={pricingCalc.markupType} onValueChange={handleMarkupTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="slab">Slab Based</SelectItem>
                  <SelectItem value="country-based">Country Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="markup">
                Markup {pricingCalc.markupType === 'percentage' ? '(%)' : pricingCalc.markupType === 'country-based' ? '(Country Rule)' : `(${pricingCalc.currency})`}
              </Label>
              {pricingCalc.markupType === 'country-based' && (
                <Badge variant="outline" className="text-xs">
                  {query.destination?.country || 'Unknown Country'}
                </Badge>
              )}
            </div>
            <Input
              id="markup"
              type="number"
              value={pricingCalc.perPersonMarkup}
              onChange={(e) => handleMarkupChange(e.target.value)}
              min="0"
              step={pricingCalc.markupType === 'percentage' ? '0.1' : '10'}
              disabled={pricingCalc.markupType === 'country-based'}
            />
            {pricingCalc.markupType === 'country-based' && (
              <div className="text-xs text-muted-foreground">
                Markup automatically determined by country pricing rules
              </div>
            )}
          </div>

          <Separator />

          {/* Enhanced Calculation Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Detailed Pricing Breakdown</h4>
              {pricingCalc.markupType === 'country-based' && (
                <Badge variant="secondary" className="text-xs">
                  {query.destination?.country || 'Unknown'} Rules Applied
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Base Cost Breakdown */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-muted-foreground">Base Cost Analysis</h5>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                     <span>Adult Base ({query.paxDetails.adults} × {formatCurrency(pricingCalc.baseCost / totalPax, pricingCalc.currency)}):</span>
                     <span className="font-medium">{formatCurrency(pricingCalc.baseCost / totalPax * query.paxDetails.adults, pricingCalc.currency)}</span>
                   </div>
                   
                   {query.paxDetails.children > 0 && (
                     <div className="flex justify-between text-sm">
                       <span>Child Base ({query.paxDetails.children} × {formatCurrency(pricingCalc.baseCost / totalPax, pricingCalc.currency)}):</span>
                       <span className="font-medium">{formatCurrency(pricingCalc.baseCost / totalPax * query.paxDetails.children, pricingCalc.currency)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-medium">Total Base Cost:</span>
                    <span className="font-semibold">{formatCurrency(pricingCalc.baseCost, pricingCalc.currency)}</span>
                  </div>
                </div>
              </div>
              
              {/* Markup Breakdown */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-muted-foreground">Markup Analysis</h5>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      Markup Method:
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {pricingCalc.markupType === 'percentage' ? `${pricingCalc.perPersonMarkup}%` : 
                       pricingCalc.markupType === 'country-based' ? 'Country Rule' :
                       pricingCalc.markupType === 'fixed' ? `${pricingCalc.perPersonMarkup} × ${totalPax}` : 'Slab'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Markup Amount:</span>
                    <span className="font-medium">{formatCurrency(pricingCalc.totalMarkup, pricingCalc.currency)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-medium">Final Total:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(pricingCalc.finalPrice, pricingCalc.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Per Person Breakdown */}
            <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-border">
              <h5 className="font-medium mb-3 text-sm">Per Person Final Pricing</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">
                    {formatCurrency(pricingCalc.adultPrice / query.paxDetails.adults, pricingCalc.currency)}
                  </div>
                  <div className="text-xs text-primary/80">Per Adult</div>
                  <div className="text-xs text-muted-foreground">({query.paxDetails.adults} adults)</div>
                </div>
                
                {query.paxDetails.children > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-secondary-foreground">
                      {formatCurrency(pricingCalc.childPrice / query.paxDetails.children, pricingCalc.currency)}
                    </div>
                    <div className="text-xs text-secondary-foreground/80">Per Child</div>
                    <div className="text-xs text-muted-foreground">({query.paxDetails.children} children)</div>
                  </div>
                )}
                
                <div className="text-center">
                  <div className="text-lg font-bold text-accent-foreground">
                    {formatCurrency(pricingCalc.perPersonPrice, pricingCalc.currency)}
                  </div>
                  <div className="text-xs text-accent-foreground/80">Average Per Person</div>
                  <div className="text-xs text-muted-foreground">({totalPax} total pax)</div>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                <div className="text-sm">
                  <span className="font-medium">Adults Total:</span>
                  <span className="ml-2">{formatCurrency(pricingCalc.adultPrice, pricingCalc.currency)}</span>
                </div>
                {query.paxDetails.children > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Children Total:</span>
                    <span className="ml-2">{formatCurrency(pricingCalc.childPrice, pricingCalc.currency)}</span>
                  </div>
                )}
                <div className="text-sm font-semibold">
                  <span>Grand Total:</span>
                  <span className="ml-2 text-primary">{formatCurrency(pricingCalc.finalPrice, pricingCalc.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Pricing Summary Module */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Final Pricing Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Per Person Cost Display */}
          <div className="bg-background/60 rounded-lg p-4 border">
            <h5 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Per Person Cost Breakdown
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-sm text-muted-foreground">Adult Per Person</div>
                <div className="text-xl font-bold text-primary">
                  {formatCurrency(pricingCalc.adultPrice / query.paxDetails.adults, pricingCalc.currency)}
                </div>
                <div className="text-xs text-muted-foreground">x {query.paxDetails.adults} adults</div>
              </div>
              <div className="text-center p-3 bg-secondary/20 rounded-lg border border-secondary/30">
                <div className="text-sm text-muted-foreground">Child Per Person</div>
                <div className="text-xl font-bold text-secondary-foreground">
                  {query.paxDetails.children > 0 
                    ? formatCurrency(pricingCalc.childPrice / query.paxDetails.children, pricingCalc.currency)
                    : formatCurrency(0, pricingCalc.currency)
                  }
                </div>
                <div className="text-xs text-muted-foreground">x {query.paxDetails.children} children</div>
              </div>
              <div className="text-center p-3 bg-accent rounded-lg border border-accent-foreground/20">
                <div className="text-sm text-muted-foreground">Average Per Person</div>
                <div className="text-xl font-bold text-accent-foreground">
                  {formatCurrency(pricingCalc.perPersonPrice, pricingCalc.currency)}
                </div>
                <div className="text-xs text-muted-foreground">Total: {totalPax} travelers</div>
              </div>
            </div>
          </div>

          {/* Enhanced Accommodation Options Comparison */}
          {hasData && snapshot?.accommodationOptions && snapshot.accommodationOptions.length > 0 && (
            <div className="bg-background/60 rounded-lg p-4 border">
              <h5 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Complete Accommodation Options Analysis
              </h5>
              
              {/* Options Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-medium">Option</th>
                      <th className="text-right p-3 text-sm font-medium">Base Cost</th>
                      <th className="text-right p-3 text-sm font-medium">With Markup</th>
                      <th className="text-right p-3 text-sm font-medium">Per Adult</th>
                      <th className="text-right p-3 text-sm font-medium">Per Child</th>
                      <th className="text-right p-3 text-sm font-medium">Adults Total</th>
                      <th className="text-right p-3 text-sm font-medium">Children Total</th>
                      <th className="text-right p-3 text-sm font-medium">Final Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.accommodationOptions.map((option, index) => {
                      const withMarkup = option.baseTotal + (option.baseTotal * pricingCalc.perPersonMarkup / 100);
                      const perPerson = withMarkup / totalPax;
                      const adultsTotal = perPerson * query.paxDetails.adults;
                      const childrenTotal = perPerson * query.paxDetails.children;
                      
                      return (
                        <tr key={`${option.type}-${index}`} className="border-b hover:bg-muted/30">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                              <span className="text-sm font-medium">
                                {option.type.charAt(0).toUpperCase() + option.type.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="text-right p-3 text-sm">
                            {formatCurrency(option.baseTotal, pricingCalc.currency)}
                          </td>
                          <td className="text-right p-3 text-sm font-medium">
                            {formatCurrency(withMarkup, pricingCalc.currency)}
                          </td>
                          <td className="text-right p-3 text-sm">
                            {formatCurrency(perPerson, pricingCalc.currency)}
                          </td>
                          <td className="text-right p-3 text-sm">
                            {formatCurrency(perPerson, pricingCalc.currency)}
                          </td>
                          <td className="text-right p-3 text-sm text-primary font-medium">
                            {formatCurrency(adultsTotal, pricingCalc.currency)}
                          </td>
                          <td className="text-right p-3 text-sm text-secondary-foreground font-medium">
                            {formatCurrency(childrenTotal, pricingCalc.currency)}
                          </td>
                          <td className="text-right p-3 text-sm font-bold text-accent-foreground">
                            {formatCurrency(withMarkup, pricingCalc.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-primary/10 rounded border border-primary/20">
                  <div className="text-xs text-muted-foreground">Lowest Option</div>
                  <div className="text-sm font-bold text-primary">
                    {formatCurrency(
                      Math.min(...snapshot.accommodationOptions.map(opt => 
                        opt.baseTotal + (opt.baseTotal * pricingCalc.perPersonMarkup / 100)
                      )), 
                      pricingCalc.currency
                    )}
                  </div>
                </div>
                <div className="text-center p-3 bg-secondary/10 rounded border border-secondary/20">
                  <div className="text-xs text-muted-foreground">Highest Option</div>
                  <div className="text-sm font-bold text-secondary-foreground">
                    {formatCurrency(
                      Math.max(...snapshot.accommodationOptions.map(opt => 
                        opt.baseTotal + (opt.baseTotal * pricingCalc.perPersonMarkup / 100)
                      )), 
                      pricingCalc.currency
                    )}
                  </div>
                </div>
                <div className="text-center p-3 bg-accent/10 rounded border border-accent/20">
                  <div className="text-xs text-muted-foreground">Average Price</div>
                  <div className="text-sm font-bold text-accent-foreground">
                    {formatCurrency(
                      snapshot.accommodationOptions.reduce((sum, opt) => 
                        sum + opt.baseTotal + (opt.baseTotal * pricingCalc.perPersonMarkup / 100), 0
                      ) / snapshot.accommodationOptions.length, 
                      pricingCalc.currency
                    )}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded border">
                  <div className="text-xs text-muted-foreground">Price Range</div>
                  <div className="text-sm font-bold">
                    {formatCurrency(
                      Math.max(...snapshot.accommodationOptions.map(opt => 
                        opt.baseTotal + (opt.baseTotal * pricingCalc.perPersonMarkup / 100)
                      )) - 
                      Math.min(...snapshot.accommodationOptions.map(opt => 
                        opt.baseTotal + (opt.baseTotal * pricingCalc.perPersonMarkup / 100)
                      )), 
                      pricingCalc.currency
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Total Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg border">
              <div className="text-sm text-muted-foreground">Base Cost</div>
              <div className="text-lg font-semibold">
                {formatCurrency(pricingCalc.baseCost, pricingCalc.currency)}
              </div>
            </div>
            <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-sm text-muted-foreground">Total Markup</div>
              <div className="text-lg font-semibold text-primary">
                {formatCurrency(pricingCalc.totalMarkup, pricingCalc.currency)}
              </div>
            </div>
            <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
              <div className="text-sm text-muted-foreground">Adults Total</div>
              <div className="text-lg font-semibold text-success-foreground">
                {formatCurrency(pricingCalc.adultPrice, pricingCalc.currency)}
              </div>
            </div>
            <div className="text-center p-3 bg-secondary/20 rounded-lg border border-secondary/30">
              <div className="text-sm text-muted-foreground">Children Total</div>
              <div className="text-lg font-semibold text-secondary-foreground">
                {formatCurrency(pricingCalc.childPrice, pricingCalc.currency)}
              </div>
            </div>
          </div>

          {/* Final Total */}
          <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary/30">
            <div className="text-sm text-muted-foreground mb-2">Final Quote Amount</div>
            <div className="text-3xl font-bold text-primary mb-2">
              {formatCurrency(pricingCalc.finalPrice, pricingCalc.currency)}
            </div>
            <div className="text-sm text-muted-foreground">
              {pricingCalc.markupType} markup applied
              {perPersonMarkup.enableSeparateMarkup && ' • Separate adult/child markup'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedPricingManagement;