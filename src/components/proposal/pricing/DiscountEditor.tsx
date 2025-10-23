import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Percent, Plus, Trash2, Tag } from 'lucide-react';

interface Discount {
  id: string;
  type: 'percentage' | 'fixed';
  value: number;
  category: 'group' | 'seasonal' | 'early-bird' | 'loyalty' | 'custom';
  description: string;
  isActive: boolean;
}

interface DiscountEditorProps {
  discounts: Discount[];
  onDiscountsChange: (discounts: Discount[]) => void;
  baseAmount: number;
  formatCurrency: (amount: number) => string;
}

export const DiscountEditor: React.FC<DiscountEditorProps> = ({
  discounts,
  onDiscountsChange,
  baseAmount,
  formatCurrency
}) => {
  const [newDiscount, setNewDiscount] = useState<Partial<Discount>>({
    type: 'percentage',
    value: 0,
    category: 'custom',
    description: '',
    isActive: true
  });

  const addDiscount = () => {
    if (newDiscount.value && newDiscount.description) {
      const discount: Discount = {
        id: `discount_${Date.now()}`,
        type: newDiscount.type || 'percentage',
        value: newDiscount.value,
        category: newDiscount.category || 'custom',
        description: newDiscount.description,
        isActive: true
      };
      
      onDiscountsChange([...discounts, discount]);
      setNewDiscount({
        type: 'percentage',
        value: 0,
        category: 'custom',
        description: '',
        isActive: true
      });
    }
  };

  const toggleDiscount = (id: string) => {
    onDiscountsChange(
      discounts.map(discount =>
        discount.id === id ? { ...discount, isActive: !discount.isActive } : discount
      )
    );
  };

  const removeDiscount = (id: string) => {
    onDiscountsChange(discounts.filter(discount => discount.id !== id));
  };

  const calculateDiscountAmount = (discount: Discount) => {
    if (discount.type === 'percentage') {
      return baseAmount * discount.value / 100;
    }
    return discount.value;
  };

  const totalDiscountAmount = discounts
    .filter(d => d.isActive)
    .reduce((sum, discount) => sum + calculateDiscountAmount(discount), 0);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'group': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'seasonal': return 'bg-green-50 text-green-700 border-green-200';
      case 'early-bird': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'loyalty': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-medium mb-2">Discount Management</h4>
        <p className="text-sm text-muted-foreground">
          Apply discounts to adjust the final pricing. Discounts can be percentage-based or fixed amounts.
        </p>
      </div>

      {/* Existing Discounts */}
      {discounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Applied Discounts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {discounts.map((discount) => (
              <div key={discount.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={discount.isActive}
                    onCheckedChange={() => toggleDiscount(discount.id)}
                  />
                  <div>
                    <div className="font-medium">{discount.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={getCategoryColor(discount.category)}>
                        {discount.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {discount.type === 'percentage' ? `${discount.value}%` : formatCurrency(discount.value)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-600">
                    -{formatCurrency(calculateDiscountAmount(discount))}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => removeDiscount(discount.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {totalDiscountAmount > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between font-medium">
                  <span>Total Discount:</span>
                  <span className="text-green-600">-{formatCurrency(totalDiscountAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>After Discounts:</span>
                  <span>{formatCurrency(baseAmount - totalDiscountAmount)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add New Discount */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Discount
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount-type">Discount Type</Label>
              <Select 
                value={newDiscount.type} 
                onValueChange={(value: 'percentage' | 'fixed') => setNewDiscount({...newDiscount, type: value})}
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
              <Label htmlFor="discount-category">Category</Label>
              <Select 
                value={newDiscount.category} 
                onValueChange={(value: any) => setNewDiscount({...newDiscount, category: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Group Discount</SelectItem>
                  <SelectItem value="seasonal">Seasonal Offer</SelectItem>
                  <SelectItem value="early-bird">Early Bird</SelectItem>
                  <SelectItem value="loyalty">Loyalty Discount</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="discount-description">Description</Label>
            <Input
              id="discount-description"
              value={newDiscount.description || ''}
              onChange={(e) => setNewDiscount({...newDiscount, description: e.target.value})}
              placeholder="e.g., Group booking discount for 10+ people"
            />
          </div>

          <div>
            <Label htmlFor="discount-value">
              {newDiscount.type === 'percentage' ? 'Percentage (%)' : 'Amount'}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="discount-value"
                type="number"
                value={newDiscount.value || ''}
                onChange={(e) => setNewDiscount({...newDiscount, value: Number(e.target.value)})}
                placeholder={newDiscount.type === 'percentage' ? '10' : '500'}
                min="0"
                step={newDiscount.type === 'percentage' ? '0.1' : '1'}
              />
              {newDiscount.type === 'percentage' && (
                <Percent className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {newDiscount.value && newDiscount.value > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <span className="text-muted-foreground">Discount Amount: </span>
                <span className="font-medium text-green-600">
                  -{formatCurrency(
                    newDiscount.type === 'percentage' 
                      ? baseAmount * (newDiscount.value / 100)
                      : newDiscount.value
                  )}
                </span>
              </div>
            </div>
          )}

          <Button onClick={addDiscount} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Discount
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
