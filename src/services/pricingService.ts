
import { MarkupSlab, PricingSettings, CurrencyRate, ModulePricing } from '@/types/pricing';
import { PricingConfigurationService } from '@/integrations/supabase/services/pricingConfigurationService';

export class PricingService {
  private static settings: PricingSettings = {
    defaultMarkupPercentage: 7,
    useSlabPricing: false,
    slabApplicationMode: 'per-person',
    markupSlabs: [
      {
        id: '1',
        name: 'Budget Range',
        minAmount: 1000,
        maxAmount: 5000,
        markupType: 'fixed',
        markupValue: 100,
        currency: 'THB',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Mid Range',
        minAmount: 5001,
        maxAmount: 15000,
        markupType: 'percentage',
        markupValue: 8,
        currency: 'THB',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Luxury Range',
        minAmount: 15001,
        maxAmount: 999999,
        markupType: 'percentage',
        markupValue: 10,
        currency: 'THB',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    showPricingToAgents: true,
    showPricingToStaff: true,
    allowStaffPricingEdit: true
  };

  static getSettings(): PricingSettings {
    // Supabase-only: hydrate from pricing_configurations
    // Synchronous fallback removed; callers should handle async contexts upstream
    // For legacy synchronous usage, return last cached value but refresh in background
    (async () => {
      try {
        let cfg = await PricingConfigurationService.getDefaultConfiguration();
        if (!cfg) {
          cfg = await PricingConfigurationService.setDefaultConfiguration('TH');
        }
        const mapped = await PricingConfigurationService.toPricingSettings(cfg);
        if (mapped) this.settings = mapped;
      } catch (err) {
        console.warn('PricingService: failed to hydrate settings from Supabase', err);
      }
    })();
    return this.settings;
  }

  static updateSettings(settings: Partial<PricingSettings>): void {
    // Supabase-only: upsert configuration
    (async () => {
      try {
        const countryCode = 'TH'; // default tie-in; UI maintains default country elsewhere
        const row = await PricingConfigurationService.upsertConfiguration({
          country_code: countryCode,
          base_markup_percentage: settings.defaultMarkupPercentage,
          slab_markup_enabled: settings.useSlabPricing,
        } as any);
        const mapped = await PricingConfigurationService.toPricingSettings(row);
        if (mapped) this.settings = mapped;
        // Emit event for real-time updates
        window.dispatchEvent(new CustomEvent('pricing-settings-updated', {
          detail: this.settings
        }));
      } catch (err) {
        console.warn('PricingService: failed to persist settings to Supabase', err);
      }
    })();
  }

  static calculateMarkup(basePrice: number, paxCount: number, currency: string = 'THB'): ModulePricing {
    const settings = this.getSettings();
    
    // Validate inputs
    if (basePrice <= 0 || paxCount <= 0) {
      return {
        basePrice: 0,
        markup: 0,
        markupType: 'percentage',
        finalPrice: 0,
        currency,
        perPersonPrice: 0,
        totalPrice: 0
      };
    }
    
    const perPersonPrice = basePrice / paxCount;
    let markup = 0;
    let markupType: 'percentage' | 'fixed' | 'slab' = 'percentage';

    if (settings.useSlabPricing) {
      const comparisonAmount = settings.slabApplicationMode === 'per-person' 
        ? perPersonPrice 
        : basePrice;
        
      const applicableSlab = settings.markupSlabs.find(slab => 
        slab.isActive && 
        slab.currency === currency &&
        comparisonAmount >= slab.minAmount && 
        comparisonAmount <= slab.maxAmount
      );

      if (applicableSlab) {
        markupType = 'slab';
        if (applicableSlab.markupType === 'fixed') {
          markup = applicableSlab.markupValue * paxCount;
        } else {
          markup = (basePrice * applicableSlab.markupValue) / 100;
        }
      } else {
        markup = (basePrice * settings.defaultMarkupPercentage) / 100;
      }
    } else {
      markup = (basePrice * settings.defaultMarkupPercentage) / 100;
    }

    const finalPrice = Math.round((basePrice + markup) * 100) / 100;

    return {
      basePrice,
      markup: Math.round(markup * 100) / 100,
      markupType,
      finalPrice,
      currency,
      perPersonPrice: Math.round((finalPrice / paxCount) * 100) / 100,
      totalPrice: finalPrice
    };
  }

  static convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    // Enhanced exchange rates with more currencies
    const rates: { [key: string]: number } = {
      // THB conversions
      'THB_USD': 0.028,
      'USD_THB': 35.7,
      'THB_EUR': 0.026,
      'EUR_THB': 38.5,
      'THB_AED': 0.103,
      'AED_THB': 9.7,
      'THB_SGD': 0.037,
      'SGD_THB': 27.0,
      'THB_INR': 2.4,
      'INR_THB': 0.42,
      'THB_GBP': 0.022,
      'GBP_THB': 45.2,
      
      // USD conversions
      'USD_EUR': 0.92,
      'EUR_USD': 1.09,
      'USD_AED': 3.67,
      'AED_USD': 0.27,
      'USD_SGD': 1.35,
      'SGD_USD': 0.74,
      'USD_INR': 84.5,
      'INR_USD': 0.012,
      'USD_GBP': 0.79,
      'GBP_USD': 1.27,
      
      // Cross rates
      'AED_SGD': 0.37,
      'SGD_AED': 2.72,
      'INR_AED': 0.043,
      'AED_INR': 23.0,
      'EUR_GBP': 0.86,
      'GBP_EUR': 1.16
    };

    if (fromCurrency === toCurrency) return amount;
    
    const rateKey = `${fromCurrency}_${toCurrency}`;
    const directRate = rates[rateKey];
    
    if (directRate) {
      return Math.round(amount * directRate * 100) / 100;
    }
    
    // If no direct rate, try conversion through USD
    const toUSDKey = `${fromCurrency}_USD`;
    const fromUSDKey = `USD_${toCurrency}`;
    
    if (rates[toUSDKey] && rates[fromUSDKey]) {
      const usdAmount = amount * rates[toUSDKey];
      return Math.round(usdAmount * rates[fromUSDKey] * 100) / 100;
    }
    
    console.warn(`No conversion rate found for ${fromCurrency} to ${toCurrency}, returning original amount`);
    return amount;
  }
}
