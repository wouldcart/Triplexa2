
import { Country } from '../types/country';
import { initialCountries } from '../data/countryData';

// Currency override interfaces
export interface CurrencyOverride {
  pricing_currency_override?: boolean;
  pricing_currency?: string;
  pricing_currency_symbol?: string;
}

export interface CountryWithCurrency extends Country {
  currency: string;
  currency_symbol: string;
  pricing_currency_override: boolean;
  pricing_currency?: string;
  pricing_currency_symbol?: string;
}

// Currency display information interface
export interface CurrencyDisplayInfo {
  displayCurrency: string;
  displaySymbol: string;
  pricingCurrency?: string;
  pricingSymbol?: string;
  hasPricingOverride: boolean;
}

// Function to get the effective pricing currency for a country
export const getEffectivePricingCurrency = (country: Country) => {
  if (country.pricing_currency_override && country.pricing_currency) {
    return {
      code: country.pricing_currency,
      symbol: country.pricing_currency_symbol || '$',
    };
  }
  return {
    code: country.currency,
    symbol: country.currency_symbol,
  };
};

// Function to get effective pricing currency by country name
export const getPricingCurrencyByCountryName = (countryName: string) => {
  const country = initialCountries.find(c => c.name === countryName);
  if (!country) {
    return { code: 'USD', symbol: '$' };
  }
  return getEffectivePricingCurrency(country);
};

// Function to get effective pricing currency by country code
export const getPricingCurrencyByCountryCode = (countryCode: string) => {
  const country = initialCountries.find(c => c.code === countryCode);
  if (!country) {
    return { code: 'USD', symbol: '$' };
  }
  return getEffectivePricingCurrency(country);
};

// Function to format price with effective currency
export const formatPriceWithEffectiveCurrency = (price: number, country: Country): string => {
  const effectiveCurrency = getEffectivePricingCurrency(country);
  return `${effectiveCurrency.symbol}${price.toLocaleString()}`;
};

// Get effective currency symbol with override support
export const getEffectiveCurrencySymbol = (country: CountryWithCurrency): string => {
  if (country.pricing_currency_override && country.pricing_currency_symbol) {
    return country.pricing_currency_symbol;
  }
  return country.currency_symbol || '$';
};

// Get effective currency code with override support
export const getEffectiveCurrencyCode = (country: CountryWithCurrency): string => {
  if (country.pricing_currency_override && country.pricing_currency) {
    return country.pricing_currency;
  }
  return country.currency || 'USD';
};

// Format currency with override support
export const formatCurrencyWithOverride = (amount: number, country: CountryWithCurrency): string => {
  const symbol = getEffectiveCurrencySymbol(country);
  const code = getEffectiveCurrencyCode(country);
  return `${symbol}${amount.toLocaleString()} ${code}`;
};

// Get comprehensive currency display information
export const getCurrencyDisplayInfo = (country: CountryWithCurrency): CurrencyDisplayInfo => {
  const hasPricingOverride = Boolean(
    country.pricing_currency_override && 
    country.pricing_currency && 
    country.pricing_currency !== country.currency
  );

  if (hasPricingOverride) {
    return {
      displayCurrency: country.pricing_currency!,
      displaySymbol: country.pricing_currency_symbol || country.currency_symbol || '$',
      pricingCurrency: country.pricing_currency!,
      pricingSymbol: country.pricing_currency_symbol || country.currency_symbol || '$',
      hasPricingOverride: true
    };
  }

  return {
    displayCurrency: country.currency || 'USD',
    displaySymbol: country.currency_symbol || '$',
    hasPricingOverride: false
  };
};
