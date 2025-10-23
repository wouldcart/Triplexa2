import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableCurrencySelect } from '@/components/ui/searchable-currency-select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Euro, Banknote, X } from 'lucide-react';
import { useCurrencyOverride, CurrencyOverrideData } from '@/hooks/useCurrencyOverride';
import { Country } from '@/pages/inventory/countries/types/country';
import { commonCurrencies } from '@/pages/inventory/countries/data/countryData';

interface CurrencyOverrideManagerProps {
  countries: Country[];
  onCountriesUpdate?: () => void;
}



const CurrencyOverrideManager: React.FC<CurrencyOverrideManagerProps> = ({
  countries,
  onCountriesUpdate
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [customCurrency, setCustomCurrency] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  const [useCustomCurrency, setUseCustomCurrency] = useState(false);
  const [countriesWithOverrides, setCountriesWithOverrides] = useState<Country[]>([]);

  const {
    isLoading,
    overridePricingCurrency,
    removePricingCurrencyOverride,
    bulkOverridePricingCurrency,
    getCountriesWithOverrides
  } = useCurrencyOverride();

  // Filter countries that have pricing overrides
  useEffect(() => {
    const withOverrides = countries.filter(country => country.pricingCurrencyOverride);
    setCountriesWithOverrides(withOverrides);
  }, [countries]);

  const handleCountrySelection = (countryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCountries(prev => [...prev, countryId]);
    } else {
      setSelectedCountries(prev => prev.filter(id => id !== countryId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCountries(countries.map(country => country.id));
    } else {
      setSelectedCountries([]);
    }
  };

  const handleApplyOverride = async () => {
    if (selectedCountries.length === 0) return;

    let currencyData: CurrencyOverrideData;

    if (useCustomCurrency) {
      if (!customCurrency || !customSymbol) {
        return;
      }
      currencyData = {
        pricingCurrency: customCurrency.toUpperCase(),
        pricingCurrencySymbol: customSymbol
      };
    } else {
      if (!selectedCurrency) return;
      const currency = commonCurrencies.find(c => c.code === selectedCurrency);
      if (!currency) return;
      
      currencyData = {
        pricingCurrency: currency.code,
        pricingCurrencySymbol: currency.symbol
      };
    }

    const success = await bulkOverridePricingCurrency(selectedCountries, currencyData);
    
    if (success) {
      setIsDialogOpen(false);
      setSelectedCountries([]);
      setSelectedCurrency('');
      setCustomCurrency('');
      setCustomSymbol('');
      setUseCustomCurrency(false);
      onCountriesUpdate?.();
    }
  };

  const handleRemoveOverride = async (countryId: string) => {
    const success = await removePricingCurrencyOverride(countryId);
    if (success) {
      onCountriesUpdate?.();
    }
  };

  const getCurrencyIcon = (currencyCode: string) => {
    switch (currencyCode) {
      case 'USD':
        return <DollarSign className="h-4 w-4" />;
      case 'EUR':
        return <Euro className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Countries with overrides */}
      {countriesWithOverrides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Countries with Pricing Currency Overrides
            </CardTitle>
            <CardDescription>
              Countries that use different currencies for pricing than their local currency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {countriesWithOverrides.map(country => (
                <div key={country.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getCurrencyIcon(country.pricingCurrency || '')}
                    <div>
                      <div className="font-medium">{country.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Local: {country.currency} → Pricing: {country.pricingCurrency}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOverride(country.id)}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Apply currency override dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Banknote className="h-4 w-4 mr-2" />
            Override Pricing Currency
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Override Pricing Currency</DialogTitle>
            <DialogDescription>
              Select countries and set a different currency for pricing calculations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Country selection */}
            <div>
              <Label className="text-base font-medium">Select Countries</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedCountries.length === countries.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="font-medium">
                    Select All ({countries.length} countries)
                  </Label>
                </div>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                  {countries.map(country => (
                    <div key={country.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={country.id}
                        checked={selectedCountries.includes(country.id)}
                        onCheckedChange={(checked) => handleCountrySelection(country.id, checked as boolean)}
                      />
                      <Label htmlFor={country.id} className="flex-1 text-sm">
                        {country.name} ({country.code}) - {country.currency}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Currency selection */}
            <div>
              <Label className="text-base font-medium">Pricing Currency</Label>
              <div className="mt-2 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-common"
                    checked={!useCustomCurrency}
                    onCheckedChange={(checked) => setUseCustomCurrency(!checked)}
                  />
                  <Label htmlFor="use-common">Use common currency</Label>
                </div>

                {!useCustomCurrency && (
                  <SearchableCurrencySelect
                    currencies={commonCurrencies}
                    value={selectedCurrency}
                    onValueChange={setSelectedCurrency}
                    placeholder="Select a currency"
                  />
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-custom"
                    checked={useCustomCurrency}
                    onCheckedChange={(checked) => setUseCustomCurrency(checked === true)}
                  />
                  <Label htmlFor="use-custom">Use custom currency</Label>
                </div>

                {useCustomCurrency && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="custom-currency">Currency Code</Label>
                      <Input
                        id="custom-currency"
                        placeholder="e.g., INR"
                        value={customCurrency}
                        onChange={(e) => setCustomCurrency(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custom-symbol">Currency Symbol</Label>
                      <Input
                        id="custom-symbol"
                        placeholder="e.g., ₹"
                        value={customSymbol}
                        onChange={(e) => setCustomSymbol(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected countries preview */}
            {selectedCountries.length > 0 && (
              <div>
                <Label className="text-base font-medium">
                  Selected Countries ({selectedCountries.length})
                </Label>
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedCountries.slice(0, 10).map(countryId => {
                    const country = countries.find(c => c.id === countryId);
                    return country ? (
                      <Badge key={countryId} variant="secondary" className="text-xs">
                        {country.name}
                      </Badge>
                    ) : null;
                  })}
                  {selectedCountries.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{selectedCountries.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplyOverride}
              disabled={
                isLoading || 
                selectedCountries.length === 0 || 
                (!useCustomCurrency && !selectedCurrency) ||
                (useCustomCurrency && (!customCurrency || !customSymbol))
              }
            >
              {isLoading ? 'Applying...' : 'Apply Override'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CurrencyOverrideManager;