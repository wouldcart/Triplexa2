
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calculator, Settings, DollarSign, Users, Percent, Edit3 } from 'lucide-react';

interface PricingData {
  basePrice: number;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  markup: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  taxes: {
    gst: number;
    serviceTax: number;
    otherTaxes: number;
  };
  discounts: {
    groupDiscount: number;
    seasonalDiscount: number;
    earlyBirdDiscount: number;
  };
}

interface PaxDetails {
  adults: number;
  children: number;
  infants: number;
}

interface AdvancedPricingCalculatorProps {
  basePrice: number;
  paxDetails: PaxDetails;
  onChange: (pricing: any) => void;
  currency?: string;
  readonly?: boolean;
}

const AdvancedPricingCalculator: React.FC<AdvancedPricingCalculatorProps> = ({
  basePrice,
  paxDetails,
  onChange,
  currency = 'USD',
  readonly = false
}) => {
  const [pricing, setPricing] = useState<PricingData>({
    basePrice,
    adultPrice: basePrice,
    childPrice: basePrice * 0.7, // 70% of adult price
    infantPrice: basePrice * 0.1, // 10% of adult price
    markup: {
      type: 'percentage',
      value: 15
    },
    taxes: {
      gst: 18,
      serviceTax: 0,
      otherTaxes: 0
    },
    discounts: {
      groupDiscount: 0,
      seasonalDiscount: 0,
      earlyBirdDiscount: 0
    }
  });

  const [useIndividualPricing, setUseIndividualPricing] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  useEffect(() => {
    const calculated = calculateTotalPricing();
    onChange(calculated);
  }, [pricing, paxDetails, useIndividualPricing]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTotalPricing = () => {
    let subtotal = 0;

    if (useIndividualPricing) {
      subtotal = (pricing.adultPrice * paxDetails.adults) +
                 (pricing.childPrice * paxDetails.children) +
                 (pricing.infantPrice * paxDetails.infants);
    } else {
      subtotal = pricing.basePrice;
    }

    // Apply discounts
    const totalDiscountPercent = pricing.discounts.groupDiscount + 
                               pricing.discounts.seasonalDiscount + 
                               pricing.discounts.earlyBirdDiscount;
    const discountAmount = subtotal * (totalDiscountPercent / 100);
    const afterDiscount = subtotal - discountAmount;

    // Apply markup
    const markupAmount = pricing.markup.type === 'percentage' 
      ? afterDiscount * (pricing.markup.value / 100)
      : pricing.markup.value;
    const afterMarkup = afterDiscount + markupAmount;

    // Apply taxes
    const gstAmount = afterMarkup * (pricing.taxes.gst / 100);
    const serviceTaxAmount = afterMarkup * (pricing.taxes.serviceTax / 100);
    const otherTaxesAmount = afterMarkup * (pricing.taxes.otherTaxes / 100);
    const totalTaxes = gstAmount + serviceTaxAmount + otherTaxesAmount;

    const finalTotal = afterMarkup + totalTaxes;
    const perPersonPrice = finalTotal / (paxDetails.adults + paxDetails.children + paxDetails.infants);

    return {
      subtotal,
      discountAmount,
      afterDiscount,
      markupAmount,
      afterMarkup,
      taxes: {
        gst: gstAmount,
        serviceTax: serviceTaxAmount,
        otherTaxes: otherTaxesAmount,
        total: totalTaxes
      },
      finalTotal,
      perPersonPrice,
      breakdown: {
        adults: useIndividualPricing ? pricing.adultPrice : perPersonPrice,
        children: useIndividualPricing ? pricing.childPrice : perPersonPrice,
        infants: useIndividualPricing ? pricing.infantPrice : perPersonPrice
      }
    };
  };

  const calculatedPricing = calculateTotalPricing();

  const updatePricing = (updates: Partial<PricingData>) => {
    setPricing(prev => ({ ...prev, ...updates }));
  };

  const loadFromSettings = async () => {
    // Load pricing settings from /settings/pricing
    try {
      const savedSettings = localStorage.getItem('pricing_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        updatePricing({
          markup: settings.markup || pricing.markup,
          taxes: settings.taxes || pricing.taxes
        });
      }
    } catch (error) {
      console.error('Failed to load pricing settings:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Advanced Pricing Calculator
          </CardTitle>
          {!readonly && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={loadFromSettings}>
                <Settings className="h-4 w-4 mr-1" />
                Load Settings
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pricing Mode Toggle */}
        {!readonly && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="individual-pricing" className="font-medium">
                Individual Pricing by Age Group
              </Label>
              <p className="text-sm text-muted-foreground">
                Set different prices for adults, children, and infants
              </p>
            </div>
            <Switch
              id="individual-pricing"
              checked={useIndividualPricing}
              onCheckedChange={setUseIndividualPricing}
            />
          </div>
        )}

        {/* Base Pricing */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Base Pricing
          </h4>
          
          {useIndividualPricing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Adult Price</Label>
                <Input
                  type="number"
                  value={pricing.adultPrice}
                  onChange={(e) => updatePricing({ adultPrice: Number(e.target.value) })}
                  disabled={readonly}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {paxDetails.adults} adults × {formatCurrency(pricing.adultPrice)}
                </p>
              </div>
              <div>
                <Label>Child Price (70% of adult)</Label>
                <Input
                  type="number"
                  value={pricing.childPrice}
                  onChange={(e) => updatePricing({ childPrice: Number(e.target.value) })}
                  disabled={readonly}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {paxDetails.children} children × {formatCurrency(pricing.childPrice)}
                </p>
              </div>
              <div>
                <Label>Infant Price (10% of adult)</Label>
                <Input
                  type="number"
                  value={pricing.infantPrice}
                  onChange={(e) => updatePricing({ infantPrice: Number(e.target.value) })}
                  disabled={readonly}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {paxDetails.infants} infants × {formatCurrency(pricing.infantPrice)}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <Label>Total Base Price</Label>
              <Input
                type="number"
                value={pricing.basePrice}
                onChange={(e) => updatePricing({ basePrice: Number(e.target.value) })}
                disabled={readonly}
              />
              <p className="text-xs text-muted-foreground mt-1">
                For all {paxDetails.adults + paxDetails.children + paxDetails.infants} travelers
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Discounts */}
        {!readonly && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Discounts
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Group Discount (%)</Label>
                <Input
                  type="number"
                  value={pricing.discounts.groupDiscount}
                  onChange={(e) => updatePricing({
                    discounts: { ...pricing.discounts, groupDiscount: Number(e.target.value) }
                  })}
                  max="50"
                />
              </div>
              <div>
                <Label>Seasonal Discount (%)</Label>
                <Input
                  type="number"
                  value={pricing.discounts.seasonalDiscount}
                  onChange={(e) => updatePricing({
                    discounts: { ...pricing.discounts, seasonalDiscount: Number(e.target.value) }
                  })}
                  max="30"
                />
              </div>
              <div>
                <Label>Early Bird Discount (%)</Label>
                <Input
                  type="number"
                  value={pricing.discounts.earlyBirdDiscount}
                  onChange={(e) => updatePricing({
                    discounts: { ...pricing.discounts, earlyBirdDiscount: Number(e.target.value) }
                  })}
                  max="20"
                />
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Markup */}
        {!readonly && (
          <div className="space-y-4">
            <h4 className="font-medium">Markup</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Markup Type</Label>
                <Select
                  value={pricing.markup.type}
                  onValueChange={(value) => updatePricing({
                    markup: { ...pricing.markup, type: value as 'percentage' | 'fixed' }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  Markup Value {pricing.markup.type === 'percentage' ? '(%)' : `(${currency})`}
                </Label>
                <Input
                  type="number"
                  value={pricing.markup.value}
                  onChange={(e) => updatePricing({
                    markup: { ...pricing.markup, value: Number(e.target.value) }
                  })}
                />
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Taxes */}
        {!readonly && (
          <div className="space-y-4">
            <h4 className="font-medium">Taxes</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>GST (%)</Label>
                <Input
                  type="number"
                  value={pricing.taxes.gst}
                  onChange={(e) => updatePricing({
                    taxes: { ...pricing.taxes, gst: Number(e.target.value) }
                  })}
                />
              </div>
              <div>
                <Label>Service Tax (%)</Label>
                <Input
                  type="number"
                  value={pricing.taxes.serviceTax}
                  onChange={(e) => updatePricing({
                    taxes: { ...pricing.taxes, serviceTax: Number(e.target.value) }
                  })}
                />
              </div>
              <div>
                <Label>Other Taxes (%)</Label>
                <Input
                  type="number"
                  value={pricing.taxes.otherTaxes}
                  onChange={(e) => updatePricing({
                    taxes: { ...pricing.taxes, otherTaxes: Number(e.target.value) }
                  })}
                />
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Pricing Summary */}
        <div className="space-y-4">
          <h4 className="font-medium">Pricing Summary</h4>
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(calculatedPricing.subtotal)}</span>
            </div>
            
            {calculatedPricing.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Total Discounts:</span>
                <span>-{formatCurrency(calculatedPricing.discountAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>After Discounts:</span>
              <span className="font-medium">{formatCurrency(calculatedPricing.afterDiscount)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Markup:</span>
              <span>+{formatCurrency(calculatedPricing.markupAmount)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Before Tax:</span>
              <span className="font-medium">{formatCurrency(calculatedPricing.afterMarkup)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Total Taxes:</span>
              <span>+{formatCurrency(calculatedPricing.taxes.total)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between text-lg font-bold">
              <span>Final Total:</span>
              <span className="text-green-600">{formatCurrency(calculatedPricing.finalTotal)}</span>
            </div>
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Per Person:</span>
              <span>{formatCurrency(calculatedPricing.perPersonPrice)}</span>
            </div>
          </div>
        </div>

        {/* Per Person Breakdown */}
        {useIndividualPricing && (
          <div className="space-y-3">
            <h4 className="font-medium">Per Person Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 border rounded-lg text-center">
                <Users className="h-4 w-4 mx-auto mb-1" />
                <div className="font-medium">Adults</div>
                <div className="text-sm text-muted-foreground">{paxDetails.adults} × {formatCurrency(calculatedPricing.breakdown.adults)}</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <Users className="h-4 w-4 mx-auto mb-1" />
                <div className="font-medium">Children</div>
                <div className="text-sm text-muted-foreground">{paxDetails.children} × {formatCurrency(calculatedPricing.breakdown.children)}</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <Users className="h-4 w-4 mx-auto mb-1" />
                <div className="font-medium">Infants</div>
                <div className="text-sm text-muted-foreground">{paxDetails.infants} × {formatCurrency(calculatedPricing.breakdown.infants)}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedPricingCalculator;
