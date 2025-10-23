import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, DollarSign, Users, TrendingUp, Percent, Target } from 'lucide-react';
import { EnhancedMarkupData } from '@/types/enhancedMarkup';
import { DiscountEditor } from './DiscountEditor';
import { TaxSelector } from './TaxSelector';

interface PricingCalculatorPanelProps {
  markupData: EnhancedMarkupData;
  itineraryData: any[];
  formatCurrency: (amount: number) => string;
}

interface Discount {
  id: string;
  type: 'percentage' | 'fixed';
  value: number;
  category: 'group' | 'seasonal' | 'early-bird' | 'loyalty' | 'custom';
  description: string;
  isActive: boolean;
}

interface TaxResult {
  baseAmount: number;
  taxAmount: number;
  tdsAmount?: number;
  totalAmount: number;
  taxType: string;
  taxRate: number;
  isInclusive: boolean;
}

export const PricingCalculatorPanel: React.FC<PricingCalculatorPanelProps> = ({
  markupData,
  itineraryData,
  formatCurrency
}) => {
  const [customBaseAmount, setCustomBaseAmount] = useState<number>(0);
  const [customPaxCount, setCustomPaxCount] = useState<number>(markupData.totalPax);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [taxResult, setTaxResult] = useState<TaxResult>({
    baseAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
    taxType: 'None',
    taxRate: 0,
    isInclusive: false
  });

  const selectedOption = markupData.options.find(opt => opt.type === markupData.selectedOption);
  const actualBaseAmount = selectedOption?.baseTotal || 0;
  const actualMarkup = selectedOption?.markup || 0;
  const calculatorBaseAmount = customBaseAmount || actualBaseAmount;

  // Calculate markup for custom amount
  const calculateCustomMarkup = useCallback((baseAmount: number, paxCount: number) => {
    const settings = markupData.markupSettings;
    
    if (settings.type === 'percentage') {
      return baseAmount * (settings.percentage || 0) / 100;
    } else if (settings.slabs) {
      const perPersonAmount = baseAmount / paxCount;
      const applicableSlab = settings.slabs.find(slab => 
        perPersonAmount >= slab.minAmount && perPersonAmount <= slab.maxAmount
      );
      
      if (applicableSlab) {
        return baseAmount * applicableSlab.percentage / 100;
      }
    }
    
    return 0;
  }, [markupData.markupSettings]);

  const customMarkup = calculateCustomMarkup(calculatorBaseAmount, customPaxCount);
  const customTotal = calculatorBaseAmount + customMarkup;

  // Calculate discount amount
  const totalDiscountAmount = discounts
    .filter(d => d.isActive)
    .reduce((sum, discount) => {
      if (discount.type === 'percentage') {
        return sum + (customTotal * discount.value / 100);
      }
      return sum + discount.value;
    }, 0);

  const finalAmountAfterDiscounts = customTotal - totalDiscountAmount;

  // Per person calculations
  const perPersonBreakdown = {
    basePerPerson: calculatorBaseAmount / customPaxCount,
    markupPerPerson: customMarkup / customPaxCount,
    totalPerPerson: customTotal / customPaxCount,
    discountPerPerson: totalDiscountAmount / customPaxCount,
    finalPerPerson: finalAmountAfterDiscounts / customPaxCount
  };

  // Profit margin calculation
  const profitMargin = calculatorBaseAmount > 0 ? (customMarkup / calculatorBaseAmount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Real-time Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Interactive Pricing Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="actual" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="actual">Actual Pricing</TabsTrigger>
              <TabsTrigger value="custom">Custom Calculator</TabsTrigger>
            </TabsList>

            <TabsContent value="actual" className="space-y-4">
              {selectedOption ? (
                <div className="space-y-4">
                  {/* Current Option Summary */}
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      {selectedOption.type.charAt(0).toUpperCase() + selectedOption.type.slice(1)} Package Pricing
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Base Amount</p>
                        <p className="text-lg font-semibold">{formatCurrency(actualBaseAmount)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Markup</p>
                        <p className="text-lg font-semibold text-green-600">+{formatCurrency(actualMarkup)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(selectedOption.finalTotal)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Per Person Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Adult Pricing
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Per Adult:</span>
                          <span className="font-medium">{formatCurrency(selectedOption.distribution.adultPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total ({markupData.adults} adults):</span>
                          <span className="font-semibold">{formatCurrency(selectedOption.distribution.adultPrice * markupData.adults)}</span>
                        </div>
                      </div>
                    </div>

                    {markupData.children > 0 && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Child Pricing
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Per Child:</span>
                            <span className="font-medium">{formatCurrency(selectedOption.distribution.childPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total ({markupData.children} children):</span>
                            <span className="font-semibold">{formatCurrency(selectedOption.distribution.childPrice * markupData.children)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profit Analysis */}
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Profit Analysis
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>Markup Amount:</span>
                        <span className="font-medium text-green-600">{formatCurrency(actualMarkup)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit Margin:</span>
                        <span className="font-medium text-green-600">
                          {actualBaseAmount > 0 ? ((actualMarkup / actualBaseAmount) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No pricing option selected. Please select a package first.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              {/* Custom Input Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customBase">Custom Base Amount</Label>
                  <Input
                    id="customBase"
                    type="number"
                    value={customBaseAmount || ''}
                    onChange={(e) => setCustomBaseAmount(Number(e.target.value) || 0)}
                    placeholder={`Current: ${formatCurrency(actualBaseAmount)}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customPax">Number of Travelers</Label>
                  <Input
                    id="customPax"
                    type="number"
                    value={customPaxCount}
                    onChange={(e) => setCustomPaxCount(Number(e.target.value) || 1)}
                    min="1"
                  />
                </div>
              </div>

              {calculatorBaseAmount > 0 && (
                <>
                  {/* Custom Calculation Results */}
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-medium mb-3">Calculation Results</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Base Amount</p>
                        <p className="text-lg font-semibold">{formatCurrency(calculatorBaseAmount)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Markup</p>
                        <p className="text-lg font-semibold text-green-600">+{formatCurrency(customMarkup)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(customTotal)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Per Person Breakdown */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Per Person Breakdown</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Base/Person</p>
                        <p className="font-medium">{formatCurrency(perPersonBreakdown.basePerPerson)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Markup/Person</p>
                        <p className="font-medium text-green-600">+{formatCurrency(perPersonBreakdown.markupPerPerson)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Total/Person</p>
                        <p className="font-medium">{formatCurrency(perPersonBreakdown.totalPerPerson)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Profit Margin</p>
                        <Badge variant="outline" className="text-green-600">
                          {profitMargin.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Discount Management */}
      {calculatorBaseAmount > 0 && (
        <DiscountEditor
          discounts={discounts}
          onDiscountsChange={setDiscounts}
          baseAmount={customTotal}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Tax Configuration */}
      {calculatorBaseAmount > 0 && (
        <TaxSelector
          baseAmount={finalAmountAfterDiscounts}
          countryCode="TH" // You can make this dynamic based on query
          onTaxChange={setTaxResult}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Final Summary with All Calculations */}
      {calculatorBaseAmount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Complete Pricing Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Step by step breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Base Amount:</span>
                  <span className="font-medium">{formatCurrency(calculatorBaseAmount)}</span>
                </div>
                
                <div className="flex justify-between text-green-600">
                  <span>+ Markup ({profitMargin.toFixed(1)}%):</span>
                  <span className="font-medium">+{formatCurrency(customMarkup)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(customTotal)}</span>
                </div>
                
                {totalDiscountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>- Total Discounts:</span>
                    <span className="font-medium">-{formatCurrency(totalDiscountAmount)}</span>
                  </div>
                )}
                
                {taxResult.taxAmount > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>+ {taxResult.taxType} ({taxResult.taxRate}%):</span>
                    <span className="font-medium">+{formatCurrency(taxResult.taxAmount)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Final Total:</span>
                  <span className="text-primary">
                    {formatCurrency(
                      taxResult.totalAmount > 0 
                        ? taxResult.totalAmount 
                        : finalAmountAfterDiscounts
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Per Person:</span>
                  <span>
                    {formatCurrency(
                      (taxResult.totalAmount > 0 
                        ? taxResult.totalAmount 
                        : finalAmountAfterDiscounts) / customPaxCount
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};