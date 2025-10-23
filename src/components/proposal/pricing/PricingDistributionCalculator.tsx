import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, User, Baby } from 'lucide-react';
import { EnhancedMarkupData } from '@/types/enhancedMarkup';

interface PricingDistributionCalculatorProps {
  markupData: EnhancedMarkupData;
  formatCurrency: (amount: number) => string;
}

export const PricingDistributionCalculator: React.FC<PricingDistributionCalculatorProps> = ({
  markupData,
  formatCurrency
}) => {
  const selectedOption = markupData.options.find(opt => opt.type === markupData.selectedOption);
  
  if (!selectedOption) return null;

  const { distribution, baseTotal, markup, finalTotal } = selectedOption;

  const evenDistribution = {
    perPerson: finalTotal / markupData.totalPax,
    adultTotal: (finalTotal / markupData.totalPax) * markupData.adults,
    childTotal: (finalTotal / markupData.totalPax) * markupData.children
  };

  const separateDistribution = {
    adultPrice: distribution.adultPrice,
    childPrice: distribution.childPrice,
    adultTotal: distribution.adultPrice * markupData.adults,
    childTotal: distribution.childPrice * markupData.children
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Pricing Distribution</h3>
        <p className="text-muted-foreground text-sm">
          Review how costs are distributed between adults and children for the selected accommodation option.
        </p>
      </div>

      {/* Current Selection Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Current Selection: {selectedOption.type.charAt(0).toUpperCase() + selectedOption.type.slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {formatCurrency(baseTotal)}
              </div>
              <div className="text-sm text-muted-foreground">Base Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(markup)}
              </div>
              <div className="text-sm text-muted-foreground">Markup Applied</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(finalTotal)}
              </div>
              <div className="text-sm text-muted-foreground">Final Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribution Methods */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Even Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Even Distribution
              <Badge variant="outline">Recommended</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Total cost divided equally among all passengers ({markupData.totalPax} people).
            </p>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Per Person Rate</span>
                </div>
                <span className="font-bold text-blue-600">
                  {formatCurrency(evenDistribution.perPerson)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Adults ({markupData.adults})</span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(evenDistribution.adultTotal)}
                  </span>
                </div>

                {markupData.children > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Baby className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Children ({markupData.children})</span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(evenDistribution.childTotal)}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(finalTotal)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Separate Adult/Child Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4 text-purple-600" />
              Separate Adult/Child Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Different rates for adults and children based on cost breakdown.
            </p>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Adult Rate</span>
                </div>
                <span className="font-bold text-purple-600">
                  {formatCurrency(separateDistribution.adultPrice)}
                </span>
              </div>

              {markupData.children > 0 && (
                <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Baby className="h-4 w-4 text-pink-600" />
                    <span className="text-sm font-medium">Child Rate</span>
                  </div>
                  <span className="font-bold text-pink-600">
                    {formatCurrency(separateDistribution.childPrice)}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Adults ({markupData.adults}×)</span>
                  <span className="font-medium">
                    {formatCurrency(separateDistribution.adultTotal)}
                  </span>
                </div>

                {markupData.children > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Children ({markupData.children}×)</span>
                    <span className="font-medium">
                      {formatCurrency(separateDistribution.childTotal)}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-purple-600">{formatCurrency(finalTotal)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Distribution Method</th>
                  <th className="text-right py-2">Adult Rate</th>
                  <th className="text-right py-2">Child Rate</th>
                  <th className="text-right py-2">Adult Total</th>
                  <th className="text-right py-2">Child Total</th>
                  <th className="text-right py-2">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-medium">Even Distribution</td>
                  <td className="text-right py-2">{formatCurrency(evenDistribution.perPerson)}</td>
                  <td className="text-right py-2">{formatCurrency(evenDistribution.perPerson)}</td>
                  <td className="text-right py-2">{formatCurrency(evenDistribution.adultTotal)}</td>
                  <td className="text-right py-2">{formatCurrency(evenDistribution.childTotal)}</td>
                  <td className="text-right py-2 font-bold text-blue-600">{formatCurrency(finalTotal)}</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Separate Rates</td>
                  <td className="text-right py-2">{formatCurrency(separateDistribution.adultPrice)}</td>
                  <td className="text-right py-2">{formatCurrency(separateDistribution.childPrice)}</td>
                  <td className="text-right py-2">{formatCurrency(separateDistribution.adultTotal)}</td>
                  <td className="text-right py-2">{formatCurrency(separateDistribution.childTotal)}</td>
                  <td className="text-right py-2 font-bold text-purple-600">{formatCurrency(finalTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};