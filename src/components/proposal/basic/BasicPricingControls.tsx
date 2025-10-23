
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Percent, Trash2, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface BasicProposalItem {
  id: string;
  type: 'hotel' | 'transport' | 'restaurant' | 'sightseeing' | 'custom';
  name: string;
  description?: string;
  basePrice: number;
  quantity: number;
  markup: number;
  finalPrice: number;
  currency: string;
  data?: any;
}

interface BasicPricingControlsProps {
  selectedItems: BasicProposalItem[];
  globalMarkup: number;
  onGlobalMarkupChange: (markup: number) => void;
  onApplyGlobalMarkup: () => void;
  onUpdateItemPricing: (itemId: string, markup: number, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  currencySymbol: string;
}

const BasicPricingControls: React.FC<BasicPricingControlsProps> = ({
  selectedItems,
  globalMarkup,
  onGlobalMarkupChange,
  onApplyGlobalMarkup,
  onUpdateItemPricing,
  onRemoveItem,
  currencySymbol
}) => {
  const quickMarkupOptions = [5, 10, 15, 20, 25];

  return (
    <div className="space-y-6">
      {/* Global Pricing Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Global Pricing Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="globalMarkup">Global Markup (%)</Label>
              <Input
                id="globalMarkup"
                type="number"
                value={globalMarkup}
                onChange={(e) => onGlobalMarkupChange(Number(e.target.value))}
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Quick Markup</Label>
              <div className="flex gap-2">
                {quickMarkupOptions.map(percentage => (
                  <Button
                    key={percentage}
                    variant="outline"
                    size="sm"
                    onClick={() => onGlobalMarkupChange(percentage)}
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Apply to All</Label>
              <Button onClick={onApplyGlobalMarkup} className="w-full">
                <Percent className="h-4 w-4 mr-2" />
                Apply {globalMarkup}% to All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Item Pricing */}
      {selectedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Individual Item Pricing ({selectedItems.length} items)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedItems.map((item, index) => (
                <div key={item.id}>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="md:col-span-2">
                      <h4 className="font-medium">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.type}
                        </Badge>
                        {item.description && (
                          <span className="text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Base Price</Label>
                      <div className="text-sm font-medium">
                        {formatCurrency(item.basePrice)} {currencySymbol}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor={`quantity-${item.id}`} className="text-xs">Quantity</Label>
                      <Input
                        id={`quantity-${item.id}`}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => onUpdateItemPricing(item.id, item.markup, Number(e.target.value))}
                        min={1}
                        className="h-8"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor={`markup-${item.id}`} className="text-xs">Markup (%)</Label>
                      <Input
                        id={`markup-${item.id}`}
                        type="number"
                        value={item.markup}
                        onChange={(e) => onUpdateItemPricing(item.id, Number(e.target.value), item.quantity)}
                        min={0}
                        max={100}
                        className="h-8"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <div className="font-bold">
                          {formatCurrency(item.finalPrice)} {currencySymbol}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {index < selectedItems.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Summary */}
      {selectedItems.length > 0 && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Pricing Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} (×{item.quantity})</span>
                  <span>{formatCurrency(item.finalPrice)} {currencySymbol}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Package Price</span>
                <span>
                  {formatCurrency(selectedItems.reduce((sum, item) => sum + item.finalPrice, 0))} {currencySymbol}
                </span>
              </div>
              <div className="text-sm text-muted-foreground text-right">
                Per person: {formatCurrency(selectedItems.reduce((sum, item) => sum + item.finalPrice, 0) / Math.max(selectedItems.find(item => item.type === 'hotel')?.quantity || 1, 1))} {currencySymbol}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedItems.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No Items Selected</h3>
            <p className="text-muted-foreground text-center">
              Add items from the Templates or Inventory tabs to start pricing your proposal.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BasicPricingControls;
