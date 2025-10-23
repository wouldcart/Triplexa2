
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EnhancedPricingService } from '@/services/enhancedPricingService';
import { PricingService } from '@/services/pricingService';
import { TaxCalculationService } from '@/services/taxCalculationService';
import { Calculator, DollarSign, Percent, FileText, Settings, Globe } from 'lucide-react';

const PricingSimulator: React.FC = () => {
  const [baseAmount, setBaseAmount] = useState<number>(10000);
  const [paxCount, setPaxCount] = useState<number>(2);
  const [selectedCountry, setSelectedCountry] = useState<string>(TaxCalculationService.getDefaultCountry());
  const [serviceType, setServiceType] = useState<string>('hotel');
  const [taxInclusive, setTaxInclusive] = useState<boolean>(false);
  const [enableTaxCalculation, setEnableTaxCalculation] = useState<boolean>(true);
  const [useAutoDetection, setUseAutoDetection] = useState<boolean>(true);

  const availableCountries = EnhancedPricingService.getAvailableCountries();
  const taxCountries = TaxCalculationService.getAvailableCountries();
  const enhancedSettings = EnhancedPricingService.getEnhancedSettings();
  const pricingSettings = PricingService.getSettings();

  // Define variables first
  const selectedCountryData = availableCountries.find(c => c.code === selectedCountry);
  const countryRule = enhancedSettings.countryRules.find(r => r.countryCode === selectedCountry);

  const calculateFullPricing = () => {
    let pricing;
    
    // Determine which pricing method to use based on settings
    if (enhancedSettings.enableCountryBasedPricing) {
      // Use country-based pricing (takes precedence)
      pricing = EnhancedPricingService.calculateCountryBasedPricing(
        baseAmount,
        paxCount,
        selectedCountry
      );
    } else if (pricingSettings.useSlabPricing) {
      // Use slab-based pricing
      const currency = selectedCountryData?.currency || 'THB';
      pricing = PricingService.calculateMarkup(baseAmount, paxCount, currency);
    } else {
      // Use default markup percentage
      const currency = selectedCountryData?.currency || 'THB';
      pricing = PricingService.calculateMarkup(baseAmount, paxCount, currency);
    }

    // Calculate tax based on toggle setting
    let taxResult;
    if (enableTaxCalculation) {
      if (useAutoDetection) {
        // Use auto-detection based on currency
        const detectedCountry = selectedCountryData?.currency 
          ? TaxCalculationService.detectCountryFromCurrency(selectedCountryData.currency)
          : TaxCalculationService.getDefaultCountry();
        
        taxResult = TaxCalculationService.calculateTax(
          pricing.finalPrice,
          detectedCountry,
          serviceType,
          taxInclusive
        );
      } else {
        // Use manually selected country
        taxResult = TaxCalculationService.calculateTax(
          pricing.finalPrice,
          selectedCountry,
          serviceType,
          taxInclusive
        );
      }
    } else {
      // No tax calculation
      taxResult = {
        baseAmount: pricing.finalPrice,
        taxAmount: 0,
        totalAmount: pricing.finalPrice,
        taxBreakdown: [],
        isInclusive: taxInclusive
      };
    }

    return { pricing, taxResult };
  };

  const { pricing, taxResult } = calculateFullPricing();
  
  // Find applicable slab if slab pricing is active
  const comparisonAmount = pricingSettings.slabApplicationMode === 'per-person' ? (baseAmount / paxCount) : baseAmount;
  const applicableSlab = pricingSettings.useSlabPricing && !enhancedSettings.enableCountryBasedPricing
    ? pricingSettings.markupSlabs.find(slab => 
        slab.isActive && 
        slab.currency === selectedCountryData?.currency &&
        comparisonAmount >= slab.minAmount && 
        comparisonAmount <= slab.maxAmount
      )
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Real-Time Pricing Simulator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Base Amount</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(Number(e.target.value))}
                  placeholder="Enter base amount"
                />
                <span className="text-sm text-muted-foreground">
                  {selectedCountryData?.currency || 'THB'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Passengers</Label>
              <Input
                type="number"
                value={paxCount}
                onChange={(e) => setPaxCount(Number(e.target.value))}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name} ({country.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="sightseeing">Sightseeing</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing Method Indicator */}
          <div className="flex items-center justify-center gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${enhancedSettings.enableCountryBasedPricing ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Country-Based Pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${pricingSettings.useSlabPricing && !enhancedSettings.enableCountryBasedPricing ? 'bg-blue-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Slab Pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${!enhancedSettings.enableCountryBasedPricing && !pricingSettings.useSlabPricing ? 'bg-orange-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Default Markup</span>
            </div>
          </div>

          {/* Slab Configuration */}
          {pricingSettings.useSlabPricing && !enhancedSettings.enableCountryBasedPricing && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  <span className="text-sm font-medium">Slab Configuration</span>
                </div>
                <Badge variant={pricingSettings.slabApplicationMode === 'per-person' ? "default" : "outline"}>
                  {pricingSettings.slabApplicationMode === 'per-person' ? "Per Person" : "Total Amount"}
                </Badge>
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground">
                {pricingSettings.slabApplicationMode === 'per-person' 
                  ? "Slab ranges are applied based on per person amount"
                  : "Slab ranges are applied based on total amount"
                }
              </div>
              
              <div className="mt-2 text-xs text-blue-600">
                Configure this setting in the Advanced tab → Slab Configuration
              </div>
            </div>
          )}

          <Separator />

          {/* Pricing Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Markup Calculation */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Markup Calculation
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Markup Method:
                  </span>
                  <span className="font-medium text-blue-600">
                    {enhancedSettings.enableCountryBasedPricing 
                      ? `Country-Based (${countryRule?.defaultMarkup || 0}${countryRule?.markupType === 'percentage' ? '%' : ' ' + pricing.currency})`
                      : applicableSlab 
                        ? `Slab: ${applicableSlab.name} (${applicableSlab.markupValue}${applicableSlab.markupType === 'percentage' ? '%' : ' ' + pricing.currency})`
                        : `Default (${pricingSettings.defaultMarkupPercentage}%)`
                    }
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Base Amount:</span>
                  <span className="font-medium">{pricing.currency} {pricing.basePrice.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Markup Amount:
                  </span>
                  <span className="font-medium text-green-600">
                    +{pricing.currency} {pricing.markup.toLocaleString()}
                  </span>
                </div>
                
                {applicableSlab && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Slab Range:
                    </span>
                    <span className="font-medium text-purple-600">
                      {pricing.currency} {applicableSlab.minAmount.toLocaleString()} - {applicableSlab.maxAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {pricing.tierMultiplier !== 1 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Tier Multiplier ({countryRule?.tier}):
                    </span>
                    <span className="font-medium">×{pricing.tierMultiplier}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-semibold">{pricing.currency} {pricing.finalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Tax Calculation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Tax Calculation
                </h4>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={enableTaxCalculation} 
                    onCheckedChange={setEnableTaxCalculation}
                  />
                  <span className="text-sm">Enable Tax</span>
                </div>
              </div>

              {/* Tax Configuration Controls */}
              {enableTaxCalculation && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="text-sm font-medium">Tax Configuration</span>
                    </div>
                    <Badge variant={useAutoDetection ? "default" : "outline"}>
                      {useAutoDetection ? "Auto-Detect" : "Manual"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Auto-detect from currency</Label>
                      <Switch 
                        checked={useAutoDetection} 
                        onCheckedChange={setUseAutoDetection}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Tax Inclusive Pricing</Label>
                      <Switch 
                        checked={taxInclusive} 
                        onCheckedChange={setTaxInclusive}
                      />
                    </div>
                  </div>

                  {useAutoDetection && selectedCountryData && (
                    <div className="text-xs text-muted-foreground">
                      Detected: {TaxCalculationService.detectCountryFromCurrency(selectedCountryData.currency)} 
                      (from {selectedCountryData.currency})
                    </div>
                  )}

                  {!useAutoDetection && (
                    <div className="space-y-2">
                      <Label className="text-sm">Tax Country Override</Label>
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {taxCountries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name} - {country.taxType}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-3">{!enableTaxCalculation ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Tax calculation is disabled</p>
                  <p className="text-xs">Enable the toggle above to calculate taxes</p>
                </div>
              ) : (
                <>
                  {taxResult.taxBreakdown.map((tax, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {tax.description} ({tax.rate}%):
                      </span>
                      <span className="font-medium text-blue-600">
                        +{pricing.currency} {tax.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  
                  {taxResult.tdsAmount && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">TDS Deduction:</span>
                      <span className="font-medium text-red-600">
                        -{pricing.currency} {taxResult.tdsAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {taxResult.taxBreakdown.length === 0 && enableTaxCalculation && (
                    <div className="text-center py-4 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No taxes applicable for selected configuration</p>
                    </div>
                  )}
                </>
              )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Final Summary */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {pricing.currency} {taxResult.totalAmount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-semibold">
                  {pricing.currency} {(taxResult.totalAmount / paxCount).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Per Person</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-medium">
                  {((pricing.markup / pricing.basePrice) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Effective Margin</div>
              </div>
            </div>
            
            {(countryRule || applicableSlab) && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
                  {countryRule && (
                    <>
                      <Badge variant="outline">{countryRule.tier} tier</Badge>
                      <span>•</span>
                      <span>{countryRule.region}</span>
                      <span>•</span>
                      <span>Conversion margin: {countryRule.conversionMargin}%</span>
                    </>
                  )}
                  {applicableSlab && (
                    <>
                      <Badge variant="secondary">{applicableSlab.name}</Badge>
                      <span>•</span>
                      <span>Per person range: {pricing.currency} {applicableSlab.minAmount.toLocaleString()} - {applicableSlab.maxAmount.toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingSimulator;
