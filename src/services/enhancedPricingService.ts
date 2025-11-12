
import { PricingService } from './pricingService';
import { EnhancedPricingSettings, CountryPricingCalculation, BulkPricingOperation } from '@/types/enhancedPricing';
import { CountryPricingRule, RegionalPricingTemplate } from '@/types/countryPricing';
import { CountryCurrencyService } from './countryCurrencyService';
import { initialCountries } from '@/pages/inventory/countries/data/countryData';
import { PricingConfigurationService } from '@/integrations/supabase/services/pricingConfigurationService';

export class EnhancedPricingService extends PricingService {
  private static enhancedSettings: EnhancedPricingSettings = {
    ...PricingService.getSettings(),
    countryRules: [
      {
        id: '1',
        countryCode: 'TH',
        countryName: 'Thailand',
        currency: 'THB',
        currencySymbol: '฿',
        defaultMarkup: 8,
        markupType: 'percentage',
        isActive: true,
        region: 'Southeast Asia',
        tier: 'standard',
        conversionMargin: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        countryCode: 'AE',
        countryName: 'UAE',
        currency: 'AED',
        currencySymbol: 'د.إ',
        defaultMarkup: 10,
        markupType: 'percentage',
        isActive: true,
        region: 'Middle East',
        tier: 'premium',
        conversionMargin: 1.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        countryCode: 'SG',
        countryName: 'Singapore',
        currency: 'SGD',
        currencySymbol: 'S$',
        defaultMarkup: 12,
        markupType: 'percentage',
        isActive: true,
        region: 'Southeast Asia',
        tier: 'luxury',
        conversionMargin: 1.8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    regionalTemplates: [
      {
        id: '1',
        name: 'Southeast Asia Standard',
        region: 'Southeast Asia',
        description: 'Standard pricing for Southeast Asian destinations',
        defaultMarkup: 8,
        markupType: 'percentage',
        countries: ['TH', 'MY', 'ID', 'VN'],
        isActive: true
      },
      {
        id: '2',
        name: 'Premium Middle East',
        region: 'Middle East',
        description: 'Premium pricing for Middle Eastern destinations',
        defaultMarkup: 12,
        markupType: 'percentage',
        countries: ['AE', 'QA', 'KW'],
        isActive: true
      }
    ],
    currencyConversion: {
      baseCurrency: 'USD',
      autoUpdateRates: false,
      updateFrequency: 'daily',
      fallbackRates: {
        'THB_USD': 0.028,
        'USD_THB': 35.7,
        'AED_USD': 0.27,
        'USD_AED': 3.67,
        'SGD_USD': 0.74,
        'USD_SGD': 1.35
      },
      conversionMargins: {
        'THB': 2,
        'AED': 1.5,
        'SGD': 1.8,
        'MYR': 2.2,
        'USD': 1,
        'EUR': 1.2
      }
    },
    enableCountryBasedPricing: true,
    defaultCountry: 'TH',
    popularDestinations: ['TH', 'AE', 'SG', 'MY', 'US', 'FR']
  };

  static getEnhancedSettings(): EnhancedPricingSettings {
    // Supabase-only: hydrate base pricing settings and merge enhanced fields (not persisted)
    (async () => {
      try {
        let cfg = await PricingConfigurationService.getDefaultConfiguration();
        if (!cfg) {
          cfg = await PricingConfigurationService.setDefaultConfiguration('TH');
        }
        const mapped = await PricingConfigurationService.toPricingSettings(cfg);
        if (mapped) {
          this.enhancedSettings = {
            ...this.enhancedSettings,
            ...mapped,
          };
        }
      } catch (err) {
        console.warn('EnhancedPricingService: failed to hydrate from Supabase', err);
      }
    })();
    return this.enhancedSettings;
  }

  static updateEnhancedSettings(settings: Partial<EnhancedPricingSettings>): void {
    // Supabase-only: persist base pricing-related fields; enhanced fields remain in-memory
    (async () => {
      try {
        const row = await PricingConfigurationService.upsertConfiguration({
          country_code: 'TH',
          base_markup_percentage: settings.defaultMarkupPercentage,
          slab_markup_enabled: settings.useSlabPricing,
        } as any);
        const mapped = await PricingConfigurationService.toPricingSettings(row);
        if (mapped) {
          this.enhancedSettings = { ...this.enhancedSettings, ...mapped, ...settings };
        } else {
          this.enhancedSettings = { ...this.enhancedSettings, ...settings };
        }
      } catch (err) {
        console.warn('EnhancedPricingService: failed to persist settings to Supabase', err);
        this.enhancedSettings = { ...this.enhancedSettings, ...settings };
      }
    })();
  }

  static getCountryRule(countryCode: string): CountryPricingRule | null {
    const settings = this.getEnhancedSettings();
    return settings.countryRules.find(rule => rule.countryCode === countryCode && rule.isActive) || null;
  }

  static calculateCountryBasedPricing(
    basePrice: number, 
    paxCount: number, 
    countryCode: string,
    targetCurrency?: string
  ): CountryPricingCalculation {
    const settings = this.getEnhancedSettings();
    const countryRule = this.getCountryRule(countryCode);
    
    // Validate inputs
    if (basePrice <= 0 || paxCount <= 0) {
      return {
        basePrice: 0,
        markup: 0,
        markupType: 'country-based',
        finalPrice: 0,
        currency: targetCurrency || 'USD',
        perPersonPrice: 0,
        totalPrice: 0,
        countryCode,
        originalCurrency: targetCurrency || 'USD',
        convertedCurrency: targetCurrency || 'USD',
        conversionRate: 1,
        conversionMargin: 0,
        regionalAdjustment: 0,
        tierMultiplier: 1
      };
    }
    
    if (!countryRule || !settings.enableCountryBasedPricing) {
      // Use the centralized currency service to get the proper currency for the country
      const countryInfo = CountryCurrencyService.getCurrencyByCountryCode(countryCode);
      const currency = targetCurrency || countryInfo.code;
      
      const standardCalc = this.calculateMarkup(basePrice, paxCount, currency);
      return {
        ...standardCalc,
        countryCode,
        originalCurrency: currency,
        convertedCurrency: currency,
        conversionRate: 1,
        conversionMargin: 0,
        regionalAdjustment: 0,
        tierMultiplier: 1
      };
    }

    let markup = 0;
    const perPersonPrice = basePrice / paxCount;

    // Apply country-specific markup
    if (countryRule.markupType === 'fixed') {
      markup = countryRule.defaultMarkup * paxCount;
    } else {
      markup = (basePrice * countryRule.defaultMarkup) / 100;
    }

    // Apply tier multiplier
    const tierMultipliers = {
      budget: 0.8,
      standard: 1,
      premium: 1.2,
      luxury: 1.5
    };
    const tierMultiplier = tierMultipliers[countryRule.tier] || 1;
    markup *= tierMultiplier;

    // Apply seasonal adjustment if available
    if (countryRule.seasonalAdjustment) {
      markup *= (1 + countryRule.seasonalAdjustment / 100);
    }

    // Currency conversion if needed
    let convertedPrice = basePrice + markup;
    let conversionRate = 1;
    const targetCurr = targetCurrency || countryRule.currency;
    
    if (targetCurr !== countryRule.currency) {
      const rateKey = `${countryRule.currency}_${targetCurr}`;
      conversionRate = settings.currencyConversion.fallbackRates[rateKey] || 1;
      const conversionMargin = settings.currencyConversion.conversionMargins[targetCurr] || 0;
      convertedPrice = (convertedPrice * conversionRate) * (1 + conversionMargin / 100);
    }

    // Round all monetary values to 2 decimal places
    const finalPrice = Math.round(convertedPrice * 100) / 100;
    const roundedMarkup = Math.round(markup * 100) / 100;

    return {
      basePrice,
      markup: roundedMarkup,
      markupType: 'country-based',
      finalPrice,
      currency: targetCurr,
      perPersonPrice: Math.round((finalPrice / paxCount) * 100) / 100,
      totalPrice: finalPrice,
      countryCode,
      originalCurrency: countryRule.currency,
      convertedCurrency: targetCurr,
      conversionRate,
      conversionMargin: settings.currencyConversion.conversionMargins[targetCurr] || 0,
      regionalAdjustment: countryRule.seasonalAdjustment || 0,
      tierMultiplier
    };
  }

  static createCountryRule(rule: Omit<CountryPricingRule, 'id' | 'createdAt' | 'updatedAt'>): CountryPricingRule {
    // Generate a robust unique ID to avoid duplicate keys in React lists
    const uniqueId = ((): string => {
      try {
        // Prefer crypto.randomUUID when available for strong uniqueness
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c: any = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto;
        if (c?.randomUUID) {
          return `country_${c.randomUUID()}`;
        }
      } catch {
        // Fall through to timestamp/random
      }
      const rand = Math.floor(Math.random() * 1e9);
      return `country_${rule.countryCode}_${Date.now()}_${rand}`;
    })();

    const newRule: CountryPricingRule = {
      ...rule,
      id: uniqueId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const settings = this.getEnhancedSettings();
    const updatedRules = [...settings.countryRules, newRule];
    this.updateEnhancedSettings({ countryRules: updatedRules });

    return newRule;
  }

  static updateCountryRule(ruleId: string, updates: Partial<CountryPricingRule>): void {
    const settings = this.getEnhancedSettings();
    const updatedRules = settings.countryRules.map(rule => 
      rule.id === ruleId 
        ? { ...rule, ...updates, updatedAt: new Date().toISOString() }
        : rule
    );
    this.updateEnhancedSettings({ countryRules: updatedRules });
  }

  static deleteCountryRule(ruleId: string): void {
    const settings = this.getEnhancedSettings();
    const updatedRules = settings.countryRules.filter(rule => rule.id !== ruleId);
    this.updateEnhancedSettings({ countryRules: updatedRules });
  }

  static applyRegionalTemplate(templateId: string, targetCountries: string[]): void {
    const settings = this.getEnhancedSettings();
    const template = settings.regionalTemplates.find(t => t.id === templateId);
    
    if (!template) return;

    targetCountries.forEach(countryCode => {
      const country = initialCountries.find(c => c.code === countryCode);
      if (!country) return;

      const existingRule = this.getCountryRule(countryCode);
      if (existingRule) {
        this.updateCountryRule(existingRule.id, {
          defaultMarkup: template.defaultMarkup,
          markupType: template.markupType
        });
      } else {
        // Use centralized currency service for accurate currency information
        const currencyInfo = CountryCurrencyService.getCurrencyByCountryCode(countryCode);
        this.createCountryRule({
          countryCode,
          countryName: country.name,
          currency: currencyInfo.code,
          currencySymbol: currencyInfo.symbol,
          defaultMarkup: template.defaultMarkup,
          markupType: template.markupType,
          isActive: true,
          region: country.region,
          tier: 'standard',
          conversionMargin: 2
        });
      }
    });
  }

  static performBulkOperation(operation: BulkPricingOperation): void {
    const settings = this.getEnhancedSettings();
    
    operation.targetCountries.forEach(countryCode => {
      const existingRule = this.getCountryRule(countryCode);
      
      if (operation.operation === 'set') {
        if (existingRule) {
          this.updateCountryRule(existingRule.id, {
            defaultMarkup: operation.adjustmentValue,
            markupType: operation.adjustmentType
          });
        }
      } else if (operation.operation === 'adjust' && existingRule) {
        let newMarkup = existingRule.defaultMarkup;
        if (operation.adjustmentType === 'percentage') {
          newMarkup += (newMarkup * operation.adjustmentValue / 100);
        } else {
          newMarkup += operation.adjustmentValue;
        }
        
        this.updateCountryRule(existingRule.id, {
          defaultMarkup: Math.max(0, newMarkup)
        });
      }
    });
  }

  static getAvailableCountries() {
    // Use the centralized CountryCurrencyService to get currency information
    return CountryCurrencyService.getAllCountriesWithCurrency().map(country => ({
      code: country.countryCode,
      name: country.countryName,
      currency: country.pricingCurrency || country.currency,
      currencySymbol: country.pricingCurrencySymbol || country.currencySymbol,
      region: initialCountries.find(c => c.code === country.countryCode)?.region || 'Unknown'
    }));
  }
}
