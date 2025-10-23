import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PricingService } from '@/services/pricingService';
import { TaxCalculationService } from '@/services/taxCalculationService';
import { initialCountries } from '@/pages/inventory/countries/data/countryData';
import { MarkupSlab } from '@/types/pricing';
import { TaxCalculationResult } from '@/types/taxManagement';
import { Users, Calculator, DollarSign, Percent, Settings, TrendingUp } from 'lucide-react';

// Service types from inventory sections
const SERVICE_TYPES = [
  { value: 'all', label: 'All Services' },
  { value: 'transport', label: 'Transport' },
  { value: 'hotel', label: 'Hotel & Accommodation' },
  { value: 'restaurant', label: 'Restaurant & Dining' },
  { value: 'sightseeing', label: 'Sightseeing & Tours' },
  { value: 'activity', label: 'Activities & Entertainment' }
] as const;

interface AdvancedPricingEngineProps {
  onPricingUpdate?: (pricingData: any) => void;
}

interface PricingConfiguration {
  separateAdultChildCalculation: boolean;
  applySlabOnPerPerson: boolean;
  selectedCountry: string;
  adultPerPersonPrice: number;
  childPerPersonPrice: number;
  totalPax: number;
  adultPax: number;
  childPax: number;
  infantPax: number;
  childDiscountPercent: number;
  infantDiscountPercent: number;
}

interface PricingResult {
  baseAmount: number;
  markupAmount: number;
  markupPercentage: number;
  applicableSlab?: MarkupSlab;
  totalAfterMarkup: number;
  taxCalculation?: TaxCalculationResult;
  finalAmount: number;
  perPersonBreakdown: {
    adult: { basePrice: number; markupPrice: number; finalPrice: number };
    child: { basePrice: number; markupPrice: number; finalPrice: number };
    infant: { basePrice: number; markupPrice: number; finalPrice: number };
  };
}

