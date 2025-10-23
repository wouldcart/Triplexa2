

export const formatCurrency = (amount: number, country: string = 'USA'): string => {
  // Map countries to their currencies
  const currencyMap: { [key: string]: string } = {
    'USA': 'USD',
    'United States': 'USD',
    'UK': 'GBP',
    'United Kingdom': 'GBP',
    'India': 'INR',
    'Japan': 'JPY',
    'Australia': 'AUD',
    'Canada': 'CAD',
    'Germany': 'EUR',
    'France': 'EUR',
    'Italy': 'EUR',
    'Spain': 'EUR',
    'Netherlands': 'EUR',
    'Switzerland': 'CHF',
    'Singapore': 'SGD',
    'Thailand': 'THB',
    'Malaysia': 'MYR',
    'Indonesia': 'IDR',
    'Philippines': 'PHP',
    'Vietnam': 'VND',
    'China': 'CNY',
    'South Korea': 'KRW',
    'Brazil': 'BRL',
    'Mexico': 'MXN',
    'Argentina': 'ARS',
    'Chile': 'CLP',
    'South Africa': 'ZAR',
    'Egypt': 'EGP',
    'UAE': 'AED',
    'Saudi Arabia': 'SAR',
    'Turkey': 'TRY',
    'Russia': 'RUB',
    'Poland': 'PLN',
    'Czech Republic': 'CZK',
    'Hungary': 'HUF',
    'Croatia': 'HRK',
    'Romania': 'RON',
    'Bulgaria': 'BGN',
    'Norway': 'NOK',
    'Sweden': 'SEK',
    'Denmark': 'DKK',
    'Iceland': 'ISK',
    'Finland': 'EUR',
    'Belgium': 'EUR',
    'Austria': 'EUR',
    'Portugal': 'EUR',
    'Greece': 'EUR',
    'Ireland': 'EUR',
    'Luxembourg': 'EUR',
    'Malta': 'EUR',
    'Cyprus': 'EUR',
    'Estonia': 'EUR',
    'Latvia': 'EUR',
    'Lithuania': 'EUR',
    'Slovakia': 'EUR',
    'Slovenia': 'EUR',
    'New Zealand': 'NZD',
    'Israel': 'ILS',
    'Jordan': 'JOD',
    'Lebanon': 'LBP',
    'Morocco': 'MAD',
    'Tunisia': 'TND',
    'Kenya': 'KES',
    'Tanzania': 'TZS',
    'Uganda': 'UGX',
    'Ghana': 'GHS',
    'Nigeria': 'NGN',
    'Botswana': 'BWP',
    'Namibia': 'NAD',
    'Zambia': 'ZMW',
    'Zimbabwe': 'ZWL',
    'Mauritius': 'MUR',
    'Seychelles': 'SCR',
    'Madagascar': 'MGA',
    'Sri Lanka': 'LKR',
    'Nepal': 'NPR',
    'Bhutan': 'BTN',
    'Bangladesh': 'BDT',
    'Pakistan': 'PKR',
    'Afghanistan': 'AFN',
    'Iran': 'IRR',
    'Iraq': 'IQD',
    'Kuwait': 'KWD',
    'Bahrain': 'BHD',
    'Qatar': 'QAR',
    'Oman': 'OMR',
    'Yemen': 'YER',
    'Uzbekistan': 'UZS',
    'Kazakhstan': 'KZT',
    'Kyrgyzstan': 'KGS',
    'Tajikistan': 'TJS',
    'Turkmenistan': 'TMT',
    'Mongolia': 'MNT',
    'North Korea': 'KPW',
    'Myanmar': 'MMK',
    'Laos': 'LAK',
    'Cambodia': 'KHR',
    'Brunei': 'BND',
    'East Timor': 'USD',
    'Papua New Guinea': 'PGK',
    'Fiji': 'FJD',
    'Vanuatu': 'VUV',
    'Samoa': 'WST',
    'Tonga': 'TOP',
    'Solomon Islands': 'SBD',
    'Palau': 'USD',
    'Marshall Islands': 'USD',
    'Micronesia': 'USD',
    'Kiribati': 'AUD',
    'Tuvalu': 'AUD',
    'Nauru': 'AUD'
  };

  const currency = currencyMap[country] || 'USD';
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback to USD if currency is not supported
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const getCurrencyByCountry = (country: string): { symbol: string; code: string } => {
  const currencyMap: Record<string, { symbol: string; code: string }> = {
    'Thailand': { symbol: '฿', code: 'THB' },
    'UAE': { symbol: 'د.إ', code: 'AED' },
    'United Arab Emirates': { symbol: 'د.إ', code: 'AED' },
    'Singapore': { symbol: 'S$', code: 'SGD' },
    'Malaysia': { symbol: 'RM', code: 'MYR' },
    'Japan': { symbol: '¥', code: 'JPY' },
    'United States': { symbol: '$', code: 'USD' },
    'USA': { symbol: '$', code: 'USD' },
    'United Kingdom': { symbol: '£', code: 'GBP' },
    'UK': { symbol: '£', code: 'GBP' },
    'India': { symbol: '₹', code: 'INR' },
    'Germany': { symbol: '€', code: 'EUR' },
    'France': { symbol: '€', code: 'EUR' },
    'Italy': { symbol: '€', code: 'EUR' },
    'Spain': { symbol: '€', code: 'EUR' },
    'Netherlands': { symbol: '€', code: 'EUR' },
    'Australia': { symbol: 'A$', code: 'AUD' },
    'Canada': { symbol: 'C$', code: 'CAD' },
    'Switzerland': { symbol: 'CHF', code: 'CHF' },
    'China': { symbol: '¥', code: 'CNY' },
    'South Korea': { symbol: '₩', code: 'KRW' },
    'Brazil': { symbol: 'R$', code: 'BRL' },
    'Mexico': { symbol: '$', code: 'MXN' },
    'New Zealand': { symbol: 'NZ$', code: 'NZD' },
  };

  return currencyMap[country] || { symbol: '$', code: 'USD' };
};

export const calculateTripDuration = (fromDate: string, toDate: string): { days: number; nights: number } => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    days: diffDays + 1, // Include both start and end date
    nights: diffDays
  };
};

