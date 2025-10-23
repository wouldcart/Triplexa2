
import { useState, useEffect } from 'react';
import { EnhancedPricingService } from '@/services/enhancedPricingService';
import { PricingService } from '@/services/pricingService';
import { CountryCurrencyService } from '@/services/countryCurrencyService';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const useCurrency = () => {
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyInfo>({
    code: 'THB',
    symbol: '฿',
    name: 'Thai Baht'
  });

  useEffect(() => {
    const enhancedSettings = EnhancedPricingService.getEnhancedSettings();
    const baseCurrency = enhancedSettings.currencyConversion.baseCurrency;
    
    // Get country info for the base currency using centralized service
    const availableCountries = CountryCurrencyService.getAllCountriesWithCurrency();
    const defaultCountry = availableCountries.find(c => c.countryCode === enhancedSettings.defaultCountry);
    
    if (defaultCountry) {
      const effectiveCurrency = defaultCountry.pricingCurrency || defaultCountry.currency;
      const effectiveSymbol = defaultCountry.pricingCurrencySymbol || defaultCountry.currencySymbol;
      
      setDefaultCurrency({
        code: effectiveCurrency,
        symbol: effectiveSymbol,
        name: `${defaultCountry.countryName} ${effectiveCurrency}`
      });
      
      console.log('useCurrency: Updated default currency from countries module:', {
        code: effectiveCurrency,
        symbol: effectiveSymbol,
        country: defaultCountry.countryName
      });
    }
  }, []);

  const formatCurrency = (amount: number, currency?: string, symbol?: string): string => {
    const currencyCode = currency || defaultCurrency.code;
    const currencySymbol = symbol || defaultCurrency.symbol;
    
    // Format with proper currency symbol
    return `${currencySymbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency?: string): number => {
    const targetCurrency = toCurrency || defaultCurrency.code;
    return PricingService.convertCurrency(amount, fromCurrency, targetCurrency);
  };

  const getCurrencyByCountryCode = (countryCode: string): CurrencyInfo => {
    const currency = CountryCurrencyService.getCurrencyByCountryCode(countryCode);
    const availableCountries = CountryCurrencyService.getAllCountriesWithCurrency();
    const country = availableCountries.find(c => c.countryCode === countryCode);
    
    return {
      code: currency.code,
      symbol: currency.symbol,
      name: country ? `${country.countryName} ${currency.code}` : currency.code
    };
  };

  const getCurrencyByCountryName = (countryName: string): CurrencyInfo => {
    const currency = CountryCurrencyService.getCurrencyByCountryName(countryName);
    
    return {
      code: currency.code,
      symbol: currency.symbol,
      name: `${countryName} ${currency.code}`
    };
  };

  return {
    defaultCurrency,
    formatCurrency,
    convertCurrency,
    getCurrencyByCountryCode,
    getCurrencyByCountryName,
    setDefaultCurrency
  };
};
