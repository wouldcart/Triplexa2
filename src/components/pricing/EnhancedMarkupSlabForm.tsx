import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { MarkupSlab } from '@/types/pricing';
import { CurrencyService } from '@/services/currencyService';
import { EnhancedPricingService } from '@/services/enhancedPricingService';
import { PricingService } from '@/services/pricingService';
import { Plus, Edit, Save, X, Percent, DollarSign, Users, Calculator } from 'lucide-react';

interface EnhancedMarkupSlabFormProps {
  slab?: MarkupSlab;
  onSave: (slab: MarkupSlab) => void;
  onCancel: () => void;
  existingSlabs: MarkupSlab[];
  isEditing?: boolean;
}

const EnhancedMarkupSlabForm: React.FC<EnhancedMarkupSlabFormProps> = ({
  slab,
  onSave,
  onCancel,
  existingSlabs,
  isEditing = false
}) => {
  const { toast } = useToast();
  const enhancedSettings = EnhancedPricingService.getEnhancedSettings();
  const currentSettings = PricingService.getSettings();
  
  const [formData, setFormData] = useState<Partial<MarkupSlab>>({
    name: slab?.name || '',
    minAmount: slab?.minAmount || 0,
    maxAmount: slab?.maxAmount || 0,
    markupType: slab?.markupType || 'percentage',
    markupValue: slab?.markupValue || 0,
    currency: slab?.currency || enhancedSettings.currencyConversion.baseCurrency || 'THB',
    isActive: slab?.isActive ?? true
  });

  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    if (slab?.currency) {
      const countries = CurrencyService.getCountriesByCurrency(slab.currency);
      return countries.length > 0 ? countries[0].code : enhancedSettings.defaultCountry || 'TH';
    }
    return enhancedSettings.defaultCountry || 'TH';
  });

  const [slabApplicationMode, setSlabApplicationMode] = useState<'per-person' | 'total'>(
    currentSettings.slabApplicationMode || 'total'
  );

  const [previewPaxCount, setPreviewPaxCount] = useState(2);

  // Update currency when country changes
  useEffect(() => {
    const country = CurrencyService.getCountryByCode(selectedCountry);
    if (country && country.currency !== formData.currency) {
      setFormData(prev => ({
        ...prev,
        currency: country.currency
      }));
    }
  }, [selectedCountry, formData.currency]);

  const handleSubmit = () => {
    // Validation
    if (!formData.name || !formData.minAmount || !formData.maxAmount || !formData.markupValue) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (formData.minAmount! >= formData.maxAmount!) {
      toast({
        title: "Validation Error",
        description: "Maximum amount must be greater than minimum amount.",
        variant: "destructive"
      });
      return;
    }

    if (formData.markupValue! < 0) {
      toast({
        title: "Validation Error",
        description: "Markup value cannot be negative.",
        variant: "destructive"
      });
      return;
    }

    // Check for overlapping slabs with same currency
    const overlappingSlab = existingSlabs.find(existingSlab => 
      existingSlab.isActive && 
      existingSlab.currency === formData.currency &&
      existingSlab.id !== slab?.id &&
      (
        (formData.minAmount! >= existingSlab.minAmount && formData.minAmount! <= existingSlab.maxAmount) ||
        (formData.maxAmount! >= existingSlab.minAmount && formData.maxAmount! <= existingSlab.maxAmount) ||
        (formData.minAmount! <= existingSlab.minAmount && formData.maxAmount! >= existingSlab.maxAmount)
      )
    );

    if (overlappingSlab) {
      const currencyInfo = CurrencyService.getCurrencyInfo(formData.currency!);
      toast({
        title: "Validation Error",
        description: `Price range overlaps with existing slab "${overlappingSlab.name}" in ${currencyInfo.name}.`,
        variant: "destructive"
      });
      return;
    }

    // Update global slab application mode if changed
    if (slabApplicationMode !== currentSettings.slabApplicationMode) {
      PricingService.updateSettings({ slabApplicationMode });
      toast({
        title: "Settings Updated",
        description: `Slab application mode updated to ${slabApplicationMode === 'per-person' ? 'per-person' : 'total amount'}.`
      });
    }

    const slabData: MarkupSlab = {
      id: slab?.id || `slab_${Date.now()}`,
      name: formData.name!,
      minAmount: formData.minAmount!,
      maxAmount: formData.maxAmount!,
      markupType: formData.markupType!,
      markupValue: formData.markupValue!,
      currency: formData.currency!,
      isActive: formData.isActive!,
      createdAt: slab?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(slabData);
  };

  const currencyInfo = CurrencyService.getCurrencyInfo(formData.currency || 'THB');
  const availableCountries = CurrencyService.getCountryInfo();

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEditing ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          {isEditing ? 'Edit Markup Slab' : 'Create New Markup Slab'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Slab Name *</Label>
            <Input
              placeholder="e.g., Budget Range"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Country (Sets Currency) *</Label>
            <Select
              value={selectedCountry}
              onValueChange={setSelectedCountry}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {availableCountries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center gap-2">
                      <span>{country.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {country.currencySymbol} {country.currency}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Currency: {currencyInfo.symbol} {currencyInfo.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Minimum Amount *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{currencyInfo.symbol}</span>
              <Input
                type="number"
                placeholder="0"
                value={formData.minAmount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, minAmount: Number(e.target.value) }))}
                min="0"
                step={currencyInfo.decimals === 0 ? "1" : "0.01"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Maximum Amount *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{currencyInfo.symbol}</span>
              <Input
                type="number"
                placeholder="0"
                value={formData.maxAmount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, maxAmount: Number(e.target.value) }))}
                min="0"
                step={currencyInfo.decimals === 0 ? "1" : "0.01"}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Markup Type *</Label>
            <Select
              value={formData.markupType}
              onValueChange={(value: 'percentage' | 'fixed') => setFormData(prev => ({ ...prev, markupType: value }))}
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
            <Label>Markup Value *</Label>
            <div className="flex items-center gap-2">
              {formData.markupType === 'fixed' && (
                <span className="text-sm font-medium">{currencyInfo.symbol}</span>
              )}
              <Input
                type="number"
                placeholder="0"
                value={formData.markupValue || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, markupValue: Number(e.target.value) }))}
                min="0"
                step={formData.markupType === 'fixed' && currencyInfo.decimals === 0 ? "1" : "0.01"}
              />
              {formData.markupType === 'percentage' && (
                <Percent className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Per-Person Application Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Slab Application Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Choose how slab ranges are applied to pricing calculations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={slabApplicationMode === 'per-person' ? "default" : "outline"}>
                {slabApplicationMode === 'per-person' ? "Per Person" : "Total Amount"}
              </Badge>
              <Switch
                checked={slabApplicationMode === 'per-person'}
                onCheckedChange={(checked) => setSlabApplicationMode(checked ? 'per-person' : 'total')}
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded">
            {slabApplicationMode === 'per-person' 
              ? "✓ Slab ranges will be compared against per-person amounts (Total Amount ÷ Number of Travelers)"
              : "✓ Slab ranges will be compared against total booking amount"
            }
          </div>

          {/* Country-specific note for Thailand */}
          {selectedCountry === 'TH' && (
            <div className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">TH</Badge>
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Thailand Enhanced Pricing
                </span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                For Thailand bookings, per-person application is recommended for accurate group pricing and better margin control.
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Enhanced Preview with Per-Person Calculation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Preview Calculation
            </Label>
            {slabApplicationMode === 'per-person' && (
              <div className="flex items-center gap-2">
                <Label className="text-xs">Travelers:</Label>
                <Input
                  type="number"
                  value={previewPaxCount}
                  onChange={(e) => setPreviewPaxCount(Math.max(1, Number(e.target.value) || 1))}
                  min="1"
                  max="20"
                  className="w-16 h-8 text-xs"
                />
              </div>
            )}
          </div>
          
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-1">Slab Range:</p>
                <p>
                  {CurrencyService.formatCurrency(formData.minAmount || 0, formData.currency || 'THB')} - 
                  {CurrencyService.formatCurrency(formData.maxAmount || 0, formData.currency || 'THB')}
                </p>
              </div>
              
              <div>
                <p className="font-medium mb-1">Markup:</p>
                <p>
                  {formData.markupType === 'percentage' 
                    ? `${formData.markupValue || 0}% markup` 
                    : `${CurrencyService.formatCurrency(formData.markupValue || 0, formData.currency || 'THB')} fixed markup`
                  }
                </p>
              </div>
            </div>

            {slabApplicationMode === 'per-person' && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">
                  Real-Time Per-Person Calculation ({previewPaxCount} travelers):
                </p>
                <div className="space-y-2 text-xs">
                  {/* Dynamic calculation scenarios - constrained to slab range */}
                  {[
                    { scenario: 'Minimum Range', baseAmount: formData.minAmount || 0 },
                    { scenario: 'Mid Range', baseAmount: Math.min(((formData.minAmount || 0) + (formData.maxAmount || 0)) / 2, formData.maxAmount || 0) },
                    { scenario: 'At Maximum', baseAmount: formData.maxAmount || 0 }
                  ].filter(({ baseAmount }) => baseAmount <= (formData.maxAmount || 0)).map(({ scenario, baseAmount }, index) => {
                    const totalAmount = baseAmount * previewPaxCount;
                    const perPersonAmount = baseAmount;
                    const isInRange = perPersonAmount >= (formData.minAmount || 0) && perPersonAmount <= (formData.maxAmount || 0);
                    const markupPerPerson = formData.markupType === 'percentage' 
                      ? (perPersonAmount * (formData.markupValue || 0) / 100)
                      : (formData.markupValue || 0);
                    const totalMarkup = markupPerPerson * previewPaxCount;
                    const finalTotal = totalAmount + totalMarkup;
                    
                    return (
                      <div key={index} className={`p-2 rounded border ${isInRange ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-gray-50/50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-700'}`}>
                        <div className="font-medium text-xs mb-1">{scenario}</div>
                        <div className="grid grid-cols-2 gap-1">
                          <div>
                            <span className="text-muted-foreground">Total: </span>
                            <span className="font-medium">{CurrencyService.formatCurrency(totalAmount, formData.currency || 'THB')}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Per Person: </span>
                            <span className="font-medium">{CurrencyService.formatCurrency(perPersonAmount, formData.currency || 'THB')}</span>
                          </div>
                          <div className="col-span-2">
                            {isInRange ? (
                              <div className="text-green-700 dark:text-green-300">
                                <span>✓ Slab applies - Markup: </span>
                                <span className="font-medium">
                                  {CurrencyService.formatCurrency(markupPerPerson, formData.currency || 'THB')}/person 
                                  (Total: {CurrencyService.formatCurrency(totalMarkup, formData.currency || 'THB')})
                                </span>
                                <div className="text-xs mt-1">
                                  <span className="text-muted-foreground">Final Total: </span>
                                  <span className="font-bold text-primary">{CurrencyService.formatCurrency(finalTotal, formData.currency || 'THB')}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-amber-700 dark:text-amber-300">
                                <span>⚠ Outside range - No markup applied</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Quick comparison table */}
                  <div className="mt-3 p-2 bg-primary/5 rounded border border-primary/20">
                    <div className="text-xs font-medium mb-1 text-primary">Quick Comparison</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-muted-foreground">Min Markup</div>
                        <div className="font-medium">
                          {CurrencyService.formatCurrency(
                            (formData.markupType === 'percentage' 
                              ? ((formData.minAmount || 0) * (formData.markupValue || 0) / 100)
                              : (formData.markupValue || 0)) * previewPaxCount, 
                            formData.currency || 'THB'
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Avg Markup</div>
                        <div className="font-medium">
                          {CurrencyService.formatCurrency(
                            (formData.markupType === 'percentage' 
                              ? (((formData.minAmount || 0) + (formData.maxAmount || 0)) / 2 * (formData.markupValue || 0) / 100)
                              : (formData.markupValue || 0)) * previewPaxCount, 
                            formData.currency || 'THB'
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Max Markup</div>
                        <div className="font-medium">
                          {CurrencyService.formatCurrency(
                            (formData.markupType === 'percentage' 
                              ? ((formData.maxAmount || 0) * (formData.markupValue || 0) / 100)
                              : (formData.markupValue || 0)) * previewPaxCount, 
                            formData.currency || 'THB'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSubmit} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? 'Update Slab' : 'Create Slab'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedMarkupSlabForm;