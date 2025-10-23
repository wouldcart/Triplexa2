/**
 * Utility functions for handling country flag URLs
 */

/**
 * Generates a flag URL from flagcdn.com based on country code
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB', 'IN')
 * @param size - Flag size: 'w20', 'w40', 'w80', 'w160', 'w320', 'w640', 'w1280'
 * @returns Flag URL from flagcdn.com
 */
export function generateFlagUrl(countryCode: string, size: string = 'w40'): string {
  if (!countryCode || countryCode.length !== 2) {
    return '';
  }
  
  // Convert to lowercase as required by flagcdn.com
  const code = countryCode.toLowerCase();
  return `https://flagcdn.com/${size}/${code}.png`;
}

/**
 * Gets the flag URL for a country, either from the stored flagUrl or generates one from country code
 * @param country - Country object with code and optional flagUrl
 * @param size - Flag size for generated URL
 * @returns Flag URL string
 */
export function getFlagUrl(country: { code?: string; flagUrl?: string }, size: string = 'w40'): string {
  // If flagUrl is already set and not empty, use it (prioritize database data)
  if (country.flagUrl && country.flagUrl.trim() && country.flagUrl !== '') {
    return country.flagUrl;
  }
  
  // Otherwise, generate from country code if available
  if (country.code && country.code.trim()) {
    return generateFlagUrl(country.code, size);
  }
  
  // Fallback to empty string
  return '';
}

/**
 * Updates a country object with a generated flag URL if it doesn't have one
 * @param country - Country object to update
 * @param size - Flag size for generated URL
 * @returns Updated country object with flagUrl
 */
export function ensureFlagUrl<T extends { code?: string; flagUrl?: string }>(
  country: T, 
  size: string = 'w40'
): T {
  // Only generate flag URL if none exists and we have a valid country code
  if ((!country.flagUrl || country.flagUrl.trim() === '') && country.code && country.code.trim()) {
    return {
      ...country,
      flagUrl: generateFlagUrl(country.code, size)
    };
  }
  
  return country;
}