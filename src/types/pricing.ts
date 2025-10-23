
export interface MarkupSlab {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  markupType: 'percentage' | 'fixed';
  markupValue: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PricingSettings {
  defaultMarkupPercentage: number;
  useSlabPricing: boolean;
  markupSlabs: MarkupSlab[];
  slabApplicationMode: 'per-person' | 'total';
  showPricingToAgents: boolean;
  showPricingToStaff: boolean;
  allowStaffPricingEdit: boolean;
}

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  margin: number;
  lastUpdated: string;
}

export interface ModulePricing {
  basePrice: number;
  markup: number;
  markupType: 'percentage' | 'fixed' | 'slab' | 'country-based';
  finalPrice: number;
  currency: string;
  perPersonPrice?: number;
  totalPrice?: number;
}
