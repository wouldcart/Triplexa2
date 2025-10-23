
import { currencyFormats } from '@/pages/inventory/transport/utils/currencyUtils';
import { CountryCurrencyService } from '@/services/countryCurrencyService';

// Map of country names to their respective currencies - now using centralized service as fallback
export const countryCurrencyMap: Record<string, { code: string, symbol: string }> = {
  'Thailand': { code: 'THB', symbol: '฿' },
  'United Arab Emirates': { code: 'AED', symbol: 'د.إ' },
  'UAE': { code: 'AED', symbol: 'د.إ' },
  'Dubai': { code: 'AED', symbol: 'د.إ' },
  'Singapore': { code: 'SGD', symbol: '$' },
  'Malaysia': { code: 'MYR', symbol: 'RM' },
  'India': { code: 'INR', symbol: '₹' },
  'United States': { code: 'USD', symbol: '$' },
  'United Kingdom': { code: 'GBP', symbol: '£' },
  'European Union': { code: 'EUR', symbol: '€' },
  'Japan': { code: 'JPY', symbol: '¥' },
};

// Function to get currency code by country name
export const getCurrencyByCountry = (countryName: string): { code: string, symbol: string } => {
  console.log('Hotel getCurrencyByCountry called with:', countryName);
  
  // First try centralized service (which includes pricing overrides)
  try {
    const currency = CountryCurrencyService.getCurrencyByCountryName(countryName);
    if (currency.code !== 'USD' || currency.symbol !== '$') {
      console.log('Hotel: Using centralized currency service result:', currency);
      return currency;
    }
  } catch (error) {
    console.warn('Hotel: Error using centralized currency service:', error);
  }

  // Handle various UAE/Dubai naming conventions
  if (countryName.toLowerCase().includes('dubai') || 
      countryName.toLowerCase().includes('uae') || 
      countryName.toLowerCase().includes('united arab emirates')) {
    return { code: 'AED', symbol: 'د.إ' };
  }
  
  const currency = countryCurrencyMap[countryName];
  if (currency) {
    console.log('Hotel: Found currency in local map:', currency);
    return currency;
  }
  
  console.log('Hotel: Currency not found for country:', countryName, 'using default USD');
  return { code: 'USD', symbol: '$' };
};

// Format price according to currency
export const formatHotelPrice = (price: number, currencyCode: string = 'USD'): string => {
  const format = currencyFormats[currencyCode] || { decimals: 2, separator: ',' };
  
  // Special formatting for AED (UAE currency)
  if (currencyCode === 'AED') {
    return price.toLocaleString('en-AE', {
      minimumFractionDigits: format.decimals,
      maximumFractionDigits: format.decimals,
      useGrouping: true
    });
  }
  
  return price.toLocaleString('en-US', {
    minimumFractionDigits: format.decimals,
    maximumFractionDigits: format.decimals,
    useGrouping: true
  });
};

// Format currency with symbol for display
export const formatCurrencyWithSymbol = (price: number, currencyCode: string = 'USD'): string => {
  const currencyInfo = Object.values(countryCurrencyMap).find(currency => currency.code === currencyCode) 
    || { code: 'USD', symbol: '$' };
    
  return `${currencyInfo.symbol}${formatHotelPrice(price, currencyCode)}`;
};