// Currency override types
export interface CurrencyOverride {
  currency_symbol?: string;
  pricing_currency?: string;
  pricing_currency_symbol?: string;
  pricing_currency_override?: boolean;
}

export interface CountryWithCurrency {
  currency: string;
  currency_symbol: string;
  pricing_currency?: string;
  pricing_currency_symbol?: string;
  pricing_currency_override?: boolean;
}

/**
 * Get the effective currency symbol for display, considering pricing overrides
 * @param country - Country object with currency information
 * @param useOverride - Whether to use pricing override if available (default: true)
 * @returns The currency symbol to display
 */
export const getEffectiveCurrencySymbol = (
  country: CountryWithCurrency, 
  useOverride: boolean = true
): string => {
  // If pricing override is enabled and we should use it
  if (useOverride && country.pricing_currency_override && country.pricing_currency_symbol) {
    return country.pricing_currency_symbol;
  }
  
  // Fall back to the country's default currency symbol
  return country.currency_symbol || '$';
};

/**
 * Get the effective currency code for display, considering pricing overrides
 * @param country - Country object with currency information
 * @param useOverride - Whether to use pricing override if available (default: true)
 * @returns The currency code to display
 */
export const getEffectiveCurrencyCode = (
  country: CountryWithCurrency, 
  useOverride: boolean = true
): string => {
  // If pricing override is enabled and we should use it
  if (useOverride && country.pricing_currency_override && country.pricing_currency) {
    return country.pricing_currency;
  }
  
  // Fall back to the country's default currency
  return country.currency || 'USD';
};

/**
 * Format currency amount with the effective currency symbol
 * @param amount - The amount to format
 * @param country - Country object with currency information
 * @param useOverride - Whether to use pricing override if available (default: true)
 * @returns Formatted currency string
 */
export const formatCurrencyWithOverride = (
  amount: number, 
  country: CountryWithCurrency, 
  useOverride: boolean = true
): string => {
  const symbol = getEffectiveCurrencySymbol(country, useOverride);
  const code = getEffectiveCurrencyCode(country, useOverride);
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback to manual formatting if currency code is not supported
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

/**
 * Get currency display information for a country
 * @param country - Country object with currency information
 * @param useOverride - Whether to use pricing override if available (default: true)
 * @returns Object with symbol, code, and formatted display string
 */
export const getCurrencyDisplayInfo = (
  country: CountryWithCurrency, 
  useOverride: boolean = true
): { symbol: string; code: string; display: string; isOverride: boolean } => {
  const isOverride = useOverride && country.pricing_currency_override && !!country.pricing_currency;
  const symbol = getEffectiveCurrencySymbol(country, useOverride);
  const code = getEffectiveCurrencyCode(country, useOverride);
  
  return {
    symbol,
    code,
    display: `${code} (${symbol})`,
    isOverride
  };
};

