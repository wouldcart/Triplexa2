
import { PricingSettings, MarkupSlab, ModulePricing } from './pricing';
import { CountryPricingRule, RegionalPricingTemplate, CurrencyConversionSettings } from './countryPricing';

export interface EnhancedPricingSettings extends PricingSettings {
  countryRules: CountryPricingRule[];
  regionalTemplates: RegionalPricingTemplate[];
  currencyConversion: CurrencyConversionSettings;
  enableCountryBasedPricing: boolean;
  defaultCountry: string;
  popularDestinations: string[];
}

export interface CountryPricingCalculation extends ModulePricing {
  countryCode: string;
  originalCurrency: string;
  convertedCurrency: string;
  conversionRate: number;
  conversionMargin: number;
  regionalAdjustment: number;
  tierMultiplier: number;
}

export interface BulkPricingOperation {
  operation: 'set' | 'adjust' | 'copy';
  targetCountries: string[];
  sourceCountry?: string;
  adjustmentValue: number;
  adjustmentType: 'percentage' | 'fixed';
}
