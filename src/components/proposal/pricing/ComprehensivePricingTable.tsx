import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Hotel, Users, Calculator } from 'lucide-react';
import { EnhancedMarkupData } from '@/types/enhancedMarkup';

interface ComprehensivePricingTableProps {
  markupData: EnhancedMarkupData;
  formatCurrency: (amount: number) => string;
  onOptionSelect: (option: 'standard' | 'optional' | 'alternative') => void;
}

export const ComprehensivePricingTable: React.FC<ComprehensivePricingTableProps> = ({
  markupData,
  formatCurrency,
  onOptionSelect
}) => {
  const getOptionLabel = (type: 'standard' | 'optional' | 'alternative') => {
    switch (type) {
      case 'standard': return 'Standard';
      case 'optional': return 'Optional';
      case 'alternative': return 'Alternative';
    }
  };

  const getOptionColor = (type: 'standard' | 'optional' | 'alternative') => {
    switch (type) {
      case 'standard': return 'text-green-600';
      case 'optional': return 'text-blue-600';
      case 'alternative': return 'text-purple-600';
    }
  };

  const getPrimaryHotel = (option: any) => {
    return option.accommodations[0] || { hotelName: 'No hotel selected' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Comprehensive Pricing Summary</h3>
        <p className="text-muted-foreground text-sm">
          Complete pricing breakdown for all accommodation options with adult/child distribution.
        </p>
      </div>

      {/* Passenger Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Passenger Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{markupData.adults}</div>
              <div className="text-sm text-muted-foreground">Adults</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">{markupData.children}</div>
              <div className="text-sm text-muted-foreground">Children</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{markupData.totalPax}</div>
              <div className="text-sm text-muted-foreground">Total PAX</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Pricing Comparison Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Option</th>
                  <th className="text-left py-3 px-2">Primary Hotel</th>
                  <th className="text-right py-3 px-2">Adult Price</th>
                  <th className="text-right py-3 px-2">Child Price</th>
                  <th className="text-right py-3 px-2">Total Price</th>
                  <th className="text-center py-3 px-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {markupData.options.map((option) => {
                  const primaryHotel = getPrimaryHotel(option);
                  const isSelected = markupData.selectedOption === option.type;
                  
                  return (
                    <tr key={option.type} className={`border-b ${isSelected ? 'bg-muted/50' : ''}`}>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={isSelected ? 'default' : 'outline'}
                            className={getOptionColor(option.type)}
                          >
                            {getOptionLabel(option.type)}
                          </Badge>
                          {isSelected && <CheckCircle className="h-4 w-4 text-green-600" />}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <Hotel className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">{primaryHotel.hotelName}</div>
                            <div className="text-xs text-muted-foreground">
                              {option.accommodations.length} hotel(s)
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-4 px-2 font-medium">
                        {formatCurrency(option.distribution.adultPrice)}
                      </td>
                      <td className="text-right py-4 px-2 font-medium">
                        {markupData.children > 0 
                          ? formatCurrency(option.distribution.childPrice)
                          : 'N/A'
                        }
                      </td>
                      <td className="text-right py-4 px-2">
                        <div className="text-lg font-bold text-primary">
                          {formatCurrency(option.finalTotal)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Base: {formatCurrency(option.baseTotal)}
                        </div>
                      </td>
                      <td className="text-center py-4 px-2">
                        <Button
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onOptionSelect(option.type)}
                          disabled={isSelected}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Selected Option Details */}
      {markupData.selectedOption && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Selected Option Details: {getOptionLabel(markupData.selectedOption)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const selectedOption = markupData.options.find(opt => opt.type === markupData.selectedOption);
              if (!selectedOption) return null;

              return (
                <div className="space-y-4">
                  {/* Cost Breakdown */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">Cost Breakdown</h4>
                      <div className="space-y-2 text-sm">
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
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(selectedOption.baseTotal)}</span>
                        </div>
                        <div className="flex justify-between text-primary">
                          <span>Markup:</span>
                          <span>{formatCurrency(selectedOption.markup)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>{formatCurrency(selectedOption.finalTotal)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Per Person Pricing</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Adult Rate:</span>
                          <span className="font-medium">{formatCurrency(selectedOption.distribution.adultPrice)}</span>
                        </div>
                        {markupData.children > 0 && (
                          <div className="flex justify-between">
                            <span>Child Rate:</span>
                            <span className="font-medium">{formatCurrency(selectedOption.distribution.childPrice)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between">
                          <span>Adults ({markupData.adults}×):</span>
                          <span>{formatCurrency(selectedOption.distribution.adultPrice * markupData.adults)}</span>
                        </div>
                        {markupData.children > 0 && (
                          <div className="flex justify-between">
                            <span>Children ({markupData.children}×):</span>
                            <span>{formatCurrency(selectedOption.distribution.childPrice * markupData.children)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-bold">
                          <span>Grand Total:</span>
                          <span>{formatCurrency(selectedOption.finalTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hotel List */}
                  <div>
                    <h4 className="font-medium mb-2">Included Hotels</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {selectedOption.accommodations.map((accommodation) => (
                        <div key={accommodation.id} className="p-2 border rounded text-sm">
                          <div className="font-medium">{accommodation.hotelName}</div>
                          <div className="text-muted-foreground">
                            {accommodation.roomType} • {accommodation.nights} nights • {accommodation.city}
                          </div>
                          <div className="text-right font-medium">
                            {formatCurrency(accommodation.totalPrice)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};