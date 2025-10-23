
import { useCallback } from 'react';
import { CountryCurrencyService } from '@/services/countryCurrencyService';

export const useCurrency = () => {
  const getCurrencyForCountry = useCallback((countryName: string) => {
    console.log('Hotel useCurrency: Getting currency for:', countryName);
    const currency = CountryCurrencyService.getCurrencyByCountryName(countryName);
    console.log('Hotel useCurrency: Result:', currency);
    return currency;
  }, []);
  
  const formatPriceWithCurrency = useCallback((price: number, countryName: string, options?: { showSymbol?: boolean }) => {
    const currency = CountryCurrencyService.getCurrencyByCountryName(countryName);
    const formatted = price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    });
    
    return options?.showSymbol ? `${currency.symbol}${formatted}` : formatted;
  }, []);
  
  return {
    getCurrencyForCountry,
    formatPriceWithCurrency
  };
};
