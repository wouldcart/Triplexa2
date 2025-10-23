
import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Country } from '../types/country';
import { DollarSign, AlertCircle, Flag, Wand2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import FlagDisplay from './FlagDisplay';
import FlagGenerator from './FlagGenerator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CountryEditSheetProps {
  formData: Country;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (field: keyof Country, value: any) => void;
}

const CountryEditSheet: React.FC<CountryEditSheetProps> = ({
  formData,
  isOpen,
  onClose,
  onSave,
  onChange
}) => {
  const [showFlagGenerator, setShowFlagGenerator] = useState(false);

  const handleFlagUrlGenerated = (url: string) => {
    onChange('flag_url', url);
    setShowFlagGenerator(false);
  };


  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Edit Country
          </SheetTitle>
          <SheetDescription>
            Update country details and currency pricing settings
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-4">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Country Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="e.g., United Arab Emirates"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Country Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => onChange('code', e.target.value)}
                  placeholder="ISO code (e.g., AE, TH)"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => onChange('region', e.target.value)}
                  placeholder="e.g., Southeast Asia, Middle East"
                />
              </div>
            </div>

            {/* Flag Display */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Flag
              </Label>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <FlagDisplay country={formData} size="medium" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formData.name || 'Country Name'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="continent">Continent</Label>
              <Input
                id="continent"
                value={formData.continent}
                onChange={(e) => onChange('continent', e.target.value)}
                placeholder="e.g., Asia, Europe"
              />
            </div>
          </div>

          {/* Default Currency Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Default Currency</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency Code</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => onChange('currency', e.target.value)}
                  placeholder="e.g., AED, THB"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                <Input
                  id="currencySymbol"
                  value={formData.currency_symbol}
                  onChange={(e) => onChange('currency_symbol', e.target.value)}
                  placeholder="e.g., د.إ, ฿"
                />
              </div>
            </div>
          </div>

          {/* Enhanced Pricing Currency Override Section */}
          <div className="space-y-4 border rounded-lg p-4 bg-blue-50/30 dark:bg-blue-950/30 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">Pricing Currency Override</h3>
            </div>
            
            <Alert className="border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/50">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                Use this feature when you want to price services in a different currency than the country's default currency. This affects all pricing calculations and itineraries.
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-1">
                <Label htmlFor="pricingCurrencyOverride" className="text-sm font-medium text-foreground">
                  Enable Pricing Currency Override
                </Label>
                <p className="text-xs text-muted-foreground">
                  Override the default currency for all pricing calculations
                </p>
              </div>
              <Switch
                id="pricingCurrencyOverride"
                checked={Boolean(formData.pricing_currency_override)}
                onCheckedChange={(checked) => onChange('pricing_currency_override', checked)}
              />
            </div>

            {formData.pricing_currency_override && (
              <div className="space-y-4 pl-4 border-l-4 border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-900 p-4 rounded-r-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricingCurrency" className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Pricing Currency Code
                    </Label>
                    <Input
                      id="pricingCurrency"
                      value={formData.pricing_currency || ''}
                      onChange={(e) => onChange('pricing_currency', e.target.value)}
                      placeholder="e.g., USD, EUR, GBP"
                      className="border-blue-200 dark:border-blue-700 focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricingCurrencySymbol" className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Pricing Currency Symbol
                    </Label>
                    <Input
                      id="pricingCurrencySymbol"
                      value={formData.pricing_currency_symbol || ''}
                      onChange={(e) => onChange('pricing_currency_symbol', e.target.value)}
                      placeholder="e.g., $, €, £"
                      className="border-blue-200 dark:border-blue-700 focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
                
                {formData.pricing_currency_override && formData.pricing_currency && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        All pricing will be calculated in {formData.pricing_currency} ({formData.pricing_currency_symbol})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Additional Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Additional Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="flagUrl">Flag URL</Label>
              <Input
                id="flagUrl"
                value={formData.flag_url || ''}
                onChange={(e) => onChange('flag_url', e.target.value)}
                placeholder="https://example.com/flag.png"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="languages">Languages (comma separated)</Label>
              <Input
                id="languages"
                value={formData.languages?.join(', ') || ''}
                onChange={(e) => onChange('languages', e.target.value.split(',').map(lang => lang.trim()))}
                placeholder="English, Arabic, French"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="isPopular">Popular Destination</Label>
                <Switch
                  id="isPopular"
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => onChange('is_popular', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="visaRequired">Visa Required</Label>
                <Switch
                  id="visaRequired"
                  checked={formData.visa_required}
                  onCheckedChange={(checked) => onChange('visa_required', checked)}
                />
              </div>
            </div>
          </div>
        </div>
        
        <SheetFooter className="pt-6 border-t">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button onClick={onSave} className="bg-blue-600 hover:bg-blue-700">
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CountryEditSheet;
