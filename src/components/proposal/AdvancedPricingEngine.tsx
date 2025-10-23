
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Query } from '@/types/query';
import { formatCurrency } from '@/lib/formatters';
import { 
  Calculator, TrendingUp, Percent, DollarSign, 
  PieChart, Trash2, Edit3, Eye
} from 'lucide-react';

interface SelectedModule {
  id: string;
  type: 'transport' | 'hotel' | 'sightseeing' | 'restaurant' | 'additional';
  data: any;
  pricing: {
    basePrice: number;
    finalPrice: number;
    currency: string;
  };
}

interface ProposalFormData {
  title: string;
  validUntil: Date;
  currency: string;
  paymentTerms: string;
  inclusions: string[];
  exclusions: string[];
  notes: string;
  markupType: 'percentage' | 'fixed';
  markupValue: number;
  branding: {
    companyLogo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
}

interface AdvancedPricingEngineProps {
  selectedModules: SelectedModule[];
  totalPricing: any;
  query: Query;
  proposalData: ProposalFormData;
  onRemoveModule: (moduleId: string) => void;
  onUpdatePricing: (moduleId: string, pricing: any) => void;
  onUpdateProposalData: (data: any) => void;
}

const AdvancedPricingEngine: React.FC<AdvancedPricingEngineProps> = ({
  selectedModules,
  totalPricing,
  query,
  proposalData,
  onRemoveModule,
  onUpdatePricing,
  onUpdateProposalData
}) => {
  const paxCount = query.paxDetails.adults + query.paxDetails.children;

  const currencies = [
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'USD', name: 'US Dollar', symbol: '$' }
  ];

  const handleMarkupTypeChange = (type: 'percentage' | 'fixed') => {
    onUpdateProposalData({
      ...proposalData,
      markupType: type,
      markupValue: type === 'percentage' ? 10 : 500
    });
  };

  const handleMarkupValueChange = (value: string) => {
    onUpdateProposalData({
      ...proposalData,
      markupValue: parseFloat(value) || 0
    });
  };

  const handleCurrencyChange = (currency: string) => {
    onUpdateProposalData({
      ...proposalData,
      currency
    });
  };

  const moduleTypeCounts = selectedModules.reduce((acc, module) => {
    acc[module.type] = (acc[module.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const moduleTypeColors = {
    transport: 'bg-blue-100 text-blue-800',
    hotel: 'bg-green-100 text-green-800',
    sightseeing: 'bg-purple-100 text-purple-800',
    restaurant: 'bg-orange-100 text-orange-800',
    additional: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="space-y-6">
      {/* Pricing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Pricing Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={proposalData.currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Markup Type</Label>
              <Select 
                value={proposalData.markupType} 
                onValueChange={handleMarkupTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Percentage
                    </div>
                  </SelectItem>
                  <SelectItem value="fixed">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Fixed Amount
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Markup Value 
                {proposalData.markupType === 'percentage' ? ' (%)' : ` (${proposalData.currency})`}
              </Label>
              <Input
                type="number"
                value={proposalData.markupValue}
                onChange={(e) => handleMarkupValueChange(e.target.value)}
                placeholder={proposalData.markupType === 'percentage' ? '10' : '500'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Module Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Module Type Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(moduleTypeCounts).map(([type, count]) => (
                <div key={type} className="text-center">
                  <div className={`p-3 rounded-lg ${moduleTypeColors[type as keyof typeof moduleTypeColors]}`}>
                    <div className="font-semibold">{count}</div>
                    <div className="text-xs capitalize">{type}</div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Individual Modules */}
            <div className="space-y-3">
              {selectedModules.map((module, index) => (
                <div key={module.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{module.data.name}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {module.type}
                        </Badge>
                      </div>
                      {module.data.location && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {module.data.location}
                        </p>
                      )}
                      {module.data.duration && (
                        <p className="text-xs text-muted-foreground">
                          Duration: {module.data.duration}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(module.pricing.finalPrice)} {module.pricing.currency}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Base: {formatCurrency(module.pricing.basePrice)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onRemoveModule(module.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pricing Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cost Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium">Cost Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(totalPricing.subtotal)} {totalPricing.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Markup ({proposalData.markupType === 'percentage' ? `${proposalData.markupValue}%` : 'Fixed'}):
                    </span>
                    <span>{formatCurrency(totalPricing.markup)} {totalPricing.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes & Fees (7%):</span>
                    <span>{formatCurrency(totalPricing.taxes)} {totalPricing.currency}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span className="text-primary">
                      {formatCurrency(totalPricing.total)} {totalPricing.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Per Person & Analytics */}
              <div className="space-y-3">
                <h4 className="font-medium">Per Person Analytics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Cost per Person:</span>
                    <span>{formatCurrency(totalPricing.perPerson)} {totalPricing.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total PAX:</span>
                    <span>{paxCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit Margin:</span>
                    <span className="text-green-600">
                      {((totalPricing.markup / totalPricing.subtotal) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost per Day:</span>
                    <span>
                      {formatCurrency(totalPricing.total / query.tripDuration.days)} {totalPricing.currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Variations */}
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">Quick Pricing Variations</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Budget (-20%)', multiplier: 0.8, color: 'text-blue-600' },
                  { label: 'Standard', multiplier: 1, color: 'text-gray-600' },
                  { label: 'Premium (+25%)', multiplier: 1.25, color: 'text-purple-600' }
                ].map((variation, index) => (
                  <div key={index} className="border rounded-lg p-3 text-center">
                    <div className={`font-medium ${variation.color}`}>
                      {variation.label}
                    </div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(totalPricing.total * variation.multiplier)} {totalPricing.currency}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency((totalPricing.total * variation.multiplier) / paxCount)} per person
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedPricingEngine;
