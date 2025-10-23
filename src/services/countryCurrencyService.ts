
import { initialCountries } from '@/pages/inventory/countries/data/countryData';
import { getPricingCurrencyByCountryName, getPricingCurrencyByCountryCode } from '@/pages/inventory/countries/utils/currencyUtils';

export interface CountryCurrency {
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  pricingCurrency?: string;
  pricingCurrencySymbol?: string;
}

export class CountryCurrencyService {
  /**
   * Get currency information by country name
   */
  static getCurrencyByCountryName(countryName: string): { code: string; symbol: string } {
    console.log('CountryCurrencyService: Getting currency for country:', countryName);
    
    // First try to get from countries module with pricing currency override
    const pricingCurrency = getPricingCurrencyByCountryName(countryName);
    if (pricingCurrency.code !== 'USD' || pricingCurrency.symbol !== '$') {
      console.log('Using pricing currency override:', pricingCurrency);
      return pricingCurrency;
    }

    // Fallback to initialCountries data
    const country = initialCountries.find(c => 
      c.name.toLowerCase() === countryName.toLowerCase() ||
      c.name.toLowerCase().includes(countryName.toLowerCase()) ||
      countryName.toLowerCase().includes(c.name.toLowerCase())
    );

    if (country) {
      console.log('Found country in initialCountries:', country);
      return {
        code: country.currency,
        symbol: country.currencySymbol
      };
    }

    console.log('Country not found, using default USD');
    return { code: 'USD', symbol: '$' };
  }

  /**
   * Get currency information by country code
   */
  static getCurrencyByCountryCode(countryCode: string): { code: string; symbol: string } {
    console.log('CountryCurrencyService: Getting currency for country code:', countryCode);
    
    // First try to get from countries module with pricing currency override
    const pricingCurrency = getPricingCurrencyByCountryCode(countryCode);
    if (pricingCurrency.code !== 'USD' || pricingCurrency.symbol !== '$') {
      console.log('Using pricing currency override:', pricingCurrency);
      return pricingCurrency;
    }

    // Fallback to initialCountries data
    const country = initialCountries.find(c => c.code === countryCode);
    if (country) {
      console.log('Found country in initialCountries:', country);
      return {
        code: country.currency,
        symbol: country.currencySymbol
      };
    }

    console.log('Country code not found, using default USD');
    return { code: 'USD', symbol: '$' };
  }

  /**
   * Get all available countries with their currency information
   */
  static getAllCountriesWithCurrency(): CountryCurrency[] {
    return initialCountries.map(country => ({
      countryCode: country.code,
      countryName: country.name,
      currency: country.currency,
      currencySymbol: country.currencySymbol,
      pricingCurrency: country.pricingCurrencyOverride ? country.pricingCurrency : undefined,
      pricingCurrencySymbol: country.pricingCurrencyOverride ? country.pricingCurrencySymbol : undefined
    }));
  }

  /**
   * Check if a country has pricing currency override
   */
  static hasPricingCurrencyOverride(countryName: string): boolean {
    const country = initialCountries.find(c => 
      c.name.toLowerCase() === countryName.toLowerCase()
    );
    return country?.pricingCurrencyOverride || false;
  }

  /**
   * Format currency amount with proper symbol
   */
  static formatCurrency(amount: number, countryName: string): string {
    const currency = this.getCurrencyByCountryName(countryName);
    return `${currency.symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Get effective currency for pricing (considers overrides)
   */
  static getEffectiveCurrency(countryName: string): { code: string; symbol: string; isOverride: boolean } {
    const country = initialCountries.find(c => 
      c.name.toLowerCase() === countryName.toLowerCase()
    );

    if (country?.pricingCurrencyOverride && country.pricingCurrency) {
      return {
        code: country.pricingCurrency,
        symbol: country.pricingCurrencySymbol || '$',
        isOverride: true
      };
    }

    if (country) {
      return {
        code: country.currency,
        symbol: country.currencySymbol,
        isOverride: false
      };
    }

    return {
      code: 'USD',
      symbol: '$',
      isOverride: false
    };
  }
}
