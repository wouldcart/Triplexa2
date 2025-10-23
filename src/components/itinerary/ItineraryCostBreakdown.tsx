
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CentralItinerary } from '@/types/itinerary';
import { formatCurrency } from '@/lib/formatters';
import { Calculator, DollarSign, Percent, TrendingUp } from 'lucide-react';

interface ItineraryCostBreakdownProps {
  itinerary: CentralItinerary;
  onUpdatePricing: (pricing: CentralItinerary['pricing']) => void;
  context: 'query' | 'proposal' | 'package';
}

const ItineraryCostBreakdown: React.FC<ItineraryCostBreakdownProps> = ({
  itinerary,
  onUpdatePricing,
  context,
}) => {
  // Ensure pricing object exists with defaults
  const pricing = itinerary.pricing || {
    baseCost: 0,
    finalPrice: 0,
    markup: 0,
    markupType: 'percentage' as const,
    currency: 'USD'
  };
  const accommodationCost = itinerary.days.reduce((sum, day) => 
    sum + (day.accommodation?.price || 0), 0
  );

  const transportCost = itinerary.days.reduce((sum, day) => 
    sum + (day.transport?.reduce((tSum, t) => tSum + t.price, 0) || 0), 0
  );

  const activitiesCost = itinerary.days.reduce((sum, day) => 
    sum + day.activities.reduce((aSum, a) => aSum + a.price, 0), 0
  );

  const mealsCost = itinerary.days.reduce((sum, day) => 
    sum + day.meals.reduce((mSum, m) => mSum + m.price, 0), 0
  );

  const handleMarkupChange = (value: string, type: 'markup' | 'markupType') => {
    const updatedPricing = { ...pricing };
    
    if (type === 'markup') {
      updatedPricing.markup = parseFloat(value) || 0;
    } else {
      updatedPricing.markupType = value as 'percentage' | 'fixed' | 'slab';
    }

    // Recalculate final price
    if (updatedPricing.markupType === 'percentage') {
      updatedPricing.finalPrice = updatedPricing.baseCost + (updatedPricing.baseCost * updatedPricing.markup / 100);
    } else {
      updatedPricing.finalPrice = updatedPricing.baseCost + updatedPricing.markup;
    }

    onUpdatePricing(updatedPricing);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Accommodation</Label>
              <div className="text-lg font-semibold">{formatCurrency(accommodationCost)}</div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Transport</Label>
              <div className="text-lg font-semibold">{formatCurrency(transportCost)}</div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Activities</Label>
              <div className="text-lg font-semibold">{formatCurrency(activitiesCost)}</div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Meals</Label>
              <div className="text-lg font-semibold">{formatCurrency(mealsCost)}</div>
            </div>
          </div>

          <Separator />
          
          <div className="flex justify-between items-center">
            <Label className="text-base font-medium">Subtotal</Label>
            <div className="text-xl font-bold">{formatCurrency(pricing.baseCost)}</div>
          </div>
        </CardContent>
      </Card>

      {(context === 'proposal' || context === 'package') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pricing & Markup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="markupType">Markup Type</Label>
                <Select 
                  value={pricing.markupType} 
                  onValueChange={(value) => handleMarkupChange(value, 'markupType')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="slab">Slab Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="markup">
                  Markup {pricing.markupType === 'percentage' ? '(%)' : `(${pricing.currency})`}
                </Label>
                <Input
                  id="markup"
                  type="number"
                  value={pricing.markup}
                  onChange={(e) => handleMarkupChange(e.target.value, 'markup')}
                  min="0"
                  step={pricing.markupType === 'percentage' ? '0.1' : '1'}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Base Cost:</span>
                <span className="font-medium">{formatCurrency(pricing.baseCost)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">
                  Markup ({pricing.markupType === 'percentage' ? 
                    `${pricing.markup}%` : 
                    formatCurrency(pricing.markup)
                  }):
                </span>
                <span className="font-medium">
                  {pricing.markupType === 'percentage' ? 
                    formatCurrency(pricing.baseCost * pricing.markup / 100) :
                    formatCurrency(pricing.markup)
                  }
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-base font-medium">Final Price:</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(pricing.finalPrice)}
                </span>
              </div>
            </div>

            {context === 'proposal' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">Per Person Cost</span>
                </div>
                <div className="text-lg font-bold text-blue-900">
                  {formatCurrency(pricing.finalPrice / (itinerary.preferences?.travelers?.adults || 1))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daily Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {itinerary.days.map((day) => (
              <div key={day.id} className="flex justify-between items-center p-2 border rounded">
                <span className="font-medium">Day {day.day} - {typeof day.location === 'string' ? day.location : day.location?.city || day.location?.name || 'Location'}</span>
                <span className="font-medium">{formatCurrency(day.totalCost)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ItineraryCostBreakdown;
