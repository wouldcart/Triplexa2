import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Query } from '@/types/query';
import { EnhancedPricingService } from '@/services/enhancedPricingService';
import { TaxCalculationService } from '@/services/taxCalculationService';
import { Calculator, Users, DollarSign, Percent, Settings } from 'lucide-react';

interface AdvancedPricingCalculatorProps {
  query: Query;
  proposalData?: any;
  onPricingUpdate?: (pricing: any) => void;
}

const AdvancedPricingCalculator: React.FC<AdvancedPricingCalculatorProps> = ({
  query,
  proposalData,
  onPricingUpdate
}) => {
  const [baseAmount, setBaseAmount] = useState<number>(proposalData?.totalCost || 10000);
  const [selectedCountry, setSelectedCountry] = useState<string>('TH');
  const [childDiscountPercent, setChildDiscountPercent] = useState<number>(20);
  const [customMarkup, setCustomMarkup] = useState<number | null>(null);
  const [markupType, setMarkupType] = useState<'percentage' | 'fixed'>('percentage');

  const availableCountries = EnhancedPricingService.getAvailableCountries();
  const settings = EnhancedPricingService.getEnhancedSettings();

  const calculateAdvancedPricing = () => {
    const adults = query.paxDetails.adults;
    const children = query.paxDetails.children;
    const totalPax = adults + children;

    // Calculate adult pricing
    const adultPricing = EnhancedPricingService.calculateCountryBasedPricing(
      baseAmount,
      totalPax,
      selectedCountry
    );

    // Apply custom markup if specified
    if (customMarkup !== null) {
      const customMarkupAmount = markupType === 'percentage' 
        ? (baseAmount * customMarkup) / 100
        : customMarkup;
      
      adultPricing.markup = customMarkupAmount;
      adultPricing.finalPrice = baseAmount + customMarkupAmount;
    }

    // Calculate child pricing with discount
    const childBaseAmount = (baseAmount / totalPax) * children;
    const childDiscountAmount = (childBaseAmount * childDiscountPercent) / 100;
    const childFinalAmount = childBaseAmount - childDiscountAmount;
    
    const childPricing = {
      basePrice: childBaseAmount,
      discountAmount: childDiscountAmount,
      finalPrice: childFinalAmount,
      perPerson: children > 0 ? childFinalAmount / children : 0,
      discountPercent: childDiscountPercent
    };

    // Calculate taxes
    const taxResult = TaxCalculationService.calculateTax(
      adultPricing.finalPrice,
      selectedCountry,
      'hotel',
      false
    );

    const finalPricing = {
      basePrice: baseAmount,
      markup: adultPricing.markup,
      finalPrice: adultPricing.finalPrice,
      currency: adultPricing.currency,
      adultPricing: {
        basePrice: (baseAmount / totalPax) * adults,
        markup: (adultPricing.markup / totalPax) * adults,
        finalPrice: (adultPricing.finalPrice / totalPax) * adults,
        perPerson: adults > 0 ? (adultPricing.finalPrice / totalPax) : 0
      },
      childPricing,
      taxResult,
      totalAmount: adultPricing.finalPrice + taxResult.totalAmount,
      perPersonTotal: (adultPricing.finalPrice + taxResult.totalAmount) / totalPax
    };

    return finalPricing;
  };

  const pricing = calculateAdvancedPricing();
  const countryRule = settings.countryRules.find(r => r.countryCode === selectedCountry);

  useEffect(() => {
    if (onPricingUpdate) {
      onPricingUpdate({ pricing });
    }
  }, [baseAmount, selectedCountry, childDiscountPercent, customMarkup, markupType, onPricingUpdate]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Advanced Pricing Calculator</h3>
        <p className="text-muted-foreground">
          Separate adult/child pricing with country-based calculations
        </p>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pricing Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Base Amount</Label>
              <Input
                type="number"
                value={baseAmount}
                onChange={(e) => setBaseAmount(Number(e.target.value))}
                placeholder="Enter base amount"
              />
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name} ({country.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Child Discount (%)</Label>
              <Input
                type="number"
                value={childDiscountPercent}
                onChange={(e) => setChildDiscountPercent(Number(e.target.value))}
                min="0"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label>Custom Markup (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={customMarkup || ''}
                  onChange={(e) => setCustomMarkup(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Override markup"
                />
                <Select value={markupType} onValueChange={(value: 'percentage' | 'fixed') => setMarkupType(value)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="fixed">$</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {countryRule && (
            <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
              <Badge variant="outline">{countryRule.tier} tier</Badge>
              <span>Default markup: {countryRule.defaultMarkup}%</span>
              <span>Region: {countryRule.region}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adult Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Adult Pricing ({query.paxDetails.adults} Adults)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Base Amount:</span>
              <span className="font-medium">{pricing.currency} {pricing.adultPricing.basePrice.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Markup:</span>
              <span className="font-medium text-green-600">
                +{pricing.currency} {pricing.adultPricing.markup.toLocaleString()}
              </span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Adult Total:</span>
              <span className="font-semibold">{pricing.currency} {pricing.adultPricing.finalPrice.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Per Adult:</span>
              <span className="font-medium">{pricing.currency} {pricing.adultPricing.perPerson.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Child Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Child Pricing ({query.paxDetails.children} Children)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {query.paxDetails.children > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Base Amount:</span>
                  <span className="font-medium">{pricing.currency} {pricing.childPricing.basePrice.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Discount ({childDiscountPercent}%):
                  </span>
                  <span className="font-medium text-red-600">
                    -{pricing.currency} {pricing.childPricing.discountAmount.toLocaleString()}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Child Total:</span>
                  <span className="font-semibold">{pricing.currency} {pricing.childPricing.finalPrice.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Per Child:</span>
                  <span className="font-medium">{pricing.currency} {pricing.childPricing.perPerson.toLocaleString()}</span>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No children in this booking</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Final Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Final Pricing Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {pricing.currency} {pricing.totalAmount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Amount (incl. tax)</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-semibold">
                  {pricing.currency} {pricing.perPersonTotal.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Per Person Average</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-medium">
                  {((pricing.markup / pricing.basePrice) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Effective Margin</div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Subtotal</div>
                <div className="text-muted-foreground">{pricing.currency} {pricing.finalPrice.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium">Tax Amount</div>
                <div className="text-muted-foreground">{pricing.currency} {pricing.taxResult.totalAmount.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium">Total PAX</div>
                <div className="text-muted-foreground">{query.paxDetails.adults + query.paxDetails.children}</div>
              </div>
              <div>
                <div className="font-medium">Currency</div>
                <div className="text-muted-foreground">{pricing.currency}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedPricingCalculator;