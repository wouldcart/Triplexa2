import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Percent, Plus, Trash2 } from 'lucide-react';
import { MarkupSettings, MarkupSlab } from '@/types/enhancedMarkup';

interface MarkupSlabManagerProps {
  markupSettings: MarkupSettings;
  onSettingsChange: (settings: MarkupSettings) => void;
  formatCurrency: (amount: number) => string;
}

export const MarkupSlabManager: React.FC<MarkupSlabManagerProps> = ({
  markupSettings,
  onSettingsChange,
  formatCurrency
}) => {
  const [newSlab, setNewSlab] = useState<Partial<MarkupSlab>>({
    minAmount: 0,
    maxAmount: 0,
    percentage: 0
  });

  const handleTypeChange = (type: 'percentage' | 'slab') => {
    onSettingsChange({
      ...markupSettings,
      type
    });
  };

  const handlePercentageChange = (percentage: number) => {
    onSettingsChange({
      ...markupSettings,
      percentage
    });
  };

  const addSlab = () => {
    if (newSlab.minAmount !== undefined && newSlab.maxAmount !== undefined && newSlab.percentage !== undefined) {
      const updatedSlabs = [...(markupSettings.slabs || []), newSlab as MarkupSlab];
      onSettingsChange({
        ...markupSettings,
        slabs: updatedSlabs.sort((a, b) => a.minAmount - b.minAmount)
      });
      setNewSlab({ minAmount: 0, maxAmount: 0, percentage: 0 });
    }
  };

  const removeSlab = (index: number) => {
    const updatedSlabs = markupSettings.slabs?.filter((_, i) => i !== index) || [];
    onSettingsChange({
      ...markupSettings,
      slabs: updatedSlabs
    });
  };

  const updateSlab = (index: number, updatedSlab: MarkupSlab) => {
    const updatedSlabs = [...(markupSettings.slabs || [])];
    updatedSlabs[index] = updatedSlab;
    onSettingsChange({
      ...markupSettings,
      slabs: updatedSlabs.sort((a, b) => a.minAmount - b.minAmount)
    });
  };

  const getMarkupExample = (baseAmount: number) => {
    if (markupSettings.type === 'percentage') {
      const markup = baseAmount * (markupSettings.percentage || 0) / 100;
      return {
        markup,
        total: baseAmount + markup
      };
    } else {
      const slab = markupSettings.slabs?.find(s => 
        baseAmount >= s.minAmount && baseAmount <= s.maxAmount
      );
      const markup = slab ? baseAmount * slab.percentage / 100 : 0;
      return {
        markup,
        total: baseAmount + markup,
        slabRate: slab?.percentage || 0
      };
    }
  };

  const exampleAmounts = [5000, 7500, 12000];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Markup Configuration</h3>
        <p className="text-muted-foreground text-sm">
          Configure markup type and rates for pricing calculations.
        </p>
      </div>

      {/* Markup Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Markup Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={markupSettings.type} 
            onValueChange={(value: 'percentage' | 'slab') => handleTypeChange(value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="percentage" id="percentage" />
              <Label htmlFor="percentage">Fixed Percentage</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="slab" id="slab" />
              <Label htmlFor="slab">Slab-based Rates</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Percentage Configuration */}
      {markupSettings.type === 'percentage' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Fixed Percentage Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="percentage-rate" className="min-w-0">Markup Percentage:</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="percentage-rate"
                  type="number"
                  value={markupSettings.percentage || 0}
                  onChange={(e) => handlePercentageChange(Number(e.target.value))}
                  className="w-20"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span>%</span>
              </div>
            </div>

            <div className="grid gap-3">
              <h4 className="font-medium">Examples:</h4>
              {exampleAmounts.map(amount => {
                const example = getMarkupExample(amount);
                return (
                  <div key={amount} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm">Base: {formatCurrency(amount)}</span>
                    <span className="text-sm text-muted-foreground">
                      Markup: {formatCurrency(example.markup)}
                    </span>
                    <span className="text-sm font-medium">
                      Total: {formatCurrency(example.total)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slab Configuration */}
      {markupSettings.type === 'slab' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Slab-based Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Slabs */}
            <div className="space-y-3">
              {markupSettings.slabs?.map((slab, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 items-center p-3 border rounded">
                  <Input
                    type="number"
                    value={slab.minAmount}
                    onChange={(e) => updateSlab(index, { ...slab, minAmount: Number(e.target.value) })}
                    placeholder="Min Amount"
                  />
                  <Input
                    type="number"
                    value={slab.maxAmount === Infinity ? '' : slab.maxAmount}
                    onChange={(e) => updateSlab(index, { 
                      ...slab, 
                      maxAmount: e.target.value === '' ? Infinity : Number(e.target.value) 
                    })}
                    placeholder="Max Amount"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={slab.percentage}
                      onChange={(e) => updateSlab(index, { ...slab, percentage: Number(e.target.value) })}
                      placeholder="Rate"
                      step="0.1"
                    />
                    <span className="text-sm">%</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => removeSlab(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            {/* Add New Slab */}
            <div>
              <h4 className="font-medium mb-2">Add New Slab</h4>
              <div className="grid grid-cols-4 gap-2 items-center">
                <Input
                  type="number"
                  value={newSlab.minAmount || ''}
                  onChange={(e) => setNewSlab({ ...newSlab, minAmount: Number(e.target.value) })}
                  placeholder="Min Amount"
                />
                <Input
                  type="number"
                  value={newSlab.maxAmount || ''}
                  onChange={(e) => setNewSlab({ 
                    ...newSlab, 
                    maxAmount: e.target.value === '' ? Infinity : Number(e.target.value) 
                  })}
                  placeholder="Max Amount"
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={newSlab.percentage || ''}
                    onChange={(e) => setNewSlab({ ...newSlab, percentage: Number(e.target.value) })}
                    placeholder="Rate"
                    step="0.1"
                  />
                  <span className="text-sm">%</span>
                </div>
                <Button onClick={addSlab} size="sm">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Slab Examples */}
            <div className="space-y-3">
              <h4 className="font-medium">Slab Examples:</h4>
              {exampleAmounts.map(amount => {
                const example = getMarkupExample(amount);
                return (
                  <div key={amount} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm">Base: {formatCurrency(amount)}</span>
                    <Badge variant="outline" className="text-xs">
                      {example.slabRate || 0}% slab
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Markup: {formatCurrency(example.markup)}
                    </span>
                    <span className="text-sm font-medium">
                      Total: {formatCurrency(example.total)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Default Slabs Helper */}
      {markupSettings.type === 'slab' && (!markupSettings.slabs || markupSettings.slabs.length === 0) && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No slabs configured. Add some default slabs?</p>
              <Button 
                onClick={() => onSettingsChange({
                  ...markupSettings,
                  slabs: [
                    { minAmount: 0, maxAmount: 5000, percentage: 10 },
                    { minAmount: 5001, maxAmount: 10000, percentage: 8 },
                    { minAmount: 10001, maxAmount: Infinity, percentage: 7 }
                  ]
                })}
              >
                Add Default Slabs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
