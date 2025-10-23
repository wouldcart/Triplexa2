
import { PricingSettings } from './pricing';

export interface CountryPricingRule {
  id: string;
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  defaultMarkup: number;
  markupType: 'percentage' | 'fixed';
  isActive: boolean;
  region: string;
  tier: 'budget' | 'standard' | 'premium' | 'luxury';
  conversionMargin: number;
  seasonalAdjustment?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegionalPricingTemplate {
  id: string;
  name: string;
  region: string;
  description: string;
  defaultMarkup: number;
  markupType: 'percentage' | 'fixed';
  countries: string[];
  isActive: boolean;
}

export interface CurrencyConversionSettings {
  baseCurrency: string;
  autoUpdateRates: boolean;
  updateFrequency: 'hourly' | 'daily' | 'weekly';
  fallbackRates: Record<string, number>;
  conversionMargins: Record<string, number>;
}

export interface CountryPricingSettings extends PricingSettings {
  countryRules: CountryPricingRule[];
  regionalTemplates: RegionalPricingTemplate[];
  currencyConversion: CurrencyConversionSettings;
  enableCountryBasedPricing: boolean;
  defaultCountry: string;
  popularDestinations: string[];
}
