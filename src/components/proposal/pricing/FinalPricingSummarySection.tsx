import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, DollarSign, Users, User, Baby, 
  TrendingUp, Percent, Settings2, Target
} from 'lucide-react';

interface FinalPricingSummarySectionProps {
  pricingBreakdown?: any;
  proposalData?: any;
  formatCurrency: (amount: number) => string;
  onMarkupUpdate?: (markup: number) => void;
}

interface AgentPricingOption {
  id: string;
  name: string;
  showBasePrice: boolean;
  showMarkup: boolean;
  markupPercentage: number;
  description: string;
}

export const FinalPricingSummarySection: React.FC<FinalPricingSummarySectionProps> = ({
  pricingBreakdown,
  proposalData,
  formatCurrency,
  onMarkupUpdate
}) => {
  const [selectedPricingOption, setSelectedPricingOption] = useState('standard');
  const [customMarkup, setCustomMarkup] = useState(15);

  // Predefined pricing options for agents
  const agentPricingOptions: AgentPricingOption[] = [
    {
      id: 'standard',
      name: 'Standard Rate',
      showBasePrice: false,
      showMarkup: false,
      markupPercentage: 15,
      description: 'Regular pricing for most clients'
    },
    {
      id: 'premium',
      name: 'Premium Rate',
      showBasePrice: false,
      showMarkup: false,
      markupPercentage: 25,
      description: 'Higher margin for premium clients'
    },
    {
      id: 'wholesale',
      name: 'Wholesale Rate',
      showBasePrice: true,
      showMarkup: true,
      markupPercentage: 8,
      description: 'Transparent pricing for trade partners'
    },
    {
      id: 'custom',
      name: 'Custom Rate',
      showBasePrice: true,
      showMarkup: true,
      markupPercentage: customMarkup,
      description: 'Custom markup percentage'
    }
  ];

  const currentOption = agentPricingOptions.find(opt => opt.id === selectedPricingOption) || agentPricingOptions[0];

  // Calculate pricing based on selected option
  const calculateFinalPricing = () => {
    if (!pricingBreakdown) return null;

    const basePrice = pricingBreakdown.breakdown?.total?.basePrice || pricingBreakdown.baseAmount || 0;
    const markupAmount = (basePrice * currentOption.markupPercentage) / 100;
    const finalPrice = basePrice + markupAmount;

    const adultCount = pricingBreakdown.breakdown?.adults?.count || pricingBreakdown.breakdown?.adults || 1;
    const childCount = pricingBreakdown.breakdown?.children?.count || pricingBreakdown.breakdown?.children || 0;
    const totalPax = adultCount + childCount;

    return {
      basePrice,
      markupAmount,
      finalPrice,
      perPersonPrice: finalPrice / totalPax,
      adultPrice: finalPrice / totalPax,
      childPrice: (finalPrice / totalPax) * 0.8, // 20% child discount
      markupPercentage: currentOption.markupPercentage
    };
  };

  const finalPricing = calculateFinalPricing();

  const handleMarkupChange = (markup: number) => {
    setCustomMarkup(markup);
    onMarkupUpdate?.(markup);
  };

  if (!pricingBreakdown || !finalPricing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-600" />
            Final Pricing Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Pricing data not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-600" />
            Final Pricing Summary
          </div>
          <Badge variant="outline" className="bg-orange-100 text-orange-700">
            {currentOption.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pricing Option Selector */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Select Pricing Option for Agent</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agentPricingOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedPricingOption(option.id)}
                className={`p-3 border rounded-lg text-left transition-all ${
                  selectedPricingOption === option.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{option.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {option.markupPercentage}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{option.description}</p>
              </button>
            ))}
          </div>

          {/* Custom Markup Input */}
          {selectedPricingOption === 'custom' && (
            <div className="mt-3">
              <Label htmlFor="customMarkup">Custom Markup Percentage</Label>
              <Input
                id="customMarkup"
                type="number"
                value={customMarkup}
                onChange={(e) => handleMarkupChange(Number(e.target.value))}
                min="0"
                max="100"
                className="mt-1"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Final Pricing Display */}
        <div className="space-y-4">
          <h4 className="font-medium">Agent Pricing Display</h4>
          
          <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
            {/* What the agent will see */}
            <div className="space-y-3">
              {currentOption.showBasePrice && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Base Price:</span>
                  <span>{formatCurrency(finalPricing.basePrice)}</span>
                </div>
              )}
              
              {currentOption.showMarkup && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Markup ({finalPricing.markupPercentage}%):</span>
                  <span className="text-green-600">+{formatCurrency(finalPricing.markupAmount)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total Package Price:</span>
                <span className="text-2xl font-bold text-orange-700">
                  {formatCurrency(finalPricing.finalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Per Person Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Adult Pricing</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Per Person:</span>
                  <span className="font-semibold">{formatCurrency(finalPricing.adultPrice)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Count:</span>
                  <span>{pricingBreakdown.breakdown?.adults?.count || 1}</span>
                </div>
              </div>
            </div>

            {(pricingBreakdown.breakdown?.children?.count || 0) > 0 && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Baby className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">Child Pricing</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Per Person:</span>
                    <span className="font-semibold">{formatCurrency(finalPricing.childPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Count:</span>
                    <span>{pricingBreakdown.breakdown?.children?.count || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 pt-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleMarkupChange(15)}
              className="flex items-center gap-1"
            >
              <Percent className="h-3 w-3" />
              Reset to 15%
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedPricingOption('wholesale')}
              className="flex items-center gap-1"
            >
              <Settings2 className="h-3 w-3" />
              Wholesale Mode
            </Button>
          </div>
        </div>

        <Separator />

        {/* Summary Information */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">Pricing Summary</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Base Cost:</span>
              <div className="font-semibold">{formatCurrency(finalPricing.basePrice)}</div>
            </div>
            <div>
              <span className="text-gray-600">Markup:</span>
              <div className="font-semibold text-green-600">+{finalPricing.markupPercentage}%</div>
            </div>
            <div>
              <span className="text-gray-600">Final Price:</span>
              <div className="font-semibold">{formatCurrency(finalPricing.finalPrice)}</div>
            </div>
            <div>
              <span className="text-gray-600">Per Person:</span>
              <div className="font-semibold">{formatCurrency(finalPricing.perPersonPrice)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};