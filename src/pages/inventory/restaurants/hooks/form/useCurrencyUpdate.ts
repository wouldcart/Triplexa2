
import { useEffect } from 'react';
import { CountryOption, Restaurant } from '../../types/restaurantTypes';
import { CountryCurrencyService } from '@/services/countryCurrencyService';

export interface CurrencyUpdateProps {
  formData: Partial<Restaurant>;
  countryOptions: CountryOption[];
  setFormData: React.Dispatch<React.SetStateAction<Partial<Restaurant>>>;
}

export const useCurrencyUpdate = ({ formData, countryOptions, setFormData }: CurrencyUpdateProps) => {
  // Set currency based on selected country
  useEffect(() => {
    if (formData.country) {
      console.log('Restaurant: Updating currency for country:', formData.country);
      
      // First try to find in countryOptions for backward compatibility
      const selectedCountry = countryOptions.find(c => c.name === formData.country);
      if (selectedCountry) {
        setFormData(prev => ({
          ...prev,
          currencyCode: selectedCountry.currency,
          currencySymbol: selectedCountry.currencySymbol
        }));
        console.log(`Restaurant: Updated currency from options for ${selectedCountry.name}: ${selectedCountry.currencySymbol} (${selectedCountry.currency})`);
        return;
      }

      // Fallback to centralized currency service
      const currency = CountryCurrencyService.getCurrencyByCountryName(formData.country);
      setFormData(prev => ({
        ...prev,
        currencyCode: currency.code,
        currencySymbol: currency.symbol
      }));
      console.log(`Restaurant: Updated currency from service for ${formData.country}: ${currency.symbol} (${currency.code})`);
    }
  }, [formData.country, countryOptions, setFormData]);
};
