import { useState, useEffect, useMemo } from 'react';
import { CountryEnquirySettings } from '../types/enquiry';
import { Country } from '../pages/inventory/countries/types/country';
import { initialCountries } from '../pages/inventory/countries/data/countryData';
import { useApplicationSettings } from '../contexts/ApplicationSettingsContext';

export interface CountryOption {
  id: string;
  name: string;
  code: string;
  isConfigured: boolean;
  enquiryConfig?: CountryEnquirySettings;
}

export const useCountriesEnquiryIntegration = () => {
  const { settings, addCountry, updateCountry, removeCountry, setDefaultCountry } = useApplicationSettings();
  const [activeCountries, setActiveCountries] = useState<Country[]>([]);

  // Load active countries from Countries Management module
  useEffect(() => {
    const activeCountriesFromModule = initialCountries.filter(country => country.status === 'active');
    setActiveCountries(activeCountriesFromModule);
  }, []);

  // Create country options that combine inventory countries with enquiry settings
  const countryOptions = useMemo(() => {
    return activeCountries.map(country => {
      const enquiryConfig = settings.enquirySettings.countries.find(
        config => config.countryCode === country.code
      );
      
      return {
        id: country.id,
        name: country.name,
        code: country.code,
        isConfigured: !!enquiryConfig,
        enquiryConfig
      };
    });
  }, [activeCountries, settings.enquirySettings.countries]);

  // Get available countries for new enquiry configuration (not yet configured)
  const availableCountries = useMemo(() => {
    return countryOptions.filter(option => !option.isConfigured);
  }, [countryOptions]);

  // Get configured countries
  const configuredCountries = useMemo(() => {
    return settings.enquirySettings.countries.filter(config => {
      // Only include configurations for countries that are still active in inventory
      return activeCountries.some(country => country.code === config.countryCode && country.status === 'active');
    });
  }, [settings.enquirySettings.countries, activeCountries]);

  // Auto-populate country details when creating new enquiry config
  const getCountryDetailsForConfig = (countryCode: string) => {
    const country = activeCountries.find(c => c.code === countryCode);
    if (!country) return null;

    return {
      countryCode: country.code,
      countryName: country.name,
      prefix: country.code + 'Q', // Auto-suggest prefix
      yearFormat: 'YYYY' as const,
      yearSeparator: 'none' as const,
      numberLength: 4,
      numberSeparator: 'none' as const,
      startingNumber: 1,
      isDefault: false,
      isActive: true
    };
  };

  // Validate if country is still active when processing enquiry
  const validateCountryForEnquiry = (countryCode: string): boolean => {
    const country = activeCountries.find(c => c.code === countryCode);
    const enquiryConfig = settings.enquirySettings.countries.find(c => c.countryCode === countryCode);
    
    return !!(country && country.status === 'active' && enquiryConfig && enquiryConfig.isActive);
  };

  // Sync enquiry configurations with active countries
  const syncEnquiryWithActiveCountries = () => {
    const activeCountryCodes = activeCountries.map(c => c.code);
    const currentEnquiryCountries = settings.enquirySettings.countries;

    // Mark configurations as inactive if their countries are no longer active
    currentEnquiryCountries.forEach(config => {
      if (!activeCountryCodes.includes(config.countryCode) && config.isActive) {
        updateCountry(config.countryCode, { isActive: false });
      }
    });
  };

  // Enhanced add country with auto-population
  const addCountryWithDetails = (countryCode: string, customConfig?: Partial<CountryEnquirySettings>) => {
    const baseConfig = getCountryDetailsForConfig(countryCode);
    if (!baseConfig) {
      throw new Error('Country not found in active countries');
    }

    const finalConfig = { ...baseConfig, ...customConfig };
    return addCountry(finalConfig);
  };

  return {
    activeCountries,
    countryOptions,
    availableCountries,
    configuredCountries,
    getCountryDetailsForConfig,
    validateCountryForEnquiry,
    syncEnquiryWithActiveCountries,
    addCountryWithDetails,
    updateCountry,
    removeCountry,
    setDefaultCountry,
    enquirySettings: settings.enquirySettings
  };
};