const AdvancedPricingEngine: React.FC<AdvancedPricingEngineProps> = ({ onPricingUpdate }) => {
  const [config, setConfig] = useState<PricingConfiguration>({
    separateAdultChildCalculation: true,
    applySlabOnPerPerson: true,
    selectedCountry: 'IN',
    adultPerPersonPrice: 1000,
    childPerPersonPrice: 750,
    totalPax: 4,
    adultPax: 2,
    childPax: 2,
    infantPax: 0,
    childDiscountPercent: 25,
    infantDiscountPercent: 90
  });

  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    calculatePricing();
  }, [config]);

  const calculatePricing = () => {
    setIsLoading(true);
    
    try {
      const settings = PricingService.getSettings();
      let result: PricingResult;

      if (config.separateAdultChildCalculation) {
        result = calculateSeparateAdultChild(settings);
      } else {
        result = calculateEqualDistribution(settings);
      }

      // Apply tax calculations
      if (config.selectedCountry && config.selectedCountry !== 'NONE') {
        const taxCalculation = TaxCalculationService.calculateTax(
          result.totalAfterMarkup,
          config.selectedCountry,
          'all',
          false
        );
        
        result.taxCalculation = taxCalculation;
        result.finalAmount = taxCalculation.totalAmount;
      } else {
        result.finalAmount = result.totalAfterMarkup;
      }

      setPricingResult(result);
      onPricingUpdate?.(result);

    } catch (error) {
      console.error('Error calculating pricing:', error);
      toast({
        title: "Calculation Error",
        description: "Failed to calculate pricing. Please check your inputs.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSeparateAdultChild = (settings: any): PricingResult => {
    const slabs = settings.markupSlabs || [];
    
    // Calculate per person pricing with markup
    const adultPriceWithMarkup = config.applySlabOnPerPerson 
      ? applySlabMarkup(config.adultPerPersonPrice, slabs)
      : applyPercentageMarkup(config.adultPerPersonPrice, settings.defaultMarkupPercentage);
    
    const childPriceWithMarkup = config.applySlabOnPerPerson
      ? applySlabMarkup(config.childPerPersonPrice, slabs)
      : applyPercentageMarkup(config.childPerPersonPrice, settings.defaultMarkupPercentage);

    const infantPriceWithMarkup = config.applySlabOnPerPerson
      ? applySlabMarkup(config.childPerPersonPrice * (1 - config.infantDiscountPercent / 100), slabs)
      : applyPercentageMarkup(config.childPerPersonPrice * (1 - config.infantDiscountPercent / 100), settings.defaultMarkupPercentage);

    // Calculate totals
    const baseAmount = (config.adultPerPersonPrice * config.adultPax) + 
                      (config.childPerPersonPrice * config.childPax) +
                      (config.childPerPersonPrice * (1 - config.infantDiscountPercent / 100) * config.infantPax);

    const totalAfterMarkup = (adultPriceWithMarkup.finalPrice * config.adultPax) + 
                            (childPriceWithMarkup.finalPrice * config.childPax) +
                            (infantPriceWithMarkup.finalPrice * config.infantPax);

    const markupAmount = totalAfterMarkup - baseAmount;
    const markupPercentage = baseAmount > 0 ? (markupAmount / baseAmount) * 100 : 0;

    return {
      baseAmount,
      markupAmount,
      markupPercentage,
      applicableSlab: adultPriceWithMarkup.slab || childPriceWithMarkup.slab,
      totalAfterMarkup,
      finalAmount: totalAfterMarkup,
      perPersonBreakdown: {
        adult: {
          basePrice: config.adultPerPersonPrice,
          markupPrice: adultPriceWithMarkup.finalPrice,
          finalPrice: adultPriceWithMarkup.finalPrice
        },
        child: {
          basePrice: config.childPerPersonPrice,
          markupPrice: childPriceWithMarkup.finalPrice,
          finalPrice: childPriceWithMarkup.finalPrice
        },
        infant: {
          basePrice: config.childPerPersonPrice * (1 - config.infantDiscountPercent / 100),
          markupPrice: infantPriceWithMarkup.finalPrice,
          finalPrice: infantPriceWithMarkup.finalPrice
        }
      }
    };
  };

  const calculateEqualDistribution = (settings: any): PricingResult => {
    const totalBaseAmount = (config.adultPerPersonPrice * config.adultPax) + 
                           (config.childPerPersonPrice * config.childPax) +
                           (config.childPerPersonPrice * (1 - config.infantDiscountPercent / 100) * config.infantPax);

    const averagePerPersonPrice = totalBaseAmount / config.totalPax;
    
    const priceWithMarkup = config.applySlabOnPerPerson
      ? applySlabMarkup(averagePerPersonPrice, settings.markupSlabs || [])
      : applyPercentageMarkup(averagePerPersonPrice, settings.defaultMarkupPercentage);

    const totalAfterMarkup = priceWithMarkup.finalPrice * config.totalPax;
    const markupAmount = totalAfterMarkup - totalBaseAmount;
    const markupPercentage = totalBaseAmount > 0 ? (markupAmount / totalBaseAmount) * 100 : 0;

    return {
      baseAmount: totalBaseAmount,
      markupAmount,
      markupPercentage,
      applicableSlab: priceWithMarkup.slab,
      totalAfterMarkup,
      finalAmount: totalAfterMarkup,
      perPersonBreakdown: {
        adult: {
          basePrice: averagePerPersonPrice,
          markupPrice: priceWithMarkup.finalPrice,
          finalPrice: priceWithMarkup.finalPrice
        },
        child: {
          basePrice: averagePerPersonPrice,
          markupPrice: priceWithMarkup.finalPrice,
          finalPrice: priceWithMarkup.finalPrice
        },
        infant: {
          basePrice: averagePerPersonPrice,
          markupPrice: priceWithMarkup.finalPrice,
          finalPrice: priceWithMarkup.finalPrice
        }
      }
    };
  };

  const applySlabMarkup = (amount: number, slabs: MarkupSlab[]) => {
    const applicableSlab = slabs
      .filter(slab => slab.isActive && amount >= slab.minAmount && amount <= slab.maxAmount)
      .sort((a, b) => b.minAmount - a.minAmount)[0];

    if (!applicableSlab) {
      const settings = PricingService.getSettings();
      return {
        finalPrice: amount * (1 + settings.defaultMarkupPercentage / 100),
        markup: amount * (settings.defaultMarkupPercentage / 100),
        slab: null
      };
    }

    const markup = applicableSlab.markupType === 'percentage' 
      ? amount * (applicableSlab.markupValue / 100)
      : applicableSlab.markupValue;

    return {
      finalPrice: amount + markup,
      markup,
      slab: applicableSlab
    };
  };

  const applyPercentageMarkup = (amount: number, percentage: number) => {
    const markup = amount * (percentage / 100);
    return {
      finalPrice: amount + markup,
      markup,
      slab: null
    };
  };

  const handleConfigChange = (field: keyof PricingConfiguration, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev, [field]: value };
      
      // Auto-calculate total pax when individual pax counts change
      if (['adultPax', 'childPax', 'infantPax'].includes(field)) {
        newConfig.totalPax = newConfig.adultPax + newConfig.childPax + newConfig.infantPax;
      }
      
      return newConfig;
    });
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Pricing Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pricing Logic Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <Label>Separate Adult/Child Calculation</Label>
                <p className="text-xs text-muted-foreground">Apply markup separately vs equal distribution</p>
              </div>
              <Switch
                checked={config.separateAdultChildCalculation}
                onCheckedChange={(checked) => handleConfigChange('separateAdultChildCalculation', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <Label>Apply Slab on Per Person</Label>
                <p className="text-xs text-muted-foreground">Use slab markup vs percentage markup</p>
              </div>
              <Switch
                checked={config.applySlabOnPerPerson}
                onCheckedChange={(checked) => handleConfigChange('applySlabOnPerPerson', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Passenger Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Passenger Details
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Adult Pax</Label>
                <Input
                  type="number"
                  value={config.adultPax}
                  onChange={(e) => handleConfigChange('adultPax', Number(e.target.value))}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Child Pax</Label>
                <Input
                  type="number"
                  value={config.childPax}
                  onChange={(e) => handleConfigChange('childPax', Number(e.target.value))}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Infant Pax</Label>
                <Input
                  type="number"
                  value={config.infantPax}
                  onChange={(e) => handleConfigChange('infantPax', Number(e.target.value))}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Total Pax</Label>
                <Input
                  type="number"
                  value={config.totalPax}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Per Person Pricing */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Per Person Base Pricing
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Adult Per Person (₹)</Label>
                <Input
                  type="number"
                  value={config.adultPerPersonPrice}
                  onChange={(e) => handleConfigChange('adultPerPersonPrice', Number(e.target.value))}
                  min="0"
                  step="100"
                />
              </div>

              <div className="space-y-2">
                <Label>Child Per Person (₹)</Label>
                <Input
                  type="number"
                  value={config.childPerPersonPrice}
                  onChange={(e) => handleConfigChange('childPerPersonPrice', Number(e.target.value))}
                  min="0"
                  step="100"
                />
              </div>

              <div className="space-y-2">
                <Label>Country for Tax</Label>
                <Select
                  value={config.selectedCountry}
                  onValueChange={(value) => handleConfigChange('selectedCountry', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {initialCountries.filter(country => country.status === 'active').map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name} ({country.currencySymbol})
                      </SelectItem>
                    ))}
                    <SelectItem value="NONE">No Tax</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Child Discount (%)</Label>
                <Input
                  type="number"
                  value={config.childDiscountPercent}
                  onChange={(e) => handleConfigChange('childDiscountPercent', Number(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <Label>Infant Discount (%)</Label>
                <Input
                  type="number"
                  value={config.infantDiscountPercent}
                  onChange={(e) => handleConfigChange('infantDiscountPercent', Number(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Result */}
      {pricingResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Real-Time Pricing Calculation
              {isLoading && <Badge variant="secondary">Calculating...</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600">Base Amount</div>
                <div className="text-lg font-bold text-blue-800">
                  ₹{pricingResult.baseAmount.toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-orange-600">Markup Amount</div>
                <div className="text-lg font-bold text-orange-800">
                  ₹{pricingResult.markupAmount.toLocaleString()}
                  <span className="text-sm ml-1">({pricingResult.markupPercentage.toFixed(1)}%)</span>
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600">After Markup</div>
                <div className="text-lg font-bold text-green-800">
                  ₹{pricingResult.totalAfterMarkup.toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600">Final Amount</div>
                <div className="text-lg font-bold text-purple-800">
                  ₹{pricingResult.finalAmount.toLocaleString()}
                </div>
              </div>
            </div>

            <Separator />

            {/* Per Person Breakdown */}
            <div className="space-y-4">
              <h4 className="font-medium">Per Person Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="font-medium text-blue-600">Adult ({config.adultPax} pax)</div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Base:</span>
                      <span>₹{pricingResult.perPersonBreakdown.adult.basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>With Markup:</span>
                      <span className="font-medium">₹{pricingResult.perPersonBreakdown.adult.markupPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total:</span>
                      <span>₹{(pricingResult.perPersonBreakdown.adult.finalPrice * config.adultPax).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="font-medium text-green-600">Child ({config.childPax} pax)</div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Base:</span>
                      <span>₹{pricingResult.perPersonBreakdown.child.basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>With Markup:</span>
                      <span className="font-medium">₹{pricingResult.perPersonBreakdown.child.markupPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total:</span>
                      <span>₹{(pricingResult.perPersonBreakdown.child.finalPrice * config.childPax).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="font-medium text-orange-600">Infant ({config.infantPax} pax)</div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Base:</span>
                      <span>₹{pricingResult.perPersonBreakdown.infant.basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>With Markup:</span>
                      <span className="font-medium">₹{pricingResult.perPersonBreakdown.infant.markupPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total:</span>
                      <span>₹{(pricingResult.perPersonBreakdown.infant.finalPrice * config.infantPax).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Breakdown */}
            {pricingResult.taxCalculation && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium">Tax Calculation ({config.selectedCountry})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      {pricingResult.taxCalculation.taxBreakdown.map((tax, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{tax.description} ({tax.rate}%):</span>
                          <span>₹{tax.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-sm text-red-600">Total Tax</div>
                      <div className="text-lg font-bold text-red-800">
                        ₹{pricingResult.taxCalculation.taxAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Applied Slab Information */}
            {pricingResult.applicableSlab && (
              <>
                <Separator />
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="font-medium text-amber-800">Applied Markup Slab</div>
                  <div className="text-sm text-amber-700 mt-1">
                    {pricingResult.applicableSlab.name} - {pricingResult.applicableSlab.markupType === 'percentage' ? `${pricingResult.applicableSlab.markupValue}%` : `₹${pricingResult.applicableSlab.markupValue}`}
                  </div>
                  <div className="text-xs text-amber-600 mt-1">
                    Range: ₹{pricingResult.applicableSlab.minAmount.toLocaleString()} - ₹{pricingResult.applicableSlab.maxAmount.toLocaleString()}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedPricingEngine;