
// Currency mapping for different countries
const currencyMap: Record<string, { symbol: string; code: string }> = {
  // Asia
  'Thailand': { symbol: '฿', code: 'THB' },
  'Japan': { symbol: '¥', code: 'JPY' },
  'China': { symbol: '¥', code: 'CNY' },
  'India': { symbol: '₹', code: 'INR' },
  'Singapore': { symbol: 'S$', code: 'SGD' },
  'Malaysia': { symbol: 'RM', code: 'MYR' },
  'Indonesia': { symbol: 'Rp', code: 'IDR' },
  'Philippines': { symbol: '₱', code: 'PHP' },
  'Vietnam': { symbol: '₫', code: 'VND' },
  'South Korea': { symbol: '₩', code: 'KRW' },
  
  // Europe
  'Germany': { symbol: '€', code: 'EUR' },
  'France': { symbol: '€', code: 'EUR' },
  'Italy': { symbol: '€', code: 'EUR' },
  'Spain': { symbol: '€', code: 'EUR' },
  'United Kingdom': { symbol: '£', code: 'GBP' },
  'Switzerland': { symbol: 'CHF', code: 'CHF' },
  'Norway': { symbol: 'kr', code: 'NOK' },
  'Sweden': { symbol: 'kr', code: 'SEK' },
  'Denmark': { symbol: 'kr', code: 'DKK' },
  
  // Americas
  'United States': { symbol: '$', code: 'USD' },
  'Canada': { symbol: 'C$', code: 'CAD' },
  'Mexico': { symbol: '$', code: 'MXN' },
  'Brazil': { symbol: 'R$', code: 'BRL' },
  'Argentina': { symbol: '$', code: 'ARS' },
  
  // Middle East & Africa
  'UAE': { symbol: 'د.إ', code: 'AED' },
  'Saudi Arabia': { symbol: '﷼', code: 'SAR' },
  'Egypt': { symbol: '£', code: 'EGP' },
  'South Africa': { symbol: 'R', code: 'ZAR' },
  
  // Oceania
  'Australia': { symbol: 'A$', code: 'AUD' },
  'New Zealand': { symbol: 'NZ$', code: 'NZD' },
};

// Currency formatting configurations
export const currencyFormats: Record<string, { decimals: number; separator: string }> = {
  'USD': { decimals: 2, separator: ',' },
  'EUR': { decimals: 2, separator: ',' },
  'GBP': { decimals: 2, separator: ',' },
  'THB': { decimals: 2, separator: ',' },
  'AED': { decimals: 2, separator: ',' },
  'SGD': { decimals: 2, separator: ',' },
  'MYR': { decimals: 2, separator: ',' },
  'INR': { decimals: 2, separator: ',' },
  'JPY': { decimals: 0, separator: ',' },
  'CNY': { decimals: 2, separator: ',' },
  'IDR': { decimals: 0, separator: ',' },
  'PHP': { decimals: 2, separator: ',' },
  'VND': { decimals: 0, separator: ',' },
  'KRW': { decimals: 0, separator: ',' },
};

export const getCurrencySymbolByCountry = (country: string): string => {
  const normalizedCountry = country?.trim();
  const currency = currencyMap[normalizedCountry];
  return currency?.symbol || '$'; // Default to USD symbol
};

export const getCurrencyCodeByCountry = (country: string): string => {
  const normalizedCountry = country?.trim();
  const currency = currencyMap[normalizedCountry];
  return currency?.code || 'USD'; // Default to USD
};

export const formatCurrencyWithCountry = (amount: number, country: string): string => {
  const symbol = getCurrencySymbolByCountry(country);
  return `${symbol}${amount.toLocaleString()}`;
};

// Additional exports for compatibility with other components
export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  const format = currencyFormats[currencyCode] || { decimals: 2, separator: ',' };
  const isWhole = Number.isInteger(amount);
  const decimals = isWhole ? 0 : format.decimals;
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true
  });
};

export const formatPriceForCountry = (amount: number, country: string): string => {
  const currencyCode = getCurrencyCodeByCountry(country);
  const symbol = getCurrencySymbolByCountry(country);
  const formattedAmount = formatCurrency(amount, currencyCode);
  return `${symbol}${formattedAmount}`;
};
