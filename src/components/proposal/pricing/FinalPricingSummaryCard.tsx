import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Calculator, TrendingUp, DollarSign } from 'lucide-react';
import { EnhancedMarkupData } from '@/types/enhancedMarkup';

interface TaxResult {
  baseAmount: number;
  taxAmount: number;
  tdsAmount?: number;
  totalAmount: number;
  taxType: string;
  taxRate: number;
  isInclusive: boolean;
}

interface Discount {
  id: string;
  type: 'percentage' | 'fixed';
  value: number;
  category: string;
  description: string;
  isActive: boolean;
}

interface FinalPricingSummaryCardProps {
  markupData: EnhancedMarkupData;
  discounts: Discount[];
  taxResult: TaxResult;
  formatCurrency: (amount: number) => string;
}

export const FinalPricingSummaryCard: React.FC<FinalPricingSummaryCardProps> = ({
  markupData,
  discounts,
  taxResult,
  formatCurrency
}) => {
  const selectedOption = markupData.options.find(opt => opt.type === markupData.selectedOption);
  
  if (!selectedOption) return null;

  // Calculate discount amounts
  const calculateDiscountAmount = (discount: Discount) => {
    if (discount.type === 'percentage') {
      return selectedOption.baseTotal * discount.value / 100;
    }
    return discount.value;
  };

  const totalDiscountAmount = discounts
    .filter(d => d.isActive)
    .reduce((sum, discount) => sum + calculateDiscountAmount(discount), 0);

  // Calculate final amounts
  const baseTotal = selectedOption.baseTotal;
  const markupAmount = selectedOption.markup;
  const afterDiscounts = baseTotal + markupAmount - totalDiscountAmount;
  const taxAmount = taxResult.taxAmount;
  const tdsAmount = taxResult.tdsAmount || 0;
  const finalGrandTotal = afterDiscounts + taxAmount - tdsAmount;

  // Per person calculations
  const perPersonRate = finalGrandTotal / markupData.totalPax;
  const adultTotal = perPersonRate * markupData.adults;
  const childTotal = perPersonRate * markupData.children;

  const activeDiscounts = discounts.filter(d => d.isActive);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xl font-bold mb-2">Final Pricing Summary</h4>
        <p className="text-muted-foreground">
          Complete breakdown of all costs, markups, discounts, and taxes for the selected option.
        </p>
      </div>

      {/* Selected Option Header */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Selected Option: {selectedOption.type.charAt(0).toUpperCase() + selectedOption.type.slice(1)}
            <Badge variant="default">Final Quote</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {formatCurrency(finalGrandTotal)}
            </div>
            <div className="text-muted-foreground">
              Total for {markupData.adults} adults
              {markupData.children > 0 && ` & ${markupData.children} children`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Base Costs */}
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Base Services</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Hotels:</span>
                  <span>{formatCurrency(selectedOption.accommodations.reduce((sum, acc) => sum + acc.totalPrice, 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sightseeing:</span>
                  <span>{formatCurrency(selectedOption.serviceCosts.sightseeing.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport:</span>
                  <span>{formatCurrency(selectedOption.serviceCosts.transport.totalCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dining:</span>
                  <span>{formatCurrency(selectedOption.serviceCosts.dining.total)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Adjustments */}
            <div className="space-y-2">
              <div className="flex justify-between font-medium">
                <span>Subtotal:</span>
                <span>{formatCurrency(baseTotal)}</span>
              </div>
              
              <div className="flex justify-between text-primary">
                <span>Markup ({markupData.markupSettings.type}):</span>
                <span>+{formatCurrency(markupAmount)}</span>
              </div>

              {totalDiscountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discounts:</span>
                  <span>-{formatCurrency(totalDiscountAmount)}</span>
                </div>
              )}

              {taxAmount > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>{taxResult.taxType} ({taxResult.taxRate}%):</span>
                  <span>+{formatCurrency(taxAmount)}</span>
                </div>
              )}

              {tdsAmount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>TDS (2%):</span>
                  <span>-{formatCurrency(tdsAmount)}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-lg">
              <span>Grand Total:</span>
              <span className="text-primary">{formatCurrency(finalGrandTotal)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Per Person Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Per Person Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {formatCurrency(perPersonRate)}
              </div>
              <div className="text-sm text-muted-foreground">Per Person Rate</div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>Adults ({markupData.adults})</span>
                </div>
                <span className="font-medium">{formatCurrency(adultTotal)}</span>
              </div>

              {markupData.children > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-pink-600" />
                    <span>Children ({markupData.children})</span>
                  </div>
                  <span className="font-medium">{formatCurrency(childTotal)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-bold">
                <span>Total ({markupData.totalPax} PAX):</span>
                <span className="text-primary">{formatCurrency(finalGrandTotal)}</span>
              </div>
            </div>

            {/* Passenger Summary */}
            <div className="grid grid-cols-3 gap-2 text-center mt-4">
              <div className="p-2 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-600">{markupData.adults}</div>
                <div className="text-xs text-blue-600">Adults</div>
              </div>
              <div className="p-2 bg-pink-50 rounded">
                <div className="text-lg font-bold text-pink-600">{markupData.children}</div>
                <div className="text-xs text-pink-600">Children</div>
              </div>
              <div className="p-2 bg-primary/10 rounded">
                <div className="text-lg font-bold text-primary">{markupData.totalPax}</div>
                <div className="text-xs text-primary">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applied Discounts */}
      {activeDiscounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Applied Discounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeDiscounts.map((discount) => (
                <div key={discount.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <div>
                    <span className="font-medium">{discount.description}</span>
                    <Badge variant="outline" className="ml-2">
                      {discount.category}
                    </Badge>
                  </div>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(calculateDiscountAmount(discount))}
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total Savings:</span>
                <span className="text-green-600">-{formatCurrency(totalDiscountAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hotels Included */}
      <Card>
        <CardHeader>
          <CardTitle>Hotels Included in {selectedOption.type.charAt(0).toUpperCase() + selectedOption.type.slice(1)} Option</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {selectedOption.accommodations.map((accommodation) => (
              <div key={accommodation.id} className="p-3 border rounded-lg">
                <div className="font-medium">{accommodation.hotelName}</div>
                <div className="text-sm text-muted-foreground">
                  {accommodation.roomType} • {accommodation.nights} nights
                </div>
                <div className="text-sm text-muted-foreground">
                  {accommodation.city}
                </div>
                <div className="text-right font-medium mt-1">
                  {formatCurrency(accommodation.totalPrice)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};