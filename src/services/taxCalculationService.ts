import { TaxConfiguration, TaxCalculationResult, TaxBreakdownItem } from '@/types/taxManagement';

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

  static getTaxConfigurations(): TaxConfiguration[] {
    return this.taxConfigurations;
  }

  static getTaxConfiguration(countryCode: string): TaxConfiguration | undefined {
    return this.taxConfigurations.find(
      config => config.countryCode === countryCode && config.isActive
    );
  }

  static getDefaultCountry(): string {
    return 'IN'; // Default to India
  }

  static getAvailableCountries(): Array<{code: string, name: string, taxType: string}> {
    const countryNames: Record<string, string> = {
      'IN': 'India',
      'AE': 'UAE',
      'US': 'United States', 
      'GB': 'United Kingdom'
    };
    
    return this.taxConfigurations.map(config => ({
      code: config.countryCode,
      name: countryNames[config.countryCode] || config.countryCode,
      taxType: config.taxType
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
    // Configurations are already initialized with DEFAULT_TAX_CONFIGURATIONS
    // This method ensures they are available
    if (this.taxConfigurations.length === 0) {
      this.taxConfigurations = DEFAULT_TAX_CONFIGURATIONS;
    }
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

  static updateTaxConfiguration(configOrCountryCode: TaxConfiguration | string, config?: Partial<TaxConfiguration>): void {
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
  }
}