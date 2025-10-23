
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Percent, Tag, Users, Calendar, Minus, Plus } from 'lucide-react';

interface DiscountRule {
  id: string;
  type: 'percentage' | 'fixed';
  value: number;
  category: 'group' | 'seasonal' | 'early-bird' | 'loyalty' | 'custom';
  description: string;
  isActive: boolean;
}

interface DiscountManagementSectionProps {
  onDiscountUpdate: (discounts: DiscountRule[]) => void;
  totalAmount: number;
  currency: string;
}

export const DiscountManagementSection: React.FC<DiscountManagementSectionProps> = ({
  onDiscountUpdate,
  totalAmount,
  currency
}) => {
  const [discounts, setDiscounts] = useState<DiscountRule[]>([
    {
      id: '1',
      type: 'percentage',
      value: 5,
      category: 'group',
      description: 'Group Discount (6+ people)',
      isActive: false
    },
    {
      id: '2',
      type: 'percentage',
      value: 10,
      category: 'early-bird',
      description: 'Early Bird Discount (60+ days advance)',
      isActive: false
    },
    {
      id: '3',
      type: 'percentage',
      value: 3,
      category: 'seasonal',
      description: 'Off-Season Discount',
      isActive: false
    }
  ]);

  const [newDiscount, setNewDiscount] = useState({
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    category: 'custom' as DiscountRule['category'],
    description: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateDiscountAmount = (discount: DiscountRule) => {
    if (discount.type === 'percentage') {
      return (totalAmount * discount.value) / 100;
    }
    return discount.value;
  };

  const getTotalDiscountAmount = () => {
    return discounts
      .filter(d => d.isActive)
      .reduce((sum, discount) => sum + calculateDiscountAmount(discount), 0);
  };

  const toggleDiscount = (discountId: string) => {
    const updatedDiscounts = discounts.map(discount =>
      discount.id === discountId
        ? { ...discount, isActive: !discount.isActive }
        : discount
    );
    setDiscounts(updatedDiscounts);
    onDiscountUpdate(updatedDiscounts);
  };

  const addCustomDiscount = () => {
    if (newDiscount.description && newDiscount.value > 0) {
      const customDiscount: DiscountRule = {
        id: Date.now().toString(),
        ...newDiscount,
        isActive: true
      };
      const updatedDiscounts = [...discounts, customDiscount];
      setDiscounts(updatedDiscounts);
      onDiscountUpdate(updatedDiscounts);
      
      // Reset form
      setNewDiscount({
        type: 'percentage',
        value: 0,
        category: 'custom',
        description: ''
      });
    }
  };

  const removeDiscount = (discountId: string) => {
    const updatedDiscounts = discounts.filter(d => d.id !== discountId);
    setDiscounts(updatedDiscounts);
    onDiscountUpdate(updatedDiscounts);
  };

  const getDiscountIcon = (category: DiscountRule['category']) => {
    switch (category) {
      case 'group': return Users;
      case 'early-bird': return Calendar;
      case 'seasonal': return Calendar;
      case 'loyalty': return Tag;
      default: return Percent;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-green-600" />
          Discount Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Available Discounts */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Available Discounts</Label>
          <div className="space-y-2">
            {discounts.map((discount) => {
              const Icon = getDiscountIcon(discount.category);
              const discountAmount = calculateDiscountAmount(discount);
              
              return (
                <div key={discount.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={discount.isActive}
                      onCheckedChange={() => toggleDiscount(discount.id)}
                    />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{discount.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {discount.type === 'percentage' ? `${discount.value}%` : formatCurrency(discount.value)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={discount.isActive ? "default" : "outline"}>
                      -{formatCurrency(discountAmount)}
                    </Badge>
                    {discount.category === 'custom' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeDiscount(discount.id)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Custom Discount */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <Label className="text-sm font-medium">Add Custom Discount</Label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="discount-type" className="text-xs">Type</Label>
              <Select
                value={newDiscount.type}
                onValueChange={(value: 'percentage' | 'fixed') => 
                  setNewDiscount({ ...newDiscount, type: value })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="discount-value" className="text-xs">
                Value {newDiscount.type === 'percentage' ? '(%)' : `(${currency})`}
              </Label>
              <Input
                id="discount-value"
                type="number"
                value={newDiscount.value}
                onChange={(e) => setNewDiscount({ ...newDiscount, value: Number(e.target.value) })}
                className="h-8"
                min="0"
              />
            </div>
            
            <div>
              <Label htmlFor="discount-description" className="text-xs">Description</Label>
              <Input
                id="discount-description"
                value={newDiscount.description}
                onChange={(e) => setNewDiscount({ ...newDiscount, description: e.target.value })}
                placeholder="Discount reason..."
                className="h-8"
              />
            </div>
            
            <div className="flex items-end">
              <Button
                size="sm"
                onClick={addCustomDiscount}
                disabled={!newDiscount.description || newDiscount.value <= 0}
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Discount Summary */}
        <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-green-800 dark:text-green-200">Total Discounts Applied</span>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {discounts.filter(d => d.isActive).length} active
            </Badge>
          </div>
          <div className="flex justify-between text-lg font-bold text-green-700 dark:text-green-300">
            <span>Total Discount:</span>
            <span>-{formatCurrency(getTotalDiscountAmount())}</span>
          </div>
          <div className="flex justify-between text-sm text-green-600 dark:text-green-400 mt-1">
            <span>After Discounts:</span>
            <span>{formatCurrency(totalAmount - getTotalDiscountAmount())}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
