
import { useState, useEffect, useCallback } from 'react';
import { CountryCurrencyService } from '@/services/countryCurrencyService';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  isOverride?: boolean;
}

export const useCountryCurrency = () => {
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyInfo>({
    code: 'USD',
    symbol: '$'
  });

  const getCurrencyByCountryName = useCallback((countryName: string): CurrencyInfo => {
    if (!countryName) {
      console.log('useCountryCurrency: No country name provided, using default');
      return defaultCurrency;
    }

    const effectiveCurrency = CountryCurrencyService.getEffectiveCurrency(countryName);
    console.log('useCountryCurrency: Got currency for', countryName, ':', effectiveCurrency);
    
    return {
      code: effectiveCurrency.code,
      symbol: effectiveCurrency.symbol,
      isOverride: effectiveCurrency.isOverride
    };
  }, [defaultCurrency]);

  const getCurrencyByCountryCode = useCallback((countryCode: string): CurrencyInfo => {
    if (!countryCode) {
      console.log('useCountryCurrency: No country code provided, using default');
      return defaultCurrency;
    }

    const currency = CountryCurrencyService.getCurrencyByCountryCode(countryCode);
    console.log('useCountryCurrency: Got currency for code', countryCode, ':', currency);
    
    return {
      code: currency.code,
      symbol: currency.symbol
    };
  }, [defaultCurrency]);

  const formatCurrency = useCallback((amount: number, countryName: string): string => {
    if (!countryName) {
      return `${defaultCurrency.symbol}${amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    }

    return CountryCurrencyService.formatCurrency(amount, countryName);
  }, [defaultCurrency]);

  const getAllCountriesWithCurrency = useCallback(() => {
    return CountryCurrencyService.getAllCountriesWithCurrency();
  }, []);

  return {
    defaultCurrency,
    setDefaultCurrency,
    getCurrencyByCountryName,
    getCurrencyByCountryCode,
    formatCurrency,
    getAllCountriesWithCurrency
  };
};
