import { initialCountries } from '../pages/inventory/countries/data/countryData';
import { useApplicationSettings } from '../contexts/ApplicationSettingsContext';

/**
 * Validates if a country is available for enquiry creation
 * @param countryCode - The country code to validate
 * @returns boolean indicating if the country is valid for enquiry
 */
export const validateCountryForEnquiry = (countryCode: string): boolean => {
  // Check if country exists in active countries
  const country = initialCountries.find(c => c.code === countryCode);
  if (!country || country.status !== 'active') {
    return false;
  }

  // This would normally check the enquiry settings, but since we can't use hooks here,
  // we'll need to pass the settings as a parameter or use this in a hook context
  return true;
};

/**
 * Hook to validate countries for enquiry operations
 */
export const useEnquiryCountryValidator = () => {
  const { settings } = useApplicationSettings();

  const validateForEnquiry = (countryCode: string): boolean => {
    // Check if country exists in active countries
    const country = initialCountries.find(c => c.code === countryCode);
    if (!country || country.status !== 'active') {
      return false;
    }

    // Check if enquiry configuration exists and is active
    const enquiryConfig = settings.enquirySettings.countries.find(c => c.countryCode === countryCode);
    if (!enquiryConfig || !enquiryConfig.isActive) {
      return false;
    }

    return true;
  };

  const getValidCountriesForEnquiry = () => {
    return settings.enquirySettings.countries.filter(config => {
      const country = initialCountries.find(c => c.code === config.countryCode);
      return country && country.status === 'active' && config.isActive;
    });
  };

  const getCountryNameByCode = (countryCode: string): string | null => {
    const country = initialCountries.find(c => c.code === countryCode);
    return country ? country.name : null;
  };

  return {
    validateForEnquiry,
    getValidCountriesForEnquiry,
    getCountryNameByCode
  };
};