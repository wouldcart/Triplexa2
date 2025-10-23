/**
 * Country utilities for mapping country names and aliases to country codes
 */

import { initialCountries } from '../pages/inventory/countries/data/countryData';

// Country aliases for better mapping
const COUNTRY_ALIASES = {
  'UAE': 'AE',
  'United Arab Emirates': 'AE',
  'Emirates': 'AE',
  'Thailand': 'TH',
  'Thai': 'TH',
  'USA': 'US',
  'United States': 'US',
  'America': 'US',
  'UK': 'GB',
  'United Kingdom': 'GB',
  'Britain': 'GB',
  'England': 'GB'
};

/**
 * Maps country name or alias to country code
 * @param countryName - The country name or alias
 * @returns The country code or null if not found
 */
export const getCountryCodeByName = (countryName: string): string | null => {
  if (!countryName) {
    console.log('Country mapping: Empty country name provided');
    return null;
  }
  
  const normalizedName = countryName.trim();
  console.log(`Country mapping: Attempting to map "${normalizedName}"`);
  
  // Check direct alias mapping first
  const aliasCode = COUNTRY_ALIASES[normalizedName];
  if (aliasCode) {
    console.log(`Country mapping: "${normalizedName}" -> ${aliasCode} (via alias)`);
    return aliasCode;
  }
  
  // Check exact match in country data
  const exactMatch = initialCountries.find(c => 
    c.name.toLowerCase() === normalizedName.toLowerCase()
  );
  if (exactMatch) {
    console.log(`Country mapping: "${normalizedName}" -> ${exactMatch.code} (exact match)`);
    return exactMatch.code;
  }
  
  // Check partial match (includes)
  const partialMatch = initialCountries.find(c => 
    c.name.toLowerCase().includes(normalizedName.toLowerCase()) ||
    normalizedName.toLowerCase().includes(c.name.toLowerCase())
  );
  if (partialMatch) {
    console.log(`Country mapping: "${normalizedName}" -> ${partialMatch.code} (partial match)`);
    return partialMatch.code;
  }
  
  console.warn(`Country mapping failed: "${normalizedName}" not found`);
  return null;
};

/**
 * Validates if a country code is active in the system
 * @param countryCode - The country code to validate
 * @returns boolean indicating if the country is active
 */
export const isCountryActive = (countryCode: string): boolean => {
  const country = initialCountries.find(c => c.code === countryCode);
  return country ? country.status === 'active' : false;
};

/**
 * Gets available countries for enquiry creation
 * @returns Array of active country codes
 */
export const getActiveCountryCodes = (): string[] => {
  return initialCountries
    .filter(c => c.status === 'active')
    .map(c => c.code);
};