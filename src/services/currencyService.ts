import { initialCountries } from '@/pages/inventory/countries/data/countryData';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface CountryInfo {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  region: string;
}

export interface ExchangeRate {
  id?: string;
  from: string;
  to: string;
  fromCurrency?: string;
  toCurrency?: string;
  rate: number;
  margin: number;
  lastUpdated: string;
  additionalSurcharge?: number;
  isFixed?: boolean;
  isRealTime?: boolean;
  isCustom?: boolean;
}

export class CurrencyService {
  private static currencyMap: Map<string, CurrencyInfo> = new Map([
    ['USD', { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 }],
    ['EUR', { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 }],
    ['GBP', { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 }],
    ['JPY', { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 }],
    ['CAD', { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2 }],
    ['AUD', { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 }],
    ['CHF', { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2 }],
    ['CNY', { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2 }],
    ['INR', { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2 }],
    ['AED', { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', decimals: 2 }],
    ['SGD', { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2 }],
    ['THB', { code: 'THB', symbol: '฿', name: 'Thai Baht', decimals: 2 }],
    ['MYR', { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', decimals: 2 }],
    ['IDR', { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', decimals: 0 }],
    ['PHP', { code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimals: 2 }],
    ['VND', { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', decimals: 0 }],
    ['KRW', { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimals: 0 }],
    ['BRL', { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimals: 2 }],
    ['MXN', { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimals: 2 }],
    ['ZAR', { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimals: 2 }],
    ['NZD', { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimals: 2 }],
  ]);

  static getCurrencyInfo(currencyCode: string): CurrencyInfo {
    const currency = this.currencyMap.get(currencyCode.toUpperCase());
    return currency || { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 };
  }

  static formatCurrency(amount: number, currencyCode: string): string {
    const currency = this.getCurrencyInfo(currencyCode);
    const rounded = Math.round(amount * Math.pow(10, currency.decimals)) / Math.pow(10, currency.decimals);
    
    return `${currency.symbol}${rounded.toLocaleString('en-US', {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals
    })}`;
  }

  static formatCurrencyInput(amount: number, currencyCode: string): string {
    const currency = this.getCurrencyInfo(currencyCode);
    return amount.toFixed(currency.decimals);
  }

  static getCountryInfo(): CountryInfo[] {
    return initialCountries.map(country => ({
      code: country.code,
      name: country.name,
      currency: country.currency,
      currencySymbol: country.currencySymbol,
      region: country.region
    }));
  }

  static getCountryByCode(countryCode: string): CountryInfo | null {
    const countries = this.getCountryInfo();
    return countries.find(c => c.code === countryCode) || null;
  }

  static getCurrencyByCountryCode(countryCode: string): CurrencyInfo {
    const country = this.getCountryByCode(countryCode);
    if (country) {
      return this.getCurrencyInfo(country.currency);
    }
    return this.getCurrencyInfo('USD');
  }

  static getAvailableCurrencies(): CurrencyInfo[] {
    return Array.from(this.currencyMap.values()).sort((a, b) => a.code.localeCompare(b.code));
  }

  static getCountriesByCurrency(currencyCode: string): CountryInfo[] {
    const countries = this.getCountryInfo();
    return countries.filter(c => c.currency === currencyCode);
  }

  static calculateWithMargin(rate: number, margin: number, multiplier: number = 1, surcharge: number = 0): number {
    // Calculate final rate with margin and surcharge
    const withMargin = rate * (1 + margin / 100);
    return (withMargin + surcharge) * multiplier;
  }

  static getDefaultRates(): ExchangeRate[] {
    return [
      { 
        id: '1',
        from: 'USD', 
        to: 'THB', 
        fromCurrency: 'USD',
        toCurrency: 'THB',
        rate: 35.7, 
        margin: 2, 
        lastUpdated: new Date().toISOString(),
        additionalSurcharge: 0,
        isFixed: false,
        isRealTime: true,
        isCustom: false
      },
      { 
        id: '2',
        from: 'THB', 
        to: 'USD', 
        fromCurrency: 'THB',
        toCurrency: 'USD',
        rate: 0.028, 
        margin: 2, 
        lastUpdated: new Date().toISOString(),
        additionalSurcharge: 0,
        isFixed: false,
        isRealTime: true,
        isCustom: false
      },
      { 
        id: '3',
        from: 'USD', 
        to: 'EUR', 
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.92, 
        margin: 1.5, 
        lastUpdated: new Date().toISOString(),
        additionalSurcharge: 0,
        isFixed: false,
        isRealTime: true,
        isCustom: false
      },
      { 
        id: '4',
        from: 'EUR', 
        to: 'USD', 
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        rate: 1.09, 
        margin: 1.5, 
        lastUpdated: new Date().toISOString(),
        additionalSurcharge: 0,
        isFixed: false,
        isRealTime: true,
        isCustom: false
      },
    ];
  }

  static getApiUsage(): { used: number; limit: number; remaining: number } {
    return { used: 0, limit: 1000, remaining: 1000 };
  }

  static async fetchAllRealTimeRates(): Promise<{ rates: ExchangeRate[]; isRealTime: boolean }> {
    // Mock implementation - in real app would call external API
    return {
      rates: this.getDefaultRates(),
      isRealTime: true
    };
  }

  static clearCache(): void {
    // Mock implementation for cache clearing
    console.log('Currency cache cleared');
  }
}