
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Query } from '@/types/query';
import { PricingService } from '@/services/pricingService';
import { formatCurrency } from '@/lib/formatters';
import { 
  Calculator, DollarSign, Users, Edit, Settings, 
  TrendingUp, PieChart, BarChart3, Percent
} from 'lucide-react';

interface EnhancedPricingSummaryProps {
  selectedModules: any[];
  totalPricing: any;
  query: Query;
  currency: string;
  onRemoveModule: (moduleId: string) => void;
  onUpdatePricing: (moduleId: string, pricing: any) => void;
  onCurrencyChange: (currency: string) => void;
}

const EnhancedPricingSummary: React.FC<EnhancedPricingSummaryProps> = ({
  selectedModules,
  totalPricing,
  query,
  currency,
  onRemoveModule,
  onUpdatePricing,
  onCurrencyChange
}) => {
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [customMarkup, setCustomMarkup] = useState<number>(0);
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);

  const paxCount = query.paxDetails.adults + query.paxDetails.children;
  const pricingSettings = PricingService.getSettings();

  const currencies = [
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' }
  ];

  const moduleBreakdown = selectedModules.reduce((acc: any, module) => {
    if (!acc[module.type]) {
      acc[module.type] = { count: 0, total: 0, modules: [] };
    }
    acc[module.type].count++;
    acc[module.type].total += module.pricing.finalPrice;
    acc[module.type].modules.push(module);
    return acc;
  }, {});

  const startEditing = (moduleId: string, currentPrice: number) => {
    setEditingModule(moduleId);
    setTempPrice(currentPrice);
  };

  const saveEdit = () => {
    if (editingModule) {
      onUpdatePricing(editingModule, { finalPrice: tempPrice });
      setEditingModule(null);
      setTempPrice(0);
    }
  };

  const calculateProfitMargin = () => {
    if (totalPricing.subtotal === 0) return 0;
    return ((totalPricing.markup / totalPricing.subtotal) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Currency Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Currency & Exchange
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Proposal Currency</Label>
              <Select value={currency} onValueChange={onCurrencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.name} ({curr.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Exchange Rate</Label>
              <div className="text-sm text-muted-foreground mt-2">
                1 {currency} = 1.00 {currency} (Base)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Breakdown by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Cost Breakdown by Module
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(moduleBreakdown).map(([type, data]: [string, any]) => {
              const percentage = ((data.total / totalPricing.subtotal) * 100).toFixed(1);
              
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-medium">{type}</span>
                      <Badge variant="outline">{data.count} items</Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(data.total)} {currency}
                      </div>
                      <div className="text-xs text-muted-foreground">{percentage}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Module Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Module Pricing Details
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedPricing(!showAdvancedPricing)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Advanced
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedModules.map(module => {
              const isEditing = editingModule === module.id;
              
              return (
                <div key={module.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{module.data.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {module.type} • Base: {formatCurrency(module.pricing.basePrice)} {currency}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(Number(e.target.value))}
                            className="w-20 h-6 text-xs"
                          />
                          <Button size="sm" onClick={saveEdit} className="h-6 w-6 p-0">
                            ✓
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingModule(null)} 
                            className="h-6 w-6 p-0"
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            {formatCurrency(module.pricing.finalPrice)} {currency}
                          </span>
                          {pricingSettings.allowStaffPricingEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(module.id, module.pricing.finalPrice)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Pricing Options */}
      {showAdvancedPricing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Advanced Pricing Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Custom Markup %</Label>
                <Input
                  type="number"
                  value={customMarkup}
                  onChange={(e) => setCustomMarkup(Number(e.target.value))}
                  placeholder="Override markup"
                />
              </div>
              <div>
                <Label>Discount %</Label>
                <Input
                  type="number"
                  placeholder="Apply discount"
                />
              </div>
            </div>
            <div>
              <Label>Markup Strategy</Label>
              <Select defaultValue="standard">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Markup</SelectItem>
                  <SelectItem value="competitive">Competitive Pricing</SelectItem>
                  <SelectItem value="premium">Premium Positioning</SelectItem>
                  <SelectItem value="budget">Budget Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Pricing Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Final Pricing Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PAX Information */}
          <div className="flex items-center justify-between text-sm bg-muted p-2 rounded">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Total Passengers:
            </span>
            <span className="font-medium">
              {query.paxDetails.adults} Adults + {query.paxDetails.children} Children = {paxCount}
            </span>
          </div>

          <Separator />

          {/* Pricing Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal ({selectedModules.length} modules):</span>
              <span>{formatCurrency(totalPricing.subtotal)} {currency}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <Percent className="h-3 w-3" />
                Markup ({calculateProfitMargin()}%):
              </span>
              <span className="text-green-600 font-medium">
                +{formatCurrency(totalPricing.markup)} {currency}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Taxes & Fees:</span>
              <span>{formatCurrency(totalPricing.taxes)} {currency}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Amount:</span>
              <span className="text-primary">
                {formatCurrency(totalPricing.total)} {currency}
              </span>
            </div>
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Per Person:</span>
              <span className="font-medium">
                {formatCurrency(totalPricing.perPerson)} {currency}
              </span>
            </div>
          </div>

          {/* Profit Analysis */}
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-1">Profit Analysis</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
              <div>Gross Profit: {formatCurrency(totalPricing.markup)} {currency}</div>
              <div>Margin: {calculateProfitMargin()}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedPricingSummary;
