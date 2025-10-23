import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PricingService } from '@/services/pricingService';
import { EnhancedPricingService } from '@/services/enhancedPricingService';
import { CountryCurrencyService } from '@/services/countryCurrencyService';
import { FileText, DollarSign, Globe, Calculator, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MarkupExportPreviewProps {
  onSettingsChange?: () => void;
}

const MarkupExportPreview: React.FC<MarkupExportPreviewProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState(PricingService.getSettings());
  const [enhancedSettings, setEnhancedSettings] = useState(EnhancedPricingService.getEnhancedSettings());
  const [previewAmount, setPreviewAmount] = useState(1000);
  const [previewPax, setPreviewPax] = useState(2);
  const [previewCountry, setPreviewCountry] = useState('TH');
  const [exportPriority, setExportPriority] = useState<'country' | 'slab' | 'standard'>('country');
  const { toast } = useToast();

  useEffect(() => {
    setSettings(PricingService.getSettings());
    setEnhancedSettings(EnhancedPricingService.getEnhancedSettings());
  }, []);

  // Determine active markup method based on settings
  const getActiveMarkupMethod = () => {
    if (enhancedSettings.enableCountryBasedPricing && EnhancedPricingService.getCountryRule(previewCountry)) {
      return 'country';
    }
    if (settings.useSlabPricing && settings.markupSlabs.some(slab => slab.isActive)) {
      return 'slab';
    }
    return 'standard';
  };

  const activeMethod = getActiveMarkupMethod();

  // Calculate preview pricing for each method
  const calculatePreviewPricing = () => {
    const results = {
      country: null as any,
      slab: null as any,
      standard: null as any
    };

    // Country-based calculation
    if (enhancedSettings.enableCountryBasedPricing) {
      results.country = EnhancedPricingService.calculateCountryBasedPricing(
        previewAmount,
        previewPax,
        previewCountry
      );
    }

    // Slab-based calculation - check per-person cost against slab ranges
    if (settings.useSlabPricing) {
      const countryCurrency = CountryCurrencyService.getCurrencyByCountryCode(previewCountry);
      const perPersonCost = previewAmount / previewPax;
      
      // Always check per-person cost against slab ranges (since slabs are typically set for per-person)
      const applicableSlab = settings.markupSlabs.find(slab => 
        slab.isActive && 
        slab.currency === countryCurrency.code &&
        perPersonCost >= slab.minAmount && 
        perPersonCost <= slab.maxAmount
      );

      if (applicableSlab) {
        let markup = 0;
        if (applicableSlab.markupType === 'fixed') {
          // Fixed markup per person
          markup = applicableSlab.markupValue * previewPax;
        } else {
          // Percentage markup on total amount
          markup = (previewAmount * applicableSlab.markupValue) / 100;
        }
        
        results.slab = {
          basePrice: previewAmount,
          markup: Math.round(markup * 100) / 100,
          markupType: 'slab' as const,
          finalPrice: Math.round((previewAmount + markup) * 100) / 100,
          currency: countryCurrency.code,
          perPersonPrice: Math.round(((previewAmount + markup) / previewPax) * 100) / 100,
          totalPrice: Math.round((previewAmount + markup) * 100) / 100,
          appliedSlab: applicableSlab
        };
      } else {
        // No slab matches, use standard markup
        const markup = (previewAmount * settings.defaultMarkupPercentage) / 100;
        results.slab = {
          basePrice: previewAmount,
          markup: Math.round(markup * 100) / 100,
          markupType: 'percentage' as const,
          finalPrice: Math.round((previewAmount + markup) * 100) / 100,
          currency: countryCurrency.code,
          perPersonPrice: Math.round(((previewAmount + markup) / previewPax) * 100) / 100,
          totalPrice: Math.round((previewAmount + markup) * 100) / 100
        };
      }
    }

    // Standard calculation
    const standardCurrency = CountryCurrencyService.getCurrencyByCountryCode(previewCountry);
    results.standard = PricingService.calculateMarkup(previewAmount, previewPax, standardCurrency.code);

    return results;
  };

  const previewResults = calculatePreviewPricing();

  const handleExportPriorityChange = (priority: 'country' | 'slab' | 'standard') => {
    setExportPriority(priority);
    
    // Update settings based on priority
    const updates: any = {};
    
    switch (priority) {
      case 'country':
        EnhancedPricingService.updateEnhancedSettings({ enableCountryBasedPricing: true });
        updates.useSlabPricing = false;
        break;
      case 'slab':
        updates.useSlabPricing = true;
        EnhancedPricingService.updateEnhancedSettings({ enableCountryBasedPricing: false });
        break;
      case 'standard':
        updates.useSlabPricing = false;
        EnhancedPricingService.updateEnhancedSettings({ enableCountryBasedPricing: false });
        break;
    }

    if (Object.keys(updates).length > 0) {
      PricingService.updateSettings({ ...settings, ...updates });
      setSettings(PricingService.getSettings());
      setEnhancedSettings(EnhancedPricingService.getEnhancedSettings());
    }

    toast({
      title: "Export Priority Updated",
      description: `${priority.charAt(0).toUpperCase() + priority.slice(1)} pricing will be used for exports.`
    });

    onSettingsChange?.();
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'country': return <Globe className="h-4 w-4" />;
      case 'slab': return <Calculator className="h-4 w-4" />;
      case 'standard': return <DollarSign className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getMethodColor = (method: string, isActive: boolean) => {
    if (!isActive) return 'secondary';
    switch (method) {
      case 'country': return 'default';
      case 'slab': return 'default';
      case 'standard': return 'outline';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    // Get the currency symbol using the centralized service if we have a country code
    const currencySymbol = CountryCurrencyService.getCurrencyByCountryCode(previewCountry)?.symbol || '$';
    
    // Use symbol-based formatting instead of Intl for consistency
    return `${currencySymbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Markup Export Configuration & Preview
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure which markup method will be used for exports and see live calculations
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Active Method Alert */}
        <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          {activeMethod === exportPriority ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
          <div className="flex-1">
            <p className="font-medium">
              Current Export Method: {activeMethod.charAt(0).toUpperCase() + activeMethod.slice(1)} Pricing
            </p>
            <p className="text-sm text-muted-foreground">
              {activeMethod === exportPriority 
                ? 'Your preferred method is active and will be used for exports'
                : `Your preferred method (${exportPriority}) is not available. ${activeMethod} pricing will be used instead.`
              }
            </p>
          </div>
        </div>

        <Separator />

        {/* Export Priority Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Export Priority Settings</Label>
            <Badge variant="outline" className="flex items-center gap-1">
              {getMethodIcon(activeMethod)}
              Active: {activeMethod.charAt(0).toUpperCase() + activeMethod.slice(1)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['country', 'slab', 'standard'] as const).map((method) => {
              const isAvailable = method === 'country' 
                ? enhancedSettings.countryRules.some(rule => rule.isActive)
                : method === 'slab'
                ? settings.markupSlabs.some(slab => slab.isActive)
                : true;

              return (
                <div
                  key={method}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    exportPriority === method 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  } ${!isAvailable ? 'opacity-50' : ''}`}
                  onClick={() => isAvailable && handleExportPriorityChange(method)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getMethodIcon(method)}
                      <span className="font-medium capitalize">{method} Pricing</span>
                    </div>
                    <Badge variant={getMethodColor(method, exportPriority === method)}>
                      {exportPriority === method ? 'Selected' : isAvailable ? 'Available' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {method === 'country' && 'Location-specific markup rules'}
                    {method === 'slab' && 'Amount-based pricing tiers'}
                    {method === 'standard' && 'Fixed percentage markup'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Live Preview Section */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Live Pricing Preview</Label>
          
          {/* Preview Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm">
                Base Amount {settings.slabApplicationMode === 'per-person' ? '(Per Person)' : '(Total)'}
              </Label>
              <Input
                type="number"
                value={settings.slabApplicationMode === 'per-person' ? previewAmount / previewPax : previewAmount}
                onChange={(e) => {
                  const inputValue = Number(e.target.value);
                  if (settings.slabApplicationMode === 'per-person') {
                    setPreviewAmount(inputValue * previewPax);
                  } else {
                    setPreviewAmount(inputValue);
                  }
                }}
                min="0"
                step="100"
              />
              <div className="text-xs text-muted-foreground">
                {(() => {
                  const currencyInfo = CountryCurrencyService.getCurrencyByCountryCode(previewCountry);
                  return settings.slabApplicationMode === 'per-person' 
                    ? `Total: ${currencyInfo.symbol}${previewAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `Per Person: ${currencyInfo.symbol}${(previewAmount / previewPax).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                })()}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Travelers</Label>
              <Input
                type="number"
                value={previewPax}
                onChange={(e) => setPreviewPax(Number(e.target.value))}
                min="1"
                max="20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Country</Label>
              <Select value={previewCountry} onValueChange={setPreviewCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CountryCurrencyService.getAllCountriesWithCurrency().map((country) => (
                    <SelectItem key={country.countryCode} value={country.countryCode}>
                      {country.countryName} ({country.pricingCurrency || country.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Slab Application Mode</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.slabApplicationMode === 'per-person'}
                    onCheckedChange={(checked) => {
                      const newMode = checked ? 'per-person' : 'total';
                      PricingService.updateSettings({ ...settings, slabApplicationMode: newMode });
                      setSettings(PricingService.getSettings());
                      onSettingsChange?.();
                    }}
                  />
                  <span className="text-sm">
                    {settings.slabApplicationMode === 'per-person' ? 'Per Person' : 'Total Amount'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                   {(() => {
                     const currencyInfo = CountryCurrencyService.getCurrencyByCountryCode(previewCountry);
                     const amount = settings.slabApplicationMode === 'per-person' 
                       ? previewAmount / previewPax 
                       : previewAmount;
                     return `Base: ${currencyInfo.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                   })()}
                </div>
              </div>
            </div>
          </div>

          {/* Slab Matching Display */}
          {settings.useSlabPricing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm font-medium">Per Person Mode</Label>
                  {settings.slabApplicationMode === 'per-person' && (
                    <Badge variant="default" className="text-xs">Active</Badge>
                  )}
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Calculation Base:</span>
                    <span>{(() => {
                      const currencyInfo = CountryCurrencyService.getCurrencyByCountryCode(previewCountry);
                      return `${currencyInfo.symbol}${(previewAmount / previewPax).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per person`;
                    })()}</span>
                  </div>
                  {(() => {
                    const perPersonAmount = previewAmount / previewPax;
                    const currencyInfo = CountryCurrencyService.getCurrencyByCountryCode(previewCountry);
                    const matchingSlab = settings.markupSlabs.find(slab => 
                      slab.isActive && 
                      slab.currency === currencyInfo.code &&
                      perPersonAmount >= slab.minAmount && 
                      perPersonAmount <= slab.maxAmount
                    );
                    return matchingSlab ? (
                      <div className="flex justify-between text-green-600">
                        <span>✓ Matched Slab:</span>
                        <span>{matchingSlab.name}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-amber-600">
                        <span>⚠ No Slab Match:</span>
                        <span>Default markup</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm font-medium">Total Amount Mode</Label>
                  {settings.slabApplicationMode === 'total' && (
                    <Badge variant="default" className="text-xs">Active</Badge>
                  )}
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Calculation Base:</span>
                    <span>{(() => {
                      const currencyInfo = CountryCurrencyService.getCurrencyByCountryCode(previewCountry);
                      return `${currencyInfo.symbol}${previewAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total`;
                    })()}</span>
                  </div>
                  {(() => {
                    const currencyInfo = CountryCurrencyService.getCurrencyByCountryCode(previewCountry);
                    const matchingSlab = settings.markupSlabs.find(slab => 
                      slab.isActive && 
                      slab.currency === currencyInfo.code &&
                      previewAmount >= slab.minAmount && 
                      previewAmount <= slab.maxAmount
                    );
                    return matchingSlab ? (
                      <div className="flex justify-between text-green-600">
                        <span>✓ Matched Slab:</span>
                        <span>{matchingSlab.name}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-amber-600">
                        <span>⚠ No Slab Match:</span>
                        <span>Default markup</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Preview Results */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Object.entries(previewResults).map(([method, result]) => {
              if (!result) return null;
              
              const isActiveMethod = method === activeMethod;
              const isSelectedMethod = method === exportPriority;

              return (
                <div
                  key={method}
                  className={`p-4 border rounded-lg ${
                    isActiveMethod ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getMethodIcon(method)}
                      <span className="font-medium capitalize">{method}</span>
                    </div>
                    {isActiveMethod && (
                      <Badge variant="default" className="text-xs">
                        Will Export
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base:</span>
                      <span>{formatCurrency(result.basePrice, result.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Markup:</span>
                      <span className="text-green-600">+{formatCurrency(result.markup, result.currency)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>{formatCurrency(result.finalPrice, result.currency)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Per Person:</span>
                      <span>{formatCurrency(result.perPersonPrice, result.currency)}</span>
                    </div>
                    {result.markupType && (
                      <div className="text-xs text-muted-foreground">
                        Type: {result.markupType}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Configuration Status */}
        <div className="p-4 bg-muted/30 rounded-lg space-y-3">
          <Label className="text-sm font-medium">Configuration Status</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant={enhancedSettings.enableCountryBasedPricing ? "default" : "secondary"}>
                {enhancedSettings.enableCountryBasedPricing ? "ON" : "OFF"}
              </Badge>
              <span>Country-Based Pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={settings.useSlabPricing ? "default" : "secondary"}>
                {settings.useSlabPricing ? "ON" : "OFF"}
              </Badge>
              <span>Slab-Based Pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {settings.defaultMarkupPercentage}%
              </Badge>
              <span>Standard Markup</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarkupExportPreview;