import { TaxConfiguration, TaxCalculationResult, TaxBreakdownItem } from '@/types/taxManagement';
import { PricingConfigurationService } from '@/integrations/supabase/services/pricingConfigurationService';
import { TaxConfigurationSupabase, toUI, fromUI } from '@/integrations/supabase/services/taxConfigurationService';
import { CountriesService } from '@/integrations/supabase/services/countriesService';

// Default tax configurations for common countries
const DEFAULT_TAX_CONFIGURATIONS: TaxConfiguration[] = [
  {
    id: 'IN',
    countryCode: 'IN',
    taxType: 'GST',
    isActive: true,
    taxRates: [
      { id: 'gst-transport', serviceType: 'transport', rate: 5, description: 'Transport Services GST', isDefault: false },
      { id: 'gst-hotel', serviceType: 'hotel', rate: 18, description: 'Hotel Services GST', isDefault: false },
      { id: 'gst-sightseeing', serviceType: 'sightseeing', rate: 18, description: 'Sightseeing Services GST', isDefault: false },
      { id: 'gst-restaurant', serviceType: 'restaurant', rate: 5, description: 'Restaurant Services GST', isDefault: false },
      { id: 'gst-all', serviceType: 'all', rate: 18, description: 'General Tourism Services GST', isDefault: true }
    ],
    tdsConfiguration: {
      isApplicable: true,
      rate: 2,
      threshold: 50000,
      exemptionLimit: 40000
    },
    exemptions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'AE',
    countryCode: 'AE',
    taxType: 'VAT',
    isActive: true,
    taxRates: [
      { id: 'vat-all', serviceType: 'all', rate: 5, description: 'UAE VAT', isDefault: true }
    ],
    exemptions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'US',
    countryCode: 'US',
    taxType: 'SALES_TAX',
    isActive: true,
    taxRates: [
      { id: 'sales-all', serviceType: 'all', rate: 8.5, description: 'Sales Tax', isDefault: true }
    ],
    exemptions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'GB',
    countryCode: 'GB',
    taxType: 'VAT',
    isActive: true,
    taxRates: [
      { id: 'vat-all', serviceType: 'all', rate: 20, description: 'UK VAT', isDefault: true }
    ],
    exemptions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export class TaxCalculationService {
  private static taxConfigurations: TaxConfiguration[] = DEFAULT_TAX_CONFIGURATIONS;
  private static initializedFromSupabase = false;
  private static currentConfigId: string | undefined;
  private static defaultCountry: string = 'IN';
  private static countryNameMap: Record<string, string> = {};

  /**
   * Initialize tax configurations from Supabase pricing configuration + tax tables.
   * Falls back to built-in defaults if Supabase is unavailable.
   */
  static async initializeFromSupabase(): Promise<void> {
    try {
      let config = await PricingConfigurationService.getDefaultConfiguration();
      if (!config) {
        try {
          // Seed a default pricing configuration to ensure tax can bind to a config_id
          config = await PricingConfigurationService.setDefaultConfiguration(this.defaultCountry);
        } catch (seedErr) {
          console.warn('Failed to seed default pricing configuration for tax initialization.', seedErr);
        }
        if (!config) {
          this.initializedFromSupabase = false;
          return;
        }
      }
      this.currentConfigId = config.id;
      this.defaultCountry = config.default_country || this.defaultCountry;
      let rows = await TaxConfigurationSupabase.listByConfig(config.id);
      let mapped = rows.map((r) => toUI(r));

      // If table is empty, seed defaults directly into Supabase instead of falling back
      if (mapped.length === 0) {
        try {
          for (const def of DEFAULT_TAX_CONFIGURATIONS) {
            const row = fromUI(def, config.id);
            await TaxConfigurationSupabase.upsert(config.id, row);
          }
          rows = await TaxConfigurationSupabase.listByConfig(config.id);
          mapped = rows.map((r) => toUI(r));
        } catch (seedErr) {
          console.warn('Failed to seed default tax configurations to Supabase.', seedErr);
        }
      }

      if (mapped.length > 0) {
        this.taxConfigurations = mapped;
        this.initializedFromSupabase = true;
      }
      // Hydrate country names for UI dropdowns
      const countries = await CountriesService.listActiveCountries();
      this.countryNameMap = Object.fromEntries(countries.map((c) => [c.code, c.name]));
    } catch (err) {
      // Keep defaults on any error
      this.initializedFromSupabase = false;
    }
  }

  static getTaxConfigurations(): TaxConfiguration[] {
    return this.taxConfigurations;
  }

  static getTaxConfiguration(countryCode: string): TaxConfiguration | undefined {
    return this.taxConfigurations.find(
      config => config.countryCode === countryCode && config.isActive
    );
  }

  static getDefaultCountry(): string {
    return this.defaultCountry;
  }

  static getAvailableCountries(): Array<{ code: string; name: string; taxType: string }> {
    return this.taxConfigurations.map((config) => ({
      code: config.countryCode,
      name: this.countryNameMap[config.countryCode] || config.countryCode,
      taxType: config.taxType,
    }));
  }

  static detectCountryFromCurrency(currency: string): string {
    const currencyToCountry: Record<string, string> = {
      'INR': 'IN',
      'AED': 'AE',
      'USD': 'US',
      'GBP': 'GB'
    };
    return currencyToCountry[currency] || this.getDefaultCountry();
  }

  static initializeDefaultConfigurations(): void {
    // Keep defaults available immediately; async Supabase init can override after
    if (this.taxConfigurations.length === 0) {
      this.taxConfigurations = DEFAULT_TAX_CONFIGURATIONS;
    }
    // Fire-and-forget async hydration (components may optionally await initializeFromSupabase instead)
    this.initializeFromSupabase().catch(() => {
      /* ignore */
    });
  }

  static calculateTax(
    baseAmount: number,
    countryCode: string,
    serviceType: string = 'all',
    isInclusive: boolean = false
  ): TaxCalculationResult {
    const config = this.getTaxConfiguration(countryCode);
    
    if (!config) {
      return {
        baseAmount,
        taxAmount: 0,
        totalAmount: baseAmount,
        taxBreakdown: [],
        isInclusive
      };
    }

    // Find applicable tax rate
    const taxRate = config.taxRates.find(
      rate => rate.serviceType === serviceType || (rate.serviceType === 'all' && rate.isDefault)
    ) || config.taxRates.find(rate => rate.isDefault);

    if (!taxRate) {
      return {
        baseAmount,
        taxAmount: 0,
        totalAmount: baseAmount,
        taxBreakdown: [],
        isInclusive
      };
    }

    let taxableAmount = baseAmount;
    let taxAmount = 0;
    let totalAmount = baseAmount;
    let tdsAmount = 0;

    if (isInclusive) {
      // Tax is included in the amount
      taxableAmount = baseAmount / (1 + taxRate.rate / 100);
      taxAmount = baseAmount - taxableAmount;
      totalAmount = baseAmount;
    } else {
      // Tax is additional to the amount
      taxableAmount = baseAmount;
      taxAmount = baseAmount * (taxRate.rate / 100);
      totalAmount = baseAmount + taxAmount;
    }

    // Calculate TDS if applicable
    if (config.tdsConfiguration?.isApplicable && totalAmount > config.tdsConfiguration.threshold) {
      tdsAmount = totalAmount * (config.tdsConfiguration.rate / 100);
    }

    const taxBreakdown: TaxBreakdownItem[] = [
      {
        type: config.taxType,
        rate: taxRate.rate,
        amount: taxAmount,
        description: taxRate.description
      }
    ];

    if (tdsAmount > 0) {
      taxBreakdown.push({
        type: 'TDS',
        rate: config.tdsConfiguration!.rate,
        amount: tdsAmount,
        description: 'Tax Deducted at Source'
      });
    }

    return {
      baseAmount: taxableAmount,
      taxAmount,
      tdsAmount: tdsAmount > 0 ? tdsAmount : undefined,
      totalAmount: totalAmount - (tdsAmount || 0),
      taxBreakdown,
      isInclusive
    };
  }

  static addTaxConfiguration(config: TaxConfiguration): void {
    this.taxConfigurations.push(config);
  }

  static async updateTaxConfiguration(configOrCountryCode: TaxConfiguration | string, config?: Partial<TaxConfiguration>): Promise<void> {
    if (typeof configOrCountryCode === 'string') {
      // Legacy method signature: updateTaxConfiguration(countryCode, config)
      const countryCode = configOrCountryCode;
      const index = this.taxConfigurations.findIndex(c => c.countryCode === countryCode);
      if (index !== -1 && config) {
        this.taxConfigurations[index] = { ...this.taxConfigurations[index], ...config };
      }
    } else {
      // New method signature: updateTaxConfiguration(config)
      const fullConfig = configOrCountryCode;
      const index = this.taxConfigurations.findIndex(c => c.countryCode === fullConfig.countryCode);
      if (index !== -1) {
        this.taxConfigurations[index] = fullConfig;
      }
    }

    // Persist to Supabase if initialized with a known configuration
    try {
      if (this.currentConfigId) {
        const cfg = typeof configOrCountryCode === 'string'
          ? this.taxConfigurations.find(c => c.countryCode === configOrCountryCode)
          : configOrCountryCode;
        if (cfg) {
          const row = fromUI(cfg, this.currentConfigId);
          await TaxConfigurationSupabase.upsert(this.currentConfigId, row);
        }
      }
    } catch {
      // Swallow errors to avoid interrupting UI; local state remains updated
    }
  }

  // Exposed getters for UI tracking/debug
  static isInitializedFromSupabase(): boolean {
    return this.initializedFromSupabase;
  }

  static getCurrentConfigId(): string | undefined {
    return this.currentConfigId;
  }
}